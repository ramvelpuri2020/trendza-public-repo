"use client"

import { useEffect, useState } from "react"
import { Upload, CalendarDays, Layers, Scissors, X } from "lucide-react"
import { haptic } from "@/lib/haptics"
import { cn } from "@/lib/utils"

type Action = "upload" | "plan" | "create" | "clip"

const items: { key: Action; label: string; desc: string; icon: typeof Upload }[] = [
  { key: "upload", label: "Upload Item", desc: "Add a photo from your camera roll", icon: Upload },
  { key: "clip", label: "Web Clipper", desc: "Grab items from any store", icon: Scissors },
  { key: "create", label: "Create Outfit", desc: "Style a look on the canvas", icon: Layers },
  { key: "plan", label: "Plan a Day", desc: "Schedule what to wear", icon: CalendarDays },
]

export function BottomSheet({
  open,
  onClose,
  onAction,
}: {
  open: boolean
  onClose: () => void
  onAction: (action: Action) => void
}) {
  // Keep the element mounted through the exit animation.
  const [mounted, setMounted] = useState(open)

  useEffect(() => {
    if (open) setMounted(true)
    else {
      const t = setTimeout(() => setMounted(false), 300)
      return () => clearTimeout(t)
    }
  }, [open])

  if (!mounted) return null

  return (
    <div className="absolute inset-0 z-40" aria-modal="true" role="dialog">
      {/* Dimming + frosted glass overlay */}
      <button
        type="button"
        aria-label="Close menu"
        onClick={onClose}
        className={cn(
          "absolute inset-0 transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0",
        )}
        style={{
          backgroundColor: "rgba(0,0,0,0.4)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
        }}
      />

      {/* Sheet */}
      <div
        className="absolute inset-x-0 bottom-0 rounded-t-[28px] bg-card pb-8 pt-3"
        style={{
          paddingBottom: `calc(32px + env(safe-area-inset-bottom, 0px))`,
          boxShadow: "0 -4px 20px rgba(0,0,0,0.10), 0 -1px 3px rgba(0,0,0,0.06)",
          transform: open ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.34s cubic-bezier(0.175, 0.885, 0.32, 1.1)",
        }}
      >
        <div className="mx-auto mb-2 h-1.5 w-10 rounded-full bg-border" />
        <div className="flex items-center justify-between px-6 pb-2 pt-1">
          <h2 className="text-lg font-semibold text-foreground">Add to Wardrobe</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-4">
          {items.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  haptic("medium")
                  onAction(item.key)
                }}
                className="flex w-full items-center gap-4 rounded-2xl px-3 text-left transition-colors active:bg-secondary"
                style={{ minHeight: 64 }}
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="flex-1">
                  <span className="block text-[15px] font-semibold text-foreground">
                    {item.label}
                  </span>
                  <span className="block text-[13px] text-muted-foreground">{item.desc}</span>
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
