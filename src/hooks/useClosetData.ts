/**
 * useClosetData — single source of truth for the user's wardrobe + outfits.
 *
 * Why a hook instead of letting `ClosetView` and `FitsView` each fetch their
 * own data: now that Fits is a top-level tab (its own route), the two views
 * no longer share a component tree, so prop-drilling won't work. Putting the
 * read + the small mutations here means both views read the same cache, and
 * a save in the Fits builder instantly reflects in the Closet tab without a
 * manual refetch.
 *
 * Race-safety follows the same pattern ClosetView had locally:
 * - loadingRef blocks a duplicate concurrent load
 * - lastLoadTimeRef gives us a 30s cache window on the slow queries
 * - loadRequestIdRef makes stale resolutions no-op (a retry wins)
 * - mountedRef guards against React 18 strict-mode double-mount
 *
 * Also performs a **deferred wardrobe re-seed** when the hook runs for a
 * user who has completed onboarding but has zero closet rows. This catches
 * the race window between paywall_completed and seedDemoWardrobe: the
 * dashboard effect gives the user a second (and third, and fourth) chance
 * to receive their starter wardrobe after a transient Supabase hiccup.
 *
 * Returns the raw normalized arrays plus a small set of mutations so callers
 * don't need to know the Supabase table names — they just deal with domain
 * types (`ClosetItem`, `Outfit`).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { seedDemoWardrobe } from '@/lib/wardrobe-seed';

/**
 * The local view of a closet item. Source of truth: `trendza_closet_items`,
 * with a permissive `.favorite` mirror held in React state only — the DB
 * doesn't store it today, and adding a column for it would block this
 * refactor on a migration. Keep state-local for now; future work can
 * persist.
 */
export interface ClosetItem {
  id: string;
  title: string;
  brand?: string;
  category: string;
  color: string;
  season?: string;
  tags: string[];
  attributes: Record<string, any>;
  source_image_url?: string;
  created_at: string;
  favorite?: boolean;
  /**
   * Derived by the normalizer: true iff `category === 'pending'`.
   * Drives the "still analyzing" UI badge in the Closet grid and the
   * filter exclusion from Shuffler / Canvas outfit slots (pending items
   * don't match "tops"/"bottoms"/"shoes"/"accessories" and so naturally
   * fall out, but the flag is also handy for explicit styling checks).
   */
  pending?: boolean;
}

/**
 * Saved fit (set of closet items the user named + saved).
 * Source of truth: `trendza_outfits`. Items are hydrated on load by joining
 * against `items`.
 */
export interface SavedOutfit {
  id: string;
  name: string;
  item_ids: string[];
  score?: number;
  rationale?: string;
  /** Flattened outfit preview — base64 data URL generated client-side via Canvas compositing */
  thumbnail_url?: string;
  created_at: string;
  items: ClosetItem[];
}

/**
 * What the builder hands to `saveOutfit`: which items go into the fit.
 * `null` slots are filtered before save so the caller doesn't need to
 * pre-clean.
 *
 * Optional `metadata` is serialized as JSON into the `rationale` column
 * so callers can attach position data, source info, etc. without a DB
 * migration.
 *
 * Optional `thumbnail` is a base64 data URL generated client-side via
 * Canvas compositing — saved into the rationale JSON so the Saved tab
 * can render a single lightweight image instead of layering PNGs.
 */
export interface SaveOutfitInput {
  name: string;
  items: Array<ClosetItem | null>;
  metadata?: Record<string, any>;
  thumbnail?: string;
}

interface UseClosetDataReturn {
  items: ClosetItem[];
  outfits: SavedOutfit[];
  isLoading: boolean;
  isInitialLoad: boolean;
  loadError: string | null;
  /** Manual refetch (bypasses the 30s time-based cache). */
  refresh: () => void;
  /** Surface the retry banner; same as refresh but with intent naming. */
  retry: () => void;
  /** Persist a new outfit and prepend it to the local list. */
  saveOutfit: (input: SaveOutfitInput) => Promise<SavedOutfit | null>;
  /** Delete a saved outfit + drop from local state. */
  deleteOutfit: (id: string) => Promise<void>;
  /** Local-only favorite toggle; no DB round-trip. */
  toggleFavorite: (itemId: string) => void;
  /**
   * Insert a freshly uploaded item (post-background-removal + AI analysis +
   * Supabase storage upload). Caller passes the already-processed blob /
   * analysis result so the hook stays storage- and AI-agnostic.
   *
   * Idempotent by id — if a row with the same id is already in `items`,
   * the existing entry is replaced (not duplicated). Required because
   * the upload pipelines also patch local state after an UPDATE when
   * AI classify completes; without dedup the item would appear twice.
   */
  insertItem: (item: ClosetItem) => void;
  /**
   * Replace an existing uploaded item by id and keep it at the front of
   * the local wardrobe list. Upload pipelines call this after their AI
   * classification update so a new clip cannot move down the grid when
   * its metadata finishes loading.
   */
  updateItem: (item: ClosetItem) => void;
}

