/**
 * CachedImage — the master image component that replaces every <img>
 * in the codebase. Three responsibilities, in render order:
 *
 *   1. Paint a BlurHash placeholder *synchronously* during mount
 *      so the user never sees a white square. Decode happens in
 *      `useLayoutEffect` (before paint) so the canvas is ready at
 *      the first commit frame.
 *   2. If `src` points at Supabase Storage, append `?width=N&format=webp`
 *      via `getResizedImage` so 90×90 thumbnails don't pull 4MB.
 *   3. On native iOS, check Capacitor `Directory.Cache` for a
 *      previously-fetched copy (key = SHA-1(src|width)). On hit we
 *      render the local `capacitor://` file URL — instant, zero
 *      network calls. On miss we fetch the transformed URL, drop it
 *      to disk in parallel with rendering the network response.
 *
 * Web fallback path: skip Filesystem entirely. Pass the resizing URL
 * straight to a standard `<img loading="lazy" decoding="async">`. The
 * browser's HTTP cache will still pick up the WebP after first load.
 *
 * This component is the only place that imports `@capacitor/filesystem`
 * directly. Everything else (NextImageShim, ClosetItemCard, etc.)
 * imports from here.
 */

import * as React from 'react';
import { Capacitor } from '@capacitor/core';
import {
  Filesystem,
  Directory,
} from '@capacitor/filesystem';
import { BlurhashCanvas } from './BlurhashCanvas';
import {
  getResizedImage,
  getSrcSet,
  isSupabaseStorageUrl,
  type ResizeOptions,
} from '@/lib/image';
import { cn } from '@/lib/utils';

type CachedImageFit = 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';

export interface CachedImageProps
  extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src' | 'placeholder'> {
  src: string | null | undefined;
  /** Width passed to Supabase Storage render. Defaults to intrinsic layout — set explicitly! */
  width: number;
  /** Optional blurhash string to render as instant placeholder. Decoded synchronously. */
  blurHash?: string | null;
  /** Eager-load + high-priority (above-the-fold hero images). Defaults to lazy. */
  priority?: boolean;
  /** Pick from a curated srcSet width ladder. Overrides `sizes`/`srcSet` if set. */
  variant?: 'grid' | 'hero';
  /** Custom resize options — overrides variant. */
  resize?: Omit<ResizeOptions, 'width'>;
  /** srcSet widths when you need a non-default ladder. */
  srcSetWidths?: number[];
  /** sizes hint passed to <img> for proper selection. */
  sizes?: string;
  /** Object-fit mode. Default 'cover' (closed deck-of-cards look). */
  fit?: CachedImageFit;
  /** Disable Click-to-element-class on hover for lazy debugging narration. */
  __unsafeDisableDiskCache?: boolean;
}

const DEFAULT_GRID_WIDTHS = [120, 240, 480] as const;
const DEFAULT_HERO_WIDTHS = [480, 720, 960, 1280] as const;

