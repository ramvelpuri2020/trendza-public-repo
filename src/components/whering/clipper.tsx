"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search,
  X,
  Crop,
  Check,
  Sparkles,
  ArrowLeft,
  Globe,
  AlertCircle,
  Loader2,
  Layers,
  CheckSquare,
  Square,
} from "lucide-react"
import { haptic } from "@/lib/haptics"
import { cn } from "@/lib/utils"
import { supabase } from "@/integrations/supabase/client"
import { SEARCH_FN_ENDPOINT, SEARCH_FN_KEY } from "@/lib/supabase-config"
import { useUnifiedBackgroundRemoval } from "@/hooks/useUnifiedBackgroundRemoval"
import { encodeBlurHashFromImageSource } from "@/lib/image"
import { toast } from "@/hooks/use-toast"
import type { ClosetItem } from "@/hooks/useClosetData"
import { BatchQueue, type QueueItem } from "./BatchQueue"

type ClipperItem = {
  id: string
  name: string
  src: string
  /** Where the item originated — drives whether confirmCrop re-uploads or
   *  just simulates "Added to Wardrobe". */
  origin?: "web" | "demo"
}

/**
 * Square crop region expressed as percentages of the displayed source image.
 * The wrapper `<div>` is sized with `aspect-ratio: NW/NH` so the displayed
 * rect matches the source aspect exactly — letting us map display-px
 * straight to source-px via `x * naturalW` with no letterboxing math.
 * (Roll-your-own cropper is justified because bringing in react-easy-crop
 *  / react-image-crop would add 20-50 KB and a parallel animation surface
 *  we'd then have to wrestle with on Capacitor iOS WebView.)
 */
type CropRect = { xPct: number; yPct: number; sizePct: number }

type Mode = "demo" | "web"

type Stage = "search" | "crop" | "processing" | "done" | "error"

type DragMode =
  | "move"
  | "resize-tl"
  | "resize-tr"
  | "resize-bl"
  | "resize-br"

// ── Serper search-clothes result shape ────────────────────────────────
interface SerperResult {
  id: string
  thumb_url: string
  high_res_url: string
  source?: string
  price?: string
}

// ── Brand filter data ───────────────────────────────────────────────────
interface BrandOption {
  slug: string
  label: string
  logoUrl?: string
}

const BRANDS: BrandOption[] = [
  { slug: "All", label: "All" },
  { slug: "Bottega Veneta", label: "Bottega Veneta", logoUrl: "/brands/bottega_veneta.png" },
  { slug: "Burberry", label: "Burberry", logoUrl: "/brands/burberry.png" },
  { slug: "Celine", label: "Celine", logoUrl: "/brands/celine.png" },
  { slug: "Chanel", label: "Chanel", logoUrl: "/brands/chanel.png" },
  { slug: "Chloé", label: "Chloé", logoUrl: "/brands/chloe.png" },
  { slug: "Coach", label: "Coach", logoUrl: "/brands/coach.png" },
  { slug: "Dior", label: "Dior", logoUrl: "/brands/dior.png" },
  { slug: "Fendi", label: "Fendi", logoUrl: "/brands/fendi.png" },
  { slug: "Givenchy", label: "Givenchy", logoUrl: "/brands/givenchy.png" },
  { slug: "Gucci", label: "Gucci", logoUrl: "/brands/gucci.png" },
  { slug: "Hermès", label: "Hermès", logoUrl: "/brands/hermes.png" },
  { slug: "H&M", label: "H&M", logoUrl: "/brands/hm.png" },
  { slug: "Jacquemus", label: "Jacquemus", logoUrl: "/brands/jacquemus.png" },
  { slug: "Loewe", label: "Loewe", logoUrl: "/brands/loewe.png" },
  { slug: "Louis Vuitton", label: "Louis Vuitton", logoUrl: "/brands/louis_vuitton.png" },
  { slug: "Lululemon", label: "Lululemon", logoUrl: "/brands/lululemon.png" },
  { slug: "Miu Miu", label: "Miu Miu", logoUrl: "/brands/miu_miu.png" },
  { slug: "Prada", label: "Prada", logoUrl: "/brands/prada.png" },
  { slug: "Saint Laurent", label: "Saint Laurent", logoUrl: "/brands/saint_laurent.png" },
  { slug: "Sephora", label: "Sephora", logoUrl: "/brands/sephora.png" },
  { slug: "Valentino", label: "Valentino", logoUrl: "/brands/valentino.png" },
  { slug: "Victoria's Secret", label: "Victoria's Secret", logoUrl: "/brands/victorias_secret.png" },
  { slug: "Zara", label: "Zara", logoUrl: "/brands/zara.png" },
]

const EXAMPLE_QUERIES = [
  "Vintage denim jacket",
  "White sneakers",
  "Linen summer dress",
  "Leather boots",
]

// ── Image fetch + crop helpers ──────────────────────────────────────
//
// Module-scoped so they're stable across renders and pure (no closure
// over component state). The crop helper uses createImageBitmap against
// a same-origin Blob fetched through the Supabase proxy, which sidesteps
// the canvas cross-origin taint that breaks `<img>`-based crop
// extraction on external CDN sources.
//
// Why fetchImageBlob + tryCropBlob instead of an `<img>` element:
//   1. Search-result URLs come from arbitrary hosts (gstatic.com,
//      retailer CDNs). Without `crossOrigin="anonymous"` we'd display
//      them fine BUT any canvas draw would taint and `canvas.toBlob`
//      throws SecurityError. With crossOrigin set, the browser REJECTS
//      the load entirely (the user saw a black-bg where the image
//      should be). createImageBitmap against the proxy-fetched Blob
//      is same-origin both upstream and downstream of the canvas, so
//      neither problem fires.
//   2. createImageBitmap decodes off the main-thread path → smaller
//      hitch than waiting for an `<img>` element to load + onload.
async function fetchImageBlob(url: string): Promise<Blob> {
  try {
    const proxyRes = await fetch(
      SEARCH_FN_ENDPOINT,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SEARCH_FN_KEY,
          Authorization: `Bearer ${SEARCH_FN_KEY}`,
        },
        body: JSON.stringify({ action: 'proxy-image', url }),
      },
    )
    if (!proxyRes.ok) {
      const errText = await proxyRes.text().catch(() => '')
      throw new Error(
        `Image proxy failed (${proxyRes.status}): ${errText.slice(0, 200)}`,
      )
    }
    return await proxyRes.blob()
  } catch (e: any) {
    if (e?.message?.includes('Image proxy failed')) {
      return await fetch(url).then((r) => r.blob())
    }
    throw e
  }
}