const CACHE_DURATION_MS = 30_000;

/**
 * Deferred wardrobe re-seed coordinator.
 *
 * `reSeedAttemptedRef` was a per-instance useRef in an earlier version:
 * fine for one tab, wrong for the real app where Shuffler / Wardrobe /
 * Canvas / Clipper / Index each mount this hook on every render. With a
 * per-instance latch every tab upserted its own copy of the seed —
 * idempotent, but a wasted network round per tab. Hoisting to a
 * module-level Map dedupes across all hook instances in the same session
 * AND enforces a 60s backoff window so a transient Supabase hiccup can't
 * thrash the upsert while the DB is wedged.
 *
 * Sign-out clears the map so the next sign-in starts with a clean slate.
 */
const SEED_BACKOFF_MS = 60_000;
const seedAttempts = new Map<string, number>(); // userId -> last attempt timestamp

function shouldAttemptDeferredSeed(userId: string): boolean {
  const last = seedAttempts.get(userId) ?? 0;
  const now = Date.now();
  if (now - last < SEED_BACKOFF_MS) return false;
  // Atomically arm the latch. Because JS guarantees the date.now() read
  // + map.set completes in a single synchronous turn, any other queued
  // mount will see the new timestamp and bail before calling .upsert().
  seedAttempts.set(userId, now);
  return true;
}

function clearDeferredSeedLatch(userId: string): void {
  seedAttempts.delete(userId);
}

// One-time wiring of sign-out cleanup. safe to call repeatedly — the
// flag prevents duplicate listener registration across hot reloads.
let _deferredSeedSignOutWired = false;
function ensureDeferredSeedSignOutCleanup(): void {
  if (_deferredSeedSignOutWired) return;
  _deferredSeedSignOutWired = true;
  try {
    supabase.auth.onAuthStateChange((evt) => {
      if (evt === 'SIGNED_OUT') seedAttempts.clear();
    });
  } catch {
    // no-op — losing the cleanup listener doesn't break the seed path,
    // it just means stale entries linger until the next module reload.
  }
}

/**
 * Normalize a queued `trendza_closet_items` row into the local view.
 *
 * The previous version dropped rows whose title was `'Untitled'` or
 * `'Analyzing...'` under the rationale that the closet would otherwise
 * briefly show blank entries. With the new `category === 'pending'`
 * design these placeholders are the *visible signal* that a clip is
 * in flight — hiding them would leave the user wondering whether their
 * tap registered. So we no longer filter on title; the only row we drop
 * is one that has no image at all (truly blank).
 *
 * The `pending` flag is derived from the row's category: callers can
 * use it for explicit UI styling without re-doing the comparison.
 */
function normalizeItem(r: any): ClosetItem | null {
  if (!r?.source_image_url) return null;
  const category = typeof r?.category === 'string' && r.category ? r.category : 'pending';
  const pending = category === 'pending';
  if (pending) {
    // The Closet grid renders pending rows with a "still analyzing"
    // badge; showing them with placeholder titles is fine and is in
    // fact the whole point. Don't fabricate a fake displayTitle here —
    // keep `r.title` as-is (could be 'Clipped Item', user-typed name,
    // 'Analyzing...', etc.) so the real value is visible to the user.
  }
  // BlurHash lives in the `attributes` JSON column; lift it so
  // `<CachedImage>` callers don't need to know our storage shape.
  const attrHash =
    r?.attributes && typeof r.attributes === 'object'
      ? (r.attributes as Record<string, unknown>).blur_hash
      : null;
  const blurHash =
    typeof attrHash === 'string' && attrHash.length > 0
      ? attrHash
      : null;
  return {
    id: r.id,
    title: r.title ?? '',
    brand: r.brand ?? '',
    category,
    color: r.color ?? 'unknown',
    season: r.season ?? 'all',
    tags: Array.isArray(r.tags) ? r.tags : [],
    attributes: r.attributes ?? {},
    source_image_url: r.source_image_url,
    created_at: r.created_at,
    favorite: false,
    blur_hash: blurHash,
    pending,
  };
}

