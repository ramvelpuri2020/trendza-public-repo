/**
 * plannerService — manages planned outfits per date and AI try-on image generation.
 *
 * Generation flow:
 * 1. User assigns an outfit to a date → `planOutfitForDate(outfitId, date)`
 * 2. That upserts a row in `planner_outfits` + creates a `planner_generated_images`
 *    row with status='pending'
 * 3. The frontend kicks off `generateTryOnImage(genId)` which calls a Supabase Edge * Function that runs CatVTON to generate the try-on image
 * 4. Frontend polls `planner_generated_images.status` until it's 'completed' or 'failed'
 * 5. The generated image URL is cached per user+outfit combo so it never regenerates
 */

import { FunctionRegion } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { SavedOutfit, ClosetItem } from '@/hooks/useClosetData';
import { downscaleImageFile, contentHash } from '@/utils/imageResize';

// ─── Types ───────────────────────────────────────────────────────────

export interface PlannerOutfit {
  id: string;
  user_id: string;
  outfit_id: string | null;
  planned_date: string;
  notes: string | null;
  outfit_data: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface GeneratedImage {
  id: string;
  user_id: string;
  outfit_id: string;
  planned_date: string;
  image_url: string | null;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  error_message: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export type GenerationStatus = 'pending' | 'generating' | 'completed' | 'failed';

// ─── Planner Outfit CRUD ────────────────────────────────────────────

/**
 * Assign an outfit to a specific date. Upserts — one outfit per date.
 * After planning, kicks off try-on image generation in the background.
 */
export async function planOutfitForDate(
  outfit: SavedOutfit,
  date: Date,
): Promise<{ plannerRow: PlannerOutfit | null; genRow: GeneratedImage | null }> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) throw new Error('Not authenticated');

  const dateStr = date.toISOString().split('T')[0];

  // Fresh-read source_image_url for every item from the DB, so the
  // metadata snapshot always stores current absolute URLs — not stale
  // in-memory values that might still be relative paths from before
  // the seed-wardrobe migration.
  const itemIds = outfit.items.map((i) => i.id).filter(Boolean);
  const freshUrlMap = new Map<string, string>();
  if (itemIds.length > 0) {
    const { data: freshItems } = await supabase
      .from('trendza_closet_items')
      .select('id, source_image_url')
      .in('id', itemIds);
    if (freshItems) {
      for (const row of freshItems) {
        if (row.source_image_url) freshUrlMap.set(row.id, row.source_image_url);
      }
    }
  }

  // Snapshot the outfit data at time of planning (items may change later).
  // Prefer the fresh DB URL; fall back to the in-memory value for items
  // that don't exist in the DB (e.g. demo items with fixed UUIDs).
  const outfitData = {
    name: outfit.name,
    items: outfit.items.map((i) => ({
      id: i.id,
      title: i.title,
      category: i.category,
      color: i.color,
      source_image_url: freshUrlMap.get(i.id) ?? i.source_image_url,
    })),
  };

  // Upsert the planned outfit row
  const { data: plannerRow, error: planError } = await supabase
    .from('planner_outfits')
    .upsert(
      {
        user_id: auth.user.id,
        outfit_id: outfit.id,
        planned_date: dateStr,
        outfit_data: outfitData,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id, planned_date',
        ignoreDuplicates: false,
      },
    )
    .select()
    .single();

  if (planError) throw planError;

  // ── Fetch the user's current base photo URL ───────────────
  const { data: profile } = await supabase
    .from('profiles')
    .select('selected_image')
    .eq('id', auth.user.id)
    .maybeSingle();
  const currentBasePhoto: string | null = profile?.selected_image ?? null;

  // ── Check for cached generation (same user + outfit) ──────
  // The cache is keyed by user_id + outfit_id. BUT if the user
  // changed their base photo since the last generation, the old
  // cached result is stale — it used a different person photo.
  // We must detect that and force a fresh generation.
  const { data: existingGen } = await supabase
    .from('planner_generated_images')
    .select('id, status, image_url, metadata')
    .eq('user_id', auth.user.id)
    .eq('outfit_id', outfit.id)
    .maybeSingle();

