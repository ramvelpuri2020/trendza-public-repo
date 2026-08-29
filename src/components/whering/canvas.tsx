"use client"

import { useCallback, useMemo, useRef, useState } from "react"
import Image from "next/image"
import { useDrag } from "@use-gesture/react"
import {
  ChevronUp,
  ChevronDown,
  RotateCw,
  Plus,
  Minus,
  Trash2,
  Bookmark,
  Check,
  Lock,
  Unlock,
  Grid3X3,
  AlignCenter,
} from "lucide-react"
import { haptic } from "@/lib/haptics"
import { cn } from "@/lib/utils"
import { NamePrompt } from "@/components/whering/NamePrompt"
import { getOutfitDimensions } from "@/lib/outfit-standards"
import type { ClosetItem, SavedOutfit } from "@/hooks/useClosetData"

// ─── Types ───

type CanvasItem = {
  uid: string
  src: string
  name: string
  x: number
  y: number
  scale: number
  rotation: number
  z: number
  locked: boolean
  closetItem: ClosetItem
}

type CanvasMode = "free" | "flatlay"

/** Generate a globally unique ID that survives HMR resets (no more duplicate keys). */
function nextUid() { return `c-${crypto.randomUUID().slice(0, 8)}` }

// ─── Flat Lay auto-positioning ───

/** The Y anchor for each category zone in flatlay mode (centered on canvas). */
const FLATLAY_ZONES: Record<string, number> = {
  headwear: -160,
  tops: -70,
  outerwear: -80,
  bottoms: 90,
  shoes: 220,
  dresses: -30,
  accessories: -180,
  bags: 100,
}

function flatlayPosition(category: string): { x: number; y: number } {
  const y = FLATLAY_ZONES[category] ?? 0
  return { x: 0, y }
}

// ─── Draggable Canvas Item ───