function normalizeOutfit(r: any, itemMap: Map<string, ClosetItem>): SavedOutfit {
  const itemIds = Array.isArray(r.item_ids) ? r.item_ids : [];
  // Parse rationale JSON to extract thumbnail_url, item_snapshots, and metadata
  let thumbnailUrl: string | undefined;
  let rationaleDisplay: string | undefined;
  let snapshots: ClosetItem[] | undefined;
  if (r.rationale) {
    try {
      const parsed = JSON.parse(r.rationale);
      if (parsed && typeof parsed === 'object') {
        thumbnailUrl = parsed.thumbnail ?? parsed.thumbnail_url;
        snapshots = Array.isArray(parsed.item_snapshots) ? parsed.item_snapshots : undefined;
        // Re-stringify without thumbnail + snapshots for display purposes
        const { thumbnail, thumbnail_url, item_snapshots, ...rest } = parsed;
        rationaleDisplay = Object.keys(rest).length > 0 ? JSON.stringify(rest) : undefined;
      } else {
        rationaleDisplay = r.rationale;
      }
    } catch {
      rationaleDisplay = r.rationale;
    }
  }
  // Build a snapshot lookup keyed by item id — used when an item doesn't
  // exist in the real closet (e.g. demo items saved from Canvas/Shuffler).
  const snapshotMap = new Map<string, ClosetItem>();
  if (snapshots) {
    snapshots.forEach(s => snapshotMap.set(s.id, s as ClosetItem));
  }
  return {
    id: r.id,
    name: r.name ?? 'Fit',
    item_ids: itemIds,
    ...(r.score !== null && r.score !== undefined && { score: r.score }),
    ...(rationaleDisplay && { rationale: rationaleDisplay }),
    ...(thumbnailUrl && { thumbnail_url: thumbnailUrl }),
    created_at: r.created_at,
    items: itemIds
      .map((id: string) => itemMap.get(id) ?? snapshotMap.get(id))
      .filter((i): i is ClosetItem => Boolean(i)),
  };
}

