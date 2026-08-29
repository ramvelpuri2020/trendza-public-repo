import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScanView } from "@/components/ScanView";
import ClosetView from "@/components/closet/ClosetView";
import { FitsView } from "@/components/fits/FitsView";
import { PlannerView } from "@/components/planner/PlannerView";
import {
  Shirt,
  LayoutGrid,
  Layers,
  Bookmark,
  CalendarDays,
  Plus,
  Upload,
  Scissors,
  Camera,
  X,
  CheckCircle2,
} from "lucide-react";
import { Shuffler } from "@/components/whering/shuffler";
import { Wardrobe } from "@/components/whering/wardrobe";
import { Canvas } from "@/components/whering/canvas";
import { Clipper } from "@/components/whering/clipper";
import { UploadItemFlow } from "@/components/whering/UploadItemFlow";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState, useCallback, useRef } from "react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import Profile from "@/pages/Profile";

import { useClosetData, type ClosetItem } from "@/hooks/useClosetData";
import { thrust } from "@/lib/haptics";
import { cn } from "@/lib/utils";

// ─── FAB bottom sheet actions ───

type SheetAction = "camera" | "clip" | "create" | "plan";

const sheetItems: {
  key: SheetAction;
  label: string;
  desc: string;
  icon: typeof Upload;
}[] = [
  {
    key: "camera",
    label: "Upload Item",
    desc: "Take a photo and add to your wardrobe",
    icon: Camera,
  },
  {
    key: "clip",
    label: "Clip",
    desc: "Crop & detail from any store",
    icon: Scissors,
  },
  {
    key: "create",
    label: "Create Outfit",
    desc: "Style a look on the canvas",
    icon: Layers,
  },
  {
    key: "plan",
    label: "Plan a Day",
    desc: "Schedule what to wear",
    icon: CalendarDays,
  },
];

function FabBottomSheet({
  open,
  onClose,
  onAction,
}: {
  open: boolean;
  onClose: () => void;
  onAction: (action: SheetAction) => void;
}) {
  const [mounted, setMounted] = useState(open);

  useEffect(() => {
    if (open) setMounted(true);
    else {
      const t = setTimeout(() => setMounted(false), 300);
      return () => clearTimeout(t);
    }
  }, [open]);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-50" aria-modal="true" role="dialog">
      <button
        type="button"
        aria-label="Close menu"
        onClick={onClose}
        className={cn(
          "absolute inset-0 transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0"
        )}
        style={{
          backgroundColor: "rgba(0,0,0,0.4)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
        }}
      />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: open ? 0 : "100%" }}
        transition={{ type: "spring", stiffness: 360, damping: 32 }}
        className="absolute inset-x-0 bottom-0 rounded-t-[28px] bg-white pt-3 shadow-2xl"
        style={{ paddingBottom: `calc(40px + env(safe-area-inset-bottom, 0px))` }}
      >
        <div className="mx-auto mb-2 h-1.5 w-10 rounded-full bg-gray-200" />
        <div className="flex items-center justify-between px-6 pb-2 pt-1">
          <h2 className="text-lg font-semibold text-gray-900">
            Add to Wardrobe
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-4">
          {sheetItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  thrust();
                  onAction(item.key);
                }}
                className="flex w-full items-center gap-4 rounded-2xl px-3 text-left transition-colors active:bg-gray-50"
                style={{ minHeight: 64 }}
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black text-white">
                  <Icon className="h-5 w-5" strokeWidth={2} />
                </span>
                <span className="flex-1">
                  <span className="block text-[15px] font-semibold text-gray-900">
                    {item.label}
                  </span>
                  <span className="block text-[13px] text-gray-500">
                    {item.desc}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

// ─── FAB Button ───

function FabButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label="Add to wardrobe"
      onClick={() => {
        thrust();
        onClick();
      }}
      className="relative z-30 flex items-center justify-center rounded-full bg-black text-white transition-transform active:scale-95"
      style={{
        height: 58,
        width: 58,
        marginTop: -29,
        boxShadow: "0 8px 24px rgba(0,0,0,0.22), 0 2px 6px rgba(0,0,0,0.12)",
      }}
    >
      <Plus className="h-7 w-7" strokeWidth={2.5} />
    </button>
  );
}

// ── Processing Pill ──────────────────────────────────────────────────
// Shown when the upload sheet is dismissed while items are still being processed.
// Displays progress (e.g. "Processing 3/10") with a small spinner.
// Tapping the pill reopens the full sheet.
// When all items finish, briefly flashes a completion state then auto-dismisses.