async function tryCropBlob(
  blob: Blob,
  crop: { sx: number; sy: number; sw: number; sh: number },
): Promise<Blob | null> {
  try {
    const bitmap = await createImageBitmap(blob)
    try {
      const canvas = document.createElement('canvas')
      canvas.width = crop.sw
      canvas.height = crop.sh
      const ctx = canvas.getContext('2d')
      if (!ctx) return null
      // Source rect (sx, sy, sw, sh) → destination rect (0, 0, sw, sh).
      ctx.drawImage(
        bitmap,
        crop.sx, crop.sy, crop.sw, crop.sh,
        0, 0, crop.sw, crop.sh,
      )
      return await new Promise<Blob | null>((res) =>
        canvas.toBlob((b) => res(b), 'image/png'),
      )
    } finally {
      bitmap.close()
    }
  } catch (e) {
    console.warn('[clipper] crop extraction failed:', e)
    return null
  }
}

interface ClipperProps {
  onSaved?: () => void
  /** Gender-aware demo items passed from the parent. */
  demoItems?: ClosetItem[]
  /** Called when a web-clipped item is successfully saved —
   *  parent should call its own useClosetData.insertItem so the
   *  wardrobe tab sees the new piece immediately. */
  onItemInserted?: (item: ClosetItem) => void
  /**
   * Called when the AI classify IIFE finishes a successful UPDATE on
   * the just-inserted row. Parent should call its own
   * useClosetData.updateItem so the local state patches in (the row
   * shifts from `category: 'pending'` to its real category and the
   * item re-slots in Shuffler / Canvas / the closet grid).
   *
   * Without this the AI fix would land in Supabase but local state
   * would keep showing the pending placeholder forever.
   */
  onItemUpdated?: (item: ClosetItem) => void
}