  if (existingGen) {
    const prevBasePhoto: string | null =
      (existingGen as any).metadata?.base_photo_url ?? null;

    // If the base photo changed (or was added/removed), delete the stale
    // cache entry so a fresh generation runs with the new person photo.
    if (prevBasePhoto !== currentBasePhoto) {
      console.log(
        '[plannerService] Base photo changed — invalidating cached generation for outfit',
        outfit.id,
      );
      await supabase
        .from('planner_generated_images')
        .delete()
        .eq('id', existingGen.id);
    } else {
      // Same base photo — use cached result
      if (existingGen.status === 'failed') {
        const { data: resetGen } = await supabase
          .from('planner_generated_images')
          .update({ status: 'pending', error_message: null, updated_at: new Date().toISOString() })
          .eq('id', existingGen.id)
          .select()
          .single();
        generateTryOnImage(resetGen.id).catch((e) =>
          console.error('[plannerService] Background generation failed:', e),
        );
        return { plannerRow: plannerRow as PlannerOutfit, genRow: resetGen as GeneratedImage | null };
      }
      return { plannerRow: plannerRow as PlannerOutfit, genRow: existingGen as GeneratedImage | null };
    }
  }

  // ── Create a new generation entry (includes base_photo_url in metadata) ──
  const { data: genRow, error: genError } = await supabase
    .from('planner_generated_images')
    .insert({
      user_id: auth.user.id,
      outfit_id: outfit.id,
      planned_date: dateStr,
      status: 'pending',
      metadata: {
        ...outfitData,
        base_photo_url: currentBasePhoto,
        // Content key for server-side dedupe: identical person + garment
        // set → same hash → edge function reuses the cached result.
        content_hash: contentHash([
          currentBasePhoto ?? '',
          ...outfitData.items.map((i) => i.source_image_url ?? ''),
        ]),
      },
    })
    .select()
    .single();

  if (genError) throw genError;

  // Fire the generation in the background
  generateTryOnImage(genRow.id).catch((e) =>
    console.error('[plannerService] Background generation failed:', e),
  );

  return {
    plannerRow: plannerRow as PlannerOutfit,
    genRow: genRow as GeneratedImage | null,
  };
}

/**
 * Remove a planned outfit from a date.
 */
export async function unplanDate(dateStr: string): Promise<void> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) throw new Error('Not authenticated');

  await supabase
    .from('planner_outfits')
    .delete()
    .eq('user_id', auth.user.id)
    .eq('planned_date', dateStr);
}

/**
 * Get the planned outfit + generated image for a specific date.
 */
export async function getPlannedOutfitForDate(
  dateStr: string,
): Promise<{ planner: PlannerOutfit | null; image: GeneratedImage | null }> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) return { planner: null, image: null };

  const { data: plannerRow } = await supabase
    .from('planner_outfits')
    .select('*')
    .eq('user_id', auth.user.id)
    .eq('planned_date', dateStr)
    .maybeSingle();

  if (!plannerRow) return { planner: null, image: null };

  const outfitId = (plannerRow as PlannerOutfit).outfit_id;
  let genImage: GeneratedImage | null = null;

  if (outfitId) {
    const { data: genRow } = await supabase
      .from('planner_generated_images')
      .select('*')
      .eq('user_id', auth.user.id)
      .eq('outfit_id', outfitId)
      .maybeSingle();
    genImage = genRow as GeneratedImage | null;
  }

  return { planner: plannerRow as PlannerOutfit, image: genImage };
}

/**
 * Get all planned dates for a date range (e.g., month view).
 */
