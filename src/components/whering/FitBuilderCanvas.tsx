/**
 * Canvas — freeform "styling surface" for layering closet pieces.
 *
 * The "hard" Whering feature. Three rules drive the implementation:
 *
 *   1. Never animate position via React state during a drag. setState
 *      on every pointer move = re-render jank. Instead hold the live
 *      position in a ref `{x, y}` and write directly to the tile's
 *      `style.transform`. Only setState when the drag `last` to commit.
 *
 *   2. Use `transform: translate3d(...) rotate(...) scale(...)` and
 *      `will-change: transform` to force GPU compositing. Avoid animating
 *      `top`/`left` (they trigger layout). The wrapper is a plain <div>,
 *      not a `motion.div`, because framer-motion would own the same
 *      `transform` property and fight our imperative writes.
 *
 *   3. Layering is a single `z` integer per item. "Bring forward" sets
 *      `z = maxZ + 1`, "send backward" sets `z = minZ - 1`. Selection is
 *      maintained in state and bound to a dashed lime ring overlay.
 *
 * Toolbar actions stay cheap because `scale` and `rotation` are baked
 * into the same `transform` string on commit. Per the IMPLEMENTATION
 * plan: scale is clamped 0.35–2.2, rotation in 15° steps.
 */

import * as React from "react";
import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useDrag } from "@use-gesture/react";
import {
  BringToFront,
  ChevronDown,
  ChevronUp,
  Minus,
  Plus,
  RotateCw,
  SendToBack,
  ShoppingBag,
  Trash2,
  Wand2,
} from "lucide-react";
import type { ClosetItem } from "@/hooks/useClosetData";
import { selectTick, snapTick, thrust } from "@/lib/haptics";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────

interface CanvasItemState {
  /** Stable local uid — distinct from item.id so the same closet piece
   *  can appear twice in one canvas. */
  uid: string;
  item: ClosetItem;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  z: number;
}

export interface CanvasProps {
  items: ClosetItem[];
  /** Optional initial items — e.g. hydrate from a saved fit. */
  initialItems?: Array<{
    item: ClosetItem;
    x?: number;
    y?: number;
    z?: number;
  }>;
  /** Called when the user "saves" the canvas as an outfit layout — the
   *  parent decides what that means in its domain. */
  onSave?: (payload: {
    items: Array<{ item: ClosetItem; x: number; y: number; z: number }>;
  }) => void;
  className?: string;
}

const SCALE_MIN = 0.35;
const SCALE_MAX = 2.2;
const ROT_STEP = 15;
const SURFACE_PADDING = 24;

// ─────────────────────────────────────────────────────────────────────
// Tile — single draggable / rotatable / scalable piece
// ─────────────────────────────────────────────────────────────────────

interface TileProps {
  state: CanvasItemState;
  selected: boolean;
  onSelect: (uid: string) => void;
  onCommit: (uid: string, next: { x: number; y: number }) => void;
  registerTile: (uid: string, el: HTMLDivElement | null) => void;
}

