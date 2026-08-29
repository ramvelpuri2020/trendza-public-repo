'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

type GenStatus = 'pending' | 'generating' | 'completed' | 'failed' | undefined;

/**
 * StatusDot — planned-day indicator for the planner calendars.
 *
 * Deliberately differentiated by SHAPE, not just color (6px amber vs green
 * dots were indistinguishable, especially on dark theme):
 *  - completed   → filled green dot (with a subtle background ring)
 *  - pending     → hollow amber ring (nothing has started)
 *  - generating  → pulsing amber dot (alive, working)
 *  - failed      → red badge with ✕
 */
export function StatusDot({ status, className }: { status: GenStatus; className?: string }) {
  if (status === 'failed') {
    return (
      <span
        className={cn(
          'flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold leading-none text-white shadow-sm',
          className,
        )}
        aria-label="Generation failed"
      >
        ✕
      </span>
    );
  }

  if (status === 'pending') {
    return (
      <span
        className={cn('h-2 w-2 rounded-full border-[1.5px] border-amber-400 bg-transparent', className)}
        aria-label="Waiting to generate"
      />
    );
  }

  if (status === 'generating') {
    return (
      <motion.span
        className={cn('block h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.6)]', className)}
        animate={{ scale: [1, 1.4, 1], opacity: [1, 0.55, 1] }}
        transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
        aria-label="Generating"
      />
    );
  }

  // completed (or unknown status with a planned outfit) → solid green
  return (
    <span
      className={cn('h-2 w-2 rounded-full bg-green-500 ring-2 ring-background', className)}
      aria-label="Try-on ready"
    />
  );
}