export const CachedImage = React.forwardRef<HTMLImageElement, CachedImageProps>(
  function CachedImage(props, ref) {
    const {
      src,
      blurHash,
      width,
      priority = false,
      variant = 'grid',
      resize,
      srcSetWidths,
      sizes,
      fit = 'cover',
      className,
      style,
      alt,
      onLoad,
      onError,
      loading,
      decoding,
      __unsafeDisableDiskCache,
      ...rest
    } = props;

    // selectedSource is what the <img> actually loads: either the
    // capacitor://… file URL pulled from the cache, or the (WebP)
    // network URL derived from `src`.
    //
    // Seed with src immediately so the <img> renders on first paint
    // instead of waiting for the async useEffect. On web the async
    // path just resolves to the same `src` anyway; on native the
    // useEffect may swap in a capacitor:// cached URI moments later.
    const [selectedSource, setSelectedSource] = React.useState<string | null>(
      () => (src && !isSupabaseStorageUrl(src) ? src : null),
    );
    const [didError, setDidError] = React.useState(false);
    const lastSrcRef = React.useRef<string | null | undefined>(src);

    // Reset state when source changes so a stale cache hit from a
    // previous ClosetItem doesn't flash onto the next.
    React.useEffect(() => {
      if (lastSrcRef.current !== src) {
        lastSrcRef.current = src;
        setSelectedSource(null);
        setDidError(false);
      }
    }, [src]);

    // Decide widths.
    const widths = React.useMemo(() => {
      if (srcSetWidths?.length) return srcSetWidths;
      return variant === 'hero' ? [...DEFAULT_HERO_WIDTHS] : [...DEFAULT_GRID_WIDTHS];
    }, [srcSetWidths, variant]);

    const srcSetAttr = React.useMemo(() => {
      if (!src) return undefined;
      return getSrcSet(src, widths, resize);
    }, [src, widths, resize]);

    const sizesAttr =
      sizes ?? (variant === 'hero'
        ? '(max-width: 480px) 100vw, 720px'
        : '(max-width: 480px) 33vw, 180px');

    // Tier 2 / 4 — disk cache lookup. Runs once per (src, width) tuple,
    // resolves to either the local capacitor:// file URL or set of
    // transformed network URLs.
    React.useEffect(() => {
      if (!src) {
        setSelectedSource(null);
        return;
      }
      let cancelled = false;
      const run = async () => {
        const resizeOpts: ResizeOptions = { width, ...(resize ?? { format: 'webp' }) };
        const networkUrl = getResizedImage(src, resizeOpts);

        if (Capacitor.isNativePlatform() && !__unsafeDisableDiskCache) {
          try {
            const key = await deriveCacheKey(src, width);
            const cachedUri = await readFromCache(key);
            if (cancelled) return;
            if (cachedUri) {
              setSelectedSource(cachedUri);
              return;
            }
            // On miss, write the network fetch to disk in parallel with
            // rendering the network URL. Render goes immediately so we
            // never block the UI on disk I/O.
            setSelectedSource(networkUrl);
            void writeToCacheFromNetwork(key, networkUrl).catch(() => {
              /* best-effort: network fallback already painting */
            });
            return;
          } catch {
            /* fall through to network */
          }
        }
        if (!cancelled) setSelectedSource(networkUrl);
      };
      run();
      return () => {
        cancelled = true;
      };
    }, [src, width, resize, __unsafeDisableDiskCache]);

    return (
      <span
        className={cn(
          'relative block overflow-hidden',
          className
        )}
        style={{
          // Wrapper is transparent by default — matches next/image's
          // browser output. Consumers that need a fallback color paint
          // their own `bg-*` on the parent or pass an explicit
          // `style={{ backgroundColor }}` override on the CachedImage.
          // (Previously we painted `var(--bg-secondary, #f9f9f9)` here,
          // which bled through `object-contain` whitespace around
          // clothing items and the Whering Dress Me / Canvas row.)
          ...style,
        }}
      >
        {/* Layer 1: blurhash placeholder. Always on. Painted before the
            <img> commits above-the-fold content. */}
        {blurHash && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
          >
            <BlurhashCanvas hash={blurHash} resolution={32} />
          </span>
        )}

        {/* Layer 2: actual <img>. Lazy by default; priority overrides. */}
        {selectedSource && !didError && (
          <img
            ref={ref}
            src={selectedSource}
            alt={alt ?? ''}
            loading={priority ? 'eager' : loading ?? 'lazy'}
            decoding={decoding ?? 'async'}
            // fetchpriority is the modern attribute (was fetchPriority);
            // both forms are valid HTML.
            {...(priority ? { fetchpriority: 'high' as const } : null)}
            sizes={sizesAttr}
            srcSet={srcSetAttr}
            className={cn('block h-full w-full')}
            style={{ objectFit: fit }}
            onLoad={(e) => {
              // Smooth opacity ramp to avoid the "pop" once the real
              // image commits. The placeholder below stays in stack
              // at opacity 0 until the next render swaps it out.
              const el = e.currentTarget;
              el.style.transition = 'opacity 220ms ease-out';
              el.style.opacity = '1';
              onLoad?.(e);
            }}
            onError={(e) => {
              setDidError(true);
              onError?.(e);
            }}
            {...rest}
          />
        )}

        {/* Layer 3: error state. Renders only when src is broken AND we
            have no blurhash. Cheap placeholder so the tile never collapses. */}
        {didError && !blurHash && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs text-gray-400"
          >
            •
          </span>
        )}
      </span>
    );
  }
);

// ─── Internal helpers ──────────────────────────────────────────────────────

async function deriveCacheKey(src: string, width: number): Promise<string> {
  // Lazy import to avoid forcing native-only deps on web bundle.
  const { cacheKeyFor } = await import('@/lib/image');
  return cacheKeyFor(src, width);
}

async function readFromCache(key: string): Promise<string | null> {
  try {
    const stat = await Filesystem.stat({ directory: Directory.Cache, path: key });
    if (!stat) return null;
    const uri = await Filesystem.getUri({ directory: Directory.Cache, path: key });
    return Capacitor.convertFileSrc(uri.uri);
  } catch {
    return null;
  }
}

async function writeToCacheFromNetwork(key: string, url: string): Promise<void> {
  try {
    const res = await fetch(url);
    if (!res.ok) return;
    const blob = await res.blob();
    const dataUrl = await blobToBase64(blob);
    await Filesystem.writeFile({
      directory: Directory.Cache,
      path: key,
      data: dataUrl,
      recursive: false,
    });
  } catch {
    /* best-effort */
  }
}

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        reject(new Error('Blob did not decode to string'));
        return;
      }
      // Strip `data:<mime>;base64,` prefix — Capacitor `writeFile`
      // expects raw base64, not a data URL.
      const idx = result.indexOf(',');
      resolve(idx >= 0 ? result.slice(idx + 1) : result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
