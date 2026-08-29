/**
 * BlurhashCanvas — paints a BlurHash string into a tiled canvas so
 * ClosetItemCard / FitsView / Scan tiles render with an instant
 * blurred color block instead of a white square. Zero layout shift:
 * the parent MUST own the box (a sized flex child, an aspect-square
 * tile, etc.) — this component fills 100% of whatever parent gives it.
 *
 * Decode happens once in a layout effect so the placeholder is on-screen
 * at the first paint frame. If `hash` is missing we render a transparent
 * layer so the parent's own background-color shows through (e.g. a
 * skeleton shimmer).
 *
 * Keep this component dumb — it doesn't know about Capacitor Filesystem
 * or Supabase transforms. CachedImage owns the orchestration.
 */

import * as React from 'react';
import { paintBlurHashIntoCanvas, decodeBlurHash } from '@/lib/image';
import { cn } from '@/lib/utils';

type Resolution = 16 | 24 | 32 | 48;

interface BlurhashCanvasProps {
  hash: string | null | undefined;
  className?: string;
  /** Doubles up to 64 for premium zoom-in previews; default 32 matches the encoded component count. */
  resolution?: Resolution;
  ariaLabel?: string;
}

export const BlurhashCanvas = React.memo(function BlurhashCanvas({
  hash,
  className,
  resolution = 32,
  ariaLabel,
}: BlurhashCanvasProps) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  React.useLayoutEffect(() => {
    if (!hash) return;
    paintBlurHashIntoCanvas(canvasRef.current, hash, resolution, resolution);
  }, [hash, resolution]);

  if (!hash) {
    // No blurhash — render nothing; parent supplies skeleton/bg.
    return null;
  }
  // Pre-decode once at module load so the BlurHash string validity is
  // caught early in dev. Result is discarded here; paint happens in layout effect.
  if (import.meta.env.DEV) {
    decodeBlurHash(hash, resolution, resolution);
  }

  return (
    <canvas
      ref={canvasRef}
      aria-hidden={ariaLabel ? undefined : true}
      aria-label={ariaLabel}
      width={resolution}
      height={resolution}
      className={cn('block h-full w-full', className)}
      style={{
        // The canvas pixel buffer is `resolution × resolution` (32×32
        // by default). Stretch it to fit the parent (sized by parent flex/aspect).
        imageRendering: 'auto',
        // Slight upscale blur from 32px source — looks correct on retina.
        filter: hash ? 'blur(0.5px)' : undefined,
      }}
    />
  );
});