export async function getPlannedOutfitsForRange(
  startDate: Date,
  endDate: Date,
): Promise<Array<{ date: string; outfitId: string | null; status: GenerationStatus | null; imageUrl: string | null }>> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) return [];

  const startStr = startDate.toISOString().split('T')[0];
  const endStr = endDate.toISOString().split('T')[0];

  const { data: rows } = await supabase
    .from('planner_outfits')
    .select('planned_date, outfit_id')
    .eq('user_id', auth.user.id)
    .gte('planned_date', startStr)
    .lte('planned_date', endStr);

  if (!rows) return [];

  // Get generation status for each outfit
  const outfitIds = rows
    .map((r) => (r as any).outfit_id)
    .filter(Boolean);

  let genStatuses: Map<string, string> = new Map();
  let genImageUrls: Map<string, string | null> = new Map();
  if (outfitIds.length > 0) {
    const { data: genRows } = await supabase
      .from('planner_generated_images')
      .select('outfit_id, status, image_url')
      .eq('user_id', auth.user.id)
      .in('outfit_id', outfitIds);
    if (genRows) {
      genStatuses = new Map(
        (genRows as any[]).map((r) => [r.outfit_id, r.status]),
      );
      genImageUrls = new Map(
        (genRows as any[]).map((r) => [r.outfit_id, r.image_url]),
      );
    }
  }

  return (rows as any[]).map((r) => ({
    date: r.planned_date,
    outfitId: r.outfit_id,
    status: (genStatuses.get(r.outfit_id) as GenerationStatus) ?? null,
    imageUrl: genImageUrls.get(r.outfit_id) ?? null,
  }));
}

// ─── Try-On Image Generation ─────────────────────────────────────────

/**
 * Generate a try-on image for a planned outfit.
 *
 * Calls the `generate-tryon` Supabase Edge Function which runs CatVTON
 * to generate the try-on image. Includes a client-side timeout so the
 * status doesn't get stuck at 'generating' forever.
 */
export async function generateTryOnImage(genId: string): Promise<void> {
  try {
    // Mark as generating
    await supabase
      .from('planner_generated_images')
      .update({ status: 'generating', updated_at: new Date().toISOString() })
      .eq('id', genId);

    // Guard: verify every item in metadata has a source_image_url before firing the edge function.
    // Missing images would silently fail during compositing, wasting time & quota.
    {
      const { data: checkRow } = await supabase
        .from('planner_generated_images')
        .select('metadata')
        .eq('id', genId)
        .single();
      if (checkRow) {
        const metaItems: Array<{ title?: string; category?: string; source_image_url?: string }> =
          (checkRow as any).metadata?.items ?? [];
        for (const item of metaItems) {
          if (!item.source_image_url) {
            console.warn(
              '[plannerService] ⚠️ Item missing source_image_url — Gemini won\'t be able to fetch it:',
              item.title ?? '(unnamed)',
              `(category: ${item.category ?? '?'})`,
            );
          }
        }
      }
    }

    // Call the Edge Function with a 200s timeout. Pinned to Singapore
    // (ap-southeast-1) to sit next to the DashScope workspace — the default
    // region (closest to user) adds cross-continent hops on every call.
    const result = await Promise.race([
      supabase.functions.invoke('generate-tryon', {
        body: { generation_id: genId },
        region: FunctionRegion.ApSoutheast1,
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Edge Function timed out after 240s')), 240_000),
      ),
    ]);

    const { data, error } = result as { data: any; error: any };

    if (error) throw error;

    // Handle step1_done FIRST with an early return — don't mark as
    // completed or failed. The step 2 edge function invocation will
    // set status to 'completed' when it finishes. The existing polling
    // loop (pollGenerationStatus) will pick up the final status.
    if (data?.status === 'step1_done') {
      console.log('[plannerService] Step 1 done, step 2 triggered — continuing to poll');
      return;
    }

    if (data?.image_url) {
      // ── Single invocation completed (single-garment, dress, or step 2 final) ──
      console.log('[plannerService] ✅ Generation completed for', genId);
      await supabase
        .from('planner_generated_images')
        .update({
          status: 'completed',
          image_url: data.image_url,
          updated_at: new Date().toISOString(),
        })
        .eq('id', genId);
    } else if (data?.error) {
      throw new Error(data.error);
    } else {
      console.warn('[plannerService] Unexpected response:', data);
      throw new Error('Unexpected response from generation service');
    }
  } catch (e: any) {
    console.error('[plannerService] Try-on generation failed:', e?.message ?? e);
    await supabase
      .from('planner_generated_images')
      .update({
        status: 'failed',
        error_message: e?.message ?? 'Generation failed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', genId);
  }
}

/**
 * Poll the generation status of a try-on image.
 * Resolves when status is 'completed' or 'failed'.
 * @param genId - ID of the planner_generated_images row
 * @param intervalMs - Polling interval (default 2000ms)
 * @param timeoutMs - Max time to poll (default 120000ms = 2 min)
 */
export async function pollGenerationStatus(
  genId: string,
  intervalMs = 2000,
  timeoutMs = 120_000,
): Promise<GeneratedImage> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    const { data } = await supabase
      .from('planner_generated_images')
      .select('*')
      .eq('id', genId)
      .single();

    if (!data) {
      await new Promise((r) => setTimeout(r, intervalMs));
      continue;
    }

    const img = data as GeneratedImage;

    if (img.status === 'completed' || img.status === 'failed') {
      return img;
    }

    await new Promise((r) => setTimeout(r, intervalMs));
  }

  throw new Error('Generation timed out');
}