export function useClosetData(): UseClosetDataReturn {
  const { toast } = useToast();
  const [items, setItems] = useState<ClosetItem[]>([]);
  const [outfits, setOutfits] = useState<SavedOutfit[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadingRef = useRef(false);
  const lastLoadTimeRef = useRef(0);
  const loadRequestIdRef = useRef(0);
  // Reactive sync for the `isLoading` boolean — the ref above is the
  // duplicate-load gate, but callers want a value they can render against.
  const [isLoading, setIsLoading] = useState(false);
  // Tracks whether the component is still mounted. Used to short-circuit
  // state mutations from any in-flight fetch when the user navigates
  // away from the route before Supabase resolves.
  const mountedRef = useRef(true);
  // (Deferred wardrobe re-seed latch lives at module scope via
  // `seedAttempts` Map + 60s backoff — see top of file. Per-instance
  // useRef was insufficient: every closet-rendering tab would upsert
  // its own copy.)

  const load = useCallback(async () => {
    // Block concurrent duplicate loads.
    if (loadingRef.current) return;

    // Time-based cache: if we fetched recently and have data, skip.
    const now = Date.now();
    if (
      now - lastLoadTimeRef.current < CACHE_DURATION_MS &&
      items.length > 0
    ) {
      return;
    }

    loadingRef.current = true;
    setIsLoading(true);
    const requestId = ++loadRequestIdRef.current;
    // `isStale` closes over the request id we just captured — if a retry
    // bumps the counter, or the component unmounts, this promise must not
    // touch shared state.
    const isStale = () =>
      requestId !== loadRequestIdRef.current || !mountedRef.current;

    try {
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (authError || !auth?.user) {
        // No session — leave lists empty and clear initial-load so the
        // views don't sit on a spinner. Not an error worth a toast.
        if (!isStale()) setIsInitialLoad(false);
        return;
      }

      const [itemsResult, outfitsResult] = await Promise.all([
        supabase
          .from('trendza_closet_items')
          .select(
            // attributes.blur_hash is lifted to a top-level field by
            // the normalizer below.
            'id, title, brand, category, color, season, tags, attributes, source_image_url, created_at'
          )
          .order('created_at', { ascending: false }),
        supabase
          .from('trendza_outfits')
          .select('id, name, item_ids, score, rationale, created_at')
          .order('created_at', { ascending: false }),
      ]);

      // Bail before mutating state: a resolved-but-stale promise must
      // not push data into either view that's already moved on.
      if (isStale()) return;

      const itemRows = (itemsResult.data ?? []) as any[];
      const normalizedItems = itemRows
        .map(normalizeItem)
        .filter((i): i is ClosetItem => i !== null);

      const itemMap = new Map<string, ClosetItem>();
      normalizedItems.forEach((i) => itemMap.set(i.id, i));

      const outfitRows = (outfitsResult.data ?? []) as any[];
      const normalizedOutfits = outfitRows.map((r) =>
        normalizeOutfit(r, itemMap)
      );

      setItems(normalizedItems);
      setOutfits(normalizedOutfits);
      lastLoadTimeRef.current = Date.now();
      // Clear stale error state once a load resolves successfully.
      setLoadError(null);
    } catch (e: any) {
      if (isStale()) return;
      const message = e?.message ?? 'Unable to reach your closet';
      // eslint-disable-next-line no-console
      console.error('Closet load failed:', e);
      setLoadError(message);
      toast({
        title: "Couldn't load closet",
        description: message,
        variant: 'destructive',
      });
    } finally {
      if (isStale()) return;
      loadingRef.current = false;
      setIsLoading(false);
      setIsInitialLoad(false);
    }
  }, [items.length, toast]);

  const refresh = useCallback(() => {
    lastLoadTimeRef.current = 0;
    loadingRef.current = false;
    setLoadError(null);
    setIsInitialLoad(true);
    load();
  }, [load]);

  const retry = refresh;

  // Initial load on mount; reset mountedRef for React 18 StrictMode
  // double-mount so the gate stays correct. Also wires the once-only
  // sign-out cleanup listener for the module-level seed latch.
  useEffect(() => {
    mountedRef.current = true;
    ensureDeferredSeedSignOutCleanup();
    load();
    return () => {
      mountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Deferred wardrobe re-seed.
   *
   * Runs after the initial load resolves AND items is empty AND no
   * seed attempt has fired in the last 60s for this userId. The goal
   * is to catch the rare race where handlePaywallComplete's seed call
   * fired before the user had finished persisting gender/step_data to
   * onboarding_v2, which would otherwise swallow the upsert error in a
   * try/catch. The retry path here reads gender from onboarding_v2
   * itself, runs seedDemoWardrobe again, and refreshes local items on
   * success.
   *
   * The latch lives at module scope (`seedAttempts` Map + 60s
   * backoff) so every closet-rendering tab (Shuffler / Wardrobe /
   * Canvas / Clipper / Index) shares a single seed roundtrip per
   * session per user, instead of N parallel upserts. The 60s
   * timestamp armed in `shouldAttemptDeferredSeed` is the only
   * gate we rely on — we deliberately DO NOT clear the latch on
   * seed failure, so a transient Supabase 5xx can't drive the
   * effect into a retry-storm. The one exception is the
   * `!onboardingRow.completed` branch, where clearing is correct
   * because the user just hasn't finished signup yet and will
   * need a fresh attempt when they do.
   */
  useEffect(() => {
    if (isInitialLoad || isLoading) return
    if (items.length > 0) return
    if (loadError) return  // don't hammer DB while it's wedged

    void (async () => {
      const { data: auth, error: authError } = await supabase.auth.getUser()
      if (authError || !auth?.user) return  // no userId yet — no latch arm

      const userId = auth.user.id
      if (!shouldAttemptDeferredSeed(userId)) return  // dedupes cross-tab

      try {
        // Only proceed if the user actually completed onboarding —
        // we don't want to seed users who haven't picked a gender.
        const { data: onboardingRow } = await supabase
          .from('onboarding_v2')
          .select('completed, step_data')
          .eq('user_id', userId)
          .maybeSingle()

        if (!onboardingRow?.completed) {
          // Logical state, not transient: clear so when the user
          // finishes onboarding a fresh attempt can fire.
          clearDeferredSeedLatch(userId)
          return
        }

        const stepData =
          (onboardingRow.step_data as Record<string, any> | null) ?? {}
        const rawGender = stepData?.gender?.gender ?? null
        const gender = typeof rawGender === 'string' ? rawGender : null

        await seedDemoWardrobe(userId, gender)
        // eslint-disable-next-line no-console
        console.log(
          '[useClosetData] ✅ Deferred wardrobe re-seed completed for',
          userId,
        )
        // Pull the fresh rows into local state. Bypass the 30s cache.
        lastLoadTimeRef.current = 0
        await load()
      } catch (e) {
        // Transient failure (5xx, network) — DO NOT clear the latch.
        // The 60s backoff timestamp set in shouldAttemptDeferredSeed
        // is the gate; clearing here would defeat it and let the
        // next mount immediately retry and thrash a wedged DB.
        // eslint-disable-next-line no-console
        console.error(
          '[useClosetData] ❌ Deferred wardrobe re-seed failed:',
          e,
        )
      }
    })().catch((e) => {
      // Top-level safety net: anything thrown outside the inner
      // try/catch (e.g. `await load()` outside try) becomes an
      // unhandled rejection otherwise.
      // eslint-disable-next-line no-console
      console.error('[useClosetData] deferred seed outer catch:', e)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInitialLoad, isLoading, items.length, loadError, load])

  const saveOutfit = useCallback(
    async (input: SaveOutfitInput): Promise<SavedOutfit | null> => {
      const validItems = input.items.filter(
        (i): i is ClosetItem =>
          i !== null &&
          typeof i.id === 'string' &&
          i.id.length > 0 &&
          !i.id.startsWith('temp_') &&
          i.id.length === 36 // UUID v4 length — guards against bad ids
      );
      if (validItems.length === 0) return null;

      const { data: auth } = await supabase.auth.getUser();
      if (!auth?.user) return null;

      // Build the rationale JSON payload
      const rationalePayload: Record<string, any> = input.metadata
        ? { ...input.metadata }
        : { source: 'created' };

      // Store item snapshots so demo/fake items survive page reloads.
      // Without this, outfits containing demo ClosetItems (with fixed UUIDs
      // that don't exist in Supabase) would appear empty after refresh.
      rationalePayload.item_snapshots = validItems.map((i) => ({
        id: i.id,
        title: i.title,
        brand: i.brand ?? '',
        category: i.category,
        color: i.color,
        tags: i.tags,
        attributes: i.attributes,
        source_image_url: i.source_image_url,
        created_at: i.created_at,
      }));

      // Embed thumbnail as base64 data URL if provided
      if (input.thumbnail) {
        rationalePayload.thumbnail = input.thumbnail;
      }

      const { data, error } = await supabase
        .from('trendza_outfits')
        .insert({
          user_id: auth.user.id,
          name: input.name,
          item_ids: validItems.map((i) => i.id),
          rationale: JSON.stringify(rationalePayload),
        })
        .select('id, name, item_ids, score, rationale, created_at')
        .single();

      if (error || !data) {
        console.error('saveOutfit failed:', error?.message ?? 'No data returned');
        if (error) console.error('Full Supabase error:', error);
        return null;
      }

      const newOutfit: SavedOutfit = {
        id: data.id,
        name: data.name ?? input.name,
        item_ids: Array.isArray(data.item_ids) ? data.item_ids : [],
        ...(data.score !== null &&
          data.score !== undefined && { score: data.score }),
        ...(data.rationale !== null &&
          data.rationale !== undefined && { rationale: data.rationale }),
        ...(input.thumbnail && { thumbnail_url: input.thumbnail }),
        created_at: data.created_at,
        items: validItems,
      };
      setOutfits((prev) => [newOutfit, ...prev]);
      return newOutfit;
    },
    []
  );

  const deleteOutfit = useCallback(async (id: string) => {
    try {
      await supabase.from('trendza_outfits').delete().eq('id', id);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Delete outfit failed:', e);
    } finally {
      // Optimistic update regardless — the row is gone from this user's
      // view even if the network request hiccuped.
      setOutfits((prev) => prev.filter((o) => o.id !== id));
    }
  }, []);

  const toggleFavorite = useCallback((itemId: string) => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === itemId ? { ...i, favorite: !i.favorite } : i
      )
    );
  }, []);

  /**
   * Used by the ClosetView upload pipeline after a successful insert —
   * surfaces the new row immediately without forcing a full refetch.
   *
   * Idempotent by id: if a row with the same id is already in `items`,
   * the existing entry is replaced (not duplicated). Required because
   * the upload pipelines also call this on the post-AI-UPDATE SELECT
   * refresh, and a naive prepend would create two visible copies of
   * the same row.
   */
  const insertItem = useCallback((item: ClosetItem) => {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.id === item.id);
      if (idx === -1) return [item, ...prev];
      const next = prev.slice();
      next[idx] = item;
      return next;
    });
  }, []);

  /**
   * Replace an existing uploaded item by id and keep it at the front.
   * Upload pipelines call this after they UPDATE a row in Supabase (the
   * AI-classify IIFE in clipper.tsx / UploadItemFlow.tsx), so finishing
   * classification cannot move a newly added item lower in the grid.
   */
  const updateItem = useCallback((item: ClosetItem) => {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.id === item.id);
      if (idx === -1) return prev;
      return [item, ...prev.filter((i) => i.id !== item.id)];
    });
  }, []);

  return {
    items,
    outfits,
    isLoading,
    isInitialLoad,
    loadError,
    refresh,
    retry,
    saveOutfit,
    deleteOutfit,
    toggleFavorite,
    insertItem,
    updateItem,
  };
}
