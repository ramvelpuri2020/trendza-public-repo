'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, CalendarPlus, Loader2, AlertCircle, CheckCircle2, Camera, Pencil, Clock, ImageIcon, ChevronRight, Zap } from 'lucide-react';
import { haptic } from '@/lib/haptics';

interface DayViewProps {
  date: Date;
  /** The try-on image URL (null if not yet generated) */
  tryOnImageUrl: string | null;
  /** Generation status */
  generationStatus: 'idle' | 'pending' | 'generating' | 'completed' | 'failed' | null;
  /** The outfit name if one is planned */
  outfitName?: string;
  /** The outfit's items (thumbnails + titles) to show alongside the try-on */
  outfitItems?: Array<{ title?: string; source_image_url?: string }>;
  /** Whether the user has any saved outfits to plan */
  hasOutfits: boolean;
  /** Called when the user taps "Plan an outfit" or "+ Plan" */
  onPlanOutfit: () => void;
  /** Called when the user wants to change the planned outfit */
  onChangeOutfit: () => void;
  /** Called when the user wants to remove the planned outfit */
  onRemoveOutfit: () => void;
  /** Error message if generation failed */
  errorMessage?: string | null;
  /** Whether the user has uploaded a base photo (null = checking) */
  hasBasePhoto?: boolean | null;
  /** The user's base photo URL — fills the empty day card when present */
  basePhotoUrl?: string | null;
  /** True once the user has generated at least one try-on — hides the
   *  onboarding-style copy on the empty day card (kept for new users). */
  hasDoneGeneration?: boolean;
  /** Called when the user wants to upload a base photo */
  onUploadPhoto?: () => void;
}

// ── Generation progress stages ──────────────────────────────────────

type GenerationStage = 'preparing' | 'ai-working' | 'finalizing';

interface StageInfo {
  label: string;
  description: string;
  icon: typeof Zap;
  minPercent: number;
  maxPercent: number;
}

const STAGES: Record<GenerationStage, StageInfo> = {
  preparing: {
    label: 'Preparing your images',
    description: 'Processing photos for the AI',
    icon: ImageIcon,
    minPercent: 5,
    maxPercent: 20,
  },
  'ai-working': {
    label: 'AI is creating your look',
    description: 'This takes about 15 seconds',
    icon: Zap,
    minPercent: 20,
    maxPercent: 85,
  },
  finalizing: {
    label: 'Finalizing your try-on',
    description: 'Applying the finishing touches',
    icon: Sparkles,
    minPercent: 85,
    maxPercent: 95,
  },
};

// ── Friendly error messages ─────────────────────────────────────────

function friendlyError(message: string | null | undefined): string {
  if (!message) return 'Something unexpected happened. Please try again.';

  const lower = message.toLowerCase();

  if (lower.includes('timeout') || lower.includes('timed out') || lower.includes('504') || lower.includes('gateway')) {
    return 'The AI took a bit too long to respond. Try again — it\'ll be faster the second time!';
  }
  if (lower.includes('422') || lower.includes('unprocessable')) {
    return 'There was a hiccup sending your images to the AI. Please try planning this outfit again.';
  }
  if (lower.includes('500') || lower.includes('internal server')) {
    return 'The AI service had a temporary issue. We\'ve been notified and it should be back shortly.';
  }
  if (lower.includes('no_base_photo') || lower.includes('base photo')) {
    return 'Upload a photo of yourself first so the AI can generate your try-on look.';
  }
  if (lower.includes('no garment') || lower.includes('valid item') || lower.includes('source_image_url')) {
    return 'Some items in this outfit don\'t have valid images. Try recreating the outfit.';
  }
  if (lower.includes('auth') || lower.includes('unauthorized')) {
    return 'Your session expired. Please log in again.';
  }
  if (lower.includes('network') || lower.includes('fetch') || lower.includes('abort')) {
    return 'Connection interrupted. Check your internet and try again.';
  }
  if (lower.includes('edge function') || lower.includes('returned')) {
    // Generic edge function error — strip the technical details
    return 'The generation service encountered an issue. Please try again.';
  }

  // Cap at 120 chars to avoid wall-of-text
  if (message.length > 120) return message.slice(0, 120) + '...';
  return message;
}

