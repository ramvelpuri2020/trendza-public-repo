/**
 * FitsView — simple saved-outfits grid for the Saved tab.
 *
 * Shows a two-column mosaic of saved outfits with name, piece count, and date.
 * Tap an outfit to open its detail view showing every item in that fit.
 * Supports delete from the detail view.
 *
 * Receives outfits from the parent so it shares the same useClosetData instance
 * as the other tabs — a save in Dress Me or Canvas appears here instantly.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Sparkles, Trash2, Edit3 } from 'lucide-react';

import {
  type SavedOutfit,
} from '@/hooks/useClosetData';
import { PullToRefresh } from "@/components/common/PullToRefresh"
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { thrust } from '@/lib/haptics';
import { CachedImage } from '@/components/ui/CachedImage';

/* -------------------------------------------------------------------------- */
/*                                Fit Card                                    */
/* -------------------------------------------------------------------------- */

function FitCard({ outfit }: { outfit: SavedOutfit }) {
  // Use the flattened thumbnail when available — single image, no mosaic overhead
  if (outfit.thumbnail_url) {
    return (
      <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 group">
        <CachedImage
          src={outfit.thumbnail_url}
          blurHash={null}
          width={480}
          alt={outfit.name}
          fit="cover"
          variant="hero"
          className="absolute inset-0 w-full h-full"
        />
        {/* Bottom scrim with name + count */}
        <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 via-black/30 to-transparent">
          <p className="text-white text-sm font-bold line-clamp-1">{outfit.name}</p>
          <p className="text-white/70 text-[11px] font-medium mt-0.5">
            {outfit.items.length} {outfit.items.length === 1 ? 'piece' : 'pieces'}
            {outfit.created_at &&
              ` · ${new Date(outfit.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}`}
          </p>
        </div>
      </div>
    )
  }

  const thumbs = outfit.items.slice(0, 4);
  const overflow = Math.max(outfit.items.length - thumbs.length, 0);

  return (
    <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 group">
      {thumbs.length === 0 ? (
        <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
          Empty fit
        </div>
      ) : thumbs.length === 1 ? (
        <CachedImage
          src={thumbs[0]?.source_image_url ?? null}
          blurHash={thumbs[0]?.blur_hash ?? null}
          width={320}
          alt={outfit.name}
          fit="cover"
          className="absolute inset-0 w-full h-full"
        />
      ) : (
        <div
          className={`absolute inset-0 grid gap-px ${
            thumbs.length === 2 ? 'grid-cols-2' : 'grid-cols-2 grid-rows-2'
          }`}
        >
          {thumbs.map((item, i) => (
            <div key={item.id ?? i} className="bg-white overflow-hidden">
              {item.source_image_url ? (
                <CachedImage
                  src={item.source_image_url}
                  blurHash={item.blur_hash ?? null}
                  width={240}
                  alt={item.title}
                  fit="cover"
                  className="w-full h-full"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300 text-2xl">✦</div>
              )}
            </div>
          ))}
        </div>
      )}

      {overflow > 0 && (
        <div className="absolute top-2 right-2 bg-black/85 text-white text-[11px] font-bold px-2 py-1 rounded-full backdrop-blur-md">
          +{overflow}
        </div>
      )}

      {/* Bottom scrim with name + count */}
      <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 via-black/30 to-transparent">
        <p className="text-white text-sm font-bold line-clamp-1">{outfit.name}</p>
        <p className="text-white/70 text-[11px] font-medium mt-0.5">
          {outfit.items.length} {outfit.items.length === 1 ? 'piece' : 'pieces'}
          {outfit.created_at &&
            ` · ${new Date(outfit.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}`}
        </p>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Saved Outfits Grid                            */
/* -------------------------------------------------------------------------- */

function SavedOutfitsGrid({
  outfits,
  isInitialLoad,
  loadError,
  onRetry,
}: {
  outfits: SavedOutfit[];
  isInitialLoad: boolean;
  loadError: string | null;
  onRetry: () => void;
}) {
  const navigate = useNavigate();

  if (isInitialLoad) {
    return (
      <div className="space-y-5 pt-2" aria-busy="true" aria-live="polite">
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] rounded-2xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mt-12 text-center">
        <p className="text-base font-semibold text-gray-900">Couldn't load your fits</p>
        <p className="text-sm text-gray-500 mt-1">{loadError}</p>
        <Button onClick={onRetry} className="mt-4">Try again</Button>
      </div>
    );
  }

  if (outfits.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mt-16 flex flex-col items-center text-center px-4 py-10"
      >
        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-5">
          <Sparkles className="w-9 h-9 text-gray-400" strokeWidth={1.5} />
        </div>
        <p className="text-xl font-bold text-gray-900 tracking-tight">No saved outfits yet</p>
        <p className="text-sm text-gray-500 mt-1.5 max-w-[260px]">
          Save a look from Dress Me or Canvas and it'll show up right here.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 pt-2">
      {outfits.map((outfit, idx) => (
        <motion.button
          key={outfit.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: Math.min(idx * 0.04, 0.4), duration: 0.3 }}
          onClick={() => navigate(`/fits?id=${outfit.id}`)}
          className="text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 rounded-2xl active:scale-[0.98] transition-transform"
          aria-label={`Open fit ${outfit.name}`}
        >
          <FitCard outfit={outfit} />
        </motion.button>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Fit Detail                                    */
/* -------------------------------------------------------------------------- */

function FitDetail({
  outfit,
  onDelete,
  onBack,
  onEdit,
}: {
  outfit: SavedOutfit;
  onDelete: (id: string) => Promise<void>;
  onBack: () => void;
  onEdit: (id: string) => void;
}) {
  const { toast } = useToast();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const handleDelete = async () => {
    await onDelete(outfit.id);
    thrust();
    toast({
      title: 'Fit deleted',
      description: `"${outfit.name}" was removed.`,
    });
    onBack();
  };

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onBack}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          aria-label="Back to saved fits"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(outfit.id)}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-black text-white hover:bg-gray-800 transition-colors"
            aria-label="Edit outfit"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setConfirmingDelete(true)}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-red-50 text-gray-500 hover:text-red-500 transition-colors"
            aria-label="Delete fit"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <h2 className="text-[28px] font-bold text-gray-900 tracking-tight leading-tight">
        {outfit.name}
      </h2>
      {outfit.created_at && (
        <p className="text-xs text-gray-500 mt-1 mb-5 font-medium">
          Saved{' '}
          {new Date(outfit.created_at).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
        </p>
      )}

      <div className="space-y-4 mt-6">
        {outfit.items.map((item, idx) => (
          <motion.div
            key={item.id ?? idx}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-white border border-gray-200 rounded-2xl p-3 flex items-center gap-3 shadow-sm"
          >
            <div className="w-14 h-14 rounded-xl bg-gray-50 overflow-hidden flex items-center justify-center flex-shrink-0">
              {item.source_image_url ? (
                <CachedImage
                  src={item.source_image_url}
                  blurHash={item.blur_hash ?? null}
                  width={120}
                  alt={item.title}
                  fit="contain"
                  className="w-full h-full"
                />
              ) : null}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                {item.category}
              </p>
              <p className="text-sm font-semibold text-gray-900 mt-0.5 truncate">
                {item.title}
              </p>
              {item.brand && (
                <p className="text-xs text-gray-500 mt-0.5 truncate">{item.brand}</p>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Delete confirmation */}
      <AnimatePresence>
        {confirmingDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setConfirmingDelete(false)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl"
            >
              <h3 className="text-lg font-bold text-gray-900">Delete this fit?</h3>
              <p className="text-sm text-gray-500 mt-1">
                "{outfit.name}" will be removed. The closet items stay.
              </p>
              <div className="flex gap-2 mt-5">
                <button
                  onClick={() => setConfirmingDelete(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*                                FitsView                                    */
/* -------------------------------------------------------------------------- */

export function FitsView({
  outfits,
  isInitialLoad,
  loadError,
  onRetry,
  onRefresh,
  onDeleteOutfit,
  onBack,
  onEditOutfit,
}: {
  outfits: SavedOutfit[];
  isInitialLoad: boolean;
  loadError: string | null;
  onRetry: () => void;
  onRefresh: () => void;
  onDeleteOutfit: (id: string) => Promise<void>;
  onBack: () => void;
  onEditOutfit: (id: string) => void;
}) {
  const location = useLocation();
  const detailId = new URLSearchParams(location.search).get('id');

  if (detailId) {
    const outfit = outfits.find((o) => o.id === detailId);
    if (!outfit) {
      return (
        <div className="mt-12 text-center">
          <p className="text-base font-semibold text-gray-900">Fit not found</p>
          <Button onClick={onBack} className="mt-5">Back to fits</Button>
        </div>
      );
    }
    return (
      <div className="px-4 min-h-full">
        {/* Flat 12px (0.75rem) — safe-area-inset-top is single-sourced at
            <body> (see index.html + index.css @supports). Earlier this
            stacked env() on top of body, doubling the inset and pushing
            the "Saved outfits" / FitDetail header too deep on notched
            iPhones. */}
        <div style={{ paddingTop: '0.75rem' }}>
          <FitDetail outfit={outfit} onDelete={onDeleteOutfit} onBack={onBack} onEdit={onEditOutfit} />
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 h-full flex flex-col">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex-shrink-0"
        style={{ paddingTop: '0.75rem' }}
      >
        <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2">
          Your Fits
        </p>
        <h1 className="text-[34px] font-bold text-black tracking-tight leading-tight">
          Saved outfits
        </h1>
      </motion.div>
      <PullToRefresh onRefresh={onRefresh} className="flex-1">
        <SavedOutfitsGrid
          outfits={outfits}
          isInitialLoad={isInitialLoad}
          loadError={loadError}
          onRetry={onRetry}
        />
      </PullToRefresh>
    </div>
  );
}
