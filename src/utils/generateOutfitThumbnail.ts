/**
 * generateOutfitThumbnail — client-side compositing using HTML5 Canvas.
 *
 * Composites multiple clothing item images into a single flattened WebP image.
 * This avoids the "4 overlapping transparent PNGs" render cost in the feed —
 * the Saved tab loads one lightweight thumbnail instead.
 *
 * Two modes:
 *  - "vertical-stack": items are stacked top-to-bottom (Shuffler save)
 *  - "canvas": items are rendered at their stored x/y/scale/rotation positions
 *
 * CORS requirement: all image URLs must have `Access-Control-Allow-Origin: *`
 * headers, otherwise the canvas becomes tainted and toDataURL will fail.
 */

const CANVAS_W = 400;
const CANVAS_H = 600;

interface StackItem {
  imageUrl: string;
  fitHeight?: number; // proportion of canvas height (e.g. 0.35 for tops)
}

interface CanvasItem {
  imageUrl: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  z: number;
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
}

/**
 * Vertical-stack composer (Shuffler mode).
 * Stacks items from top to bottom, each centered horizontally.
 */
export async function generateVerticalStackThumbnail(
  items: StackItem[],
): Promise<string | null> {
  if (items.length === 0) return null;

  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_W;
  canvas.height = CANVAS_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  // Light background
  ctx.fillStyle = "#f9f9f9";
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  try {
    const images = await Promise.all(items.map((item) => loadImage(item.imageUrl)));

    let yOffset = 0;
    for (let i = 0; i < items.length; i++) {
      const img = images[i];
      const fitHeight = items[i].fitHeight ?? 1 / items.length;
      const sectionHeight = CANVAS_H * fitHeight;
      const sectionWidth = CANVAS_W;

      // Scale image to fit within its section while maintaining aspect ratio
      const scaleX = sectionWidth / img.naturalWidth;
      const scaleY = sectionHeight / img.naturalHeight;
      const scale = Math.min(scaleX, scaleY) * 0.85; // 85% for padding
      const drawW = img.naturalWidth * scale;
      const drawH = img.naturalHeight * scale;
      const drawX = (CANVAS_W - drawW) / 2;
      const drawY = yOffset + (sectionHeight - drawH) / 2;

      ctx.drawImage(img, drawX, drawY, drawW, drawH);
      yOffset += sectionHeight;
    }

    return canvas.toDataURL("image/webp", 0.8);
  } catch (error) {
    console.error("Failed to generate vertical stack thumbnail:", error);
    return null;
  }
}

/**
 * Canvas-positioned composer (freeform Canvas mode).
 * Renders items at their stored x/y/scale/rotation positions.
 */
export async function generateCanvasThumbnail(
  items: CanvasItem[],
): Promise<string | null> {
  if (items.length === 0) return null;

  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_W;
  canvas.height = CANVAS_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  // Grid background (matching the canvas UI)
  ctx.fillStyle = "#f9f9f9";
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Draw subtle dot grid
  ctx.fillStyle = "rgba(0,0,0,0.04)";
  for (let x = 0; x < CANVAS_W; x += 22) {
    for (let y = 0; y < CANVAS_H; y += 22) {
      ctx.fillRect(x, y, 1, 1);
    }
  }

  try {
    const images = await Promise.all(
      items.map((item) => loadImage(item.imageUrl)),
    );

    // Sort by z_index so items stack correctly (lowest z drawn first)
    const sortedItems = [...items].sort((a, b) => a.z - b.z);
    const sortedImages = [...images];
    // Reorder images to match the sorted items order
    // Since images were loaded in the original items order, we need to reorder them
    const itemIndexMap = new Map(items.map((item, i) => [item, i]));
    sortedItems.forEach((item, i) => {
      sortedImages[i] = images[itemIndexMap.get(item)!];
    });

    for (let i = 0; i < sortedItems.length; i++) {
      const item = sortedItems[i];
      const img = images[i];

      // Map canvas coordinates to thumbnail canvas
      // Canvas items are positioned with center anchor, 220x220 base size
      const baseItemSize = 220;
      const centerX = CANVAS_W / 2;
      const centerY = CANVAS_H / 2;

      // Calculate the draw position from the item's x/y (which are offsets from center)
      const drawCenterX = centerX + item.x;
      const drawCenterY = centerY + item.y;
      const drawW = baseItemSize * item.scale;
      const drawH = baseItemSize * item.scale;

      ctx.save();
      ctx.translate(drawCenterX, drawCenterY);
      ctx.rotate((item.rotation * Math.PI) / 180);
      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();
    }

    return canvas.toDataURL("image/webp", 0.8);
  } catch (error) {
    console.error("Failed to generate canvas thumbnail:", error);
    return null;
  }
}