function Tile({
  state,
  selected,
  onSelect,
  onCommit,
  registerTile,
}: TileProps) {
  // Live position stored in a ref so each drag frame writes directly to
  // the DOM transform string without bouncing through React state.
  const liveRef = React.useRef<{ x: number; y: number }>({
    x: state.x,
    y: state.y,
  });
  const elRef = React.useRef<HTMLDivElement | null>(null);

  // Keep `liveRef` in sync after committed state changes so a parent
  // re-render between drags starts from the correct offset.
  React.useEffect(() => {
    liveRef.current = { x: state.x, y: state.y };
  }, [state.x, state.y]);
  // Imperatively paint the initial transform once mounted.
  React.useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    el.style.transform = transformFor(state.x, state.y, state.rotation, state.scale);
    el.style.opacity = "1";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const bind = useDrag(
    ({ first, last, offset: [ox, oy], event }) => {
      if (first) {
        onSelect(state.uid);
        selectTick();
        // Prevent the browser's native image drag interfering on Safari.
        event?.preventDefault();
      }
      liveRef.current = { x: ox, y: oy };
      const el = elRef.current;
      if (!el) return;
      el.style.transform = transformFor(ox, oy, state.rotation, state.scale);
      if (last) onCommit(state.uid, { x: ox, y: oy });
    },
    {
      // Drag origin is the live position, not `state.x`. This protects
      // against an in-flight re-render (e.g. toolbar scale) resetting
      // the offset to the stale state value.
      from: () => [liveRef.current.x, liveRef.current.y] as [number, number],
      filterTaps: true,
    }
  );

  const setRefs = React.useCallback(
    (el: HTMLDivElement | null) => {
      elRef.current = el;
      registerTile(state.uid, el);
    },
    [registerTile, state.uid]
  );

  // `bind()` returns a props object; spread it on a plain <div> so it
  // owns pointer events. Spreading on motion.div would fight transform.
  const dragProps = bind() as React.HTMLAttributes<HTMLDivElement>;

  return (
    <div
      ref={setRefs}
      {...dragProps}
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: "44%",
        maxWidth: 220,
        zIndex: state.z,
        touchAction: "none",
        willChange: "transform",
        transformOrigin: "center center",
        opacity: 0, // Imperatively set to 1 in the mount effect so the
        // initial transform can land before the fade-in completes.
        cursor: "grab",
        // Allow the user to keep dragging even if pointer briefly drifts
        // off the tile — `@use-gesture/react` re-aims on pointermove.
      }}
      className={cn(
        "active:cursor-grabbing select-none transition-[outline] duration-200",
        selected && "wh-selection-ring"
      )}
      role="button"
      aria-label={`${state.item.title}, draggable`}
      aria-pressed={selected}
    >
      <div className="rounded-2xl bg-white border border-gray-200 overflow-hidden wh-soft-shadow">
        {state.item.source_image_url ? (
          <img
            src={state.item.source_image_url}
            alt={state.item.title}
            draggable={false}
            className="w-full aspect-[3/4] object-contain p-2"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <div className="w-full aspect-[3/4] flex items-center justify-center text-gray-300 text-3xl bg-gray-50">
            ✦
          </div>
        )}
        <div className="px-2 py-1.5">
          <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-500 truncate">
            {state.item.brand || state.item.category}
          </p>
          <p className="text-xs font-semibold text-gray-900 truncate">
            {state.item.title}
          </p>
        </div>
      </div>
    </div>
  );
}

function transformFor(x: number, y: number, rotation: number, scale: number) {
  return `translate3d(${x}px, ${y}px, 0) rotate(${rotation}deg) scale(${scale})`;
}

// ─────────────────────────────────────────────────────────────────────
// Canvas — composes surface + tile state + toolbar
// ─────────────────────────────────────────────────────────────────────

