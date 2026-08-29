"use client"

import { Shirt, LayoutGrid, Layers, Scissors, Plus } from "lucide-react"
import { haptic } from "@/lib/haptics"
import { cn } from "@/lib/utils"

export type Tab = "shuffle" | "wardrobe" | "canvas" | "clipper"

const left: { key: Tab; label: string; icon: typeof Shirt }[] = [
  { key: "shuffle", label: "Dress Me", icon: Shirt },
  { key: "wardrobe", label: "Wardrobe", icon: LayoutGrid },
]
const right: { key: Tab; label: string; icon: typeof Shirt }[] = [
  { key: "canvas", label: "Canvas", icon: Layers },
  { key: "clipper", label: "Clip", icon: Scissors },
]

function TabButton({
  active,
  label,
  Icon,
  onClick,
}: {
  active: boolean
  label: string
  Icon: typeof Shirt
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-1 flex-col items-center justify-center gap-1 py-1"
      aria-current={active ? "page" : undefined}
    >
      <Icon
        className={cn("h-6 w-6 transition-colors", active ? "text-foreground" : "text-muted-foreground")}
        strokeWidth={active ? 2.4 : 2}
      />
      <span
        className={cn(
          "text-[10px] font-medium transition-colors",
          active ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {label}
      </span>
    </button>
  )
}

export function BottomNav({
  active,
  onTabChange,
  onFabPress,
}: {
  active: Tab
  onTabChange: (tab: Tab) => void
  onFabPress: () => void
}) {
  const go = (tab: Tab) => {
    haptic("light")
    onTabChange(tab)
  }

  return (
    <nav className="relative border-t border-border/70 bg-card/95 backdrop-blur-md">
      {/* Floating action button */}
      <button
        type="button"
        aria-label="Add to wardrobe"
        onClick={() => {
          haptic("medium")
          onFabPress()
        }}
        className="absolute left-1/2 top-0 flex h-15 w-15 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-foreground text-background lift-shadow transition-transform active:scale-95"
        style={{ height: 60, width: 60 }}
      >
        <Plus className="h-7 w-7" strokeWidth={2.5} />
      </button>

      <div
        className="flex items-stretch px-2 pt-2"
        style={{
          // Pad the tab bar above the iOS home indicator. Tailwind's
          // `pb-6` (24px) is not enough on notched/dynamic-island iPhones
          // and would render the tab labels underneath the swipe bar.
          paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom, 0px))",
        }}
      >
        <div className="flex flex-1">
          {left.map((t) => (
            <TabButton
              key={t.key}
              active={active === t.key}
              label={t.label}
              Icon={t.icon}
              onClick={() => go(t.key)}
            />
          ))}
        </div>
        <div className="w-16 flex-none" aria-hidden />
        <div className="flex flex-1">
          {right.map((t) => (
            <TabButton
              key={t.key}
              active={active === t.key}
              label={t.label}
              Icon={t.icon}
              onClick={() => go(t.key)}
            />
          ))}
        </div>
      </div>
    </nav>
  )
}
