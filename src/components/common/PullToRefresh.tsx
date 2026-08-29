"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import { Loader2 } from "lucide-react"

/**
 * Pull-to-refresh wrapper for scrollable content.
 *
 * Listens for touch pull-down when the container is at scrollTop=0.
 * When the user pulls past the threshold and releases, fires onRefresh.
 * Shows a pull indicator and a brief "Refreshing..." spinner.
 *
 * Usage:
 *   <PullToRefresh onRefresh={refresh} isRefreshing={isRefreshing}>
 *     <div>your scrollable content</div>
 *   </PullToRefresh>
 */

const PULL_THRESHOLD = 80
const SPINNER_DURATION_MS = 900

export function PullToRefresh({
  children,
  onRefresh,
  className = "",
}: {
  children: React.ReactNode
  onRefresh: () => void
  className?: string
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const startY = useRef(0)
  const pulling = useRef(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mountedRef = useRef(true)

  // Cleanup timer on unmount
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const el = containerRef.current
    if (!el || el.scrollTop > 0) return
    pulling.current = true
    startY.current = e.touches[0].clientY
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!pulling.current) return
    const diff = e.touches[0].clientY - startY.current
    // Apply resistance — the further you pull, the harder it gets
    const resistance = diff > 120 ? 120 + (diff - 120) * 0.25 : diff
    setPullDistance(Math.max(0, resistance))
  }, [])

  const handleTouchEnd = useCallback(() => {
    if (!pulling.current) return
    pulling.current = false

    if (pullDistance >= PULL_THRESHOLD) {
      setIsRefreshing(true)
      onRefresh()
      // Keep spinner visible briefly for feedback
      timerRef.current = setTimeout(() => {
        if (mountedRef.current) {
          setIsRefreshing(false)
          setPullDistance(0)
        }
      }, SPINNER_DURATION_MS)
    } else {
      setPullDistance(0)
    }
  }, [pullDistance, onRefresh])

  const progress = Math.min(pullDistance / PULL_THRESHOLD, 1)

  return (
    <div
      ref={containerRef}
      className={`h-full overflow-y-auto ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      {/* Pull indicator */}
      {(pullDistance > 0 || isRefreshing) && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: pullDistance, opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="flex items-center justify-center overflow-hidden"
        >
            {isRefreshing ? (
              <div className="flex items-center gap-2 py-3">
                <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
                <span className="text-sm font-medium text-gray-500">
                  Refreshing…
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 py-3">
                <motion.div
                  animate={{ rotate: progress * 360 }}
                  transition={{ duration: 0.1 }}
                >
                  <svg
                    className="h-5 w-5 text-gray-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3"
                    />
                  </svg>
                </motion.div>
                <span className="text-sm font-medium text-gray-400">
                  {progress >= 1 ? "Release to refresh" : "Pull to refresh"}
                </span>
              </div>
            )}
          </motion.div>
      )}

      {children}
    </div>
  )
}
