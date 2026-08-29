import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

interface MattingPayload {
  imageBlob: Blob;
  originalName: string;
}

/**
 * Sanitize a user-supplied filename into a storage-safe segment.
 * Replaces anything outside `[A-Za-z0-9._-]` with `_` and clamps to 80
 * chars so the storage path can't grow unbounded. Rejecting `..`
 * segments upfront so a path-traversal in `originalName` can't reach
 * outside the bucket prefix even if the Edge Function's validation
 * ever regresses (defense in depth — the function's auth gap is the
 * real concern, tracked separately).
 */
function sanitizeName(input: string): string {
  const cleaned = input.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80)
  if (cleaned === '' || cleaned === '.' || cleaned === '..') return 'image'
  if (cleaned.startsWith('.')) return '_' + cleaned
  // Strip embedded `..` segments — defensive against any way it slipped
  // through the outer regex.
  if (cleaned.includes('..')) return cleaned.replace(/\.\./g, '_')
  return cleaned
}

/**
 * Generate a collision-resistant filename stem. Prefers crypto.randomUUID
 * (natively available in every modern browser + Capacitor WebView);
 * falls back to a millisecond timestamp + short random suffix for
 * ancient runtimes.
 */
function makeFileId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

export const useUnifiedBackgroundRemoval = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ imageBlob, originalName }: MattingPayload) => {
      // Per-user scoped path: `uploads/{user.id}/{uuid}_{name}` in
      // `raw-closet-items`. The Edge Function reads from this bucket,
      // mints the transparent PNG, and writes it to `clipped-closet-items`
      // at the same logical path (with `_clean.png` appended).
      const { data: auth } = await supabase.auth.getUser()
      if (!auth?.user) throw new Error('Not signed in')
      const userId = auth.user.id

      const rawStoragePath = `uploads/${userId}/${makeFileId()}_${sanitizeName(originalName)}`

      // 1. Upload the raw picture from the device to the raw storage bucket
      const { error: uploadError } = await supabase.storage
        .from('raw-closet-items')
        .upload(rawStoragePath, imageBlob, {
          contentType: imageBlob.type || 'application/octet-stream',
        })
      if (uploadError) throw uploadError

      // 2. Fire off the secure Supabase Edge Function bridge (BiRefNet on HF).
      const { data, error: functionError } = await supabase.functions.invoke(
        'process-bg',
        { body: { imagePath: rawStoragePath } },
      )
      if (functionError) throw functionError
      if (!data?.cleanPath) {
        throw new Error('process-bg returned no clean path')
      }

      // 3. Path inside `clipped-closet-items` bucket — caller resolves
      //    to a public URL via supabase.storage.from(...).getPublicUrl().
      return data.cleanPath as string
    },
    onSuccess: () => {
      // Refresh the closet UI on success. NOTE: `useClosetData` does
      // its data fetching inside `useEffect` + `useState` rather than
      // TanStack Query, so this invalidation is currently a no-op (no
      // matching `useQuery({'closet-items'})` exists in the app).
      // Callers that use this hook should follow up with their own
      // local-state updates via the `insertItem`/`updateItem` callbacks
      // the parents expose. Kept here as a defence in case
      // useClosetData is migrated to TanStack Query later.
      queryClient.invalidateQueries({ queryKey: ['closet-items'] })
    },
  })
}