// ── View State ──────────────────────────────────────────────────────

type ViewState =
  | { kind: 'empty' }
  | { kind: 'generating'; elapsed: number }
  | { kind: 'completed'; imageUrl: string; outfitName?: string }
  | { kind: 'failed'; errorMessage?: string | null };

function computeViewState(
  generationStatus: DayViewProps['generationStatus'],
  tryOnImageUrl: string | null,
  outfitName: string | undefined,
  errorMessage: string | null | undefined,
  elapsed: number,
): ViewState {
  const isGenerating = generationStatus === 'pending' || generationStatus === 'generating';
  if (generationStatus === null || generationStatus === 'idle') return { kind: 'empty' };
  if (generationStatus === 'completed' && tryOnImageUrl) {
    return { kind: 'completed', imageUrl: tryOnImageUrl, outfitName };
  }
  if (generationStatus === 'failed' && !isGenerating) {
    return { kind: 'failed', errorMessage };
  }
  if (isGenerating) return { kind: 'generating', elapsed };
  return { kind: 'empty' };
}

/**
 * Compute the current generation stage + progress percent based on elapsed time.
 * This is a frontend simulation since we don't get real progress from the backend.
 */
function computeProgress(elapsed: number): { stage: GenerationStage; percent: number } {
  if (elapsed < 3) {
    // 0-3s: preparing
    const pct = 5 + (elapsed / 3) * 15;
    return { stage: 'preparing', percent: Math.round(pct) };
  } else if (elapsed < 18) {
    // 3-18s: AI working (tuned for the ~12s Qwen 2.0 path)
    const pct = 20 + ((elapsed - 3) / 15) * 65;
    return { stage: 'ai-working', percent: Math.round(pct) };
  } else {
    // 18s+: finalizing
    const pct = Math.min(95, 85 + ((elapsed - 18) / 6) * 10);
    return { stage: 'finalizing', percent: Math.round(pct) };
  }
}

// ── Component ───────────────────────────────────────────────────────

// ── Outfit item strip ───────────────────────────────────────────────
// Small thumbnails + titles of the garments in the planned outfit.
function ItemStrip({ items }: { items: DayViewProps['outfitItems'] }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar px-4 py-2.5 border-t border-border/40 bg-muted/5">
      {items.slice(0, 4).map((item, i) => (
        <div key={`${item.title ?? i}-${i}`} className="flex items-center gap-2 flex-none">
          {item.source_image_url ? (
            <img
              src={item.source_image_url}
              alt={item.title ?? ''}
              loading="lazy"
              decoding="async"
              className="h-9 w-9 rounded-lg border border-border/40 object-cover"
            />
          ) : null}
          <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
            {item.title ?? 'Item'}
          </span>
          {i < items.length - 1 && <span className="text-muted-foreground/40">·</span>}
        </div>
      ))}
    </div>
  );
}

