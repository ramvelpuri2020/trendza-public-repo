/**
 * Shuffler — the Whering "Dress Me" carousel.
 *
 * Three horizontal scroll-snap rows (Tops, Bottoms, Shoes), each a row of
 * closet pieces. Pure CSS handles the snapping — buttery 60fps with zero
 * JS animation. `IntersectionObserver` watches each row to know which
 * tile is centered and fires `snapTick` (light haptic) when the index
 * changes, giving the carousel a "tactile dial" feel.
 *
 * Why props over fetching inside: `Shuffler` is data-agnostic. The parent
 * (`FitBuilder`) feeds it the same `useClosetData()` items already in
 * cache so adding a new piece in `/closet` reflects here on next mount.
 *
 * Lock toggles: tapping the lock icon on a row marks it `locked`, which
 * tells `handleShuffle` to skip the `scrollTo(random)` for that row. So
 * a user can lock a favorite top, shuffle the rest, and never lose the
 * top.
 *
 * Pure CSS overshoot via `transition: transform 380ms cubic-bezier(0.22,
 * 1.2, 0.36, 1)` on the active-card lift. No motion lib needed.
 */

import * as React from "react";
import { Lock, LockOpen, Shuffle, Sparkles, Wand2 } from "lucide-react";
import type { ClosetItem } from "@/hooks/useClosetData";
import { snapTick, thrust, selectTick } from "@/lib/haptics";
import { cn } from "@/lib/utils";
import { HapticButton } from "./HapticButton";

// ─────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────

export type RowKey = "tops" | "bottoms" | "shoes";

interface RowSpec {
  key: RowKey;
  label: string;
  emoji: string;
}

const ROWS: RowSpec[] = [
  { key: "tops", label: "Tops", emoji: "👕" },
  { key: "bottoms", label: "Bottoms", emoji: "👖" },
  { key: "shoes", label: "Shoes", emoji: "👟" },
];

export interface ShufflerSelection {
  tops: ClosetItem | null;
  bottoms: ClosetItem | null;
  shoes: ClosetItem | null;
}

export interface ShufflerProps {
  /** Per-row items, already filtered by category. Empty rows render an
   *  "Add a {tops,bottoms,shoes} item" hint. */
  tops: ClosetItem[];
  bottoms: ClosetItem[];
  shoes: ClosetItem[];
  /** Called whenever the centered item for any row changes (initial fire
   *  included so the parent can hydrate `currentFit`). */
  onSelectionChange?: (selection: ShufflerSelection) => void;
  /** Optional className for the outer container. */
  className?: string;
}

// ─────────────────────────────────────────────────────────────────────────
// Row — single scroll-snap carousel with observed center item
// ─────────────────────────────────────────────────────────────────────────

interface RowProps {
  spec: RowSpec;
  items: ClosetItem[];
  locked: boolean;
  onToggleLock: () => void;
  onCenteredChange: (item: ClosetItem | null) => void;
  /** Imperative random-scroll, used by parent's Shuffle button. */
  registerScroller: (scrollTo: (index: number) => void) => void;
}

