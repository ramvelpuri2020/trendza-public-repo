/**
 * NextImageShim — drop-in replacement for `next/image` used only as a
 * build-system alias (Vite resolve.alias in vite.config.ts maps
 * `next/image` → this file). Its sole job is to compile cloned Next.js
 * source code in our Vite + React Router + Capacitor setup without us
 * touching the cloned files' byte content.
 *
 * Behaviour contract — matches what `next/image` produces in the
 * browser (this file does NOT replicate Next.js' on-disk optimisation
 * pipeline; under Vite there is no image pipeline, so this is the
 * pure runtime equivalent):
 *
 *   - `<Image fill>`     → position: absolute; inset: 0; width/height 100%;
 *                          colour transparent (so alt text is hidden).
 *                          The parent is expected to be `position: relative`
 *                          (the cloned source already does this).
 *   - `<Image priority>` → loading: eager; fetchPriority: high.
 *   - `<Image quality>`  → ignored (Vite has no runtime quality knob —
 *                          we just leave the user's `src` alone so the
 *                          browser fetches the file as-is, BUT we now
 *                          apply Supabase Storage render transforms
 *                          via `getResizedImage`).
 *   - `<Image sizes>`    → passed through to the underlying `<img>`
 *                          (works natively in Vite-served assets).
 *   - Everything else — className, style, srcSet, fetchpriority,
 *                          decoding, etc. — falls through to the
 *                          underlying `<img>` via the spread.
 *
 * **2024 upgrade — Tier 2/3/4 wiring**: now composes with `CachedImage`
 * so cloned Whering canvases get BlurHash placeholders + WebP via
 * Supabase render + Capacitor Filesystem cache for free, *without*
 * modifying any cloned source file. The cloned `Image` props we don't
 * recognize (`blur_hash`) are forwarded to `CachedImage` upstream via
 * the caller in a small TS shim that's append-only.
 *
 * No Tailwind magic happens here; the cloned source already authors
 * complete `className` strings (e.g. "absolute inset-0 h-full w-full
 * object-contain"), so we just compose our `fill` tokens before the
 * caller's className.
 */

import * as React from 'react';
import { CachedImage, type CachedImageProps } from '@/components/ui/CachedImage';

interface ImageProps extends CachedImageProps {
  src: string;
  alt: string;
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
  quality?: number;
  /** Blurhash string. Forwarded to CachedImage. */
  blurHash?: string | null;
  /** Whatever else the cloned files pass — we ignore unknown keys. */
  [key: string]: unknown;
}

const NextImageShim = React.forwardRef<HTMLImageElement, ImageProps>(
  function NextImageShim(props, ref) {
    const {
      fill,
      sizes: _sizes,
      priority,
      quality: _quality,
      src,
      alt,
      className,
      style,
      loading: _loading,
      fetchPriority: _fp,
      blurHash,
      width,
      ...rest
    } = props as ImageProps;

    // `fill` mode pushes the image to absolute-inset sizing. The cloned
    // source already wraps in a `position: relative` parent so we just
    // compose the fill tokens into the className. Width gets a sensible
    // fallback because `next/image fill` doesn't require an intrinsic
    // width prop, but our CachedImage does.
    const composedClassName = [
      fill ? 'absolute inset-0 h-full w-full' : null,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const composedStyle: React.CSSProperties = {
      ...(fill ? { color: 'transparent' } : {}),
      ...(style as React.CSSProperties | undefined),
    };

    // Sized fallback for fill mode — closet tiles + canvas items land
    // in the 64-220px range; pick 96 as a sensible median so the
    // Supabase render call requests a meaningful width even when the
    // cloned caller didn't pass one.
    const fallbackWidth = typeof width === 'number' ? width : fill ? 180 : 240;

    return (
      <CachedImage
        ref={ref}
        src={src}
        alt={alt}
        width={fallbackWidth}
        className={composedClassName}
        style={composedStyle}
        blurHash={blurHash}
        priority={!!priority}
        variant={fill ? 'grid' : 'hero'}
        fit="contain"
        {...rest}
      />
    );
  }
);

export default NextImageShim;
