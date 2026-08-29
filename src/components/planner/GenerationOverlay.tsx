'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Frontend progress simulation ───────────────────────────────────
// The backend never reports granular progress, so we drive the UI with
// an elapsed-time simulation: the pill fills over ~30s and the caption
// rotates through stages so the screen never looks stuck on "Generating".
function computePercent(elapsed: number): number {
  // ~30s total: preparing → AI working → finalizing. Capped at 97% until
  // the real image lands (status flips to completed and the overlay
  // unmounts, swapping in the try-on).
  if (elapsed < 5) return Math.round(5 + (elapsed / 5) * 20);
  if (elapsed < 25) return Math.round(25 + ((elapsed - 5) / 20) * 65);
  return Math.min(97, Math.round(90 + ((elapsed - 25) / 5) * 7));
}

// Rotating status captions, keyed by elapsed seconds.
const STATUS_MESSAGES: Array<{ at: number; text: string }> = [
  { at: 0, text: 'Preparing your images…' },
  { at: 3, text: 'Removing the background…' },
  { at: 7, text: 'AI is studying your look…' },
  { at: 12, text: 'Matching the outfit to your photo…' },
  { at: 18, text: 'Styling the details…' },
  { at: 24, text: 'Adding the finishing touches…' },
  { at: 28, text: 'Almost there…' },
];

function statusMessageAt(elapsed: number): string {
  let msg = STATUS_MESSAGES[0].text;
  for (const m of STATUS_MESSAGES) {
    if (elapsed >= m.at) msg = m.text;
  }
  return msg;
}

interface GenerationOverlayProps {
  /** The user's base photo URL (the image being generated). */
  basePhotoUrl: string | null;
}

/**
 * Full-screen generation overlay (light theme). The base photo sits in a
 * rounded card — NOT full-bleed — with a solid black pill-shaped loading
 * bar and bold black "Generating" text beneath it. A frosted bar at the
 * bottom carries a thin red progress line along its bottom edge.
 */
export function GenerationOverlay({ basePhotoUrl }: GenerationOverlayProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    setElapsed(0);
    const timer = setInterval(() => setElapsed((p) => p + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const percent = useMemo(() => computePercent(elapsed), [elapsed]);
  const statusMessage = statusMessageAt(elapsed);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-[100] flex flex-col bg-white"
      role="dialog"
      aria-modal="true"
      aria-label="Generating your outfit"
    >
      {/* ── Photo card + loading text ──────────────────────────── */}
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6">
        {/* Rounded photo card */}
        <div className="relative aspect-[3/4] w-full max-w-sm overflow-hidden rounded-3xl bg-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.18)]">
          {basePhotoUrl ? (
            <img
              src={basePhotoUrl}
              alt=""
              loading="eager"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover object-top"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-b from-zinc-200 via-zinc-100 to-gray-50" />
          )}

        </div>

        {/* Progress pill + "Generating" + rotating status text */}
        <div className="flex w-full max-w-sm flex-col items-center gap-3">
          <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-gray-200">
            <motion.div
              className="h-full rounded-full bg-black"
              animate={{ width: `${Math.max(percent, 3)}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>
          <motion.p
            animate={{ opacity: [1, 0.55, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="text-2xl font-bold tracking-tight text-black"
          >
            Generating
          </motion.p>

          {/* Rotating status captions so it never feels stuck */}
          <AnimatePresence mode="wait">
            <motion.p
              key={statusMessage}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
              className="text-sm font-medium text-gray-600"
            >
              {statusMessage}
            </motion.p>
          </AnimatePresence>

          <p className="text-xs text-gray-400">
            {percent}% · {elapsed}s
          </p>
        </div>
      </div>

      {/* ── Bottom panel — frosted bar with red progress line ── */}
      <div className="relative w-full overflow-hidden border-t border-black/5 bg-white/80 pb-5 pt-4 backdrop-blur-md">
        <div className="absolute bottom-0 left-0 h-0.5 bg-red-500" style={{ width: `${percent}%` }} />
      </div>
    </motion.div>
  );
}
