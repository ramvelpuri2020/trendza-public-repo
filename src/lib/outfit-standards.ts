/**
 * outfit-standards.ts
 *
 * Shared constants for outfit item display boxes.
 * Every component that renders outfit items (Shuffler, Canvas, Saved looks)
 * references OUTFIT_ITEM_DIMENSIONS so sizing is tuned in one place.
 *
 * Each item image renders inside its category's box using object-fit: contain
 * (never cover) and centered both horizontally and vertically.
 */

export type OutfitCategory = "tops" | "bottoms" | "shoes" | "accessories"

export interface OutfitItemSpec {
  /** Box width in CSS pixels. */
  width: number
  /** Box height in CSS pixels. */
  height: number
}

/**
 * Fixed display boxes per category for outfit-composite views.
 * Images render inside these boxes with object-fit: contain so no part
 * of the garment is cropped, regardless of source aspect ratio.
 */
export const OUTFIT_ITEM_DIMENSIONS: Record<OutfitCategory, OutfitItemSpec> = {
  tops:        { width: 260, height: 280 },
  bottoms:     { width: 260, height: 320 },
  shoes:       { width: 260, height: 140 },
  accessories: { width: 200, height: 200 },
}

/** Map any category string to the closest outfit dimension spec. */
export function getOutfitDimensions(category: string): OutfitItemSpec {
  const cat = category.toLowerCase()
  if (cat === "tops" || cat === "outerwear" || cat === "dresses") return OUTFIT_ITEM_DIMENSIONS.tops
  if (cat === "bottoms") return OUTFIT_ITEM_DIMENSIONS.bottoms
  if (cat === "shoes") return OUTFIT_ITEM_DIMENSIONS.shoes
  // bags, jewelry, hats, belts, etc.
  return OUTFIT_ITEM_DIMENSIONS.accessories
}

// ─── Legacy Dress Me standards (Shuffler-specific) ───

export type DressMeCategory = "tops" | "bottoms" | "shoes"

export interface DressMeSpec {
  /** Tailwind width class — clamps at the standard's pixel width. */
  widthClass: string
  /** Box height in CSS pixels. */
  height: number
  /** Tailwind position class. */
  position: string
  /** Stacking order — higher z renders on top. */
  z: number
}

export const DRESS_ME_STANDARDS: Record<DressMeCategory, DressMeSpec> = {
  tops:    { widthClass: "w-[min(100%,260px)]", height: OUTFIT_ITEM_DIMENSIONS.tops.height,    position: "top-0",      z: 10 },
  bottoms: { widthClass: "w-[min(100%,260px)]", height: OUTFIT_ITEM_DIMENSIONS.bottoms.height, position: "top-[200px]", z: 5  },
  shoes:   { widthClass: "w-[min(100%,260px)]", height: OUTFIT_ITEM_DIMENSIONS.shoes.height,   position: "bottom-0",   z: 15 },
}

/** Minimum canvas height to fit the full layered composition
 *  without clipping the top of the shirt. */
export const DRESS_ME_MIN_CANVAS_HEIGHT = 600