function DraggableItem({
  item,
  selected,
  onSelect,
  onCommit,
}: {
  item: CanvasItem
  selected: boolean
  onSelect: (uid: string) => void
  onCommit: (uid: string, x: number, y: number) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const pos = useRef({ x: item.x, y: item.y })

  const apply = useCallback(() => {
    if (ref.current) {
      ref.current.style.transform = `translate3d(${pos.current.x}px, ${pos.current.y}px, 0) scale(${item.scale}) rotate(${item.rotation}deg)`
    }
  }, [item.scale, item.rotation])

  if (ref.current) apply()

  const bind = useDrag(
    ({ first, last, offset: [ox, oy] }) => {
      if (item.locked) return
      if (first) {
        onSelect(item.uid)
        haptic("selection")
      }
      pos.current = { x: ox, y: oy }
      apply()
      if (last) onCommit(item.uid, ox, oy)
    },
    { from: () => [pos.current.x, pos.current.y], filterTaps: true, enabled: !item.locked },
  )

  const dim = getOutfitDimensions(item.closetItem.category)
  const halfW = dim.width / 2
  const halfH = dim.height / 2

  return (
    <div
      ref={ref}
      {...bind()}
      onClick={(e) => { e.stopPropagation(); onSelect(item.uid) }}
      className="absolute left-1/2 top-1/2 touch-none select-none"
      style={{
        zIndex: item.z,
        width: dim.width,
        height: dim.height,
        marginLeft: -halfW,
        marginTop: -halfH,
        transform: `translate3d(${item.x}px, ${item.y}px, 0) scale(${item.scale}) rotate(${item.rotation}deg)`,
        willChange: "transform",
      }}
    >
      <div
        className={cn(
          "relative h-full w-full rounded-xl",
          selected && "outline-dashed outline-2 outline-offset-4 outline-primary",
        )}
      >
        <Image
          src={item.src || "/placeholder.svg"}
          alt={item.name}
          fill
          sizes={`${dim.width}px`}
          draggable={false}
          className="pointer-events-none object-contain drop-shadow-[0_10px_24px_rgba(0,0,0,0.12)]"
        />
        {/* Lock indicator */}
        {item.locked && (
          <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-black flex items-center justify-center">
            <Lock className="w-3 h-3 text-white" />
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Tool button ───

function ToolButton({
  children,
  label,
  onClick,
  destructive,
  active,
}: {
  children: React.ReactNode
  label: string
  onClick: () => void
  destructive?: boolean
  active?: boolean
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-full transition-colors active:bg-secondary",
        destructive ? "text-destructive" : "text-foreground",
        active && "bg-black text-white",
      )}
    >
      {children}
    </button>
  )
}

// ─── Build initial demo canvas items from gendered demo items ───

function buildDemoCanvasItems(demoItems: ClosetItem[]): CanvasItem[] {
  const top = demoItems.find(d => d.category === "tops" || d.category === "outerwear")
  const bottom = demoItems.find(d => d.category === "bottoms")
  const shoe = demoItems.find(d => d.category === "shoes")
  const result: CanvasItem[] = []
  if (top) result.push({ uid: nextUid(), src: top.source_image_url ?? "", name: top.title, x: 0, y: -90, scale: 1, rotation: -6, z: 2, locked: false, closetItem: top })
  if (bottom) result.push({ uid: nextUid(), src: bottom.source_image_url ?? "", name: bottom.title, x: 10, y: 70, scale: 1, rotation: 4, z: 1, locked: false, closetItem: bottom })
  if (shoe) result.push({ uid: nextUid(), src: shoe.source_image_url ?? "", name: shoe.title, x: -70, y: 200, scale: 0.7, rotation: 0, z: 3, locked: false, closetItem: shoe })
  return result
}

// ─── Parse edit query param ───

function useEditOutfitId(): string | null {
  if (typeof window === "undefined") return null
  return new URLSearchParams(window.location.search).get("edit")
}

/** Reconstruct CanvasItems from a saved outfit's items + positions metadata. */
function loadOutfitItems(outfit: SavedOutfit): CanvasItem[] {
  let positions: Record<string, { x: number; y: number; scale: number; rotation: number; z: number }> = {}
  try {
    if (outfit.rationale) {
      const parsed = JSON.parse(outfit.rationale)
      if (Array.isArray(parsed.positions)) {
        for (const p of parsed.positions) {
          positions[p.item_id] = p
        }
      }
    }
  } catch { /* ignore parse errors */ }

  return outfit.items
    .filter((ci) => ci.source_image_url)
    .map((ci) => {
      const pos = positions[ci.id] ?? { x: 0, y: 0, scale: ci.category === "shoes" ? 0.7 : 1, rotation: 0, z: 1 }
      return {
        uid: nextUid(),
        src: ci.source_image_url!,
        name: ci.title,
        x: pos.x,
        y: pos.y,
        scale: pos.scale,
        rotation: pos.rotation,
        z: pos.z,
        locked: false,
        closetItem: ci,
      }
    })
}

// ─── Tray categories ───
const TRAY_CATEGORIES = ["all", "tops", "bottoms", "shoes", "outerwear", "dresses", "accessories", "bags"] as const
type TrayFilter = (typeof TRAY_CATEGORIES)[number]

// ─── Main Canvas ───

export function Canvas({
  closetItems,
  outfits,
  demoItems,
  onSaveOutfit,
  onDeleteOutfit,
  onSaved,
}: {
  closetItems: ClosetItem[]
  outfits: SavedOutfit[]
  /** Gender-aware demo wardrobe — used as the tray + initial layout when
   *  the user has no real closet items yet. */
  demoItems?: ClosetItem[]
  onSaveOutfit: (name: string, items: ClosetItem[], metadata?: Record<string, any>) => Promise<SavedOutfit | null>
  onDeleteOutfit?: (id: string) => Promise<void>
  onSaved?: () => void
}) {
  // Prefer real closet items; fall back to the gender-aware demo set whenever
  // the user hasn't built one yet. Both source arrays contain real ClosetItem
  // shapes so downstream filter / find calls stay typed and unambiguous.
  const displayCloset =
    closetItems.length > 0 ? closetItems : demoItems ?? [];
  const editOutfitId = useEditOutfitId()
  const editOutfit = useMemo(
    () => (editOutfitId ? outfits.find((o) => o.id === editOutfitId) ?? null : null),
    [editOutfitId, outfits],
  )

  const [items, setItems] = useState<CanvasItem[]>(() => {
    if (editOutfit) return loadOutfitItems(editOutfit)
    return buildDemoCanvasItems(displayCloset)
  })
  const [selected, setSelected] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showNamePrompt, setShowNamePrompt] = useState(false)
  const [mode, setMode] = useState<CanvasMode>("free")
  const [trayOpen, setTrayOpen] = useState(true)

  const selectItem = useCallback((uid: string) => setSelected(uid), [])

  const commitPos = useCallback((uid: string, x: number, y: number) => {
    setItems((prev) => prev.map((it) => (it.uid === uid ? { ...it, x, y } : it)))
    setSaved(false)
  }, [])

  const updateSelected = (fn: (it: CanvasItem) => CanvasItem) => {
    if (!selected) return
    haptic("light")
    setItems((prev) => prev.map((it) => (it.uid === selected ? fn(it) : it)))
    setSaved(false)
  }

  const bringForward = () => {
    const maxZ = Math.max(...items.map((i) => i.z), 0)
    updateSelected((it) => ({ ...it, z: maxZ + 1 }))
  }
  const sendBackward = () => {
    const minZ = Math.min(...items.map((i) => i.z), 0)
    updateSelected((it) => ({ ...it, z: minZ - 1 }))
  }
  const rotate = () => updateSelected((it) => ({ ...it, rotation: it.rotation + 15 }))
  const scaleUp = () => updateSelected((it) => ({ ...it, scale: Math.min(it.scale + 0.12, 2.2) }))
  const scaleDown = () => updateSelected((it) => ({ ...it, scale: Math.max(it.scale - 0.12, 0.35) }))
  const toggleLock = () => updateSelected((it) => ({ ...it, locked: !it.locked }))
  const remove = () => {
    if (!selected) return
    haptic("medium")
    setItems((prev) => prev.filter((it) => it.uid !== selected))
    setSelected(null)
    setSaved(false)
  }

  const addClosetItem = (ci: ClosetItem) => {
    if (!ci.source_image_url) return
    haptic("medium")
    const maxZ = Math.max(...items.map((i) => i.z), 0)
    const uid = nextUid()
    const pos = mode === "flatlay" ? flatlayPosition(ci.category) : { x: Math.random() * 80 - 40, y: Math.random() * 80 - 40 }
    setItems((prev) => [
      ...prev,
      {
        uid,
        src: ci.source_image_url,
        name: ci.title,
        x: pos.x,
        y: pos.y,
        scale: ci.category === "shoes" ? 0.7 : 1,
        rotation: 0,
        z: maxZ + 1,
        locked: false,
        closetItem: ci,
      },
    ])
    setSelected(uid)
    setSaved(false)
  }

  // Auto-position all items when switching to flatlay mode
  const applyFlatLay = () => {
    setItems((prev) =>
      prev.map((it) => {
        const pos = flatlayPosition(it.closetItem.category)
        return { ...it, x: pos.x, y: pos.y }
      }),
    )
    setSaved(false)
    haptic("medium")
  }

  const toggleMode = () => {
    const next = mode === "free" ? "flatlay" : "free"
    setMode(next)
    if (next === "flatlay") {
      applyFlatLay()
    }
  }

  // ─── Save flow ───

  const handleSaveClick = () => {
    if (items.length === 0) return
    haptic("medium")
    // Editing an existing outfit → save directly without prompting for name
    if (editOutfit) {
      handleConfirmSave(editOutfit.name)
      return
    }
    setShowNamePrompt(true)
  }

  const handleConfirmSave = async (name: string) => {
    console.log('🖼️ [Canvas] Save —', items.length, 'items, mode:', mode)
    setShowNamePrompt(false)
    setSaving(true)

    const selectedItems = items.map((i) => i.closetItem)
    const positions = items.map((i) => ({
      item_id: i.closetItem.id,
      x: Math.round(i.x * 100) / 100,
      y: Math.round(i.y * 100) / 100,
      scale: Math.round(i.scale * 100) / 100,
      rotation: i.rotation,
      z: i.z,
    }))

    haptic("medium")

    try {
      const result = await onSaveOutfit(name, selectedItems, { source: "canvas", mode, positions })
      console.log('🖼️ [Canvas] Result:', result ? `SAVED ${result.id}` : 'NULL')
      if (result) {
        if (editOutfit) await onDeleteOutfit?.(editOutfit.id)
        setSaved(true)
        haptic("medium")
        onSaved?.()
      }
    } catch (err) {
      console.error('🖼️ [Canvas] Save threw:', err)
    }
    setSaving(false)
  }

  // ─── Selected item for toolbar ───
  const selectedItem = useMemo(() => items.find((it) => it.uid === selected) ?? null, [items, selected])

  // ─── Tray: real items (or gender-aware demo fallback) ───
  const traySource = displayCloset.filter((ci) => ci.source_image_url)

  // ─── Tray category filter ───
  const [trayFilter, setTrayFilter] = useState<TrayFilter>("all")

  // Only show chips for categories that actually have items
  const availableCategories = TRAY_CATEGORIES.filter(
    (cat): cat is TrayFilter => cat === "all" || traySource.some((ci) => ci.category === cat),
  )

  const filteredTray = trayFilter === "all"
    ? traySource
    : traySource.filter((ci) => ci.category === trayFilter)

  return (
    <div className="flex h-full flex-col relative">
      {showNamePrompt && (
        <NamePrompt onConfirm={handleConfirmSave} onCancel={() => setShowNamePrompt(false)} />
      )}

      <header className="flex items-center justify-between px-5 pb-2 pt-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            {editOutfit ? "Edit Fit" : "Create"}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {editOutfit ? editOutfit.name : "Canvas"}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {/* Mode toggle */}
          <button
            type="button"
            onClick={toggleMode}
            aria-label={mode === "free" ? "Switch to Flat Lay" : "Switch to Freeform"}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
              mode === "flatlay"
                ? "bg-black text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200",
            )}
          >
            {mode === "flatlay" ? (
              <AlignCenter className="h-3.5 w-3.5" />
            ) : (
              <Grid3X3 className="h-3.5 w-3.5" />
            )}
            {mode === "flatlay" ? "Flat Lay" : "Freeform"}
          </button>
          {/* Save */}
          <button
            type="button"
            onClick={handleSaveClick}
            disabled={saving || items.length === 0}
            className={cn(
              "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
              saved ? "bg-primary text-primary-foreground" : "bg-foreground text-background",
              (items.length === 0 || saving) && "opacity-50",
            )}
          >
            {saved ? <Check className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
            {saving ? "Saving..." : saved ? "Saved" : "Save"}
          </button>
        </div>
      </header>

      {/* Canvas surface */}
      <div
        className={cn(
          "relative mx-4 mb-3 flex-1 overflow-hidden rounded-3xl soft-shadow",
          mode === "flatlay"
            ? "bg-white aspect-[3/4] mx-auto max-w-md"
            : "bg-card",
        )}
        style={mode === "flatlay" ? { maxHeight: "calc(100vh - 260px)" } : undefined}
      >
        <button
          type="button"
          aria-label="Deselect"
          onClick={() => setSelected(null)}
          className="absolute inset-0"
          style={
            mode === "free"
              ? {
                  backgroundImage: "radial-gradient(circle at 1px 1px, rgba(0,0,0,0.06) 1px, transparent 0)",
                  backgroundSize: "22px 22px",
                }
              : undefined
          }
        />

        {items.map((item) => (
          <DraggableItem
            key={item.uid}
            item={item}
            selected={selected === item.uid}
            onSelect={selectItem}
            onCommit={commitPos}
          />
        ))}

        {selected && (
          <div className="absolute right-3 top-1/2 z-[999] flex -translate-y-1/2 flex-col gap-1 rounded-full bg-card/95 p-1.5 backdrop-blur-md lift-shadow">
            <ToolButton label="Bring forward" onClick={bringForward}><ChevronUp className="h-5 w-5" /></ToolButton>
            <ToolButton label="Send backward" onClick={sendBackward}><ChevronDown className="h-5 w-5" /></ToolButton>
            <div className="mx-2 my-0.5 h-px bg-border" />
            <ToolButton label="Scale up" onClick={scaleUp}><Plus className="h-5 w-5" /></ToolButton>
            <ToolButton label="Scale down" onClick={scaleDown}><Minus className="h-5 w-5" /></ToolButton>
            <ToolButton label="Rotate" onClick={rotate}><RotateCw className="h-5 w-5" /></ToolButton>
            <div className="mx-2 my-0.5 h-px bg-border" />
            <ToolButton
              label={selectedItem?.locked ? "Unlock" : "Lock"}
              onClick={toggleLock}
              active={selectedItem?.locked ?? false}
            >
              {selectedItem?.locked ? <Lock className="h-5 w-5" /> : <Unlock className="h-5 w-5" />}
            </ToolButton>
            <div className="mx-2 my-0.5 h-px bg-border" />
            <ToolButton label="Delete" onClick={remove} destructive><Trash2 className="h-5 w-5" /></ToolButton>
          </div>
        )}

        {items.length === 0 && (
          <p className="pointer-events-none absolute inset-0 flex items-center justify-center px-10 text-center text-sm text-muted-foreground">
            Tap an item below to start styling your look.
          </p>
        )}
      </div>

      {/* Item tray */}
      <TraySection
        trayOpen={trayOpen}
        onToggle={() => {
          haptic("light")
          setTrayOpen((o) => !o)
        }}
        availableCategories={availableCategories}
        trayFilter={trayFilter}
        onTrayFilter={setTrayFilter}
        filteredTray={filteredTray}
        onAddItem={addClosetItem}
      />
    </div>
  )
}

// ─── Collapsible Tray Section ───

function TraySection({
  trayOpen,
  onToggle,
  availableCategories,
  trayFilter,
  onTrayFilter,
  filteredTray,
  onAddItem,
}: {
  trayOpen: boolean
  onToggle: () => void
  availableCategories: readonly TrayFilter[]
  trayFilter: TrayFilter
  onTrayFilter: (cat: TrayFilter) => void
  filteredTray: ClosetItem[]
  onAddItem: (ci: ClosetItem) => void
}) {
  return (
    <div className="px-4 pb-2">
      {/* Toggle bar */}
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-center gap-1.5 rounded-t-xl bg-muted/40 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted"
        aria-label={trayOpen ? "Collapse item tray" : "Expand item tray"}
      >
        {trayOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        {trayOpen ? "Hide items" : `Show items (${filteredTray.length})`}
      </button>

      {trayOpen && (
        <>
          {/* Category filter chips */}
          {availableCategories.length > 2 && (
            <div className="no-scrollbar flex gap-1.5 overflow-x-scroll py-2">
              {availableCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    haptic("light")
                    onTrayFilter(cat)
                  }}
                  className={cn(
                    "flex-none rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                    trayFilter === cat
                      ? "bg-foreground text-background"
                      : "bg-card text-muted-foreground soft-shadow",
                  )}
                >
                  {cat === "all" ? "All" : cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>
          )}

          {/* Scrollable item thumbnails */}
          <div className="no-scrollbar flex gap-3 overflow-x-scroll">
            {filteredTray.map((ci) => (
              <button
                key={ci.id}
                type="button"
                onClick={() => onAddItem(ci)}
                className="relative h-16 w-16 flex-none rounded-2xl bg-card soft-shadow"
                aria-label={`Add ${ci.title}`}
              >
                <Image src={ci.source_image_url!} alt={ci.title} fill sizes="64px" className="object-contain p-1.5" />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
