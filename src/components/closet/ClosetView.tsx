/**
 * ClosetView — pieces-only workspace post-navigation refactor.
 *
 * After "Fits" became its own top-level tab at /fits, this view owns a
 * single job: collect and display the wardrobe (capture, upload, filter,
 * detail). Data fetching lives in the shared `useClosetData` hook so the
 * Closet and Fits tabs stay in sync without manual refreshes.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera as CameraIcon,
  Image as ImageIcon,
  Loader2,
  Plus,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { useUnifiedBackgroundRemoval } from '@/hooks/useUnifiedBackgroundRemoval';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { selectTick, successTick, thrust } from '@/lib/haptics';
import { encodeBlurHashFromImageSource } from '@/lib/image';

import PiecesTab from './PiecesTab';
import ItemDetailModal from './ItemDetailModal';
import { useClosetData, type ClosetItem } from '@/hooks/useClosetData';

// ClosetItem is owned by `useClosetData` — import-only here, no re-export
// to avoid two valid import paths for the same structural type.

// Filter chips for the chip strip. Field keys mirror the schema columns
// on `trendza_closet_items`. Inline rather than dynamic so the order +
// labels stay designer-controlled.
const FILTER_CHIPS: Array<{ key: string; value: string; label: string }> = [
  { key: 'category', value: 'tops', label: 'Tops' },
  { key: 'category', value: 'bottoms', label: 'Bottoms' },
  { key: 'category', value: 'shoes', label: 'Shoes' },
  { key: 'category', value: 'accessories', label: 'Accessories' },
  { key: 'season', value: 'spring', label: 'Spring' },
  { key: 'season', value: 'summer', label: 'Summer' },
  { key: 'season', value: 'fall', label: 'Fall' },
  { key: 'season', value: 'winter', label: 'Winter' },
];

/**
 * Upload progress overlay — visible while background-removal + storage
 * upload + AI classify are running. Shows a thin progress bar + Cancel.
 */
function UploadOverlay({
  progress,
  fileName,
  onCancel,
}: {
  progress: number;
  fileName: string;
  onCancel: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-md z-[60] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Uploading"
    >
      <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
        <div className="text-center mb-4">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <Sparkles className="w-6 h-6 text-gray-900" strokeWidth={1.75} />
          </div>
          <p className="text-base font-bold text-gray-900">
            Adding to your closet
          </p>
          <p className="text-xs text-gray-500 mt-1 truncate">{fileName}</p>
        </div>
        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mb-2">
          <motion.div
            animate={{ width: `${Math.max(progress, 4)}%` }}
            transition={{ duration: 0.3 }}
            className="h-full bg-black rounded-full"
          />
        </div>
        <p className="text-xs text-gray-500 text-center mb-4">{progress}%</p>
        <button
          onClick={onCancel}
          className="w-full py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors"
        >
          Cancel
        </button>
      </div>
    </motion.div>
  );
}

/**
 * PendingSection — surfaces items whose `category === 'pending'`
 * (currently being analyzed by the AI classifier). Renders as a small
 * thin row above the main PiecesTab grid with skeleton tiles + a
 * loader badge. Why this lives here and not inside PiecesTab: the
 * "still processing" UX is a Closet-specific concern (Shuffler / Canvas
 * route pending items out of their data flow without a UI affordance).
 * This also keeps PiecesTab prop surface stable.
 */
