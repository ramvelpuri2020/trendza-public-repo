/**
 * demo-wardrobe.ts — Gender-specific default wardrobe items.
 *
 * When a new user signs up and hasn't uploaded any real clothing, we pre-populate
 * their Wardrobe, Shuffler, and Canvas with these items. The set shown depends on
 * the gender they selected during onboarding (Male / Female / Other).
 *
 * Female: 50 items (10 tops, 10 bottoms, 10 shoes, 5 headwear, 5 accessories, 5 bags, 5 dresses)
 * Male:   45 items (10 tops, 10 bottoms, 10 shoes, 5 headwear, 5 accessories, 5 bags)
 * Fixed UUIDs ensure saved outfits survive page reloads (via item_snapshots).
 */

import type { ClosetItem } from "@/hooks/useClosetData"

// ─── Female Wardrobe (30 items) ───

export const FEMALE_DEMO_ITEMS: ClosetItem[] = [
  // ── Tops (10) ──
  { id: "f0000000-0000-4000-a000-000000000001", title: "Cream Knit Sweater",        category: "tops",       color: "cream",       tags: ["knit", "cozy", "sweater"],           attributes: {}, source_image_url: '/clothes/f-top-1.png',  created_at: "2025-01-01T00:00:00.000Z", brand: "" },
  { id: "f0000000-0000-4000-a000-000000000002", title: "Leather Biker Jacket",      category: "outerwear",  color: "black",       tags: ["leather", "edgy", "jacket"],          attributes: {}, source_image_url: '/clothes/f-top-2.png',  created_at: "2025-01-01T00:00:00.000Z", brand: "" },
  { id: "f0000000-0000-4000-a000-000000000003", title: "White Cotton Blouse",       category: "tops",       color: "white",       tags: ["cotton", "classic", "blouse"],         attributes: {}, source_image_url: '/clothes/f-top-3.png',  created_at: "2025-01-01T00:00:00.000Z", brand: "" },
  { id: "f0000000-0000-4000-a000-000000000004", title: "Striped Long Sleeve Tee",   category: "tops",       color: "striped",     tags: ["striped", "casual", "long-sleeve"],    attributes: {}, source_image_url: '/clothes/f-top-4.png',  created_at: "2025-01-01T00:00:00.000Z", brand: "" },
  { id: "f0000000-0000-4000-a000-000000000005", title: "Black Bodysuit",            category: "tops",       color: "black",       tags: ["bodysuit", "sleek", "form-fitting"],   attributes: {}, source_image_url: '/clothes/f-top-5.png',  created_at: "2025-01-01T00:00:00.000Z", brand: "" },
  { id: "f0000000-0000-4000-a000-000000000006", title: "Beige Trench Coat",         category: "outerwear",  color: "beige",       tags: ["trench", "elegant", "coat"],           attributes: {}, source_image_url: '/clothes/f-top-6.png',  created_at: "2025-01-01T00:00:00.000Z", brand: "" },
  { id: "f0000000-0000-4000-a000-000000000007", title: "Blush Pink Cardigan",       category: "tops",       color: "pink",        tags: ["cardigan", "soft", "knit"],            attributes: {}, source_image_url: '/clothes/f-top-7.png',  created_at: "2025-01-01T00:00:00.000Z", brand: "" },
  { id: "f0000000-0000-4000-a000-000000000008", title: "Navy V-Neck Blouse",        category: "tops",       color: "navy",        tags: ["v-neck", "blouse", "professional"],    attributes: {}, source_image_url: '/clothes/f-top-8.png',  created_at: "2025-01-01T00:00:00.000Z", brand: "" },
  { id: "f0000000-0000-4000-a000-000000000009", title: "Red Crop Top",              category: "tops",       color: "red",         tags: ["crop", "bold", "summer"],              attributes: {}, source_image_url: '/clothes/f-top-9.png',  created_at: "2025-01-01T00:00:00.000Z", brand: "" },
  { id: "f0000000-0000-4000-a000-00000000000a", title: "Denim Jacket",              category: "outerwear",  color: "blue",        tags: ["denim", "jacket", "layering"],         attributes: {}, source_image_url: '/clothes/f-top-10.png', created_at: "2025-01-01T00:00:00.000Z", brand: "" },

  // ── Bottoms (10) ──
  { id: "f0000000-0000-4000-a000-00000000000b", title: "Straight-Leg Blue Jeans",   category: "bottoms",    color: "blue",        tags: ["jeans", "denim", "straight-leg"],      attributes: {}, source_image_url: '/clothes/f-bottom-1.png',  created_at: "2025-01-01T00:00:00.000Z", brand: "" },
  { id: "f0000000-0000-4000-a000-00000000000c", title: "Pleated Black Midi Skirt",  category: "bottoms",    color: "black",       tags: ["skirt", "pleated", "midi"],            attributes: {}, source_image_url: '/clothes/f-bottom-2.png',  created_at: "2025-01-01T00:00:00.000Z", brand: "" },
  { id: "f0000000-0000-4000-a000-00000000000d", title: "Gray Tailored Trousers",    category: "bottoms",    color: "gray",        tags: ["tailored", "trousers", "chic"],        attributes: {}, source_image_url: '/clothes/f-bottom-3.png',  created_at: "2025-01-01T00:00:00.000Z", brand: "" },
  { id: "f0000000-0000-4000-a000-00000000000e", title: "Olive Cargo Pants",         category: "bottoms",    color: "olive",       tags: ["cargo", "utility", "pants"],           attributes: {}, source_image_url: '/clothes/f-bottom-4.png',  created_at: "2025-01-01T00:00:00.000Z", brand: "" },
  { id: "f0000000-0000-4000-a000-00000000000f", title: "High-Waist White Shorts",   category: "bottoms",    color: "white",       tags: ["shorts", "high-waist", "summer"],      attributes: {}, source_image_url: '/clothes/f-bottom-5.png',  created_at: "2025-01-01T00:00:00.000Z", brand: "" },
  { id: "f0000000-0000-4000-a000-000000000010", title: "Black Leggings",            category: "bottoms",    color: "black",       tags: ["leggings", "stretch", "active"],       attributes: {}, source_image_url: '/clothes/f-bottom-6.png',  created_at: "2025-01-01T00:00:00.000Z", brand: "" },
  { id: "f0000000-0000-4000-a000-000000000011", title: "Floral Maxi Skirt",         category: "bottoms",    color: "floral",      tags: ["skirt", "floral", "maxi"],             attributes: {}, source_image_url: '/clothes/f-bottom-7.png',  created_at: "2025-01-01T00:00:00.000Z", brand: "" },
  { id: "f0000000-0000-4000-a000-000000000012", title: "Beige Wide-Leg Pants",      category: "bottoms",    color: "beige",       tags: ["wide-leg", "pants", "flowy"],          attributes: {}, source_image_url: '/clothes/f-bottom-8.png',  created_at: "2025-01-01T00:00:00.000Z", brand: "" },
  { id: "f0000000-0000-4000-a000-000000000013", title: "Dark Wash Skinny Jeans",    category: "bottoms",    color: "dark-blue",   tags: ["jeans", "skinny", "dark-wash"],        attributes: {}, source_image_url: '/clothes/f-bottom-9.png',  created_at: "2025-01-01T00:00:00.000Z", brand: "" },
  { id: "f0000000-0000-4000-a000-000000000014", title: "Camel Mini Skirt",          category: "bottoms",    color: "camel",       tags: ["skirt", "mini", "suede"],              attributes: {}, source_image_url: '/clothes/f-bottom-10.png', created_at: "2025-01-01T00:00:00.000Z", brand: "" },

  // ── Shoes (10) ──
  { id: "f0000000-0000-4000-a000-000000000015", title: "White Sneakers",            category: "shoes",      color: "white",       tags: ["sneakers", "clean", "casual"],         attributes: {}, source_image_url: '/clothes/f-shoe-1.png',    created_at: "2025-01-01T00:00:00.000Z", brand: "" },
  { id: "f0000000-0000-4000-a000-000000000016", title: "Brown Chelsea Boots",       category: "shoes",      color: "brown",       tags: ["boots", "chelsea", "ankle"],           attributes: {}, source_image_url: '/clothes/f-shoe-2.png',    created_at: "2025-01-01T00:00:00.000Z", brand: "" },
  { id: "f0000000-0000-4000-a000-000000000017", title: "Tan Suede Loafers",         category: "shoes",      color: "tan",         tags: ["loafers", "suede", "preppy"],          attributes: {}, source_image_url: '/clothes/f-shoe-3.png',    created_at: "2025-01-01T00:00:00.000Z", brand: "" },
  { id: "f0000000-0000-4000-a000-000000000018", title: "Black Classic Heels",       category: "shoes",      color: "black",       tags: ["heels", "classic", "elegant"],         attributes: {}, source_image_url: '/clothes/f-shoe-4.png',    created_at: "2025-01-01T00:00:00.000Z", brand: "" },
  { id: "f0000000-0000-4000-a000-000000000019", title: "Nude Ankle-Strap Sandals",  category: "shoes",      color: "nude",        tags: ["sandals", "ankle-strap", "dainty"],    attributes: {}, source_image_url: '/clothes/f-shoe-5.png',    created_at: "2025-01-01T00:00:00.000Z", brand: "" },
  { id: "f0000000-0000-4000-a000-00000000001a", title: "White Leather Ankle Boots", category: "shoes",      color: "white",       tags: ["boots", "leather", "ankle"],           attributes: {}, source_image_url: '/clothes/f-shoe-6.png',    created_at: "2025-01-01T00:00:00.000Z", brand: "" },
  { id: "f0000000-0000-4000-a000-00000000001b", title: "Ballet Flats",              category: "shoes",      color: "blush",       tags: ["flats", "ballet", "feminine"],         attributes: {}, source_image_url: '/clothes/f-shoe-7.png',    created_at: "2025-01-01T00:00:00.000Z", brand: "" },
  { id: "f0000000-0000-4000-a000-00000000001c", title: "Chunky Platform Sneakers",  category: "shoes",      color: "white",       tags: ["sneakers", "chunky", "platform"],      attributes: {}, source_image_url: '/clothes/f-shoe-8.png',    created_at: "2025-01-01T00:00:00.000Z", brand: "" },
  { id: "f0000000-0000-4000-a000-00000000001d", title: "Strappy Black Sandals",     category: "shoes",      color: "black",       tags: ["sandals", "strappy", "minimal"],       attributes: {}, source_image_url: '/clothes/f-shoe-9.png',    created_at: "2025-01-01T00:00:00.000Z", brand: "" },
  { id: "f0000000-0000-4000-a000-00000000001e", title: "Pointed-Toe Pumps",         category: "shoes",      color: "nude",        tags: ["pumps", "pointed-toe", "sophisticated"], attributes: {}, source_image_url: '/clothes/f-shoe-10.png',   created_at: "2025-01-01T00:00:00.000Z", brand: "" },

  // ── Headwear (5) ──
  { id: "f0000000-0000-4000-a000-00000000001f", title: "Wide-Brim Fedora",          category: "headwear",   color: "beige",       tags: ["fedora", "wide-brim", "statement"],    attributes: {}, source_image_url: '/clothes/f-headwear-1.png', created_at: "2025-01-01T00:00:00.000Z", brand: "" },
  { id: "f0000000-0000-4000-a000-000000000020", title: "Ribbed Beanie",             category: "headwear",   color: "pink",        tags: ["beanie", "ribbed", "cozy"],            attributes: {}, source_image_url: '/clothes/f-headwear-2.png', created_at: "2025-01-01T00:00:00.000Z", brand: "" },
  { id: "f0000000-0000-4000-a000-000000000021", title: "French Beret",              category: "headwear",   color: "black",       tags: ["beret", "parisian", "chic"],           attributes: {}, source_image_url: '/clothes/f-headwear-3.png', created_at: "2025-01-01T00:00:00.000Z", brand: "" },
  { id: "f0000000-0000-4000-a000-000000000022", title: "Bucket Hat",                category: "headwear",   color: "cream",       tags: ["bucket", "hat", "street"],             attributes: {}, source_image_url: '/clothes/f-headwear-4.png', created_at: "2025-01-01T00:00:00.000Z", brand: "" },
  { id: "f0000000-0000-4000-a000-000000000023", title: "Silk Headband",             category: "headwear",   color: "green",       tags: ["headband", "silk", "elegant"],         attributes: {}, source_image_url: '/clothes/f-headwear-5.png', created_at: "2025-01-01T00:00:00.000Z", brand: "" },

  // ── Accessories (5) ──
  { id: "f0000000-0000-4000-a000-000000000024", title: "Gold Chain Necklace",       category: "accessories", color: "gold",        tags: ["necklace", "chain", "gold"],           attributes: {}, source_image_url: '/clothes/f-accessory-1.png', created_at: "2025-01-01T00:00:00.000Z", brand: "" },
  { id: "f0000000-0000-4000-a000-000000000025", title: "Tortoise Sunglasses",       category: "accessories", color: "tortoise",    tags: ["sunglasses", "tortoise", "retro"],     attributes: {}, source_image_url: '/clothes/f-accessory-2.png', created_at: "2025-01-01T00:00:00.000Z", brand: "" },
  { id: "f0000000-0000-4000-a000-000000000026", title: "Classic Leather Belt",      category: "accessories", color: "black",       tags: ["belt", "leather", "gold-buckle"],      attributes: {}, source_image_url: '/clothes/f-accessory-3.png', created_at: "2025-01-01T00:00:00.000Z", brand: "" },
  { id: "f0000000-0000-4000-a000-000000000027", title: "Rose Gold Watch",           category: "accessories", color: "rose-gold",   tags: ["watch", "rose-gold", "minimalist"],    attributes: {}, source_image_url: '/clothes/f-accessory-4.png', created_at: "2025-01-01T00:00:00.000Z", brand: "" },
  { id: "f0000000-0000-4000-a000-000000000028", title: "Pearl Drop Earrings",       category: "accessories", color: "pearl",       tags: ["earrings", "pearl", "drop"],           attributes: {}, source_image_url: '/clothes/f-accessory-5.png', created_at: "2025-01-01T00:00:00.000Z", brand: "" },

  // ── Bags (5) ──
  { id: "f0000000-0000-4000-a000-000000000029", title: "Leather Tote Bag",          category: "bags",       color: "camel",       tags: ["tote", "leather", "everyday"],         attributes: {}, source_image_url: '/clothes/f-bag-1.png',        created_at: "2025-01-01T00:00:00.000Z", brand: "" },
  { id: "f0000000-0000-4000-a000-00000000002a", title: "Chain Crossbody Bag",       category: "bags",       color: "black",       tags: ["crossbody", "chain", "quilted"],       attributes: {}, source_image_url: '/clothes/f-bag-2.png',        created_at: "2025-01-01T00:00:00.000Z", brand: "" },
  { id: "f0000000-0000-4000-a000-00000000002b", title: "Beaded Clutch",             category: "bags",       color: "ivory",       tags: ["clutch", "beaded", "evening"],         attributes: {}, source_image_url: '/clothes/f-bag-3.png',        created_at: "2025-01-01T00:00:00.000Z", brand: "" },
  { id: "f0000000-0000-4000-a000-00000000002c", title: "Structured Shoulder Bag",   category: "bags",       color: "burgundy",    tags: ["shoulder", "structured", "day"],       attributes: {}, source_image_url: '/clothes/f-bag-4.png',        created_at: "2025-01-01T00:00:00.000Z", brand: "" },
  { id: "f0000000-0000-4000-a000-00000000002d", title: "Canvas Backpack",           category: "bags",       color: "olive",       tags: ["backpack", "canvas", "casual"],        attributes: {}, source_image_url: '/clothes/f-bag-5.png',        created_at: "2025-01-01T00:00:00.000Z", brand: "" },

  // ── Dresses (5) ──
  { id: "f0000000-0000-4000-a000-00000000002e", title: "Black Slip Dress",          category: "dresses",    color: "black",       tags: ["slip", "minimal", "date-night"],       attributes: {}, source_image_url: '/clothes/f-dress-1.png',      created_at: "2025-01-01T00:00:00.000Z", brand: "" },
  { id: "f0000000-0000-4000-a000-00000000002f", title: "Floral Wrap Dress",         category: "dresses",    color: "floral",      tags: ["wrap", "floral", "feminine"],          attributes: {}, source_image_url: '/clothes/f-dress-2.png',      created_at: "2025-01-01T00:00:00.000Z", brand: "" },
  { id: "f0000000-0000-4000-a000-000000000030", title: "White Sundress",            category: "dresses",    color: "white",       tags: ["sundress", "white", "summer"],         attributes: {}, source_image_url: '/clothes/f-dress-3.png',      created_at: "2025-01-01T00:00:00.000Z", brand: "" },
  { id: "f0000000-0000-4000-a000-000000000031", title: "Navy Bodycon Dress",        category: "dresses",    color: "navy",        tags: ["bodycon", "fitted", "night-out"],      attributes: {}, source_image_url: '/clothes/f-dress-4.png',      created_at: "2025-01-01T00:00:00.000Z", brand: "" },
  { id: "f0000000-0000-4000-a000-000000000032", title: "Camel Shirt Dress",         category: "dresses",    color: "camel",       tags: ["shirt", "dress", "tailored"],          attributes: {}, source_image_url: '/clothes/f-dress-5.png',      created_at: "2025-01-01T00:00:00.000Z", brand: "" },
]

