"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Check, X, Loader2, Sparkles, AlertCircle, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

export type QueueItemStatus = "waiting" | "bg-removal" | "saving" | "classifying" | "done" | "error"

export interface QueueItem {
  id: string
  thumbnail: string
  name: string
  status: QueueItemStatus
  error?: string
}

interface BatchQueueProps {
  items: QueueItem[]
  /** Called when user taps X on an item that's still waiting/error */
  onRemoveItem?: (id: string) => void
  className?: string
}

const STATUS_CONFIG: Record<QueueItemStatus, { label: string; icon: React.ReactNode; color: string }> = {
  "waiting": {
    label: "Waiting",
    icon: <Clock className="h-3.5 w-3.5" />,
    color: "text-muted-foreground",
  },
  "bg-removal": {
    label: "Removing background",
    icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
    color: "text-primary",
  },
  "saving": {
    label: "Saving to wardrobe",
    icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
    color: "text-primary",
  },
  "classifying": {
    label: "Classifying",
    icon: <Sparkles className="h-3.5 w-3.5 animate-pulse" />,
    color: "text-amber-500",
  },
  "done": {
    label: "Done",
    icon: <Check className="h-3.5 w-3.5" />,
    color: "text-green-500",
  },
  "error": {
    label: "Failed",
    icon: <AlertCircle className="h-3.5 w-3.5" />,
    color: "text-red-500",
  },
}

export function BatchQueue({ items, onRemoveItem, className }: BatchQueueProps) {
  const completedCount = items.filter((i) => i.status === "done").length
  const errorCount = items.filter((i) => i.status === "error").length

  return (
    <div className={cn("space-y-3", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">Processing Queue</span>
          <span className="text-xs text-muted-foreground">
            {completedCount}/{items.length}
            {errorCount > 0 && ` · ${errorCount} failed`}
          </span>
        </div>
        {/* Overall progress ring */}
        <div className="flex items-center gap-1.5">
          <svg className="h-5 w-5 -rotate-90" viewBox="0 0 20 20">
            <circle cx="10" cy="10" r="8" fill="none" stroke="hsl(var(--muted))" strokeWidth="2.5" />
            <motion.circle
              cx="10" cy="10" r="8"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray={50.27}
              animate={{ strokeDashoffset: 50.27 * (1 - completedCount / Math.max(items.length, 1)) }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </svg>
        </div>
      </div>

      {/* Queue items */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {items.map((item, idx) => {
            const cfg = STATUS_CONFIG[item.status]
            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 80, scale: 0.95 }}
                transition={{ duration: 0.3, delay: idx * 0.03 }}
                className={cn(
                  "relative flex items-center gap-3 rounded-xl border p-3 transition-colors",
                  item.status === "error"
                    ? "border-red-200 bg-red-50/50"
                    : item.status === "done"
                      ? "border-green-200 bg-green-50/50"
                      : item.status === "waiting"
                        ? "border-muted bg-card/50"
                        : "border-primary/20 bg-primary/5",
                )}
              >
                {/* Thumbnail */}
                <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                  <img
                    src={item.thumbnail || "/placeholder.svg"}
                    alt={item.name}
                    className="h-full w-full object-cover"
                  />
                  {item.status === "done" && (
                    <div className="absolute inset-0 flex items-center justify-center bg-green-500/20 backdrop-brightness-110">
                      <Check className="h-5 w-5 text-green-600" strokeWidth={3} />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {item.name}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <span className={cn("flex-shrink-0", cfg.color)}>{cfg.icon}</span>
                    <span className={cn("text-xs", cfg.color)}>{cfg.label}</span>
                    {item.error && (
                      <span className="truncate text-xs text-red-400">· {item.error}</span>
                    )}
                  </div>
                </div>

                {/* Remove button (only for waiting/error items) */}
                {(item.status === "waiting" || item.status === "error") && onRemoveItem && (
                  <button
                    type="button"
                    onClick={() => onRemoveItem(item.id)}
                    className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    aria-label={`Remove ${item.name}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}

                {/* Progress indicator for active items */}
                {(item.status === "bg-removal" || item.status === "saving" || item.status === "classifying") && (
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary/20 overflow-hidden rounded-full"
                    initial={false}
                  >
                    <motion.div
                      className="h-full bg-primary rounded-full"
                      animate={{
                        x: ["-100%", "200%"],
                      }}
                      transition={{
                        duration: 1.2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      style={{ width: "40%" }}
                    />
                  </motion.div>
                )}
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Empty state */}
      {items.length === 0 && (
        <div className="py-8 text-center text-sm text-muted-foreground">
          No items in queue
        </div>
      )}
    </div>
  )
}