function PendingSection({ pendingItems }: { pendingItems: ClosetItem[] }) {
  if (pendingItems.length === 0) return null;
  return (
    <section
      aria-label="Still analyzing"
      className="mb-6 rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-4"
      data-testid="closet-pending-section"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-gray-500" strokeWidth={2} />
          <p className="text-sm font-semibold text-gray-900">
            Still analyzing
          </p>
          <span className="text-xs text-gray-500">
            ({pendingItems.length})
          </span>
        </div>
        <p className="text-xs text-gray-500">
          Hold tight — AI is figuring it out.
        </p>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {pendingItems.slice(0, 8).map((item) => (
          <div
            key={item.id}
            className="relative aspect-square rounded-xl bg-gray-100 overflow-hidden animate-pulse"
            aria-label={item.title || 'Pending item'}
          >
            {item.source_image_url && (
              <img
                src={item.source_image_url}
                alt=""
                className="absolute inset-0 h-full w-full object-cover opacity-60"
              />
            )}
            <div className="absolute bottom-1 left-1 right-1 text-[10px] text-white font-medium truncate bg-black/40 rounded px-1">
              {item.title || 'Pending'}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function ClosetView() {
  const { toast } = useToast();
  const {
    items,
    isInitialLoad,
    loadError,
    retry,
    toggleFavorite: toggleFavoriteRaw,
    insertItem,
    updateItem,
  } = useClosetData();

  // Background removal — server-side BiRefNet via the `process-bg`
  // Edge Function. The hook returns the storage path inside
  // `clipped-closet-items` where the transparent PNG lives; we
  // resolve it to a public URL inline.
  const removeBgMutation = useUnifiedBackgroundRemoval();

  // Wrap the favorite toggle so favorite/unfavorite feels tactile on tap.
  // Doesn't change behaviour — same state update, just adds haptic feedback.
  const toggleFavorite = useCallback(
    (id: string) => {
      thrust();
      toggleFavoriteRaw(id);
    },
    [toggleFavoriteRaw]
  );

  const [selectedItem, setSelectedItem] = useState<ClosetItem | null>(null);
  const [activeFilters, setActiveFilters] =
    useState<Record<string, string>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentFileName, setCurrentFileName] = useState('');
  const [showUploadSheet, setShowUploadSheet] = useState(false);
  const cancelUploadRef = useRef(false);

  const filteredItems = useMemo(() => {
    const filters = Object.entries(activeFilters);
    if (filters.length === 0) return items;
    return items.filter((item) => {
      for (const [k, val] of filters) {
        const field = (item as Record<string, unknown>)[k];
        if (field == null) return false;
        if (String(field).toLowerCase() !== String(val).toLowerCase()) {
          return false;
        }
      }
      return true;
    });
  }, [items, activeFilters]);

  const toggleFilterChip = (chip: { key: string; value: string }) => {
    setActiveFilters((prev) => {
      const next = { ...prev };
      if (next[chip.key] === chip.value) {
        delete next[chip.key];
      } else {
        next[chip.key] = chip.value;
      }
      return next;
    });
  };

  const clearFilters = () => setActiveFilters({});

  /**
   * Single-image upload pipeline. Takes a base64 dataURL, runs background
   * removal (if available), uploads to a public Supabase storage bucket,
   * inserts a placeholder row so the user sees the piece immediately
   * (with an "Analyzing" title), then fires off the AI classifier to
   * fill in title / category / color / etc.
   *
   * When called with `batch`, progress is mapped into an overall
   * percentage across the whole set (e.g. item 3 of 12 at 50% local =
   * ~20% overall) and the overlay stays up until the batch runner
   * finishes, so a large gallery haul shows one continuous progress bar
   * instead of a series of flashing dialogs.
   */
  const processSingleImage = async (
    dataUrl: string,
    label: string,
    batch?: { index: number; total: number }
  ) => {
    if (cancelUploadRef.current) return;
    // Map a local 0-100 progress step into the batch's overall position
    // so the bar always reflects the whole selection, not just the
    // current photo.
    const progressOf = (local: number) =>
      batch
        ? Math.min(
            Math.round(((batch.index + local / 100) / batch.total) * 100),
            100
          )
        : local;
    const fileName = batch
      ? `${label} ${batch.index + 1}/${batch.total}`
      : label;
    setCurrentFileName(fileName);
    setIsUploading(true);
    setUploadProgress(progressOf(8));

    try {
      setUploadProgress(progressOf(20));
      const blob = await fetch(dataUrl).then((r) => r.blob());
      // Server-side BiRefNet matting (replaces the in-browser MODNet
      // path). The clean PNG is written to `clipped-closet-items` and
      // surfaced to the UI as a public URL.
      let cleanPublicUrl: string;
      try {
        const cleanPath = await removeBgMutation.mutateAsync({
          imageBlob: blob,
          originalName: 'closet_upload.png',
        });
        const { data: pubData } = supabase.storage
          .from('clipped-closet-items')
          .getPublicUrl(cleanPath);
        cleanPublicUrl = pubData.publicUrl;
      } catch (e: any) {
        console.error('[closet-view] bg-removal failed:', e);
        throw new Error(e?.message ?? 'Background removal failed');
      }
      setUploadProgress(progressOf(45));

      // Compute BlurHash client-side from the BG-removed blob. The hash
      // is written into the `attributes` JSON column at insert time so
      // CachedImage can paint an instant placeholder on subsequent app
      // opens (drives Tier 4's "loads instantly on reopen" UX). Any
      // encoding failure here degrades gracefully \u2014 no hash means the
      // tile falls back to a soft gray skeleton while the disk cache
      // warms up.
      let blurHash: string | null = null;
      // Hash the raw image — close enough at 32×32 placeholder size
      // that the closet grid still shows a tinted version of the
      // user's photo. Encoding failure degrades gracefully.
      try {
        blurHash = await encodeBlurHashFromImageSource(blob);
      } catch {
        blurHash = null;
      }


      const { data: auth } = await supabase.auth.getUser();
      if (!auth?.user) throw new Error('Not signed in');
      setUploadProgress(progressOf(70));

      const { data: row, error: insertErr } = await supabase
        .from('trendza_closet_items')
        .insert({
          user_id: auth.user.id,
          title: 'Analyzing...',
          // 'pending' (was 'tops') — see clipper.tsx for the same
          // rationale. The closet grid surfaces this row under the
          // "Still analyzing" PendingSection banner until AI returns.
          category: 'pending',
          color: 'unknown',
          tags: [],
          attributes: blurHash ? { blur_hash: blurHash } : {},
          source_image_url: cleanPublicUrl,
        })
        .select(
          'id, title, brand, category, color, season, tags, attributes, source_image_url, created_at'
        )
        .single();
      if (insertErr || !row) throw insertErr ?? new Error('Insert failed');

      const insertedRowId = row.id;
      // Surface placeholder immediately; AI classify fills it in below.
      insertItem(row as ClosetItem);
      setUploadProgress(progressOf(82));

      try {
        // Contract: `analyze-closet-item` expects a base64 image string
        // under `image`. Sending the public URL would either fail or
        // return an empty result. Read the blob back through FileReader
        // to keep alignment with the deployed function contract.
        const base64Image = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        const { data: aiData } = await supabase.functions.invoke(
          'analyze-closet-item',
          { body: { image: base64Image } }
        );
        const payload = (aiData as any)?.result ?? aiData;
        if (payload && (payload.title || payload.category)) {
          // `?? 'pending'` (was `'tops'`) — see clipper.tsx for
          // rationale. Don't fabricate a category if AI doesn't
          // return one; user can fix it from the detail modal.
          await supabase
            .from('trendza_closet_items')
            .update({
              title: payload.title ?? 'Untitled',
              category: payload.category ?? 'pending',
              color: payload.color ?? 'unknown',
              season: payload.season ?? null,
              tags: payload.tags ?? [],
              attributes: payload.attributes ?? {},
              brand: payload.brand ?? '',
            })
           
            .eq('id', insertedRowId);
          // Re-SELECT the row and call useClosetData.updateItem so the
          // local state patches with the post-AI category. Without
          // this the closet grid keeps the pending row forever and
          // Shuffler/Canvas never see the freshly classified item.
          const { data: refreshed } = await supabase
            .from('trendza_closet_items')
            .select(
              'id, title, brand, category, color, season, tags, attributes, source_image_url, created_at'
            )
            .eq('id', insertedRowId)
            .single();
          if (refreshed) updateItem(refreshed as ClosetItem);
        }
      } catch {
        // Best-effort; the row stays pending and the user can still see
        // it under the PendingSection until they manually fix it.
      }

      setUploadProgress(progressOf(100));
      // In batch mode the runner owns the overlay lifecycle (one
      // continuous bar for the whole selection), so only the single-shot
      // path tears it down here. The brief 600ms pause doubles as a beat
      // between photos so a big haul doesn't feel like a wall of churn.
      setTimeout(() => {
        if (!batch) {
          setIsUploading(false);
          setUploadProgress(0);
          successTick();
        }
      }, 600);
    } catch (e: any) {
      console.error('Upload failed:', e);
      // Keep the batch going when one photo fails — the remaining items
      // still get added and the error is surfaced per-piece via toast.
      if (!batch) {
        setIsUploading(false);
        setUploadProgress(0);
      }
      toast({
        title: "Couldn't add that piece",
        description: e?.message ?? 'Something went wrong',
        variant: 'destructive',
      });
    }
  };

  /**
   * Batch runner for gallery multi-select. Feeds every picked photo
   * through the single-image pipeline in order, mapping each one's local
   * progress into the shared overall bar, then tears the overlay down
   * once (success haptic included) when the whole haul is done.
   */
  const processGalleryBatch = async (dataUrls: string[]) => {
    if (cancelUploadRef.current || dataUrls.length === 0) return;
    const total = dataUrls.length;
    for (let i = 0; i < total; i++) {
      if (cancelUploadRef.current) break;
      await processSingleImage(dataUrls[i], 'Photo', { index: i, total });
    }
    if (!cancelUploadRef.current) {
      successTick();
      toast({
        title: total > 1 ? `${total} pieces added` : 'Piece added',
        description:
          total > 1
            ? 'They\'re being analyzed — check the "Still analyzing" section.'
            : 'It\'s being analyzed — check the "Still analyzing" section.',
      });
    }
    setIsUploading(false);
    setUploadProgress(0);
  };

  const handleCameraCapture = async () => {
    setShowUploadSheet(false);
    // iOS first-run: must explicitly request camera permission or the
    // Capacitor plugin fails silently with an opaque capture error.
    const camPerms = await Camera.checkPermissions();
    if (camPerms.camera !== 'granted') {
      const requested = await Camera.requestPermissions({
        permissions: ['camera'],
      });
      if (requested.camera !== 'granted') {
        toast({
          title: 'Camera access required',
          description: 'Grant camera access in Settings to scan pieces.',
          variant: 'destructive',
        });
        return;
      }
    }
    const result = await Camera.getPhoto({
      resultType: CameraResultType.Base64,
      source: CameraSource.Camera,
      quality: 90,
    });
    if (cancelUploadRef.current) return;
    await processSingleImage(
      `data:image/jpeg;base64,${result.base64String}`,
      'Camera'
    );
  };

  const handleGalleryUpload = async () => {
    setShowUploadSheet(false);
    // Same permission gate as camera — separate Photos scope in the
    // Capacitor plugin so both must be granted independently.
    const photoPerms = await Camera.checkPermissions();
    if (photoPerms.photos !== 'granted') {
      const requested = await Camera.requestPermissions({
        permissions: ['photos'],
      });
      if (requested.photos !== 'granted') {
        toast({
          title: 'Photo library access required',
          description: 'Grant Photos access in Settings to upload pieces.',
          variant: 'destructive',
        });
        return;
      }
    }

    if (Capacitor.isNativePlatform()) {
      // Native multi-select — `pickImages` opens the system photo
      // picker in multi-select mode (limit 0 = unlimited) so the user
      // can grab a whole gallery haul in one go. Every picked photo
      // flows through the same upload pipeline sequentially to keep
      // peak memory flat no matter how many are chosen.
      const result = await Camera.pickImages({
        quality: 85,
        width: 1024,
        correctOrientation: true,
        presentationStyle: 'popover',
        limit: 0, // unlimited multi-select
      });
      if (cancelUploadRef.current) return;
      const photos = result.photos ?? [];
      if (photos.length === 0) return;

      // Materialize each picked photo to a dataURL. Done sequentially so
      // a large selection never loads every image into memory at once.
      const dataUrls: string[] = [];
      for (const p of photos) {
        try {
          const res = await fetch(p.webPath);
          const blob = await res.blob();
          const dataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
          dataUrls.push(dataUrl);
        } catch (e) {
          console.error('[closet-view] failed to read picked photo:', e);
        }
      }
      await processGalleryBatch(dataUrls);
    } else {
      // Web fallback — multi-select file input keeps the same "pick a
      // bunch at once" behaviour in the browser preview.
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.multiple = true;
      input.onchange = async (e) => {
        const files = Array.from((e.target as HTMLInputElement).files ?? []);
        if (files.length === 0 || cancelUploadRef.current) return;
        const dataUrls: string[] = [];
        for (const file of files) {
          dataUrls.push(
            await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(file);
            })
          );
        }
        await processGalleryBatch(dataUrls);
      };
      input.click();
    }
  };

  const handleCancel = () => {
    cancelUploadRef.current = true;
    setIsUploading(false);
    toast({
      title: 'Upload cancelled',
      description: 'The piece was not added.',
    });
  };

  // Cancel-ref re-arm is handled by the useEffect below — single source
  // of truth instead of fighting inline-vs-effect ordering.
  const handleAddPiece = () => {
    selectTick();
    setShowUploadSheet(true);
  };

  // Re-arm the cancel ref each time the picker is opened fresh, so a
  // previous cancellation never silently drops a new upload.
  useEffect(() => {
    if (showUploadSheet) cancelUploadRef.current = false;
  }, [showUploadSheet]);

  // Split: pending items render in a small "Still analyzing"
  // banner above the main grid; the rest go to PiecesTab grouped by
  // the active filter chips.
  const pendingItems = useMemo(
    () => items.filter((i) => i.pending === true || i.category === 'pending'),
    [items]
  );
  // PiecesTab receives items without the pending set so main-grid
  // filters (top/bottom/accessory/season) don't accidentally include
  // rows the AI hasn't classified yet.
  const mainItems = useMemo(
    () => items.filter((i) => !(i.pending === true || i.category === 'pending')),
    [items]
  );

  // Manual category override — used by ItemDetailModal. UPDATE the
  // row in Supabase, refresh the local view via updateItem so the
  // closet grid + Shuffler/Canvas pick up the change without a full
  // refetch. Errors are surfaced as a destructive toast.
  const updateCategory = useCallback(
    async (itemId: string, newCategory: string) => {
      try {
        const { data: updated, error } = await supabase
          .from('trendza_closet_items')
          .update({ category: newCategory })
          .eq('id', itemId)
          .select(
            'id, title, brand, category, color, season, tags, attributes, source_image_url, created_at'
          )
          .single();
        if (error) throw error;
        if (updated) updateItem(updated as ClosetItem);
      } catch (e: any) {
        console.error('updateCategory failed:', e);
        toast({
          title: "Couldn't update category",
          description: e?.message ?? 'Please try again',
          variant: 'destructive',
        });
      }
    },
    [updateItem, toast]
  );

  return (
    <div className="px-4 pb-nav-fab min-h-full relative">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        style={{
          // Flat 12px (0.75rem) — safe-area-inset-top is single-sourced at
          // <body> (see index.html + index.css @supports). An earlier version
          // applied env() here on top of the body's stacking, which pushed
          // "Wardrobe" header to y=154 on iPhone 14 Pro instead of y=95.
          paddingTop: '0.75rem',
        }}
      >
        <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2">
          Your Closet
        </p>
        <h1 className="text-[34px] font-bold text-black tracking-tight leading-tight">
          Wardrobe
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {/* Counts only items outside the "Still analyzing" section, so
             the header number agrees with what the user can interact
             with in the main grid below. Pending count is on its own
             section banner. */}
          {mainItems.length} {mainItems.length === 1 ? 'piece' : 'pieces'}
          {pendingItems.length > 0 && (
            <span className="text-gray-400">
              {' '}· {pendingItems.length} analyzing
            </span>
          )}
        </p>
      </motion.div>

      {/* Filter chip strip */}
      <div className="flex gap-2 overflow-x-auto pb-3 mt-4 -mx-4 px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {FILTER_CHIPS.map((chip) => {
          const isActive = activeFilters[chip.key] === chip.value;
          return (
            <button
              key={`${chip.key}-${chip.value}`}
              onClick={() => toggleFilterChip(chip)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 ${
                isActive
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {chip.label}
            </button>
          );
        })}
        {Object.keys(activeFilters).length > 0 && (
          <button
            onClick={clearFilters}
            className="flex-shrink-0 px-3 py-2 rounded-full text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Pending "Still analyzing" banner above the main grid — drops
         in only when there are pending rows. */}
      {!isInitialLoad && <PendingSection pendingItems={pendingItems} />}

      {/* Pieces grid (PiecesTab handles its own empty + add tile).
         mainItems excludes pending rows; user filter chips still
         apply on top via filteredItems. */}
      {!isInitialLoad && (
        <PiecesTab
          items={mainItems}
          filteredItems={filteredItems.filter(
            (i) => !(i.pending === true || i.category === 'pending')
          )}
          isUploading={isUploading}
          freeLimit={Number.POSITIVE_INFINITY}
          filterChips={[]}
          activeFilters={activeFilters}
          onToggleFilter={(k: string) => {
            const chip = FILTER_CHIPS.find(
              (c) => `${c.key}-${c.value}` === k
            );
            if (chip) toggleFilterChip(chip);
          }}
          onClearFilters={clearFilters}
          onAddPiece={handleAddPiece}
          onItemClick={(it) => setSelectedItem(it)}
          onToggleFavorite={(id) => toggleFavorite(id)}
        />
      )}

      {isInitialLoad && (
        <div
          className="grid grid-cols-3 gap-4 mt-4"
          aria-busy="true"
          aria-live="polite"
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square rounded-2xl bg-gray-100 animate-pulse"
            />
          ))}
        </div>
      )}

      {loadError && !isInitialLoad && (
        <div className="mt-12 text-center px-4">
          <p className="text-base font-semibold text-gray-900">
            Couldn't load your closet
          </p>
          <p className="text-sm text-gray-500 mt-1">{loadError}</p>
          <button
            onClick={retry}
            className="mt-4 px-4 py-2 bg-black text-white rounded-xl text-sm font-semibold hover:bg-gray-900 flex items-center gap-1.5 mx-auto transition-colors"
          >
            <RefreshCw className="w-4 h-4" strokeWidth={2.5} />
            Try again
          </button>
        </div>
      )}

      <ItemDetailModal
        item={selectedItem}
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        onToggleFavorite={(id) => toggleFavorite(id)}
        onUpdateCategory={updateCategory}
      />

      <AnimatePresence>
        {showUploadSheet && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end"
            onClick={() => setShowUploadSheet(false)}
            role="dialog"
            aria-modal="true"
            aria-label="Add a piece"
          >
            <motion.div
              initial={{ y: 60 }}
              animate={{ y: 0 }}
              exit={{ y: 60 }}
              transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              onClick={(e) => e.stopPropagation()}
              // `pb-safe` removed — that Tailwind utility applies
              // `padding-bottom: env(safe-area-inset-bottom)` directly,
              // which was stacking on top of the body-level env(bottom)
              // single source. The sheet's outer `p-6` (1.5rem = 24px on
              // all sides) already gives the aesthetic bottom padding
              // we want; the home-indicator clearance rides on body's
              // env(bottom) alone. (b) double-count fix per Phase 3 of
              // the iOS layout cleanup sweep.
              className="bg-white w-full p-6 shadow-2xl rounded-t-3xl"
            >
              <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-5" />
              <h3 className="text-xl font-bold text-gray-900 tracking-tight mb-4">
                Add a piece
              </h3>
              <div className="space-y-2">
                <button
                  onClick={handleCameraCapture}
                  className="w-full bg-gray-50 hover:bg-gray-100 rounded-2xl p-4 flex items-center gap-3 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center flex-shrink-0">
                    <CameraIcon className="w-5 h-5" strokeWidth={1.75} />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">Take photo</p>
                    <p className="text-xs text-gray-500">Use your camera</p>
                  </div>
                </button>
                <button
                  onClick={handleGalleryUpload}
                  className="w-full bg-gray-50 hover:bg-gray-100 rounded-2xl p-4 flex items-center gap-3 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center flex-shrink-0">
                    <ImageIcon className="w-5 h-5" strokeWidth={1.75} />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">Choose photos</p>
                    <p className="text-xs text-gray-500">Select one or many from your gallery</p>
                  </div>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isUploading && (
          <UploadOverlay
            progress={uploadProgress}
            fileName={currentFileName}
            onCancel={handleCancel}
          />
        )}
      </AnimatePresence>

      <button
        onClick={handleAddPiece}
        aria-label="Add piece"
        className="fixed right-5 w-14 h-14 bg-black rounded-full flex items-center justify-center shadow-lg hover:bg-gray-900 z-40 transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
        style={{
          bottom: 'calc(64px + env(safe-area-inset-bottom, 0px) + 20px)',
        }}
      >
        <Plus className="w-6 h-6 text-white" strokeWidth={2.5} />
      </button>
    </div>
  );
}
