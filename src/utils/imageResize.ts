/**
 * imageResize — client-side image downscaling.
 *
 * Why: try-on inputs (base photo, closet item photos) are often raw phone
 * photos (3000-4000px, several MB). DashScope has to download + VAE-encode
 * those on every generation, adding seconds. Downscaling at upload time
 * (where HTML5 canvas is available) means the API only ever sees small
 * files — no per-request CPU cost in the edge function.
 *
 * Preserves format: PNG stays PNG (keeps transparency for garments),
 * everything else becomes JPEG (flattened onto white so transparency
 * doesn't turn into black).
 */

/**
 * Downscale an image File so its longest side is at most `maxSide`.
 * Returns the original file unchanged when it can't be decoded or is
 * already small enough.
 */
export async function downscaleImageFile(
  file: File,
  maxSide = 1280,
  jpegQuality = 0.88,
): Promise<File> {
  let bitmap: ImageBitmap | null = null;
  try {
    bitmap = await createImageBitmap(file);
    const { width, height } = bitmap;
    const longest = Math.max(width, height);
    if (longest <= maxSide) {
      return file;
    }

    const scale = maxSide / longest;
    const w = Math.max(1, Math.round(width * scale));
    const h = Math.max(1, Math.round(height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;

    const isPng = file.type === 'image/png';
    if (!isPng) {
      // Flatten any transparency onto white — JPEG has no alpha channel
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
    }
    ctx.drawImage(bitmap, 0, 0, w, h);

    const mime = isPng ? 'image/png' : 'image/jpeg';
    const blob = await new Promise<Blob>((resolve) =>
      canvas.toBlob(
        (b) => resolve(b ?? file),
        mime,
        isPng ? undefined : jpegQuality,
      ),
    );

    const ext = isPng ? 'png' : 'jpg';
    const baseName = file.name.replace(/\.[^.]+$/, '') || 'image';
    return new File([blob], `${baseName}.${ext}`, { type: mime });
  } catch (e) {
    console.warn('[imageResize] downscale failed, uploading original:', e);
    return file;
  } finally {
    bitmap?.close();
  }
}

/**
 * Stable non-cryptographic hash of an ordered input list, used as a
 * content key for caching (identical person + garment set → same hash).
 * Pure integer math — identical in browser and Deno runtimes.
 */
export function contentHash(inputs: string[]): string {
  const s = [...inputs].sort().join('|');
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
  }
  return 'h' + h.toString(36);
}
