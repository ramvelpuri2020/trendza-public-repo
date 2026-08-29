/**
 * wardrobe-seed.ts — Seeds the user's closet with gender-appropriate demo
 * items as real rows in trendza_closet_items.
 *
 * ## Per-user scoped UUIDs
 *
 * `src/lib/demo-wardrobe.ts` ships a fixed set of 45 / 50 demo items
 * whose ids use globally-shared prefixes (`f0000000-…` for Female,
 * `a0000000-…` for Male). Two Female users sharing the same gender
 * would collide on these ids at the primary-key level — Supabase's
 * `onConflict: 'id'` upsert silently overwrites the earlier user's
 * row (or, with RLS, throws and gets swallowed).
 *
 * To make seeding safe across all users we re-key every demo id
 * against the *owner's* UUID:
 *
 *   - The first 13 chars of `userId` (groups 1–2 + their hyphen sep)
 *     replace the first 13 chars of the demo item id (the gendered
 *     prefix + groups 1–2 of the demo). 48 bits of user entropy
 *     (12 hex chars across groups 1–2) ⇒ birthday collision
 *     probability remains ≈ 0 even at millions of users.
 *   - Groups 3–5 of the original item id (slice(13)) are preserved so
 *     the version nibble (`4`) at position 14 and the variant nibble
 *     (8/9/a/b) at position 19 still validate the result as a canonical
 *     v4 UUID. Concretely:
 *       item.id  = f0000000-0000-4000-a000-000000000001
 *       slice(13)= -4000-a000-000000000001
 *       userId   = 91f4165a-cf4e-49dd-81ea-65df53b7e67d
 *       slice(0,13) = 91f4165a-cf4e
 *       result   = 91f4165a-cf4e-4000-a000-000000000001  (36 chars, v4)
 *
 * Re-runs are still idempotent: a given userId + gender always yields
 * the same final ids, so the upsert's `onConflict: 'id'` is a no-op
 * when rows already exist.
 */

import { supabase } from "@/integrations/supabase/client"
import { getDemoItemsForGender } from "@/lib/demo-wardrobe"

export async function seedDemoWardrobe(
  userId: string,
  gender: string | null,
): Promise<void> {
  if (!userId) throw new Error("seedDemoWardrobe: userId is required")
  if (userId.length !== 36 || !/^[0-9a-f-]+$/i.test(userId)) {
    throw new Error(
      `seedDemoWardrobe: expected canonical UUID, got "${userId}". ` +
        "Per-user id transformation requires a 36-char hex+dash id.",
    )
  }

  // 13 chars = "xxxxxxxx-xxxx" (groups 1-2 of the user UUID with their
  // separator). After concatenation we still get a 36-char canonical
  // UUID, and the 12 hex chars of user entropy (positions 0-7 + 9-12)
  // keep collision-free behaviour for any realistic deploy size.
  const userPrefix = userId.slice(0, 13)

  const demoItems = getDemoItemsForGender(gender)
  const rows = demoItems.map((item) => ({
    // The 13-char `userPrefix` (groups 1-2 of userId + hyphen sep)
    // replaces the first 13 chars of the demo id (the gendered prefix
    // + groups 1-2). `item.id.slice(13)` is a 23-char suffix starting
    // with `-` that preserves the v4 version nibble (`4`) at position
    // 14 and the variant nibble (8/9/a/b) at position 19, so the
    // 36-char concatenation remains a canonical v4 UUID.
    //
    // Example:
    //   userId   = 91f4165a-cf4e-49dd-81ea-65df53b7e67d
    //   item.id  = f0000000-0000-4000-a000-000000000001
    //   userPref = 91f4165a-cf4e           (13 chars: groups 1-2 + sep)
    //   item Suf = -4000-a000-000000000001 (23 chars)
    //   result   = 91f4165a-cf4e-4000-a000-000000000001  (v4 valid)
    id: `${userPrefix}${item.id.slice(13)}`,
    user_id: userId,
    title: item.title,
    category: item.category,
    color: item.color,
    tags: item.tags ?? [],
    attributes: item.attributes ?? {},
    source_image_url: item.source_image_url,
  }))

  const { error } = await supabase
    .from("trendza_closet_items")
    .upsert(rows, { onConflict: "id" })

  if (error) throw error
}