// ─── User Base Photo ─────────────────────────────────────────────────

/**
 * Save the user's base photo (full-body selfie used for try-on compositing).
 * Uploads to Supabase Storage at `user-base-photos/{userId}/{filename}`.
 */
export async function saveUserBasePhoto(file: File): Promise<string> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) throw new Error('Not authenticated');

  // ── Downscale before upload ─────────────────────────────────
  // Phone photos are 3000-4000px; DashScope downloads + VAE-encodes the
  // base photo on every try-on, so keeping it ≤1280px cuts that cost.
  // Canvas isn't available server-side, so this happens at upload time.
  const resizedFile = await downscaleImageFile(file, 1280);

  // ── Normalize file extension ────────────────────────────────
  // .jfif is valid JPEG data in a JFIF container; rename to .jpg.
  // .jpeg is standard JPEG; normalize to .jpg for consistency.
  // Reject anything other than .jpg/.jpeg/.png/.jfif to prevent
  // format issues downstream (e.g. Leffa's ML pipeline can't
  // decode .webp, .jfif, .bmp etc).
  const rawExt = (resizedFile.name.split('.').pop() ?? '').toLowerCase();
  const ALLOWED = new Set(['jpg', 'jpeg', 'png', 'jfif']);

  if (!ALLOWED.has(rawExt)) {
    throw new Error(
      `Unsupported image format: .${rawExt}. Please upload a .jpg, .jpeg, or .png photo.`,
    );
  }

  // Normalize to standard extension + mime type
  const normalizedExt = rawExt === 'jpeg' || rawExt === 'jfif' ? 'jpg' : rawExt;
  const mimeType = normalizedExt === 'png' ? 'image/png' : 'image/jpeg';

  const fileName = `base_photo_${Date.now()}.${normalizedExt}`;
  // Must use uploads/{userId}/... path — the clipped-closet-items bucket
  // RLS policy only allows writes under that prefix
  const storagePath = `uploads/${auth.user.id}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('clipped-closet-items')
    .upload(storagePath, resizedFile, {
      contentType: mimeType,
      upsert: true,
      cacheControl: '31536000', // timestamped URL → immutable → browser-cache forever
    });

  if (uploadError) throw uploadError;

  const { data: pubData } = supabase.storage
    .from('clipped-closet-items')
    .getPublicUrl(storagePath);

  // Store the URL in the user's profile
  await supabase
    .from('profiles')
    .update({ selected_image: pubData.publicUrl })
    .eq('id', auth.user.id);

  return pubData.publicUrl;
}

/**
 * Get the user's stored base photo URL (from profile or onboarding).
 * Falls back to null if none exists.
 */
export async function getUserBasePhoto(): Promise<string | null> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('selected_image')
    .eq('id', auth.user.id)
    .maybeSingle();

  if (profile?.selected_image) return profile.selected_image;

  // Check onboarding_v2 for selfie data
  const { data: onboarding } = await supabase
    .from('onboarding_v2')
    .select('step_data')
    .eq('user_id', auth.user.id)
    .maybeSingle();

  if (onboarding?.step_data && typeof onboarding.step_data === 'object') {
    const sd = onboarding.step_data as Record<string, any>;
    if (sd?.selfie_captured?.photo_url) return sd.selfie_captured.photo_url;
  }

  return null;
}