export function Clipper({ onSaved, demoItems = [], onItemInserted, onItemUpdated }: ClipperProps) {
  const [mode, setMode] = useState<Mode>("demo")
  const [query, setQuery] = useState("")
  const [brand, setBrand] = useState<string>("All")
  const [stage, setStage] = useState<Stage>("search")
  const [active, setActive] = useState<ClipperItem | null>(null)

  // ── Cropper state ──────────────────────────────────────────────────────
  // Square aspect (1:1). Persisted in pct of the displayed image rect.
  // Initial {xPct:0.15, yPct:0.15, sizePct:0.70} leaves a comfortable
  // margin so the user sees the dim-overlay immediately on entry.
  const [rotation, setRotation] = useState(0) // kept for backcompat with `reset()`
  const [crop, setCrop] = useState<CropRect>({
    xPct: 0.15,
    yPct: 0.15,
    sizePct: 0.7,
  })
  const [imgInfo, setImgInfo] = useState<
    { naturalW: number; naturalH: number } | null
  >(null)
  const [dragState, setDragState] = useState<
    | {
        mode: DragMode
        startScreenX: number
        startScreenY: number
        startCrop: CropRect
      }
    | null
  >(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const cropContainerRef = useRef<HTMLDivElement>(null)

  // ── Serper web search results ───────────────────────────────────────
  const [webResults, setWebResults] = useState<SerperResult[]>([])
  const [webLoading, setWebLoading] = useState(false)
  const [webError, setWebError] = useState<string | null>(null)
  const [webSearched, setWebSearched] = useState(false)

  // Multi-select batch state
  const [selectedResultIds, setSelectedResultIds] = useState<Set<string>>(new Set())
  const [batchItems, setBatchItems] = useState<QueueItem[]>([])
  const [batchStage, setBatchStage] = useState<"idle" | "processing" | "done">("idle")

  const autoSavedTimerRef = useRef<number | null>(null)
  const [extractError, setExtractError] = useState<string | null>(null)

  const clearAutoSavedTimer = useCallback(() => {
    if (autoSavedTimerRef.current !== null) {
      window.clearTimeout(autoSavedTimerRef.current)
      autoSavedTimerRef.current = null
    }
  }, [])

  // Background removal — server-side BiRefNet via the `process-bg`
  // Edge Function. The hook returns a storage path inside
  // `clipped-closet-items` where the transparent PNG lives; we
  // resolve it to a public URL at the call site.
  const removeBgMutation = useUnifiedBackgroundRemoval()

  // ── Demo wardrobe (gender-aware, from parent) ────────────────────────
  const allItems = useMemo<ClipperItem[]>(
    () =>
      demoItems.map((ci) => ({
        id: ci.id,
        name: ci.title,
        src: ci.source_image_url ?? "/placeholder.svg",
      })),
    [demoItems],
  )
  const demoResults = query.trim()
    ? allItems.filter((g) =>
        g.name.toLowerCase().includes(query.trim().toLowerCase()),
      )
    : allItems

  // ── Batch import handler ───────────────────────────────────────────
  const handleBatchImport = useCallback(async () => {
    if (selectedResultIds.size === 0) return

    const selected = webResults.filter((r) => selectedResultIds.has(r.id))
    const items: QueueItem[] = selected.map((r, i) => ({
      id: r.id,
      thumbnail: r.thumb_url || r.high_res_url,
      name: `${query.trim() || "Item"} ${i + 1}`,
      status: "waiting" as const,
    }))

    setBatchItems(items)
    setBatchStage("processing")
    setStage("processing")

    for (let i = 0; i < selected.length; i++) {
      const r = selected[i]

      setBatchItems((prev) =>
        prev.map((q) => (q.id === r.id ? { ...q, status: "bg-removal" as const } : q)),
      )

      try {
        await extractFromUrl(r.high_res_url, query.trim() || "Web item", { crop: null })
        setBatchItems((prev) =>
          prev.map((q) => (q.id === r.id ? { ...q, status: "done" as const } : q)),
        )
      } catch (e: any) {
        console.error(`[batch] Failed ${r.id}:`, e)
        setBatchItems((prev) =>
          prev.map((q) =>
            q.id === r.id ? { ...q, status: "error" as const, error: e?.message ?? "Failed" } : q,
          ),
        )
      }
    }

    setBatchStage("done")
    setSelectedResultIds(new Set())
  }, [selectedResultIds, webResults, query, extractFromUrl])

  // ── Serper web search (calls search-clothes Supabase Edge Function) ─
  const webSearchLock = useRef(false)
  const handleWebSearch = useCallback(async () => {
    const q = query.trim()
    if (!q || webSearchLock.current) return
    webSearchLock.current = true
    setWebLoading(true)
    setWebError(null)
    setWebSearched(true)
    setWebResults([])
    try {
      const { data, error } = await supabase.functions.invoke("search-clothes", {
        body: { q, brand: brand === "All" ? undefined : brand, num: 30 },
      })
      if (error) throw error
      const results: SerperResult[] = Array.isArray(data?.results)
        ? data.results
        : []
      setWebResults(results)
      if (results.length === 0) {
        setWebError("No results found — try a different search.")
      }
    } catch (e: any) {
      console.error("Web search failed:", e)
      setWebError(e?.message ?? "Search failed — try again.")
    } finally {
      setWebLoading(false)
      webSearchLock.current = false
    }
  }, [query, brand])

  // Re-search when brand changes (if web mode is active and we've already
  // searched at least once).
  useEffect(() => {
    if (mode === "web" && webSearched && query.trim()) {
      handleWebSearch()
    }
  }, [brand, handleWebSearch, mode, webSearched, query])

  // ── Toggle multi-selection on web results ──────────────────────────
  const toggleResultSelection = useCallback((resultId: string) => {
    setSelectedResultIds((prev) => {
      const next = new Set(prev)
      if (next.has(resultId)) next.delete(resultId)
      else next.add(resultId)
      return next
    })
  }, [])

  // ── Web result tap → single item crop ────────────────────────────────
  const handleWebResultTap = useCallback(
    (result: SerperResult) => {
      haptic("medium")
      const imageUrl = result.high_res_url
      const itemName = query.trim() || "Web item"
      setActive({
        id: result.id,
        name: itemName,
        src: imageUrl,
        origin: "web",
      })
      setExtractError(null)
      setCrop({ xPct: 0, yPct: 0, sizePct: 1 })
      setImgInfo(null)
      setStage("crop")
    },
    [query],
  )

  // Clear any pending auto-redirect on unmount
  useEffect(() => {
    return () => clearAutoSavedTimer()
  }, [clearAutoSavedTimer])

  // ── Stage-machine actions ────────────────────────────────────────────
  const reset = () => {
    clearAutoSavedTimer()
    setActive(null)
    setRotation(0)
    setExtractError(null)
    setCrop({ xPct: 0, yPct: 0, sizePct: 1 })
    setImgInfo(null)
    setDragState(null)
    setSelectedResultIds(new Set())
    setBatchItems([])
    setBatchStage("idle")
    setStage("search")
  }

  const openCropper = (g: ClipperItem) => {
    haptic("medium")
    setActive({ ...g, origin: "demo" })
    setRotation(0)
    setCrop({ xPct: 0, yPct: 0, sizePct: 1 })
    setImgInfo(null)
    setStage("crop")
  }

  /**
   * Run the bg-removal + upload pipeline.
   *
   * `cropCoords` is the source-pixel rect the user selected in the
   * crop stage, or null for the Skip-crop path (full image). extractFromUrl
   * internally proxy-fetches the source, applies the crop via
   * createImageBitmap (same-origin, no taint), runs bg-removal, uploads,
   * and inserts the row.
   *
   * For demo-origin items we keep the pre-existing stub behaviour so we
   * don't accidentally re-upload a wardrobe item the user already owns
   * (which would create a duplicate row in trendza_closet_items).
   */
  const runPipeline = useCallback(
    async (
      imageUrl: string,
      itemName: string,
      cropCoords: { sx: number; sy: number; sw: number; sh: number } | null,
    ) => {
      setStage("processing")
      setExtractError(null)
      try {
        const finalUrl = await extractFromUrl(imageUrl, itemName, {
          crop: cropCoords,
        })
        setActive((prev) => (prev ? { ...prev, src: finalUrl } : prev))
        setStage("done")
        if (onSaved) {
          clearAutoSavedTimer()
          autoSavedTimerRef.current = window.setTimeout(onSaved, 1800)
        }
      } catch (e: any) {
        console.error("[clipper] web extraction failed:", e)
        setExtractError(e?.message ?? "Could not extract that item")
        setStage("error")
      }
    },
    [onSaved, clearAutoSavedTimer],
  )

  // Demo-mode stub for the confirm/skip paths. Run a fake processing
  // delay so the animation still plays; nothing is uploaded.
  const runDemoStub = useCallback(() => {
    setStage("processing")
    window.setTimeout(() => {
      setStage("done")
      if (onSaved) {
        clearAutoSavedTimer()
        autoSavedTimerRef.current = window.setTimeout(onSaved, 1500)
      }
    }, 1200)
  }, [onSaved, clearAutoSavedTimer])

  // ── Cropper pointer handlers ────────────────────────────────────────
  const MIN_CROP_SIZE = 0.25

  const clampCrop = useCallback(
    (next: CropRect): CropRect => {
      const size = Math.max(MIN_CROP_SIZE, Math.min(1, next.sizePct))
      const x = Math.max(0, Math.min(1 - size, next.xPct))
      const y = Math.max(0, Math.min(1 - size, next.yPct))
      return { xPct: x, yPct: y, sizePct: size }
    },
    [],
  )

  const handleCropPointerDown = useCallback(
    (mode: DragMode, e: React.PointerEvent) => {
      // Critical for iOS Capacitor: stop the WebView from interpreting
      // the drag as a scroll, and stop the browser from launching the
      // native image drag-and-drop (which blanks the source briefly).
      e.preventDefault()
      e.stopPropagation()
      const target = e.currentTarget as HTMLElement
      try {
        target.setPointerCapture(e.pointerId)
      } catch {
        /* pointer capture can fail if the pointer was already released */
      }
      setDragState({
        mode,
        startScreenX: e.clientX,
        startScreenY: e.clientY,
        startCrop: crop,
      })
    },
    [crop],
  )

  // Re-runs whenever dragState becomes truthy. Attaches the
  // move/up listeners to window so dragging stays smooth even if the
  // cursor exits the crop container. Cleanup detaches on every state
  // change, but the listeners themselves are tiny and the effect only
  // fires on dragState toggles (not on every pointermove), so the perf
  // cost is negligible.
  useEffect(() => {
    if (!dragState) return
    const startCropBox = dragState.startCrop

    const handleMove = (e: PointerEvent) => {
      const box = cropContainerRef.current?.getBoundingClientRect()
      if (!box) return
      const dx = (e.clientX - dragState.startScreenX) / box.width
      const dy = (e.clientY - dragState.startScreenY) / box.height

      setCrop((prev) => {
        if (dragState.mode === "move") {
          return clampCrop({
            xPct: startCropBox.xPct + dx,
            yPct: startCropBox.yPct + dy,
            sizePct: startCropBox.sizePct,
          })
        }

        // Resize math. `sizeDelta` is the largest of dx/dy so the
        // square stays square as the user drags any corner.
        let sizeDelta = Math.max(dx, dy)
        let anchorX = startCropBox.xPct
        let anchorY = startCropBox.yPct
        const m = dragState.mode
        if (m === "resize-tl") {
          sizeDelta = Math.max(-dx, -dy)
        } else if (m === "resize-tr") {
          sizeDelta = Math.max(dx, -dy)
        } else if (m === "resize-bl") {
          sizeDelta = Math.max(-dx, dy)
        } else if (m === "resize-br") {
          sizeDelta = Math.max(dx, dy)
        }
        const newSize = Math.max(
          MIN_CROP_SIZE,
          Math.min(1, startCropBox.sizePct + sizeDelta),
        )
        // Re-anchor so the corner opposite to the dragged edge stays put.
        if (m === "resize-tl") {
          anchorX = startCropBox.xPct - (newSize - startCropBox.sizePct)
          anchorY = startCropBox.yPct - (newSize - startCropBox.sizePct)
        } else if (m === "resize-tr") {
          anchorX = startCropBox.xPct
          anchorY = startCropBox.yPct - (newSize - startCropBox.sizePct)
        } else if (m === "resize-bl") {
          anchorX = startCropBox.xPct - (newSize - startCropBox.sizePct)
          anchorY = startCropBox.yPct
        } else {
          anchorX = startCropBox.xPct
          anchorY = startCropBox.yPct
        }
        return clampCrop({
          xPct: anchorX,
          yPct: anchorY,
          sizePct: newSize,
        })
      })
    }

    const handleUp = () => setDragState(null)

    window.addEventListener("pointermove", handleMove)
    window.addEventListener("pointerup", handleUp)
    window.addEventListener("pointercancel", handleUp)
    return () => {
      window.removeEventListener("pointermove", handleMove)
      window.removeEventListener("pointerup", handleUp)
      window.removeEventListener("pointercancel", handleUp)
    }
  }, [dragState, clampCrop])

  /**
   * "Use this" — convert the user's crop selection to source pixels
   * and hand off to runPipeline. Demo items keep the stub behaviour
   * so we don't accidentally re-upload an existing wardrobe item.
   */
  const applyCrop = useCallback(async () => {
    haptic("medium")
    if (!active) return
    if (active.origin === "demo") {
      runDemoStub()
      return
    }
    if (!imgInfo) {
      // Image hasn't reported natural size yet — degrade gracefully
      // to the no-crop path rather than blocking the user.
      await runPipeline(active.src, active.name, null)
      return
    }
    const { naturalW, naturalH } = imgInfo
    const { xPct, yPct, sizePct } = crop
    const sx = Math.max(0, Math.round(xPct * naturalW))
    const sy = Math.max(0, Math.round(yPct * naturalH))
    const sw = Math.max(16, Math.round(sizePct * naturalW))
    const sh = Math.max(16, Math.round(sizePct * naturalH))
    await runPipeline(active.src, active.name, { sx, sy, sw, sh })
  }, [active, imgInfo, crop, runPipeline, runDemoStub])

  /**
   * "Skip crop" — bg-remove the original full image. Demo items keep
   * the stub behaviour.
   */
  const skipCrop = useCallback(async () => {
    haptic("light")
    if (!active) return
    if (active.origin === "demo") {
      runDemoStub()
      return
    }
    await runPipeline(active.src, active.name, null)
  }, [active, runPipeline, runDemoStub])

  // ── Web extract pipeline ─────────────────────────────────────────────
  async function extractFromUrl(
    url: string,
    searchQuery: string,
    opts: {
      /**
       * Optional source-pixel crop. When provided, the proxied image
       * is decoded → cropped via createImageBitmap on a same-origin
       * Blob → bg-removal runs on JUST the cropped region. Sent as
       * source pixels (not %) so the pipeline never re-derives them.
       */
      crop?: { sx: number; sy: number; sw: number; sh: number } | null
    } = {},
  ): Promise<string> {
    // ── Hop 1: Always proxy-fetch (same-origin Blob, imagebitmap-safe). ──
    const fetchedBlob = await fetchImageBlob(url)
    if (fetchedBlob.size < 1000) {
      throw new Error('Fetched image invalid — proxy returned empty/tiny blob')
    }

    // ── Hop 1.5: Apply user crop (skip if null = Skip Crop path). ──────
    //   createImageBitmap on a same-origin Blob yields a same-origin
    //   ImageBitmap, so canvas.drawImage + canvas.toBlob don't throw
    //   SecurityError. This is the fix for the previous bug where the
    //   <img crossOrigin="anonymous"> + canvas path silently fell
    //   through to "use full image" — see git log on tryCropBlob.
    let rawBlob: Blob = fetchedBlob
    if (opts.crop) {
      const cropped = await tryCropBlob(fetchedBlob, opts.crop)
      if (cropped && cropped.size >= 16) {
        console.log(
          '[clipper] applied crop:',
          cropped.size,
          'bytes from',
          opts.crop.sw,
          'x',
          opts.crop.sh,
        )
        rawBlob = cropped
      } else {
        console.warn('[clipper] crop extraction failed — using full image')
      }
    }

    // ── Hop 2: Background removal (server-side BiRefNet) ─────────────────
    // Upload the raw image to `raw-closet-items`; the `process-bg`
    // Edge Function strips the background with BiRefNet and writes
    // the transparent PNG into `clipped-closet-items`. We resolve
    // that clean path to a public URL for the closet row.
    let processedImageUrl: string | null = null
    try {
      const cleanPath = await removeBgMutation.mutateAsync({
        imageBlob: rawBlob,
        originalName: 'web_clip.png',
      })
      const { data: pubData } = supabase.storage
        .from('clipped-closet-items')
        .getPublicUrl(cleanPath)
      processedImageUrl = pubData.publicUrl
      console.log('[clipper] post-bg-removal url:', processedImageUrl)
    } catch (e) {
      console.error('[clipper] bg-removal failed:', e)
      throw new Error('Background removal failed — try a different image.')
    }

    // ── Hop 3: BlurHash the raw image + verify auth user ─────────────────
    // The clean PNG already lives at `processedImageUrl`. The raw
    // image is visually close enough at 32×32 placeholder size
    // that hashing it client-side saves a re-download round-trip
    // for the same UX.
    let blurHash: string | null = null
    try {
      blurHash = await encodeBlurHashFromImageSource(rawBlob)
    } catch {
      blurHash = null
    }

    const { data: auth } = await supabase.auth.getUser()
    if (!auth?.user) throw new Error("Not signed in")

    // ── Hop 4: Insert row (ONLY after confirmed upload) ─────────────────
    const seedTags = ["web-clipper"]
    const initialAttributes: Record<string, unknown> = {
      source_url: url,
      source_query: searchQuery,
      source_type: "web_search",
    }
    if (blurHash) initialAttributes.blur_hash = blurHash

    // Insert with category = "pending" rather than a lying default.
    // Shuffler / Canvas slot filters naturally exclude pending items,
    // and the closet grid renders them under a "still analyzing"
    // badge — see ClosetView's PendingSection. They become real items
    // once the AI classify IIFE below UPDATEs the row.
    const { data: row, error: insertErr } = await supabase
      .from("trendza_closet_items")
      .insert({
        user_id: auth.user.id,
        title: searchQuery || "Clipped Item",
        category: "pending",
        color: "unknown",
        tags: seedTags,
        attributes: initialAttributes,
        source_image_url: processedImageUrl!,
      })
      .select(
        "id, title, brand, category, color, season, tags, attributes, source_image_url, created_at",
      )
      .single()
    if (insertErr || !row) throw insertErr ?? new Error("Insert failed")

    const insertedRowId = row.id
    if (onItemInserted) onItemInserted(row as ClosetItem)

    // Fire-and-forget AI classify
    void (async () => {
      try {
        // AI classify using public URL (much faster than sending full base64)
        const { data: aiData } = await Promise.race([
          supabase.functions.invoke("analyze-closet-item", {
            body: { image: processedImageUrl! },
          }),
          new Promise<never>((_, reject) =>
            setTimeout(
              () => reject(new Error("AI classify timeout (20s)")),
              20_000,
            ),
          ),
        ])
        const aiPayload = (aiData as any)?.result ?? aiData

        // Handle Gemini quota exhaustion gracefully — don't overwrite
        // the pending category, the item stays usable but uncategorized.
        if (aiPayload?.error === 'rate_limited') {
          console.warn("AI classify rate-limited (Gemini daily quota), item left as pending")
          toast({
            title: "Still organizing",
            description: "We'll finish classifying this item shortly. It's already in your closet.",
            duration: 4000,
          })
          return
        }

        // If the function returned a cropped version of the image, update
        // source_image_url to point at the cropped (garment-only) version.
        const croppedUrl = aiPayload?.croppedImageUrl as string | undefined

        if (aiPayload && (aiPayload.title || aiPayload.category)) {
          const incomingTags: string[] = Array.isArray(aiPayload.tags)
            ? aiPayload.tags
            : []
          const mergedTags = Array.from(
            new Set([
              ...seedTags,
              ...incomingTags.filter((t) => t !== "web-clipper"),
            ]),
          )
          // `?? "pending"` (was `"tops"`) — if the AI returns without a
          // category, leaving the row pending is more honest than
          // silently faking a top. Items can be reclassified manually
          // from the closet detail modal.
          await supabase
            .from("trendza_closet_items")
            .update({
              ...(croppedUrl ? { source_image_url: croppedUrl } : {}),
              title: aiPayload.title ?? "Untitled",
              category: aiPayload.category ?? "pending",
              color: aiPayload.color ?? "unknown",
              season: aiPayload.season ?? null,
              tags: mergedTags,
              attributes: {
                ...initialAttributes,
                ...(aiPayload.attributes ?? {}),
              },
              brand: aiPayload.brand ?? "",
            })
            .eq("id", insertedRowId)
          // Refresh local state with the just-mutated row so the user
          // sees the category slot flip immediately on this tab. We
          // re-SELECT (cheap, indexed by id) rather than patching the
          // single fields client-side so blur_hash lifts go through the
          // same normalizer pipeline the initial load uses.
          const { data: refreshed } = await supabase
            .from("trendza_closet_items")
            .select(
              "id, title, brand, category, color, season, tags, attributes, source_image_url, created_at",
            )
            .eq("id", insertedRowId)
            .single()
          if (refreshed && onItemUpdated) onItemUpdated(refreshed as ClosetItem)
        }
      } catch (e: any) {
        console.warn("AI classify failed (non-fatal):", e?.message ?? e)
      }
    })()

    return processedImageUrl!
  }

  const isDemoMode = mode === "demo"

  return (
    <div className="flex h-full flex-col">
      <header className="px-5 pb-3 pt-2">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Web Clipper
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Find an Item
        </h1>
      </header>

      {/* Mode toggle */}
      <div className="px-5 pb-3">
        <div className="inline-flex p-1 rounded-full bg-muted/50">
          <button
            type="button"
            onClick={() => {
              haptic("light")
              setMode("demo")
              setQuery("")
            }}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
              isDemoMode
                ? "bg-card text-foreground soft-shadow"
                : "text-muted-foreground",
            )}
          >
            My wardrobe
          </button>
          <button
            type="button"
            onClick={() => {
              haptic("light")
              setMode("web")
              setQuery("")
            }}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1",
              !isDemoMode
                ? "bg-card text-foreground soft-shadow"
                : "text-muted-foreground",
            )}
          >
            <Globe className="h-3 w-3" />
            Search web
          </button>
        </div>
      </div>

      {/* Search bar — both modes */}
      <div className="px-5 pb-2">
        <div className="flex items-center gap-2 rounded-full bg-card px-4 py-3 soft-shadow">
          <Search className="h-5 w-5 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              if (mode === "web") setWebSearched(false)
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && mode === "web" && query.trim()) {
                haptic("light")
                handleWebSearch()
              }
            }}
            placeholder={
              isDemoMode
                ? "Search stores for jackets, jeans…"
                : 'Try "leather jacket", "linen pants"…'
            }
            className="flex-1 bg-transparent text-[15px] text-foreground outline-none placeholder:text-muted-foreground"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("")
                setWebSearched(false)
              }}
              aria-label="Clear search"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
          {/* Search button — web mode only */}
          {!isDemoMode && query.trim() && (
            <button
              type="button"
              onClick={() => {
                haptic("light")
                handleWebSearch()
              }}
              disabled={webLoading}
              className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Batch import button — shows when items are selected */}
      {!isDemoMode && selectedResultIds.size > 0 && (
        <div className="px-5 pb-3">
          <button
            type="button"
            onClick={() => {
              haptic("medium")
              handleBatchImport()
            }}
            className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground flex items-center justify-center gap-2 hover:bg-primary/90 transition-all active:scale-[0.98]"
          >
            <Layers className="h-4 w-4" />
            Import Selected ({selectedResultIds.size})
          </button>
        </div>
      )}

      {/* Brand filter chips — web mode only */}
      {!isDemoMode && (
        <div className="no-scrollbar flex gap-2 overflow-x-scroll px-5 pb-4">
          {BRANDS.map((b) => {
            const active = brand === b.slug
            const showLogo = b.logoUrl && b.slug !== "All"
            return (
              <button
                key={b.slug}
                type="button"
                onClick={() => {
                  haptic("light")
                  setBrand(b.slug)
                }}
                className={cn(
                  "flex-none rounded-full px-3 py-2 transition-all flex items-center gap-1.5",
                  active
                    ? "bg-foreground text-background shadow-md"
                    : "bg-card text-muted-foreground soft-shadow hover:bg-muted/50",
                )}
              >
                {showLogo && (
                  <img
                    src={b.logoUrl}
                    alt={b.label}
                    className={cn(
                      "h-5 max-w-[120px] w-auto object-contain transition-[filter]",
                      active ? "invert" : "opacity-60",
                    )}
                  />
                )}
                {!showLogo && (
                  <span className="text-xs font-semibold tracking-wide">
                    {b.label}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Results */}
      <div className="no-scrollbar flex-1 overflow-y-scroll px-5 pb-4">
        {isDemoMode ? (
          demoResults.length === 0 ? (
            <p className="pt-16 text-center text-sm text-muted-foreground">
              {"No matches. Try \"jeans\" or \"boots\"."}
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {demoResults.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => openCropper(g)}
                  className="flex flex-col overflow-hidden rounded-2xl bg-card soft-shadow"
                >
                  <div className="relative aspect-square w-full">
                    <Image
                      src={g.src || "/placeholder.svg"}
                      alt={g.name}
                      fill
                      sizes="180px"
                      className="object-contain p-3"
                    />
                  </div>
                  <span className="px-3 pb-3 pt-1 text-left text-[13px] font-medium text-foreground">
                    {g.name}
                  </span>
                </button>
              ))}
            </div>
          )
        ) : webLoading ? (
          /* Web search loading */
          <div className="flex flex-1 flex-col items-center justify-center pt-16 gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Searching the web…
            </p>
          </div>
        ) : !webSearched ? (
          /* Web mode — before first search */
          <div className="flex flex-1 flex-col items-center pt-12">
            <p className="text-sm font-medium text-muted-foreground mb-3">
              Try a search
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {EXAMPLE_QUERIES.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => {
                    haptic("light")
                    setQuery(q)
                  }}
                  className="px-3 py-2 rounded-full bg-card text-sm font-medium text-foreground soft-shadow hover:bg-muted/50 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-6 leading-relaxed text-center max-w-xs">
              Search for clothing items from across the web. Tap any result to
              import it into your wardrobe with the background automatically
              removed.
            </p>
          </div>
        ) : webError && webResults.length === 0 ? (
          /* Web search error — no results at all */
          <div className="flex flex-1 flex-col items-center pt-16 gap-4">
            <AlertCircle className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground text-center max-w-xs">
              {webError}
            </p>
            <button
              type="button"
              onClick={() => handleWebSearch()}
              className="rounded-full bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground"
            >
              Try Again
            </button>
          </div>
        ) : webResults.length === 0 ? (
          /* Empty results from API */
          <div className="flex flex-1 flex-col items-center pt-16 gap-4">
            <p className="text-sm text-muted-foreground text-center max-w-xs">
              No results found for{" "}
              <span className="font-semibold text-foreground">
                "{query}"
              </span>
              . Try a different search.
            </p>
          </div>
        ) : (
          /* Web search results grid with checkbox multi-select */
          <div className="grid grid-cols-2 gap-3">
            {webResults.map((r) => {
              const isSelected = selectedResultIds.has(r.id)
              return (
                <div
                  key={r.id}
                  className={cn(
                    "relative flex flex-col overflow-hidden rounded-2xl bg-card soft-shadow transition-all",
                    isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                  )}
                >
                  {/* Clickable image — opens crop screen */}
                  <button
                    type="button"
                    onClick={() => handleWebResultTap(r)}
                    className="relative aspect-square w-full bg-muted/30"
                  >
                    <Image
                      src={r.thumb_url || r.high_res_url || "/placeholder.svg"}
                      alt="Search result"
                      fill
                      sizes="180px"
                      className="object-cover"
                    />
                  </button>
                  {/* Selection checkbox button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleResultSelection(r.id)
                    }}
                    className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm hover:bg-black/50 transition-colors"
                    aria-label={isSelected ? "Deselect" : "Select for batch import"}
                  >
                    {isSelected ? (
                      <CheckSquare className="h-4 w-4 text-primary" />
                    ) : (
                      <Square className="h-4 w-4 text-white" />
                    )}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Stage-machine overlay — AnimatePresence crossfades each stage */}
      <AnimatePresence mode="wait" initial={false}>
        {/* ── CROP ─────────── drag-to-crop real cropper UI ────────── */}
        {stage === "crop" && active && (
          <motion.div
            key="crop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-0 z-50 flex flex-col bg-black"
            style={{ touchAction: "none" }}
          >
            <div className="relative z-20 flex items-center justify-between px-4 pb-2 pt-4">
              <button
                type="button"
                onClick={reset}
                aria-label="Back"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-2">
                <Crop className="h-4 w-4 text-white/80" />
                <span className="text-sm font-medium text-white">
                  Crop your item
                </span>
              </div>
              <button
                type="button"
                onClick={applyCrop}
                aria-label="Apply crop"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-black"
              >
                <Check className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-1 items-center justify-center overflow-hidden p-6">
              <div
                ref={cropContainerRef}
                className="relative max-h-full max-w-full"
                style={{
                  aspectRatio: imgInfo
                    ? `${imgInfo.naturalW} / ${imgInfo.naturalH}`
                    : "1 / 1",
                  touchAction: "none",
                  userSelect: "none",
                }}
              >
                <img
                  ref={imgRef}
                  src={active.src}
                  alt={active.name}
                  draggable={false}
                  onLoad={() => {
                    if (imgRef.current) {
                      setImgInfo({
                        naturalW: imgRef.current.naturalWidth,
                        naturalH: imgRef.current.naturalHeight,
                      })
                    }
                  }}
                  // Note: no `crossOrigin="anonymous"` here. Search-result
                  // images come from arbitrary hosts (gstatic.com, retailer
                  // CDNs, etc.) that don't return CORS headers — setting
                  // crossOrigin would make the browser REJECT the load
                  // entirely and the user would see a blank black box
                  // instead of the image. Without crossOrigin the image
                  // loads fine and a downstream `canvas.drawImage` may
                  // taint the canvas, but `extractCroppedBlob`'s
                  // try/catch already handles that by returning null
                  // so `confirmCrop(null)` falls back to bg-removal
                  // on the original.
                  className="block h-full w-full select-none"
                />

                {/* Dim everything outside the crop region — 4 inset
                    rectangles around the selected square. pointer-events
                    none so the cropper underneath stays draggable. */}
                <div
                  className="pointer-events-none absolute inset-0"
                  aria-hidden="true"
                >
                  <div
                    className="absolute left-0 right-0 top-0 bg-black/65"
                    style={{ height: `${crop.yPct * 100}%` }}
                  />
                  <div
                    className="absolute left-0 bg-black/65"
                    style={{
                      top: `${crop.yPct * 100}%`,
                      height: `${crop.sizePct * 100}%`,
                      width: `${crop.xPct * 100}%`,
                    }}
                  />
                  <div
                    className="absolute right-0 bg-black/65"
                    style={{
                      top: `${crop.yPct * 100}%`,
                      height: `${crop.sizePct * 100}%`,
                      left: `${(crop.xPct + crop.sizePct) * 100}%`,
                    }}
                  />
                  <div
                    className="absolute left-0 right-0 bottom-0 bg-black/65"
                    style={{ top: `${(crop.yPct + crop.sizePct) * 100}%` }}
                  />
                </div>

                {/* Crop selection border + 4 corner resize handles.
                    touchAction:none + setPointerCapture are critical on
                    iOS Capacitor (the WebView would otherwise scroll /
                    trigger native image drag-and-drop). */}
                <div
                  onPointerDown={(e) => handleCropPointerDown("move", e)}
                  className="absolute border-2 border-white"
                  style={{
                    left: `${crop.xPct * 100}%`,
                    top: `${crop.yPct * 100}%`,
                    width: `${crop.sizePct * 100}%`,
                    height: `${crop.sizePct * 100}%`,
                    touchAction: "none",
                    cursor: "move",
                  }}
                >
                  {/* Rule-of-thirds grid hint */}
                  <div
                    className="pointer-events-none absolute inset-0"
                    aria-hidden="true"
                  >
                    <div className="absolute top-1/3 left-0 right-0 h-px bg-white/30" />
                    <div className="absolute top-2/3 left-0 right-0 h-px bg-white/30" />
                    <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/30" />
                    <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/30" />
                  </div>

                  <div
                    onPointerDown={(e) =>
                      handleCropPointerDown("resize-tl", e)
                    }
                    className="absolute -left-1.5 -top-1.5 h-5 w-5 cursor-nw-resize"
                    style={{
                      borderLeft: "2px solid white",
                      borderTop: "2px solid white",
                    }}
                  />
                  <div
                    onPointerDown={(e) =>
                      handleCropPointerDown("resize-tr", e)
                    }
                    className="absolute -right-1.5 -top-1.5 h-5 w-5 cursor-ne-resize"
                    style={{
                      borderRight: "2px solid white",
                      borderTop: "2px solid white",
                    }}
                  />
                  <div
                    onPointerDown={(e) =>
                      handleCropPointerDown("resize-bl", e)
                    }
                    className="absolute -bottom-1.5 -left-1.5 h-5 w-5 cursor-sw-resize"
                    style={{
                      borderLeft: "2px solid white",
                      borderBottom: "2px solid white",
                    }}
                  />
                  <div
                    onPointerDown={(e) =>
                      handleCropPointerDown("resize-br", e)
                    }
                    className="absolute -bottom-1.5 -right-1.5 h-5 w-5 cursor-se-resize"
                    style={{
                      borderRight: "2px solid white",
                      borderBottom: "2px solid white",
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 px-6 pb-8 pt-3">
              <button
                type="button"
                onClick={skipCrop}
                className="text-sm font-medium text-white/70 hover:text-white transition-colors"
              >
                Skip crop
              </button>
              <p className="text-[10px] text-white/40 tracking-widest uppercase">
                Drag to move · corners to resize
              </p>
              <button
                type="button"
                onClick={applyCrop}
                className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-white/90 transition-colors"
              >
                Use this
              </button>
            </div>
          </motion.div>
        )}

        {/* ── PROCESSING ──── batch queue OR single-item spinner ── */}
        {stage === "processing" && (
          <motion.div
            key="processing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="absolute inset-0 z-50 flex flex-col bg-white"
          >
            {batchItems.length > 0 ? (
              /* Batch processing queue */
              <div className="flex flex-1 flex-col p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4">Importing Items</h2>
                <div className="flex-1 overflow-y-auto">
                  <BatchQueue
                    items={batchItems}
                    onRemoveItem={(id) => {
                      setBatchItems((prev) => prev.filter((q) => q.id !== id))
                    }}
                  />
                </div>
                {batchStage === "done" && (
                  <button
                    type="button"
                    onClick={() => {
                      reset()
                      setStage("search")
                    }}
                    className="mt-4 w-full rounded-full bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground"
                  >
                    Done
                  </button>
                )}
              </div>
            ) : active ? (
              /* Single-item processing spinner */
              <div className="flex flex-1 flex-col items-center justify-center gap-5 px-10 text-center">
                <div className="relative h-40 w-40">
                  <motion.div
                    aria-hidden="true"
                    className="absolute -inset-3 rounded-full border-2 border-primary"
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 2.4,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    style={{
                      borderTopColor: "transparent",
                      borderRightColor: "transparent",
                    }}
                  />
                  <Image
                    src={active.src || "/placeholder.svg"}
                    alt={active.name}
                    fill
                    sizes="160px"
                    className="object-contain"
                  />
                </div>
                <div className="flex items-center gap-2 text-foreground">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1.6,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  >
                    <Sparkles className="h-5 w-5 text-primary" />
                  </motion.div>
                  <span className="text-[15px] font-medium">
                    {active.origin === "demo"
                      ? "Removing background…"
                      : "Extracting item…"}
                  </span>
                </div>
                <div className="h-1 w-40 overflow-hidden rounded-full bg-black/10">
                  <motion.div
                    className="h-full rounded-full bg-primary"
                    animate={{ x: ["-100%", "200%"] }}
                    transition={{
                      duration: 1.4,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    style={{ width: "50%" }}
                  />
                </div>
              </div>
            ) : null}
          </motion.div>
        )}

        {/* ── DONE ─────────── scale-in tile + spring checkmark + staggered CTA */}
        {stage === "done" && active && (
          <motion.div
            key="done"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.24 }}
            className="absolute inset-0 z-50 flex flex-col bg-white overflow-hidden"
          >
            {/* Soft radial pulse — visualises "your item landed here" */}
            <motion.div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              style={{
                background:
                  "radial-gradient(circle at 50% 40%, hsl(var(--primary) / 0.18) 0%, transparent 60%)",
              }}
            />
            <div className="relative flex flex-1 flex-col items-center justify-center gap-6 px-10 text-center">
              <motion.div
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 280,
                  damping: 22,
                }}
                className="relative h-52 w-52 rounded-3xl bg-card soft-shadow"
              >
                <Image
                  src={active.src || "/placeholder.svg"}
                  alt={active.name}
                  fill
                  sizes="208px"
                  className="object-contain p-4"
                />
                <motion.span
                  initial={{ y: -24, scale: 0 }}
                  animate={{ y: 0, scale: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 380,
                    damping: 18,
                    delay: 0.18,
                  }}
                  className="absolute -right-2 -top-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground ring-4 ring-white"
                >
                  <Check className="h-5 w-5" strokeWidth={3} />
                </motion.span>
              </motion.div>

              <motion.div
                initial={{ y: 12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.32, delay: 0.32 }}
              >
                <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                  Added to Wardrobe
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {active.name} is ready to style.
                </p>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.32, delay: 0.5 }}
                className="text-xs text-muted-foreground/70"
              >
                Taking you to your wardrobe…
              </motion.p>

              <motion.button
                type="button"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                whileTap={{ scale: 0.96 }}
                transition={{
                  type: "spring",
                  stiffness: 280,
                  damping: 24,
                  delay: 0.6,
                }}
                onClick={() => {
                  clearAutoSavedTimer()
                  if (onSaved) onSaved()
                  else reset()
                }}
                className="rounded-full bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground"
              >
                View in Wardrobe
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* ── ERROR ─────────── gentle scale-in ──────────────────── */}
        {stage === "error" && active && (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="absolute inset-0 z-50 flex flex-col bg-white"
          >
            <div className="flex flex-1 flex-col items-center justify-center gap-6 px-10 text-center">
              <AlertCircle className="h-12 w-12 text-foreground/80" />
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  Couldn&apos;t add that item
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {extractError ?? "Try a different image."}
                </p>
              </div>
              <button
                type="button"
                onClick={reset}
                className="rounded-full bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground"
              >
                Back to Search
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes loading {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(200%);
          }
        }
      `}</style>
    </div>
  )
}