export function DayView({
  date,
  tryOnImageUrl,
  generationStatus,
  outfitName,
  outfitItems,
  hasOutfits,
  onPlanOutfit,
  onChangeOutfit,
  onRemoveOutfit,
  errorMessage,
  hasBasePhoto,
  basePhotoUrl,
  hasDoneGeneration,
  onUploadPhoto,
}: DayViewProps) {
  const formattedDate = date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  // ── Elapsed time counter ──────────────────────────────────────────
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isGenerating = generationStatus === 'pending' || generationStatus === 'generating';

  useEffect(() => {
    if (isGenerating) {
      setElapsed(0);
      timerRef.current = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isGenerating]);

  const viewState = computeViewState(
    generationStatus,
    tryOnImageUrl,
    outfitName,
    errorMessage,
    elapsed,
  );

  const progress = isGenerating ? computeProgress(elapsed) : null;

  const formatElapsed = (s: number) => {
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}m ${sec}s`;
  };

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div className="flex flex-1 flex-col px-4 pb-4">
      {/* Date label */}
      <motion.p
        key={formattedDate}
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-[15px] font-medium text-muted-foreground mb-3"
      >
        {formattedDate}
      </motion.p>

      <AnimatePresence mode="wait">
        {/* ═══════════════════════════════════════════════════════
           EMPTY STATE — no outfit planned yet
           ═══════════════════════════════════════════════════════ */}
        {viewState.kind === 'empty' && (
          /* When the user has a base photo, the whole rounded card is
             covered by it — opening a new day shows you. The Plan Outfit
             CTA sits overlaid on the photo. Falls back to the dashed
             placeholder when no base photo exists yet. */
          hasBasePhoto === true && basePhotoUrl ? (
            <motion.div
              key="empty-photo"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="relative flex-1 overflow-hidden rounded-3xl border border-border/40 shadow-sm"
            >
              <img
                src={basePhotoUrl}
                alt="Your base photo"
                loading="eager"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover object-top"
              />
              {/* Legibility gradient over the photo */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-black/10" />

              <div className="relative flex h-full flex-col items-center justify-end gap-3 px-6 pb-6 pt-10 text-center">
                {/* Onboarding copy — only for new users who haven't done
                    their first generation yet. Everyone else just gets the
                    photo + CTA so the base photo dominates the card. */}
                {!hasDoneGeneration && (
                  <>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.05 }}
                      className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/25 backdrop-blur-sm"
                    >
                      <CalendarPlus className="h-6 w-6 text-white" strokeWidth={1.5} />
                    </motion.div>

                    <h3 className="text-lg font-semibold text-white">
                      Plan an outfit for this day
                    </h3>

                    <p className="text-sm text-white/80 max-w-xs leading-relaxed">
                      {hasOutfits
                        ? 'Choose one of your saved outfits and see an AI-generated try-on preview.'
                        : 'Create an outfit first, then plan it for a specific day.'}
                    </p>
                  </>
                )}

                <button
                  type="button"
                  onClick={onPlanOutfit}
                  className="group relative mt-1 flex items-center justify-center gap-2 overflow-hidden rounded-full bg-white px-6 py-3 text-sm font-semibold text-black shadow-lg transition-all hover:opacity-90 active:scale-[0.97]"
                >
                  {hasOutfits ? '+ Plan Outfit' : 'Create Outfit'}
                  <ChevronRight className="h-4 w-4" />
                </button>

                {onUploadPhoto && (
                  <button
                    type="button"
                    onClick={() => {
                      haptic('light');
                      onUploadPhoto?.();
                    }}
                    className="mt-1 flex items-center gap-1 text-xs text-white/70 hover:text-white transition-colors"
                  >
                    <Pencil className="h-3 w-3" />
                    Change base photo
                  </button>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="flex flex-1 flex-col items-center justify-center rounded-3xl border-2 border-dashed border-muted-foreground/20 bg-gradient-to-b from-muted/5 to-muted/20 shadow-sm"
            >
            <div className="flex flex-col items-center gap-4 px-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.05 }}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary/10 to-primary/5 ring-1 ring-primary/10"
              >
                <CalendarPlus className="h-7 w-7 text-primary/70" strokeWidth={1.5} />
              </motion.div>

              <h3 className="text-lg font-semibold text-foreground">
                Plan an outfit for this day
              </h3>

              <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                {hasBasePhoto === false
                  ? 'Upload a photo of yourself first so the AI can show you how you\'ll look in any outfit.'
                  : hasOutfits
                    ? 'Choose one of your saved outfits and see an AI-generated try-on preview.'
                    : 'Create an outfit first, then plan it for a specific day.'}
              </p>

              {hasBasePhoto === false && onUploadPhoto ? (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="flex flex-col gap-2 mt-2 w-full max-w-[240px]"
                >
                  <button
                    type="button"
                    onClick={() => {
                      haptic('light');
                      onUploadPhoto?.();
                    }}
                    className="group relative w-full overflow-hidden rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background transition-all hover:opacity-90 active:scale-[0.97] flex items-center justify-center gap-2"
                  >
                    <Camera className="h-4 w-4" />
                    Upload Your Photo
                    <motion.span
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                      initial={{ x: '-100%' }}
                      whileHover={{ x: '100%' }}
                      transition={{ duration: 0.6 }}
                    />
                  </button>
                  <button
                    type="button"
                    onClick={onPlanOutfit}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Skip — I'll just plan outfits
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <button
                    type="button"
                    onClick={onPlanOutfit}
                    className="group relative overflow-hidden rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background transition-all hover:opacity-90 active:scale-[0.97] flex items-center justify-center gap-2"
                  >
                    {hasOutfits ? '+ Plan Outfit' : 'Create Outfit'}
                    <ChevronRight className="h-4 w-4" />
                    <motion.span
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                      initial={{ x: '-100%' }}
                      whileHover={{ x: '100%' }}
                      transition={{ duration: 0.6 }}
                    />
                  </button>
                </motion.div>
              )}

              {hasBasePhoto && onUploadPhoto && (
                <motion.button
                  type="button"
                  onClick={() => {
                    haptic('light');
                    onUploadPhoto?.();
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="mt-1 text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                >
                  <Pencil className="h-3 w-3" />
                  Change base photo
                </motion.button>
              )}
              </div>
            </motion.div>
          )
        )}

        {/* ═══════════════════════════════════════════════════════
           GENERATING STATE — animated progress with stages
           ═══════════════════════════════════════════════════════ */}
        {viewState.kind === 'generating' && progress && (
          <motion.div
            key="generating"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="flex flex-1 flex-col rounded-3xl bg-gradient-to-b from-muted/30 via-muted/20 to-background overflow-hidden border border-border/40 shadow-sm"
          >
            <div className="relative flex-1 flex flex-col items-center justify-center px-6 py-8">
              {/* Stage icon with pulse */}
              <motion.div
                key={`stage-icon-${progress.stage}`}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="relative mb-6"
              >
                <motion.div
                  className="absolute inset-0 rounded-full bg-primary/10"
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.3, 0.1, 0.3],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
                <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/20">
                  <motion.div
                    animate={{ rotate: progress.stage === 'ai-working' ? 360 : 0 }}
                    transition={{ duration: 3, repeat: progress.stage === 'ai-working' ? Infinity : 0, ease: 'linear' }}
                  >
                    {(() => {
                      const Icon = STAGES[progress.stage].icon;
                      return <Icon className="h-7 w-7 text-primary" strokeWidth={1.5} />;
                    })()}
                  </motion.div>
                </div>
              </motion.div>

              {/* Stage label */}
              <motion.p
                key={`stage-label-${progress.stage}`}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-base font-semibold text-foreground mb-1"
              >
                {STAGES[progress.stage].label}
              </motion.p>

              <p className="text-sm text-muted-foreground mb-6">
                {STAGES[progress.stage].description}
              </p>

              {/* Animated progress bar */}
              <div className="w-full max-w-[240px] mb-4">
                <div className="h-2 w-full rounded-full bg-muted/60 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-primary/60 via-primary to-primary/80"
                    animate={{ width: `${progress.percent}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                </div>
                {/* Glow under the bar */}
                <motion.div
                  className="h-6 w-full -mt-4 rounded-full blur-xl bg-primary/5"
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              </div>

              {/* Progress percentage + elapsed time */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>{progress.percent}%</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatElapsed(viewState.elapsed)}
                </span>
              </div>
            </div>

            {/* Outfit items being generated */}
            <ItemStrip items={outfitItems} />

            {/* Bottom info bar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-2 border-t border-border/40 px-5 py-3 bg-muted/20"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                <Loader2 className="h-3.5 w-3.5 text-primary/60" />
              </motion.div>
              <span className="text-sm font-medium text-foreground">
                {outfitName ?? 'Planned Outfit'}
              </span>
            </motion.div>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════════
           COMPLETED STATE — show the generated try-on image
           ═══════════════════════════════════════════════════════ */}
        {viewState.kind === 'completed' && (
          <motion.div
            key="completed"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ type: 'spring', stiffness: 280, damping: 24 }}
            className="flex flex-1 flex-col rounded-3xl bg-card overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.3),0_1px_3px_rgba(0,0,0,0.15)] border border-border/40"
          >
            {/* Try-on image */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="relative flex-1 bg-gradient-to-b from-muted/40 via-muted/20 to-background flex items-center justify-center overflow-hidden"
            >
              {/* Plain <img> with eager loading — renders immediately on first
                  paint (unlike CachedImage which defers Supabase URLs). The
                  preloading in PlannerView fires new Image() fetches in the
                  background, so the browser HTTP cache serves them instantly. */}

              <motion.img
                src={viewState.imageUrl}
                alt={`Try-on for ${viewState.outfitName ?? 'outfit'}`}
                loading="eager"
                fetchpriority="high"
                decoding="async"
                className="h-full w-full object-contain"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                onLoad={(e) => {
                  const el = e.currentTarget;
                  el.style.opacity = '1';
                }}
              />

              {/* Status badge */}
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur-sm px-3 py-1.5"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
                <span className="text-[11px] font-medium text-white">AI Try-On</span>
              </motion.div>

              {/* Dark theme: inner shadow for depth separation */}
              <div className="pointer-events-none absolute inset-0 shadow-[inset_0_1px_2px_rgba(0,0,0,0.15)]" />
            </motion.div>

            {/* Outfit items that make up this look */}
            <ItemStrip items={outfitItems} />

            {/* Bottom info bar with actions */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="flex items-center justify-between border-t border-border/40 px-5 py-3 bg-muted/10"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Sparkles className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="text-sm font-medium text-foreground truncate">
                  {viewState.outfitName ?? 'Planned Outfit'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                {hasBasePhoto && (
                  <button
                    type="button"
                    onClick={onUploadPhoto}
                    title="Change base photo"
                    className="rounded-full bg-muted p-1.5 text-muted-foreground hover:text-foreground transition-colors hover:bg-muted/80 active:scale-90 border border-border/30"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={onChangeOutfit}
                  className="rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-foreground hover:text-foreground transition-colors hover:bg-muted/80 active:scale-95 border border-border/30"
                >
                  Change
                </button>
                <button
                  type="button"
                  onClick={onRemoveOutfit}
                  className="rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-red-500 hover:text-red-600 transition-colors hover:bg-red-50 active:scale-95 border border-red-200/40"
                >
                  Remove
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════════
           FAILED STATE — friendly error with retry
           ═══════════════════════════════════════════════════════ */}
        {viewState.kind === 'failed' && (
          <motion.div
            key="failed"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.25 }}
            className="flex flex-1 flex-col rounded-3xl bg-gradient-to-b from-red-50/50 to-red-50/20 border border-red-200/40 overflow-hidden"
          >
            <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 py-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100/80 ring-1 ring-red-200/60"
              >
                <AlertCircle className="h-8 w-8 text-red-400" strokeWidth={1.5} />
              </motion.div>

              <h3 className="text-base font-semibold text-foreground">
                We couldn't generate your try-on
              </h3>

              <p className="text-sm text-muted-foreground text-center max-w-xs leading-relaxed">
                {friendlyError(viewState.errorMessage)}
              </p>

              <motion.button
                type="button"
                onClick={onChangeOutfit}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="mt-2 rounded-full bg-foreground px-6 py-2.5 text-sm font-semibold text-background transition-all hover:opacity-90 flex items-center gap-2"
              >
                <Zap className="h-4 w-4" />
                Try Again
              </motion.button>

              {viewState.errorMessage && viewState.errorMessage.length > 120 && (
                <details className="w-full mt-2">
                  <summary className="text-xs text-muted-foreground/60 cursor-pointer hover:text-muted-foreground text-center">
                    Technical details
                  </summary>
                  <p className="text-[10px] text-muted-foreground/40 mt-2 text-center leading-relaxed max-w-xs mx-auto">
                    {viewState.errorMessage}
                  </p>
                </details>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