// ─── Male Wardrobe (30 items) ───

export const MALE_DEMO_ITEMS: ClosetItem[] = [
  // ── Tops (10) ──
  { id: "a0000000-0000-4000-a000-000000000001", title: "Cream Knit Sweater",         category: "tops",       color: "cream",       tags: ["knit", "cozy", "sweater"],             attributes: {}, source_image_url: '/clothes/m-top-1.png',  created_at: "2025-01-01T00:00:00.000Z", brand: "" },
  { id: "a0000000-0000-4000-a000-000000000002", title: "Black Leather Biker Jacket", category: "outerwear",  color: "black",       tags: ["leather", "edgy", "jacket"],            attributes: {}, source_image_url: '/clothes/m-top-2.png',  created_at: "2025-01-01T00:00:00.000Z", brand: "" },
  { id: "a0000000-0000-4000-a000-000000000003", title: "White Oxford Button-Down",   category: "tops",       color: "white",       tags: ["oxford", "crisp", "button-down"],       attributes: {}, source_image_url: '/clothes/m-top-3.png',  created_at: "2025-01-01T00:00:00.000Z", brand: "" },
  { id: "a0000000-0000-4000-a000-000000000004", title: "Striped Rugby Polo",         category: "tops",       color: "striped",     tags: ["rugby", "polo", "prep"],               attributes: {}, source_image_url: '/clothes/m-top-4.png',  created_at: "2025-01-01T00:00:00.000Z", brand: "" },
  { id: "a0000000-0000-4000-a000-000000000005", title: "Black Crewneck Tee",         category: "tops",       color: "black",       tags: ["tee", "crewneck", "essential"],        attributes: {}, source_image_url: '/clothes/m-top-5.png',  created_at: "2025-01-01T00:00:00.000Z", brand: "" },
  { id: "a0000000-0000-4000-a000-000000000006", title: "Navy Hoodie",                category: "outerwear",  color: "navy",        tags: ["hoodie", "casual", "pullover"],        attributes: {}, source_image_url: '/clothes/m-top-6.png',  created_at: "2025-01-01T00:00:00.000Z", brand: "" },
  { id: "a0000000-0000-4000-a000-000000000007", title: "Gray Henley Shirt",          category: "tops",       color: "gray",        tags: ["henley", "long-sleeve", "rugged"],     attributes: {}, source_image_url: '/clothes/m-top-7.png',  created_at: "2025-01-01T00:00:00.000Z", brand: "" },
  { id: "a0000000-0000-4000-a000-000000000008", title: "Olive Bomber Jacket",        category: "outerwear",  color: "olive",       tags: ["bomber", "jacket", "military"],        attributes: {}, source_image_url: '/clothes/m-top-8.png',  created_at: "2025-01-01T00:00:00.000Z", brand: "" },
  { id: "a0000000-0000-4000-a000-000000000009", title: "Light Blue Denim Shirt",     category: "tops",       color: "light-blue",  tags: ["denim", "shirt", "workwear"],          attributes: {}, source_image_url: '/clothes/m-top-9.png',  created_at: "2025-01-01T00:00:00.000Z", brand: "" },
  { id: "a0000000-0000-4000-a000-00000000000a", title: "Burgundy Quarter-Zip",       category: "tops",       color: "burgundy",    tags: ["quarter-zip", "pullover", "smart"],    attributes: {}, source_image_url: '/clothes/m-top-10.png', created_at: "2025-01-01T00:00:00.000Z", brand: "" },

  // ── Bottoms (10) ──
  { id: "a0000000-0000-4000-a000-00000000000b", title: "Slim-Fit Blue Denim",        category: "bottoms",    color: "blue",        tags: ["denim", "slim-fit", "jeans"],          attributes: {}, source_image_url: '/clothes/m-bottom-1.png',  created_at: "2025-01-01T00:00:00.000Z", brand: "" },
  { id: "a0000000-0000-4000-a000-00000000000c", title: "Khaki Relaxed Chinos",       category: "bottoms",    color: "khaki",       tags: ["chinos", "relaxed", "casual"],         attributes: {}, source_image_url: '/clothes/m-bottom-2.png',  created_at: "2025-01-01T00:00:00.000Z", brand: "" },
  { id: "a0000000-0000-4000-a000-00000000000d", title: "Gray Tailored Dress Pants",  category: "bottoms",    color: "gray",        tags: ["dress", "tailored", "sharp"],          attributes: {}, source_image_url: '/clothes/m-bottom-3.png',  created_at: "2025-01-01T00:00:00.000Z", brand: "" },
  { id: "a0000000-0000-4000-a000-00000000000e", title: "Olive Cargo Joggers",        category: "bottoms",    color: "olive",       tags: ["cargo", "joggers", "street"],          attributes: {}, source_image_url: '/clothes/m-bottom-4.png',  created_at: "2025-01-01T00:00:00.000Z", brand: "" },
  { id: "a0000000-0000-4000-a000-00000000000f", title: "Black Athletic Shorts",      category: "bottoms",    color: "black",       tags: ["shorts", "athletic", "gym"],           attributes: {}, source_image_url: '/clothes/m-bottom-5.png',  created_at: "2025-01-01T00:00:00.000Z", brand: "" },
  { id: "a0000000-0000-4000-a000-000000000010", title: "Dark Rinse Straight Jeans",  category: "bottoms",    color: "dark-blue",   tags: ["jeans", "straight", "dark-rinse"],     attributes: {}, source_image_url: '/clothes/m-bottom-6.png',  created_at: "2025-01-01T00:00:00.000Z", brand: "" },
  { id: "a0000000-0000-4000-a000-000000000011", title: "Navy Tech-Fabric Pants",     category: "bottoms",    color: "navy",        tags: ["tech", "performance", "pants"],        attributes: {}, source_image_url: '/clothes/m-bottom-7.png',  created_at: "2025-01-01T00:00:00.000Z", brand: "" },
  { id: "a0000000-0000-4000-a000-000000000012", title: "Beige Linen Shorts",         category: "bottoms",    color: "beige",       tags: ["linen", "shorts", "summer"],           attributes: {}, source_image_url: '/clothes/m-bottom-8.png',  created_at: "2025-01-01T00:00:00.000Z", brand: "" },
  { id: "a0000000-0000-4000-a000-000000000013", title: "Charcoal Sweatpants",        category: "bottoms",    color: "charcoal",    tags: ["sweatpants", "lounge", "comfort"],     attributes: {}, source_image_url: '/clothes/m-bottom-9.png',  created_at: "2025-01-01T00:00:00.000Z", brand: "" },
  { id: "a0000000-0000-4000-a000-000000000014", title: "Stonewashed Relaxed Jeans",  category: "bottoms",    color: "light-blue",  tags: ["jeans", "relaxed", "stonewashed"],     attributes: {}, source_image_url: '/clothes/m-bottom-10.png', created_at: "2025-01-01T00:00:00.000Z", brand: "" },

  // ── Shoes (10) ──
  { id: "a0000000-0000-4000-a000-000000000015", title: "White Low-Top Sneakers",     category: "shoes",      color: "white",       tags: ["sneakers", "low-top", "clean"],       attributes: {}, source_image_url: '/clothes/m-shoe-1.png',    created_at: "2025-01-01T00:00:00.000Z", brand: "" },
  { id: "a0000000-0000-4000-a000-000000000016", title: "Brown Chelsea Boots",        category: "shoes",      color: "brown",       tags: ["boots", "chelsea", "smart"],           attributes: {}, source_image_url: '/clothes/m-shoe-2.png',    created_at: "2025-01-01T00:00:00.000Z", brand: "" },
  { id: "a0000000-0000-4000-a000-000000000017", title: "Brown Penny Loafers",        category: "shoes",      color: "brown",       tags: ["loafers", "penny", "ivy"],             attributes: {}, source_image_url: '/clothes/m-shoe-3.png',    created_at: "2025-01-01T00:00:00.000Z", brand: "" },
  { id: "a0000000-0000-4000-a000-000000000018", title: "Blue Running Sneakers",      category: "shoes",      color: "blue",        tags: ["running", "sneakers", "athletic"],     attributes: {}, source_image_url: '/clothes/m-shoe-4.png',    created_at: "2025-01-01T00:00:00.000Z", brand: "" },
  { id: "a0000000-0000-4000-a000-000000000019", title: "Black Leather Slides",       category: "shoes",      color: "black",       tags: ["slides", "leather", "minimal"],        attributes: {}, source_image_url: '/clothes/m-shoe-5.png',    created_at: "2025-01-01T00:00:00.000Z", brand: "" },
  { id: "a0000000-0000-4000-a000-00000000001a", title: "Tan Desert Boots",           category: "shoes",      color: "tan",         tags: ["boots", "desert", "chukka"],           attributes: {}, source_image_url: '/clothes/m-shoe-6.png',    created_at: "2025-01-01T00:00:00.000Z", brand: "" },
  { id: "a0000000-0000-4000-a000-00000000001b", title: "Gray Knit Sneakers",         category: "shoes",      color: "gray",        tags: ["sneakers", "knit", "modern"],          attributes: {}, source_image_url: '/clothes/m-shoe-7.png',    created_at: "2025-01-01T00:00:00.000Z", brand: "" },
  { id: "a0000000-0000-4000-a000-00000000001c", title: "Black Leather Derbys",       category: "shoes",      color: "black",       tags: ["derby", "leather", "formal"],          attributes: {}, source_image_url: '/clothes/m-shoe-8.png',    created_at: "2025-01-01T00:00:00.000Z", brand: "" },
  { id: "a0000000-0000-4000-a000-00000000001d", title: "Gum-Sole White Trainers",    category: "shoes",      color: "white",       tags: ["trainers", "gum-sole", "retro"],       attributes: {}, source_image_url: '/clothes/m-shoe-9.png',    created_at: "2025-01-01T00:00:00.000Z", brand: "" },
  { id: "a0000000-0000-4000-a000-00000000001e", title: "Navy Boat Shoes",            category: "shoes",      color: "navy",        tags: ["boat", "preppy", "summer"],            attributes: {}, source_image_url: '/clothes/m-shoe-10.png',   created_at: "2025-01-01T00:00:00.000Z", brand: "" },

  // ── Headwear (5) ──
  { id: "a0000000-0000-4000-a000-00000000001f", title: "Baseball Cap",              category: "headwear",   color: "navy",        tags: ["baseball", "cap", "sporty"],           attributes: {}, source_image_url: '/clothes/m-headwear-1.png', created_at: "2025-01-01T00:00:00.000Z", brand: "" },
  { id: "a0000000-0000-4000-a000-000000000020", title: "Flat Cap",                  category: "headwear",   color: "gray",        tags: ["flat-cap", "tweed", "heritage"],       attributes: {}, source_image_url: '/clothes/m-headwear-2.png', created_at: "2025-01-01T00:00:00.000Z", brand: "" },
  { id: "a0000000-0000-4000-a000-000000000021", title: "Ribbed Beanie",             category: "headwear",   color: "charcoal",    tags: ["beanie", "ribbed", "winter"],          attributes: {}, source_image_url: '/clothes/m-headwear-3.png', created_at: "2025-01-01T00:00:00.000Z", brand: "" },
  { id: "a0000000-0000-4000-a000-000000000022", title: "Bucket Hat",                category: "headwear",   color: "olive",       tags: ["bucket", "hat", "street"],             attributes: {}, source_image_url: '/clothes/m-headwear-4.png', created_at: "2025-01-01T00:00:00.000Z", brand: "" },
  { id: "a0000000-0000-4000-a000-000000000023", title: "Knit Beanie",               category: "headwear",   color: "black",       tags: ["beanie", "knit", "essential"],         attributes: {}, source_image_url: '/clothes/m-headwear-5.png', created_at: "2025-01-01T00:00:00.000Z", brand: "" },

  // ── Accessories (5) ──
  { id: "a0000000-0000-4000-a000-000000000024", title: "Silver Chain Necklace",     category: "accessories", color: "silver",      tags: ["necklace", "chain", "silver"],         attributes: {}, source_image_url: '/clothes/m-accessory-1.png', created_at: "2025-01-01T00:00:00.000Z", brand: "" },
  { id: "a0000000-0000-4000-a000-000000000025", title: "Aviator Sunglasses",        category: "accessories", color: "gold",        tags: ["sunglasses", "aviator", "classic"],    attributes: {}, source_image_url: '/clothes/m-accessory-2.png', created_at: "2025-01-01T00:00:00.000Z", brand: "" },
  { id: "a0000000-0000-4000-a000-000000000026", title: "Leather Belt",              category: "accessories", color: "brown",       tags: ["belt", "leather", "staple"],           attributes: {}, source_image_url: '/clothes/m-accessory-3.png', created_at: "2025-01-01T00:00:00.000Z", brand: "" },
  { id: "a0000000-0000-4000-a000-000000000027", title: "Chronograph Watch",         category: "accessories", color: "silver",      tags: ["watch", "chronograph", "sport"],       attributes: {}, source_image_url: '/clothes/m-accessory-4.png', created_at: "2025-01-01T00:00:00.000Z", brand: "" },
  { id: "a0000000-0000-4000-a000-000000000028", title: "Beaded Bracelet",           category: "accessories", color: "multi",       tags: ["bracelet", "beaded", "boho"],          attributes: {}, source_image_url: '/clothes/m-accessory-5.png', created_at: "2025-01-01T00:00:00.000Z", brand: "" },

  // ── Bags (5) ──
  { id: "a0000000-0000-4000-a000-000000000029", title: "Leather Messenger Bag",     category: "bags",       color: "brown",       tags: ["messenger", "leather", "work"],        attributes: {}, source_image_url: '/clothes/m-bag-1.png',        created_at: "2025-01-01T00:00:00.000Z", brand: "" },
  { id: "a0000000-0000-4000-a000-00000000002a", title: "Crossbody Sling Bag",       category: "bags",       color: "black",       tags: ["crossbody", "sling", "minimal"],       attributes: {}, source_image_url: '/clothes/m-bag-2.png',        created_at: "2025-01-01T00:00:00.000Z", brand: "" },
  { id: "a0000000-0000-4000-a000-00000000002b", title: "Canvas Backpack",           category: "bags",       color: "olive",       tags: ["backpack", "canvas", "everyday"],      attributes: {}, source_image_url: '/clothes/m-bag-3.png',        created_at: "2025-01-01T00:00:00.000Z", brand: "" },
  { id: "a0000000-0000-4000-a000-00000000002c", title: "Weekender Duffel",          category: "bags",       color: "tan",         tags: ["duffel", "weekender", "travel"],       attributes: {}, source_image_url: '/clothes/m-bag-4.png',        created_at: "2025-01-01T00:00:00.000Z", brand: "" },
  { id: "a0000000-0000-4000-a000-00000000002d", title: "Leather Briefcase",         category: "bags",       color: "dark-brown",  tags: ["briefcase", "leather", "professional"], attributes: {}, source_image_url: '/clothes/m-bag-5.png',        created_at: "2025-01-01T00:00:00.000Z", brand: "" },
]

/**
 * Returns the gender-appropriate demo items.
 * Defaults to Female for "Other" or unknown gender.
 *
 * Comparison is case-insensitive so callers that lowercase the
 * gender value (e.g. Auth.tsx's handleGender which normalises via
 * `.toLowerCase()`) still resolve to the correct item set.
 */
export function getDemoItemsForGender(gender: string | null): ClosetItem[] {
  const g = gender?.toLowerCase() ?? ""
  if (g === "female") return FEMALE_DEMO_ITEMS
  if (g === "male") return MALE_DEMO_ITEMS
  return FEMALE_DEMO_ITEMS // default to female for "Other" / unknown
}