type ProcessingPillState = "running" | "completing" | null;

function ProcessingPill({
  done,
  total,
  failed,
  onTap,
}: {
  done: number;
  total: number;
  failed: number;
  onTap: () => void;
}) {
  const [phase, setPhase] = useState<"processing" | "complete">(total > 0 && done + failed >= total ? "complete" : "processing");

  useEffect(() => {
    if (total > 0 && done + failed >= total) {
      // All done — briefly flash completion
      const t = setTimeout(() => setPhase("complete"), 100);
      return () => clearTimeout(t);
    } else {
      setPhase("processing");
    }
  }, [done, failed, total]);

  return (
    <motion.button
      initial={{ y: 80, opacity: 0, scale: 0.9 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: 80, opacity: 0, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
      onClick={onTap}
      className="fixed left-1/2 -translate-x-1/2 z-[65] flex items-center gap-2.5 rounded-full bg-black/90 backdrop-blur-md px-4 py-2.5 shadow-lg border border-white/10"
      style={{ bottom: `calc(80px + env(safe-area-inset-bottom, 0px))` }}
    >
      {phase === "processing" ? (
        <>
          <div className="relative h-5 w-5 flex-shrink-0">
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-white/20"
            />
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-t-transparent border-l-transparent border-r-white/80 border-b-white/80"
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
            />
          </div>
          <span className="text-sm font-semibold text-white whitespace-nowrap">
            Processing {done}/{total}
          </span>
          {failed > 0 && (
            <span className="text-xs text-red-300 font-medium">
              · {failed} failed
            </span>
          )}
        </>
      ) : (
        <>
          <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0" />
          <span className="text-sm font-semibold text-white whitespace-nowrap">
            {done}/{total} done ✓
          </span>
          {failed > 0 && (
            <span className="text-xs text-red-300 font-medium">
              · {failed} failed
            </span>
          )}
        </>
      )}
    </motion.button>
  );
}

// ─── Main Index ───

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const pathSegments = location.pathname.split("/").filter(Boolean);
  const currentPath = pathSegments[0] ?? "dress-me";

  // Sheet & upload state
  const [sheetOpen, setSheetOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [clipperOpen, setClipperOpen] = useState(false);

  // Bumped every time a clip or upload finishes and redirects to the
  // wardrobe tab. Used as a `key` on <Wardrobe> so the tab REMOUNTS with
  // the "All" filter instead of keeping the user's previous filter
  // (e.g. "Tops") — freshly clipped/uploaded items are inserted as
  // `category: 'pending'` and only show up under "All" until the AI
  // classifier categorizes them.
  const [wardrobeResetKey, setWardrobeResetKey] = useState(0);

  // Processing queue state from UploadItemFlow — used to show the pill
  const [processingState, setProcessingState] = useState<{
    isProcessing: boolean;
    total: number;
    done: number;
    failed: number;
  } | null>(null);

  // Keep UploadItemFlow mounted while processing is active (so the queue
  // continues running even after the sheet is dismissed).
  const showUploadFlows = uploadOpen || processingState?.isProcessing === true;

  // Lift closet data state so UploadItemFlow, Wardrobe, Shuffler, Canvas, and Saved tab share the same instance
  const { items, outfits, isInitialLoad, loadError, retry, refresh, insertItem, updateItem, saveOutfit, deleteOutfit } = useClosetData();

  const handleItemInserted = useCallback(
    (item: ClosetItem) => {
      insertItem(item);
    },
    [insertItem]
  );

  // Patch local state after Clipper/UploadItemFlow's fire-and-forget
  // AI classify completes a successful UPDATE. Without this the row
  // would stay `category: 'pending'` in our hook's items[], not
  // slotting into Shuffler/Canvas/the main closet grid.
  const handleItemUpdated = useCallback(
    (item: ClosetItem) => {
      updateItem(item);
    },
    [updateItem]
  );

  const handleProcessingChange = useCallback(
    (state: { isProcessing: boolean; total: number; done: number; failed: number } | null) => {
      setProcessingState(state);
    },
    []
  );

  // Default to dress-me
  useEffect(() => {
    if (location.pathname === "/") {
      navigate("/dress-me", { replace: true });
    }
  }, [location.pathname, navigate]);



  const handleTabChange = (value: string) => {
    navigate(`/${value}`);
  };

  const handleSheetAction = (action: SheetAction) => {
    setSheetOpen(false);
    if (action === "camera") setUploadOpen(true);
    if (action === "clip") setClipperOpen(true);
    if (action === "create") navigate("/canvas");
    if (action === "plan") navigate("/planner");
  };

  // Tab icons + labels for the 5 main tabs
  const tabs: {
    key: string;
    label: string;
    icon: typeof Shirt;
    side: "left" | "right";
  }[] = [
    { key: "dress-me", label: "Dress Me", icon: Shirt, side: "left" },
    { key: "wardrobe", label: "Wardrobe", icon: LayoutGrid, side: "left" },
    { key: "planner", label: "Planner", icon: CalendarDays, side: "right" },
    { key: "canvas", label: "Canvas", icon: Layers, side: "right" },
    { key: "fits", label: "Saved", icon: Bookmark, side: "right" },
  ];

  const renderContent = () => {
    try {
      switch (currentPath) {
        case "dress-me":
          return (
            <div className="whering-theme bg-muted h-full overflow-hidden">
              <Shuffler
                closetItems={items}
                onSaveOutfit={(name, selectedItems, metadata, thumbnail) => {
                  console.log('📦 [Index] Shuffler onSaveOutfit called — items:', selectedItems.length, 'name:', name)
                  return saveOutfit({ name, items: selectedItems, ...(metadata !== undefined && { metadata }), ...(thumbnail !== undefined && { thumbnail }) })
                }}
                onSaved={() => {
                  console.log('📍 [Index] onSaved fired — navigating to /fits')
                  navigate("/fits")
                }}
              />
            </div>
          );
        case "wardrobe":
          return (
            <div className="whering-theme bg-muted h-full overflow-hidden">
              {/* key remounts the tab with the "All" filter when the user
                  lands here right after clipping/uploading — see
                  wardrobeResetKey in the clip/upload onSaved handlers. */}
              <Wardrobe key={wardrobeResetKey} items={items} onRefresh={refresh} />
            </div>
          );
        case "canvas":
          return (
            <div className="whering-theme bg-muted h-full overflow-hidden">
              <Canvas
                closetItems={items}
                outfits={outfits}
                onSaveOutfit={(name, selectedItems, metadata, thumbnail) => {
                  console.log('📦 [Index] Canvas onSaveOutfit called — items:', selectedItems.length, 'name:', name)
                  return saveOutfit({ name, items: selectedItems, ...(metadata !== undefined && { metadata }), ...(thumbnail !== undefined && { thumbnail }) })
                }}
                onDeleteOutfit={deleteOutfit}
                onSaved={() => {
                  console.log('📍 [Index] onSaved fired — navigating to /fits')
                  navigate("/fits")
                }}
              />
            </div>
          );
        case "planner":
          return (
            <div className="whering-theme bg-muted h-full overflow-hidden">
              <PlannerView outfits={outfits} />
            </div>
          );

        case "fits":
          return (
            <FitsView
              outfits={outfits}
              isInitialLoad={isInitialLoad}
              loadError={loadError}
              onRetry={retry}
              onRefresh={refresh}
              onDeleteOutfit={deleteOutfit}
              onBack={() => navigate("/fits")}
              onEditOutfit={(id) => navigate(`/canvas?edit=${id}`)}
            />
          );
        case "scan":
          return <ScanView />;
        case "closet":
          return <ClosetView />;
        case "profile":
          return <Profile />;
        default:
          return (
            <div className="whering-theme bg-muted h-full overflow-hidden">
              <Shuffler
                closetItems={items}
                onSaveOutfit={(name, selectedItems, metadata, thumbnail) => {
                  console.log('📦 [Index] Shuffler onSaveOutfit called — items:', selectedItems.length, 'name:', name)
                  return saveOutfit({ name, items: selectedItems, ...(metadata !== undefined && { metadata }), ...(thumbnail !== undefined && { thumbnail }) })
                }}
                onSaved={() => {
                  console.log('📍 [Index] onSaved fired — navigating to /fits')
                  navigate("/fits")
                }}
              />
            </div>
          );
      }
    } catch {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Something went wrong
            </h3>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-black text-white rounded-xl"
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
  };

  return (
    <div
      className="h-full app-content bg-white relative overflow-x-hidden flex flex-col"
    >
      <DashboardHeader />

      <Tabs
        value={currentPath}
        onValueChange={handleTabChange}
        className="flex flex-col flex-1"
      >
        <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 pb-24">
          {renderContent()}
        </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 z-50 mx-auto lg:max-w-[480px] bg-white/90 backdrop-blur-xl border-t border-gray-200/70 shadow-[0_-1px_3px_rgba(0,0,0,0.03)]">
          <motion.div
            initial={false}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            <TabsList className="w-full h-16 flex items-stretch bg-transparent gap-0 p-0 rounded-none">
              {/* Left tabs (Dress Me, Wardrobe) */}
              <div className="flex flex-1 justify-around">
                {tabs
                  .filter((t) => t.side === "left")
                  .map((t) => {
                    const active = currentPath === t.key;
                    const Icon = t.icon;
                    return (
                      <TabsTrigger
                        key={t.key}
                        value={t.key}
                        aria-label={`${t.label} tab`}
                        className="flex flex-col items-center justify-center gap-0.5 flex-1 data-[state=active]:bg-transparent data-[state=active]:text-black data-[state=active]:shadow-none text-gray-400 hover:text-gray-700 rounded-none h-full transition-colors focus-visible:outline-none"
                      >
                        <Icon
                          className="h-6 w-6 transition-colors"
                          strokeWidth={active ? 2.4 : 1.75}
                        />
                        <span className="text-[10px] font-semibold tracking-wide">
                          {t.label}
                        </span>
                      </TabsTrigger>
                    );
                  })}
              </div>

              {/* FAB spacer */}
              <div className="w-16 flex-shrink-0 flex items-start justify-center">
                <FabButton onClick={() => setSheetOpen(true)} />
              </div>

              {/* Right tabs (Planner, Saved, Canvas) */}
              <div className="flex flex-1 justify-around">
                {tabs
                  .filter((t) => t.side === "right")
                  .map((t) => {
                    const active = currentPath === t.key;
                    const Icon = t.icon;
                    return (
                      <TabsTrigger
                        key={t.key}
                        value={t.key}
                        aria-label={`${t.label} tab`}
                        className="flex flex-col items-center justify-center gap-0.5 flex-1 data-[state=active]:bg-transparent data-[state=active]:text-black data-[state=active]:shadow-none text-gray-400 hover:text-gray-700 rounded-none h-full transition-colors focus-visible:outline-none"
                      >
                        <Icon
                          className="h-6 w-6 transition-colors"
                          strokeWidth={active ? 2.4 : 1.75}
                        />
                        <span className="text-[10px] font-semibold tracking-wide">
                          {t.label}
                        </span>
                      </TabsTrigger>
                    );
                  })}
              </div>
            </TabsList>
          </motion.div>
        </div>
      </Tabs>

      {/* FAB Bottom Sheet */}
      <FabBottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onAction={handleSheetAction}
      />

      {/* Upload Item Flow — keep mounted while processing is active */}
      {showUploadFlows && (
        <UploadItemFlow
          open={uploadOpen}
          onClose={() => setUploadOpen(false)}
          onItemInserted={handleItemInserted}
          onItemUpdated={handleItemUpdated}
          onProcessingChange={handleProcessingChange}
          onComplete={() => {
            console.log('📍 [Index] UploadItemFlow onComplete — navigating to /wardrobe')
            // Remount the wardrobe tab on "All" so freshly uploaded
            // (still-pending) items are visible right away.
            setWardrobeResetKey((k) => k + 1)
            navigate("/wardrobe")
          }}
        />
      )}

      {/* Processing pill — shown when items are processing but sheet is closed */}
      <AnimatePresence>
        {processingState && !uploadOpen && (
          <ProcessingPill
            done={processingState.done}
            total={processingState.total}
            failed={processingState.failed}
            onTap={() => setUploadOpen(true)}
          />
        )}
      </AnimatePresence>

      {/* Clipper overlay */}
      <AnimatePresence>
        {clipperOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-white"
          >
            <div className="whering-theme h-full">
              <Clipper
                demoItems={items}
                onItemInserted={handleItemInserted}
                onItemUpdated={handleItemUpdated}
                onSaved={() => {
                  setClipperOpen(false)
                  // Remount the wardrobe tab on "All" so the just-clipped
                  // item (category: 'pending' until AI classifies it) is
                  // visible immediately instead of being hidden behind the
                  // user's previous filter (e.g. "Tops").
                  setWardrobeResetKey((k) => k + 1)
                  navigate("/wardrobe")
                }}
              />
            </div>
              <button
                onClick={() => setClipperOpen(false)}
                className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/10 flex items-center justify-center hover:bg-black/20 transition-colors"
              >
                <X className="w-5 h-5 text-gray-700" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;
