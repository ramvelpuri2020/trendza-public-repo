'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Camera, Image as ImageIcon, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { WeekStrip } from './WeekStrip';
import { DayView } from './DayView';
import { MonthView } from './MonthView';
import { GenerationOverlay } from './GenerationOverlay';
import { useSubscription } from '@/components/subscription/SubscriptionProvider';
import { useUsageLimits } from '@/hooks/useUsageLimits';
import { PaywallModal } from '@/components/subscription/PaywallModal';
import {
  getPlannedOutfitForDate,
  getPlannedOutfitsForRange,
  planOutfitForDate,
  unplanDate,
  saveUserBasePhoto,
  getUserBasePhoto,
  type PlannerOutfit,
  type GeneratedImage,
} from '@/services/plannerService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { haptic, successTick } from '@/lib/haptics';
import type { SavedOutfit } from '@/hooks/useClosetData';

type ViewMode = 'day' | 'month';

interface PlannerViewProps {
  outfits: SavedOutfit[];
}

export function PlannerView({ outfits }: PlannerViewProps) {
  const navigate = useNavigate();

  // ── Subscription gating ─────────────────────────────────────────
  const { isPro } = useSubscription();
  const { canUseFeature, useFeature } = useUsageLimits();
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallFeature, setPaywallFeature] = useState('');

  // ── State ──────────────────────────────────────────────────────
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [plannedOutfit, setPlannedOutfit] = useState<{
    planner: PlannerOutfit | null;
    image: GeneratedImage | null;
  }>({ planner: null, image: null });
  const [plannedDates, setPlannedDates] = useState<Set<string>>(new Set());
  const [generationStatuses, setGenerationStatuses] = useState<
    Map<string, 'pending' | 'generating' | 'completed' | 'failed'>
  >(new Map());
  const [plannedThumbnails, setPlannedThumbnails] = useState<Map<string, string>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [showOutfitPicker, setShowOutfitPicker] = useState(false);

  // ── Data cache ─────────────────────────────────────────────────
  // Cache full query results (planner + image) keyed by date string.
  // Populated by loadDateData each time a date is first visited.
  // Re-visiting a date reads from cache — zero Supabase queries.
  const dataCacheRef = useRef<Map<string, { planner: PlannerOutfit | null; image: GeneratedImage | null }>>(new Map());

  // ── Base photo state ──────────────────────────────────────────
  const [hasBasePhoto, setHasBasePhoto] = useState<boolean | null>(null);
  const [basePhotoUrl, setBasePhotoUrl] = useState<string | null>(null);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatDateStr = useCallback((d: Date) => {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  // ── Check for base photo on mount ─────────────────────────────
  useEffect(() => {
    getUserBasePhoto().then((url) => {
      setBasePhotoUrl(url);
      setHasBasePhoto(url !== null);
    });
  }, []);

  // ── Base photo upload handler ─────────────────────────────────
  const handleFileSelected = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    try {
      const url = await saveUserBasePhoto(file);
      setHasBasePhoto(true);
      // Keep the URL state in sync too — otherwise the empty-day card
      // and generation overlay keep showing the previous photo.
      setBasePhotoUrl(url);
      setShowPhotoUpload(false);
      toast({
        title: 'Photo saved!',
        description: 'Your base photo is now stored. You can plan outfits and get AI try-on results.',
      });
      console.log('[Planner] Base photo saved:', url);
    } catch (err: any) {
      console.error('[Planner] Failed to save base photo:', err);
      toast({
        title: 'Upload failed',
        description: err?.message ?? 'Could not save photo. Try again.',
        variant: 'destructive',
      });
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, []);

  // ── Month load deduplication ───────────────────────────────────
  const lastLoadedMonthRef = useRef<string>('');

  // ── Polling management ─────────────────────────────────────────
  const abortControllerRef = useRef<AbortController | null>(null);

  const startPolling = useCallback(
    (genId: string, dateStr: string) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const signal = controller.signal;
      let cancelled = false;
      signal.addEventListener('abort', () => {
        cancelled = true;
      });

      const poll = async () => {
        let attempts = 0;
        const maxAttempts = 100;

        while (!cancelled && attempts < maxAttempts) {
          try {
            await new Promise<void>((resolve, reject) => {
              const timer = setTimeout(resolve, 2000);
              if (signal.aborted) {
                clearTimeout(timer);
                reject(new DOMException('Aborted', 'AbortError'));
                return;
              }
              const onAbort = () => {
                clearTimeout(timer);
                reject(new DOMException('Aborted', 'AbortError'));
              };
              signal.addEventListener('abort', onAbort, { once: true });
            });

            if (cancelled) return;

            const { data } = await supabase
              .from('planner_generated_images')
              .select('*')
              .eq('id', genId)
              .single();

            if (!data || cancelled) {
              attempts++;
              continue;
            }

            const genImage = data as GeneratedImage;

            if (genImage.status === 'completed' || genImage.status === 'failed') {
              if (!cancelled) {
                if (genImage.status === 'completed') successTick();
                setPlannedOutfit((prev) => ({ ...prev, image: genImage }));
                setGenerationStatuses((prev) => {
                  const next = new Map(prev);
                  next.set(dateStr, genImage.status as any);
                  return next;
                });
                const cached = dataCacheRef.current.get(dateStr);
                if (cached) {
                  dataCacheRef.current.set(dateStr, { ...cached, image: genImage });
                }
              }
              return;
            }
            attempts++;
          } catch (e: any) {
            if (e?.name === 'AbortError') return;
            attempts++;
          }
        }

        if (!cancelled) {
          console.warn('[Planner] Polling timed out for genId:', genId);
          try {
            await supabase
              .from('planner_generated_images')
              .update({
                status: 'failed',
                error_message: 'Generation timed out after 200s',
                updated_at: new Date().toISOString(),
              })
              .eq('id', genId);
          } catch {
            // Best-effort
          }

          setPlannedOutfit((prev) => ({
            ...prev,
            image: prev.image
              ? { ...prev.image, status: 'failed' as const, error_message: 'Generation timed out' }
              : null,
          }));
          setGenerationStatuses((prev) => {
            const next = new Map(prev);
            next.set(dateStr, 'failed');
            return next;
          });
        }
      };

      poll();
    },
    [],
  );

  // ── Data loading ───────────────────────────────────────────────
  const loadDateData = useCallback(
    async (date: Date) => {
      const dateStr = formatDateStr(date);

      // Check data cache first
      const cachedData = dataCacheRef.current.get(dateStr);
      if (cachedData) {
        setPlannedOutfit(cachedData);
        // Quick status refresh for pending/generating
        if (cachedData.image && (cachedData.image.status === 'pending' || cachedData.image.status === 'generating')) {
          try {
            const { data: quickCheck } = await supabase
              .from('planner_generated_images')
              .select('status, image_url, error_message')
              .eq('id', cachedData.image.id)
              .maybeSingle();
            if (quickCheck && (quickCheck.status === 'completed' || quickCheck.status === 'failed')) {
              const updated: typeof cachedData = {
                ...cachedData,
                image: { ...cachedData.image, ...quickCheck } as GeneratedImage,
              };
              dataCacheRef.current.set(dateStr, updated);
              setPlannedOutfit(updated);
              setGenerationStatuses((prev) => {
                const next = new Map(prev);
                next.set(dateStr, quickCheck.status as any);
                return next;
              });
              return;
            }
          } catch {
            // Fall through to polling
          }
          startPolling(cachedData.image.id, dateStr);
        }
        return;
      }

      setIsLoading(true);

      try {
        const result = await getPlannedOutfitForDate(dateStr);
        dataCacheRef.current.set(dateStr, result);
        setPlannedOutfit(result);

        if (result.image && (result.image.status === 'pending' || result.image.status === 'generating')) {
          startPolling(result.image.id, dateStr);
        }
      } catch (e) {
        console.error('[PlannerView] Failed to load date data:', e);
      } finally {
        setIsLoading(false);
      }
    },
    [formatDateStr, startPolling],
  );

  const loadMonthData = useCallback(async (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const monthKey = `${year}-${month}`;

    if (lastLoadedMonthRef.current === monthKey) return;
    lastLoadedMonthRef.current = monthKey;

    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);

    try {
      const planned = await getPlannedOutfitsForRange(start, end);
      const dateSet = new Set<string>();
      const statusMap = new Map<string, 'pending' | 'generating' | 'completed' | 'failed'>();
      const thumbMap = new Map<string, string>();
      planned.forEach((p) => {
        if (p.date) dateSet.add(p.date);
        if (p.status) statusMap.set(p.date, p.status);
        // Preload the small thumbnail into browser cache so switching dates is instant
        if (p.imageUrl) {
          thumbMap.set(p.date, p.imageUrl);
          const img = new Image();
          img.src = p.imageUrl;
        }
      });
      setPlannedDates(dateSet);
      setGenerationStatuses(statusMap);
      setPlannedThumbnails(thumbMap);
    } catch (e) {
      console.error('[PlannerView] Failed to load month data:', e);
    }
  }, []);

  useEffect(() => {
    const dateStr = formatDateStr(selectedDate);
    loadDateData(selectedDate);
    loadMonthData(selectedDate);
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [selectedDate, loadDateData, loadMonthData, formatDateStr]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  // ── Handlers ──────────────────────────────────────────────────
  const handleSelectDate = useCallback((date: Date) => {
    const dateStr = formatDateStr(date);

    // Check data cache — instant render if previously loaded
    const cachedData = dataCacheRef.current.get(dateStr);
    if (cachedData) {
      setPlannedOutfit(cachedData);
      setSelectedDate(date);
      return;
    }

    // No cache — just set the date; the useEffect will trigger loadDateData
    setSelectedDate(date);
  }, [formatDateStr]);

  const handlePlanOutfit = useCallback(() => {
    haptic('medium');
    // Check usage limits for free users
    if (!isPro) {
      const check = canUseFeature('outfit_tryon');
      if (!check.allowed) {
        setPaywallFeature('AI Outfit Try-Ons');
        setShowPaywall(true);
        return;
      }
    }

    if (hasBasePhoto === false) {
      setShowPhotoUpload(true);
      return;
    }
    if (outfits.length === 0) {
      navigate('/canvas');
      return;
    }
    setShowOutfitPicker(true);
  }, [isPro, canUseFeature, hasBasePhoto, outfits.length, navigate]);

  const handleSelectOutfit = useCallback(
    async (outfit: SavedOutfit) => {
      // Deduct usage for free users before planning
      if (!isPro) {
        const used = await useFeature('outfit_tryon');
        if (!used) {
          setPaywallFeature('AI Outfit Try-Ons');
          setShowPaywall(true);
          setIsLoading(false);
          return;
        }
      }

      setShowOutfitPicker(false);
      setIsLoading(true);
      try {
        await planOutfitForDate(outfit, selectedDate);
        haptic('selection');
        dataCacheRef.current.delete(formatDateStr(selectedDate));
        lastLoadedMonthRef.current = '';
        await loadDateData(selectedDate);
        await loadMonthData(selectedDate);
      } catch (e) {
        console.error('[PlannerView] Failed to plan outfit:', e);
      } finally {
        setIsLoading(false);
      }
    },
    [selectedDate, formatDateStr, loadDateData, loadMonthData, isPro, useFeature],
  );

  const handleRemoveOutfit = useCallback(async () => {
    haptic('medium');
    const dateStr = formatDateStr(selectedDate);
    setIsLoading(true);
    try {
      await unplanDate(dateStr);
      dataCacheRef.current.delete(dateStr);
      lastLoadedMonthRef.current = '';
      setPlannedOutfit({ planner: null, image: null });
      await loadMonthData(selectedDate);
    } catch (e) {
      console.error('[PlannerView] Failed to remove outfit:', e);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate, formatDateStr, loadMonthData]);

  const handleToday = useCallback(() => {
    haptic('light');
    setSelectedDate(new Date());
  }, []);

  // ── Derived state ──────────────────────────────────────────────
  const currentGenStatus = useMemo(() => {
    if (!plannedOutfit.image) return null;
    return plannedOutfit.image.status as 'idle' | 'pending' | 'generating' | 'completed' | 'failed';
  }, [plannedOutfit.image]);

  // Full-screen scanning overlay shows while the AI is generating
  // (pending = queued, generating = in progress).
  const isGeneratingOverlay =
    currentGenStatus === 'pending' || currentGenStatus === 'generating';

  // Has the user generated a try-on before? Drives whether the empty day
  // card shows the onboarding-style "Plan an outfit for this day" copy
  // (kept only for new users who haven't done their first generation) or
  // just the base photo + CTA for everyone else.
  const hasDoneGeneration =
    plannedDates.size > 0 || generationStatuses.size > 0;

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div className="flex h-full flex-col bg-background">
      {/* Paywall gate modal */}
      <PaywallModal
        open={showPaywall}
        onClose={() => setShowPaywall(false)}
        feature={paywallFeature}
      />

      {/* ── Full-screen generation overlay ────────────────────────
         Takes over the whole phone screen while a try-on is being
         generated: base photo in the background + glowing scanning-
         line reveal sweeping at torso level. */}
      <AnimatePresence>
        {isGeneratingOverlay && (
          <GenerationOverlay basePhotoUrl={basePhotoUrl} />
        )}
      </AnimatePresence>
      {/* Hidden file input for photo upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileSelected}
      />

      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-5 pt-1 pb-0">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              haptic('light');
              navigate(-1);
            }}
            aria-label="Back"
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={2} />
          </button>
          <h1 className="text-xl font-semibold tracking-tight">Planner</h1>
        </div>
        <button
          type="button"
          onClick={handleToday}
          className={cn(
            'rounded-full px-5 py-2 text-sm font-semibold transition-all active:scale-[0.97]',
            formatDateStr(selectedDate) === formatDateStr(new Date())
              ? 'bg-foreground text-background shadow-sm'
              : 'bg-muted text-foreground hover:bg-muted/80 border border-border/40',
          )}
        >
          Today
        </button>
      </header>

      {/* ── Day/Month Tab Switcher ─────────────────────────────── */}
      <div className="px-5 pb-1">
        <div className="inline-flex rounded-full bg-muted p-1 shadow-sm">
          <motion.button
            type="button"
            onClick={() => {
              haptic('light');
              setViewMode('day');
            }}
            layout
            className={cn(
              'relative rounded-full px-6 py-2 text-sm font-medium transition-all active:scale-[0.97]',
              viewMode === 'day'
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground/80 border border-border/30',
            )}
          >
            {viewMode === 'day' && (
              <motion.span
                layoutId="view-tab-bg"
                className="absolute inset-0 rounded-full bg-background shadow-sm"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            <span className="relative z-10">Day</span>
          </motion.button>
          <motion.button
            type="button"
            onClick={() => {
              haptic('light');
              setViewMode('month');
            }}
            layout
            className={cn(
              'relative rounded-full px-6 py-2 text-sm font-medium transition-all active:scale-[0.97]',
              viewMode === 'month'
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground/80 border border-border/30',
            )}
          >
            {viewMode === 'month' && (
              <motion.span
                layoutId="view-tab-bg"
                className="absolute inset-0 rounded-full bg-background shadow-sm"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            <span className="relative z-10">Month</span>
          </motion.button>
        </div>
      </div>

      {/* ── Week Strip ─────────────────────────────────────────── */}
      {viewMode === 'day' && (
        <WeekStrip
          selectedDate={selectedDate}
          onSelectDate={handleSelectDate}
          plannedDates={plannedDates}
          generationStatuses={generationStatuses}
          plannedThumbnails={plannedThumbnails}
        />
      )}

      <div className="mx-5 h-px bg-border/60" />

      {/* ── Content ────────────────────────────────────────────── */}
      <AnimatePresence mode="popLayout">
        {viewMode === 'day' ? (
          <motion.div
            key="day-view"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="flex flex-1 flex-col"
          >
            <DayView
              date={selectedDate}
              tryOnImageUrl={plannedOutfit.image?.image_url ?? null}
              generationStatus={currentGenStatus}
              outfitName={plannedOutfit.planner?.outfit_data?.name ?? undefined}
              outfitItems={plannedOutfit.planner?.outfit_data?.items}
              hasOutfits={outfits.length > 0}
              onPlanOutfit={handlePlanOutfit}
              onChangeOutfit={handlePlanOutfit}
              onRemoveOutfit={handleRemoveOutfit}
              errorMessage={plannedOutfit.image?.error_message}
              hasBasePhoto={hasBasePhoto}
              basePhotoUrl={basePhotoUrl}
              hasDoneGeneration={hasDoneGeneration}
              onUploadPhoto={() => {
                setShowPhotoUpload(true);
                fileInputRef.current?.click();
              }}
            />
          </motion.div>
        ) : (
          <motion.div
            key="month-view"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="flex flex-1 flex-col pt-3"
          >
            {/* Compact MonthView with integrated navigation + expand */}
            <div className="mx-4 mb-2 rounded-2xl bg-card/60 border border-border/40 shadow-sm">
              <MonthView
                displayMonth={selectedDate}
                selectedDate={selectedDate}
                plannedDates={plannedDates}
                generationStatuses={generationStatuses}
                plannedThumbnails={plannedThumbnails}
                onSelectDate={handleSelectDate}
                onMonthChange={(month) => setSelectedDate(month)}
              />
            </div>
            <div className="mx-5 h-px bg-border/40 mb-3" />
            {/* DayView always visible above the fold */}
            <DayView
              date={selectedDate}
              tryOnImageUrl={plannedOutfit.image?.image_url ?? null}
              generationStatus={currentGenStatus}
              outfitName={plannedOutfit.planner?.outfit_data?.name ?? undefined}
              outfitItems={plannedOutfit.planner?.outfit_data?.items}
              hasOutfits={outfits.length > 0}
              onPlanOutfit={handlePlanOutfit}
              onChangeOutfit={handlePlanOutfit}
              onRemoveOutfit={handleRemoveOutfit}
              errorMessage={plannedOutfit.image?.error_message}
              hasBasePhoto={hasBasePhoto}
              basePhotoUrl={basePhotoUrl}
              hasDoneGeneration={hasDoneGeneration}
              onUploadPhoto={() => {
                setShowPhotoUpload(true);
                fileInputRef.current?.click();
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Photo Upload Modal ─────────────────────────────────── */}
      <AnimatePresence>
        {showPhotoUpload && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-6"
            onClick={() => setShowPhotoUpload(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm bg-white rounded-3xl p-8 text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                <Camera className="h-9 w-9 text-muted-foreground" strokeWidth={1.5} />
              </div>
              <h2 className="text-xl font-semibold mb-2">Upload Your Photo</h2>
              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                Take or upload a full-body photo so the AI can generate realistic try-on images of you wearing your planned outfits.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => {
                    haptic('light');
                    if (fileInputRef.current) {
                      fileInputRef.current.capture = 'environment';
                      fileInputRef.current.click();
                    }
                  }}
                  disabled={uploadingPhoto}
                  className="w-full rounded-full bg-foreground py-3.5 text-sm font-semibold text-background hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {uploadingPhoto ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Camera className="h-4 w-4" />
                      Take a Photo
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    haptic('light');
                    if (fileInputRef.current) {
                      fileInputRef.current.removeAttribute('capture');
                      fileInputRef.current.click();
                    }
                  }}
                  disabled={uploadingPhoto}
                  className="w-full rounded-full bg-muted py-3.5 text-sm font-semibold text-foreground hover:bg-muted/80 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <ImageIcon className="h-4 w-4" />
                  Choose from Gallery
                </button>
                <button
                  type="button"
                  onClick={() => {
                    haptic('light');
                    setShowPhotoUpload(false);
                  }}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors pt-2"
                >
                  Skip for now
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Outfit Picker Modal ────────────────────────────────── */}
      <AnimatePresence>
        {showOutfitPicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => setShowOutfitPicker(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 360, damping: 32 }}
              className="w-full max-w-lg bg-white rounded-t-[28px] max-h-[75vh] flex flex-col shadow-[0_-4px_20px_rgba(0,0,0,0.08)]"
              onClick={(e) => e.stopPropagation()}
              style={{ paddingBottom: `calc(16px + env(safe-area-inset-bottom, 0px))` }}
            >
              {/* Drag handle */}
              <div className="mx-auto mt-2 mb-2 h-1 w-10 rounded-full bg-gray-200" />

              {/* Header */}
              <div className="flex items-center justify-between px-5 pb-2 pt-1">
                <h2 className="text-base font-semibold text-gray-900">Pick an Outfit</h2>
                <button
                  type="button"
                  onClick={() => setShowOutfitPicker(false)}
                  className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors px-3 py-1"
                >
                  Cancel
                </button>
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto px-4 pb-4">
                <div className="space-y-2">
                  {outfits.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 px-8">
                      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
                        <span className="text-2xl">🧥</span>
                      </div>
                      <p className="text-sm font-medium text-gray-500 text-center leading-relaxed">
                        No saved outfits yet.
                      </p>
                      <p className="text-xs text-gray-400 mt-1 text-center">
                        Create one in Canvas first, then plan it here.
                      </p>
                    </div>
                  ) : (
                    outfits.map((outfit) => {
                      const previewItems = outfit.items
                        .filter((i) => i.source_image_url)
                        .slice(0, 3);
                      const hasThumbnail = !!outfit.thumbnail_url;

                      return (
                        <button
                          key={outfit.id}
                          type="button"
                          onClick={() => handleSelectOutfit(outfit)}
                          className="flex w-full items-center gap-3 rounded-2xl bg-gray-50 p-3 text-left hover:bg-gray-100 transition-colors active:scale-[0.98] border border-gray-100 hover:border-gray-200"
                        >
                          {/* Visual preview — thumbnail collage or fallback */}
                          <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100">
                            {hasThumbnail ? (
                              <img
                                src={outfit.thumbnail_url!}
                                alt={outfit.name}
                                className="h-full w-full object-cover"
                              />
                            ) : previewItems.length > 0 ? (
                              <div className="relative h-full w-full">
                                {previewItems.map((item, idx) => (
                                  <img
                                    key={item.id}
                                    src={item.source_image_url}
                                    alt={item.title || ''}
                                    className="absolute rounded-lg object-cover border border-white"
                                    loading="lazy"
                                    style={{
                                      width: '100%',
                                      height: '100%',
                                      left: `${idx * 8}px`,
                                      top: `${idx * 4}px`,
                                      zIndex: 3 - idx,
                                      transform: `rotate(${(idx - 1) * 6}deg)`,
                                      opacity: Math.max(0.3, 1 - idx * 0.3),
                                    }}
                                  />
                                ))}
                              </div>
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <span className="text-sm text-gray-300">🧥</span>
                              </div>
                            )}
                          </div>

                          {/* Text: single line with name + piece count */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate leading-tight">
                              {outfit.name}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {outfit.items.length} {outfit.items.length === 1 ? 'piece' : 'pieces'}
                              {outfit.score ? (
                                <span className="text-gray-400"> · {outfit.score} pts</span>
                              ) : null}
                            </p>
                          </div>

                          {/* Selection chevron */}
                          <div className="flex-shrink-0 text-gray-300">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                              <path
                                d="M6 4L10 8L6 12"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
