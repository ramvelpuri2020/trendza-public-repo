"use client"

import { useEffect, useRef, useState } from "react"

/**
 * Reusable name prompt modal used by Shuffler and Canvas save flows.
 * Keyboard-resilient: uses items-center (not items-end) so the modal
 * stays vertically centered when the native iOS keyboard appears.
 * Content scrolls internally via overflow-y-auto with a max-height
 * guard so buttons never get pushed off-screen.
 */
export function NamePrompt({
  defaultName = "My Look",
  subtitle = "Give this outfit a name so you can find it later.",
  onConfirm,
  onCancel,
}: {
  defaultName?: string
  subtitle?: string
  onConfirm: (name: string) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(defaultName)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Small delay so iOS keyboard animation completes before focus
    const t = setTimeout(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
    }, 350)
    return () => clearTimeout(t)
  }, [])

  return (
    <div
      className="absolute inset-0 z-20 flex items-center justify-center px-4"
      style={{
        backgroundColor: "rgba(0,0,0,0.4)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        // Prevent the overlay itself from scrolling — the modal body scrolls
        overflow: "hidden",
      }}
    >
      {/* Modal container: bounded so it never overflows below keyboard */}
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl"
        style={{
          maxHeight: "calc(100vh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px) - 48px)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Scrollable body: name, subtitle, input, buttons */}
        <div className="overflow-y-auto flex-1" style={{ WebkitOverflowScrolling: "touch" }}>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            Name your look
          </h3>
          <p className="text-sm text-gray-500 mb-4">{subtitle}</p>
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && name.trim()) onConfirm(name.trim())
              if (e.key === "Escape") onCancel()
            }}
            placeholder={defaultName}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-900 outline-none focus:border-black focus:ring-1 focus:ring-black"
            style={{ fontSize: 16 }} // prevents iOS zoom on focus
          />
          <div className="flex gap-3 mt-4 pb-1">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 rounded-xl border border-gray-200 bg-white py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors active:scale-[0.98]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => name.trim() && onConfirm(name.trim())}
              className="flex-1 rounded-xl bg-black py-3 text-sm font-semibold text-white hover:bg-gray-900 transition-colors disabled:opacity-40 active:scale-[0.98]"
              disabled={!name.trim()}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