const Row = React.memo(function Row({
  spec,
  items,
  locked,
  onToggleLock,
  onCenteredChange,
  registerScroller,
}: RowProps) {
  const rowRef = React.useRef<HTMLDivElement | null>(null);
  const tileRefs = React.useRef<Array<HTMLButtonElement | null>>([]);
  // `lastCenteredIndexRef` stores the *real* index the parent sees
  // (0..items.length-1) so we always emit haptics + onCenteredChange
  // against domain indices, not the cloned renderItems index space.
  const lastCenteredIndexRef = React.useRef<number | null>(null);
  // `lastRenderedIdxRef` is the most recent IntersectionObserver hit in
  // the cloned renderItems array. Used by the scrollend-wrap-jump
  // useEffect below to know whether we're resting on a clone (renderIdx
  // 0 or renderItems.length-1) and need a silent snap-back.
  const lastRenderedIdxRef = React.useRef(0);
  // 150ms debounce fallback to detect scroll-end on iOS WebView where
  // the native `scrollend` event isn't reliably supported on iOS 15/16.
  const scrollTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  // Stable map: index → item. Used by `scrollToIndex` and the parent
  // mutation handler so we don't re-derive on each render.
  const itemsRef = React.useRef(items);
  React.useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  // Wrap-around cloning — render `[last, ...items, first]` so a swipe
  // past either boundary lands on a clone that we silently snap back
  // from. Disabled for 0/1-item rows: empty rows render the empty hint
  // anyway, and a single item has nothing to wrap.
  const hasClones = items.length > 1;
  const renderItems = React.useMemo(
    () =>
      hasClones
        ? [items[items.length - 1], ...items, items[0]]
        : items,
    [items, hasClones],
  );

  // Map a `renderItems` index back to the user-facing (domain) index.
  // The leading clone at idx=0 represents the real LAST item, and the
  // trailing clone at idx=renderItems.length-1 represents the real FIRST.
  const getRealIndex = React.useCallback(
    (renderIdx: number): number => {
      if (!hasClones) return renderIdx;
      if (renderIdx === 0) return items.length - 1;
      if (renderIdx === renderItems.length - 1) return 0;
      return renderIdx - 1;
    },
    [hasClones, items.length, renderItems.length],
  );

  // Center-margin: extends the first/last tile outward so the row can
  // scroll the leftmost (resp. rightmost) tile into the visual center.
  // Without this, `row.scrollTo({ left: 0 })` would clamp at the row
  // edge, leaving the first tile pinned to the left rather than centered.
  // Recomputed on layout change via ResizeObserver.
  const [centerMargin, setCenterMargin] = React.useState(0);
  React.useEffect(() => {
    const row = rowRef.current;
    const first = tileRefs.current[0];
    if (!row || !first) return;
    const compute = () => {
      const liveRow = rowRef.current;
      const liveFirst = tileRefs.current[0];
      if (!liveRow || !liveFirst) return;
      setCenterMargin(
        Math.max(0, (liveRow.clientWidth - liveFirst.clientWidth) / 2)
      );
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(row);
    ro.observe(first);
    return () => ro.disconnect();
  }, [items.length]);

  // Expose imperative scrollTo to the parent. Because items can change
  // (user adds a piece), we resolve "index" against the live itemsRef so
  // a stale closure can't scroll past the new tile count. Parent passes
  // a domain index (0..items.length-1); translate to renderItems space
  // (+1 to skip the leading clone) when wrap is active.
  React.useEffect(() => {
    registerScroller((index: number) => {
      const live = itemsRef.current;
      if (live.length === 0) return;
      // Clamp to range — guards against out-of-bounds when items shrink.
      const safeIdx = Math.max(0, Math.min(index, live.length - 1));
      const renderIdx = hasClones ? safeIdx + 1 : safeIdx;
      const tile = tileRefs.current[renderIdx];
      const row = rowRef.current;
      if (!tile || !row) return;
      // Center math: tile.center should equal row.center.
      //   row.scrollLeft + row.clientWidth/2 = tile.offsetLeft + tile.clientWidth/2
      //   row.scrollLeft = tile.offsetLeft + tile.clientWidth/2 - row.clientWidth/2
      const rowWidth = row.clientWidth;
      const tileWidth = tile.clientWidth;
      const desired = tile.offsetLeft + tileWidth / 2 - rowWidth / 2;
      row.scrollTo({ left: Math.max(0, desired), behavior: "smooth" });
    });
  }, [registerScroller, hasClones]);

  // IntersectionObserver — fires snapTick + report centered item to
  // parent. We map the rendered idx back to a domain (real) index so the
  // parent never sees a clone value, AND we capture `lastRenderedIdxRef`
  // for the wrap-jump useEffect below.
  React.useEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    const tileEls = tileRefs.current.filter(
      (el): el is HTMLButtonElement => el !== null
    );
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting || entry.intersectionRatio < 0.6) continue;
          const idx = tileEls.findIndex((el) => el === entry.target);
          if (idx === -1) continue;
          lastRenderedIdxRef.current = idx;
          const realIdx = getRealIndex(idx);
          if (lastCenteredIndexRef.current !== realIdx) {
            lastCenteredIndexRef.current = realIdx;
            onCenteredChange(itemsRef.current[realIdx] ?? null);
            snapTick();
          }
        }
      },
      { root: row, threshold: [0.6] }
    );
    tileEls.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [onCenteredChange, renderItems.length, centerMargin, getRealIndex]);

  // Wrap-jump — when the user finishes a flick and is resting on a
  // clone (renderIdx 0 or renderItems.length-1), silently scroll back
  // to the matching real item. 150ms after the last `scroll` event is
  // the standard window for `scrollend` polyfill on iOS WebView.
  React.useEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    const onScroll = () => {
      window.clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = window.setTimeout(() => {
        if (!hasClones) return;
        const currentRenderIdx = lastRenderedIdxRef.current;
        if (
          currentRenderIdx === 0 ||
          currentRenderIdx === renderItems.length - 1
        ) {
          const targetRenderIdx = getRealIndex(currentRenderIdx) + 1;
          const targetEl = tileRefs.current[targetRenderIdx];
          if (targetEl && row) {
            const rowWidth = row.clientWidth;
            const tileWidth = targetEl.clientWidth;
            const desired =
              targetEl.offsetLeft + tileWidth / 2 - rowWidth / 2;
            row.scrollTo({ left: Math.max(0, desired), behavior: "auto" });
          }
        }
      }, 150);
    };
    row.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      row.removeEventListener("scroll", onScroll);
      window.clearTimeout(scrollTimeoutRef.current);
    };
  }, [hasClones, getRealIndex, renderItems.length]);

  // Initial centering — when wrap is active we start on renderIdx=1
  // (the real first item), NOT on renderIdx=0 (the clone of the last
  // item). Without this the user briefly sees the clone of last[0] on
  // first paint.
  React.useEffect(() => {
    if (items.length === 0) return;
    // Defer to next frame so tiles have measurable offsetLeft.
    const id = window.requestAnimationFrame(() => {
      const startRenderIdx = hasClones ? 1 : 0;
      const first = tileRefs.current[startRenderIdx];
      const row = rowRef.current;
      if (!first || !row) return;
      const rowWidth = row.clientWidth;
      const tileWidth = first.clientWidth;
      const desired = first.offsetLeft + tileWidth / 2 - rowWidth / 2;
      row.scrollTo({ left: Math.max(0, desired), behavior: "auto" });
      // Fire the initial center report up so parent state hydrates.
      onCenteredChange(items[0] ?? null);
      lastCenteredIndexRef.current = 0;
    });
    return () => window.cancelAnimationFrame(id);
  }, [items, onCenteredChange, centerMargin, hasClones]);

  if (items.length === 0) {
    return (
      <div
        className="rounded-2xl bg-white border border-gray-200 px-4 py-6 flex items-center gap-3 wh-soft-shadow"
        role="group"
        aria-label={`${spec.label} (empty)`}
      >
        <div className="text-2xl" aria-hidden>
          {spec.emoji}
        </div>
        <div className="text-left">
          <p className="text-[11px] uppercase tracking-wider font-semibold text-gray-500">
            {spec.label}
          </p>
          <p className="text-sm text-gray-700 mt-0.5">
            Add a {spec.label.toLowerCase().slice(0, -1)} item to your closet
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative" role="group" aria-label={spec.label}>
      {/* Row header — label + lock toggle. */}
      <div className="flex items-center justify-between px-2 mb-2">
        <p className="text-[11px] uppercase tracking-widest font-semibold text-gray-500">
          {spec.label}
          <span className="ml-2 text-gray-400 font-normal normal-case tracking-normal">
            {items.length} {items.length === 1 ? "piece" : "pieces"}
          </span>
        </p>
        <button
          type="button"
          onClick={() => {
            selectTick();
            onToggleLock();
          }}
          className={cn(
            "h-7 w-7 rounded-full flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black",
            locked
              ? "bg-black text-white"
              : "bg-gray-100 text-gray-500 hover:bg-gray-200"
          )}
          aria-pressed={locked}
          aria-label={
            locked ? `Unlock ${spec.label.toLowerCase()} row` : `Lock ${spec.label.toLowerCase()} row`
          }
        >
          {locked ? (
            <Lock className="w-3.5 h-3.5" strokeWidth={2} />
          ) : (
            <LockOpen className="w-3.5 h-3.5" strokeWidth={2} />
          )}
        </button>
      </div>

      {/* Scroll-snap row. No `px-N` padding on the row itself — center
        margin is applied as inline marginInline on the first/last tile
        (see `centerMargin` state above). That way the row can scroll
        the leftmost tile into visual center even though scrollLeft
        can't go negative. */}
      <div
        ref={rowRef}
        className="no-scrollbar snap-x-center flex gap-3 overflow-x-auto py-3 rounded-2xl bg-white border border-gray-200 wh-soft-shadow"
        style={{ scrollPaddingInline: centerMargin ? `${centerMargin}px` : undefined }}
      >
        {renderItems.map((item, idx) => (
          <button
            key={`${item.id}-${idx}`}
            ref={(el) => {
              tileRefs.current[idx] = el;
            }}
            type="button"
            className="snap-item flex-none w-[68%] sm:w-[60%] aspect-[3/4] rounded-2xl bg-gray-50 overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black active:scale-[0.98] wh-spring"
            style={{
              // Inline margin so the row can scroll the first/last tile
              // into view centered; without this `scrollTo({ left: 0 })`
              // clamps at the row edge and the first tile ends up pinned
              // left instead of centered. With wrap-around, the first and
              // last renderIdx are the cloned boundary tiles, which we
              // also want centered on landing (before the silent snap).
              marginInline:
                idx === 0 || idx === renderItems.length - 1 ? centerMargin : 0,
            }}
            onClick={() => {
              snapTick();
            }}
            aria-label={`${item.title}, ${item.brand || "no brand"}`}
          >
            {item.source_image_url ? (
              <img
                src={item.source_image_url}
                alt={item.title}
                loading="lazy"
                className="w-full h-full object-contain p-3"
                draggable={false}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300 text-3xl">
                {spec.emoji}
              </div>
            )}
            <div className="px-3 pb-3 -mt-10 bg-gradient-to-t from-white via-white/80 to-transparent pt-6">
              <p className="text-[11px] uppercase tracking-wider font-semibold text-gray-500 truncate">
                {item.brand || "Untitled"}
              </p>
              <p className="text-sm font-semibold text-gray-900 truncate">
                {item.title}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
});

// ─────────────────────────────────────────────────────────────────────────
// Shuffler — composes 3 rows + Shuffle button
// ─────────────────────────────────────────────────────────────────────────

export function Shuffler({
  tops,
  bottoms,
  shoes,
  onSelectionChange,
  className,
}: ShufflerProps) {
  // Map of row → latest `scrollTo(index)` fn. Populated by each Row's
  // `registerScroller`; consumed by `shuffleUnlocked`.
  const scrollersRef = React.useRef<
    Partial<Record<RowKey, (index: number) => void>>
  >({});
  const [locked, setLocked] = React.useState<Record<RowKey, boolean>>({
    tops: false,
    bottoms: false,
    shoes: false,
  });
  // Snapshot of each row's currently-centered item, lifted up so the
  // parent can read "what's selected" without traversing the DOM.
  const [centered, setCentered] = React.useState<ShufflerSelection>({
    tops: null,
    bottoms: null,
    shoes: null,
  });

  // Notify parent on every centered-item change. Stable callback identity
  // so consumers can use it in a `useEffect` without thrash.
  const notifyRef = React.useRef(onSelectionChange);
  React.useEffect(() => {
    notifyRef.current = onSelectionChange;
  }, [onSelectionChange]);
  React.useEffect(() => {
    notifyRef.current?.(centered);
  }, [centered]);

  const registerScroller = React.useCallback(
    (key: RowKey) => (scrollTo: (index: number) => void) => {
      scrollersRef.current[key] = scrollTo;
    },
    []
  );

  const makeSetCentered =
    (key: RowKey) =>
    (item: ClosetItem | null) => {
      setCentered((prev) => (prev[key] === item ? prev : { ...prev, [key]: item }));
    };

  const toggleLock = (key: RowKey) =>
    setLocked((prev) => ({ ...prev, [key]: !prev[key] }));

  // Pick a random index per unlocked row and scroll to it.
  const shuffleUnlocked = () => {
    thrust();
    (Object.keys(ROWS) as RowKey[]).forEach((key) => {
      if (locked[key]) return;
      const pool =
        key === "tops" ? tops : key === "bottoms" ? bottoms : shoes;
      if (pool.length === 0) return;
      const idx = Math.floor(Math.random() * pool.length);
      scrollersRef.current[key]?.(idx);
    });
  };

  const totalItems = tops.length + bottoms.length + shoes.length;
  const empty = totalItems === 0;

  return (
    <div
      className={cn(
        "space-y-4 wh-shell rounded-3xl p-3 sm:p-4",
        className
      )}
      role="region"
      aria-label="Dress Me shuffler"
    >
      {empty ? (
        <div className="rounded-2xl bg-white border border-gray-200 p-6 text-center wh-soft-shadow">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <Wand2 className="w-6 h-6 text-gray-600" strokeWidth={1.75} />
          </div>
          <p className="text-base font-bold text-gray-900 tracking-tight">
            No pieces to shuffle yet
          </p>
          <p className="text-sm text-gray-500 mt-1 max-w-[260px] mx-auto">
            Open the Closet tab to scan or upload tops, bottoms, and shoes —
            then come back here to swipe through them.
          </p>
        </div>
      ) : (
        <>
          {ROWS.map((spec) => {
            const items =
              spec.key === "tops" ? tops : spec.key === "bottoms" ? bottoms : shoes;
            return (
              <Row
                key={spec.key}
                spec={spec}
                items={items}
                locked={locked[spec.key]}
                onToggleLock={() => toggleLock(spec.key)}
                onCenteredChange={makeSetCentered(spec.key)}
                registerScroller={registerScroller(spec.key)}
              />
            );
          })}
        </>
      )}

      {/* Footer action bar — sticky so the shuffle thumb is always within
        reach on tall phones. Backdrop blur lifts it above the rows. */}
      {!empty && (
        <div className="sticky bottom-0 -mx-3 sm:-mx-4 px-3 sm:px-4 pt-3 pb-[calc(env(safe-area-inset-bottom,0px)+12px)] bg-gradient-to-t from-[var(--wh-bg)] via-[var(--wh-bg)] to-transparent">
          <HapticButton
            haptic="medium"
            onClick={shuffleUnlocked}
            disabled={empty}
            className={cn(
              "w-full flex items-center justify-center gap-2 px-5 py-4 rounded-2xl",
              "bg-black text-white text-sm font-semibold tracking-wide",
              "wh-lift-shadow wh-press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black",
              "disabled:opacity-50 disabled:cursor-not-allowed transition-colors hover:bg-gray-900"
            )}
          >
            <Sparkles className="w-4 h-4" strokeWidth={2.25} />
            Dress Me
          </HapticButton>
          <p className="text-[11px] text-gray-400 text-center mt-2 font-medium">
            <Shuffle className="inline w-3 h-3 mr-1" strokeWidth={2} />
            Tap any row to lock, then dress me to shuffle the rest
          </p>
        </div>
      )}
    </div>
  );
}