export function Canvas({
  items,
  initialItems,
  onSave,
  className,
}: CanvasProps) {
  const [tiles, setTiles] = React.useState<CanvasItemState[]>(() =>
    (initialItems ?? []).map((entry, i) => ({
      uid: `c_${entry.item.id}_${i}_${Date.now()}`,
      item: entry.item,
      x: entry.x ?? 0,
      y: entry.y ?? 0,
      scale: 1,
      rotation: 0,
      z: entry.z ?? 10 + i,
    }))
  );
  const [selectedUid, setSelectedUid] = React.useState<string | null>(null);

  const tileRefs = React.useRef<Map<string, HTMLDivElement>>(new Map());
  const registerTile = React.useCallback(
    (uid: string, el: HTMLDivElement | null) => {
      if (el) tileRefs.current.set(uid, el);
      else tileRefs.current.delete(uid);
    },
    []
  );

  // Escape-to-deselect — keyboard / switch-control users otherwise have
  // no way to dismiss a selection without reaching for the surface.
  // Listener is only attached while a tile is selected.
  useEffect(() => {
    if (!selectedUid) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedUid(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [selectedUid]);

  // ─── Tile mutations ───
  const commitTile = React.useCallback(
    (uid: string, next: Partial<CanvasItemState>) => {
      setTiles((prev) =>
        prev.map((t) => (t.uid === uid ? { ...t, ...next } : t))
      );
    },
    []
  );

  const bringForward = (uid: string) => {
    setTiles((prev) => {
      const maxZ = prev.reduce((m, t) => Math.max(m, t.z), 0);
      return prev.map((t) => (t.uid === uid ? { ...t, z: maxZ + 1 } : t));
    });
    snapTick();
  };

  const sendBackward = (uid: string) => {
    setTiles((prev) => {
      const minZ = prev.reduce((m, t) => Math.min(m, t.z), 0);
      return prev.map((t) => (t.uid === uid ? { ...t, z: minZ - 1 } : t));
    });
    snapTick();
  };

  const paintTile = React.useCallback(
    (uid: string, transform: string) => {
      const el = tileRefs.current.get(uid);
      if (el) el.style.transform = transform;
    },
    []
  );

  const adjustScale = (uid: string, delta: number) => {
    snapTick();
    setTiles((prev) =>
      prev.map((t) => {
        if (t.uid !== uid) return t;
        const next = Math.max(SCALE_MIN, Math.min(SCALE_MAX, t.scale + delta));
        paintTile(uid, transformFor(t.x, t.y, t.rotation, next));
        return { ...t, scale: next };
      })
    );
  };

  const adjustRotation = (uid: string, delta: number) => {
    snapTick();
    setTiles((prev) =>
      prev.map((t) => {
        if (t.uid !== uid) return t;
        const next = t.rotation + delta;
        paintTile(uid, transformFor(t.x, t.y, next, t.scale));
        return { ...t, rotation: next };
      })
    );
  };

  const deleteTile = (uid: string) => {
    thrust();
    setTiles((prev) => prev.filter((t) => t.uid !== uid));
    if (selectedUid === uid) setSelectedUid(null);
  };

  // Add an item from the wardrobe into the canvas — small jitter so
  // successive Adds don't perfectly overlap.
  const addItem = (item: ClosetItem) => {
    thrust();
    const sig = `${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const uid = `c_${item.id}_${sig}`;
    setTiles((prev) => {
      const maxZ = prev.reduce((m, t) => Math.max(m, t.z), 0);
      return [
        ...prev,
        {
          uid,
          item,
          x: SURFACE_PADDING + Math.random() * 60,
          y: SURFACE_PADDING + Math.random() * 80,
          scale: 1,
          rotation: 0,
          z: maxZ + 1,
        },
      ];
    });
    setSelectedUid(uid);
  };

  const handleCommit = React.useCallback(
    (uid: string, next: { x: number; y: number }) => {
      commitTile(uid, next);
    },
    [commitTile]
  );

  // ─── Save handler ───
  const handleSave = () => {
    if (!onSave) return;
    thrust();
    onSave({
      items: tiles.map((t) => ({
        item: t.item,
        x: t.x,
        y: t.y,
        z: t.z,
      })),
    });
  };

  const selectedTile = selectedUid
    ? tiles.find((t) => t.uid === selectedUid)
    : null;

  return (
    <div
      className={cn("flex flex-col gap-3 wh-shell rounded-3xl p-3", className)}
      role="region"
      aria-label="Freeform canvas"
    >
      {/* Surface — the styling board. */}
      <div
        className="relative bg-white border border-gray-200 rounded-2xl wh-soft-shadow overflow-hidden min-h-[60vh]"
        onClick={(e) => {
          if (e.target === e.currentTarget) setSelectedUid(null);
        }}
        style={{
          backgroundImage:
            "radial-gradient(rgba(0,0,0,0.04) 1px, transparent 1px)",
          backgroundSize: "16px 16px",
        }}
      >
        {tiles.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center px-6 py-5 max-w-[280px]">
              <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <Wand2 className="w-7 h-7 text-gray-500" strokeWidth={1.5} />
              </div>
              <p className="text-base font-bold text-gray-900 tracking-tight">
                Lay out your fit
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Pick pieces from the shelf below, then drag to position,
                rotate, or scale them on this surface.
              </p>
            </div>
          </div>
        )}
        {tiles.map((t) => (
          <Tile
            key={t.uid}
            state={t}
            selected={selectedUid === t.uid}
            onSelect={setSelectedUid}
            onCommit={handleCommit}
            registerTile={registerTile}
          />
        ))}

        {/* Floating toolbar — appears on selection, vertically arranged
            along the right edge to keep it thumb-friendly. */}
        <AnimatePresence>
          {selectedTile && (
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className="absolute top-3 right-3 flex flex-col gap-2 bg-white border border-gray-200 rounded-2xl p-2 wh-lift-shadow z-50"
              onClick={(e) => e.stopPropagation()}
            >
              <ToolbarButton
                icon={BringToFront}
                label="Bring forward"
                onClick={() => bringForward(selectedTile.uid)}
              />
              <ToolbarButton
                icon={SendToBack}
                label="Send backward"
                onClick={() => sendBackward(selectedTile.uid)}
              />
              <Divider />
              <ToolbarButton
                icon={Plus}
                label="Scale up"
                onClick={() => adjustScale(selectedTile.uid, 0.15)}
              />
              <ToolbarButton
                icon={Minus}
                label="Scale down"
                onClick={() => adjustScale(selectedTile.uid, -0.15)}
              />
              <Divider />
              <ToolbarButton
                icon={ChevronUp}
                label={`Rotate +${ROT_STEP}°`}
                onClick={() => adjustRotation(selectedTile.uid, ROT_STEP)}
              />
              <ToolbarButton
                icon={ChevronDown}
                label={`Rotate -${ROT_STEP}°`}
                onClick={() => adjustRotation(selectedTile.uid, -ROT_STEP)}
              />
              <ToolbarButton
                icon={RotateCw}
                label={`Rotate +${ROT_STEP}° clockwise`}
                onClick={() => adjustRotation(selectedTile.uid, ROT_STEP)}
              />
              <Divider />
              <ToolbarButton
                icon={Trash2}
                label="Remove"
                tone="danger"
                onClick={() => deleteTile(selectedTile.uid)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Shelf — wardrobe pieces the user can add. Horizontally
          scrollable thumbnail chips. */}
      <div
        className="bg-white border border-gray-200 rounded-2xl px-3 py-3 wh-soft-shadow"
        aria-label="Wardrobe shelf"
      >
        <p className="text-[11px] uppercase tracking-widest font-semibold text-gray-500 mb-2 px-1">
          Add to canvas
        </p>
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          {items.length === 0 ? (
            <p className="text-sm text-gray-500 py-2 px-1">
              Your closet is empty — add some pieces first.
            </p>
          ) : (
            items.map((item) => {
              const alreadyOnCanvas = tiles.some(
                (t) => t.item.id === item.id
              );
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => addItem(item)}
                  disabled={alreadyOnCanvas}
                  className={cn(
                    "flex-none w-20 rounded-xl overflow-hidden border bg-gray-50 transition-all",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black",
                    alreadyOnCanvas
                      ? "opacity-40 cursor-not-allowed border-gray-200"
                      : "border-gray-200 hover:border-black active:scale-95"
                  )}
                  aria-label={`Add ${item.title} to canvas${
                    alreadyOnCanvas ? " (already added)" : ""
                  }`}
                >
                  {item.source_image_url ? (
                    <img
                      src={item.source_image_url}
                      alt=""
                      draggable={false}
                      className="w-full aspect-square object-contain p-1"
                    />
                  ) : (
                    <div className="w-full aspect-square flex items-center justify-center text-gray-300">
                      ✦
                    </div>
                  )}
                  <p className="text-[10px] font-medium text-gray-700 truncate px-1.5 pb-1">
                    {item.title}
                  </p>
                </button>
              );
            })
          )}
        </div>
      </div>

      {onSave && tiles.length > 0 && (
        <button
          type="button"
          onClick={handleSave}
          className="w-full flex items-center justify-center gap-2 px-5 py-4 rounded-2xl bg-black text-white text-sm font-semibold wh-lift-shadow wh-press active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black hover:bg-gray-900 transition-colors"
          aria-label="Save canvas layout"
        >
          <ShoppingBag className="w-4 h-4" strokeWidth={2.25} />
          Save layout
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Toolbar helpers
// ─────────────────────────────────────────────────────────────────────

interface ToolbarButtonProps {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  onClick: () => void;
  tone?: "default" | "danger";
}

function ToolbarButton({ icon: Icon, label, onClick, tone = "default" }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "h-10 w-10 rounded-xl flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black",
        tone === "danger"
          ? "text-red-500 hover:bg-red-50"
          : "text-gray-700 hover:bg-gray-100"
      )}
    >
      <Icon className="w-4 h-4" strokeWidth={2} />
    </button>
  );
}

function Divider() {
  return <div className="h-px bg-gray-200 my-1" aria-hidden />;
}
