'use client';

import { useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';
import { StatusDot } from './StatusDot';

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const;

interface MonthViewProps {
  displayMonth: Date; // Any date in the target month
  selectedDate: Date;
  plannedDates: Set<string>;
  generationStatuses: Map<string, 'pending' | 'generating' | 'completed' | 'failed'>;
  /** Map of date string -> small try-on thumbnail URL for planned days */
  plannedThumbnails?: Map<string, string>;
  onSelectDate: (date: Date) => void;
  /** Called when navigating to previous/next month */
  onMonthChange?: (month: Date) => void;
}

/**
 * MonthView — a full-month calendar grid (always visible, no compact/expand
 * toggle). Planned days show their try-on photo as the day-cell background
 * so the month is scannable at a glance; pending/generating/failed days show
 * a shape-differentiated StatusDot instead.
 */
export function MonthView({
  displayMonth,
  selectedDate,
  plannedDates,
  generationStatuses,
  plannedThumbnails = new Map(),
  onSelectDate,
  onMonthChange,
}: MonthViewProps) {
  const formatDateStr = useCallback(
    (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
    [],
  );

  const todayStr = useMemo(() => formatDateStr(new Date()), [formatDateStr]);
  const selectedStr = formatDateStr(selectedDate);

  // ── Full month grid ───────────────────────────────────────────
  const calendarCells = useMemo(() => {
    const year = displayMonth.getFullYear();
    const month = displayMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPad = firstDay.getDay();

    const cells: Array<{ date: Date | null; key: string }> = [];
    for (let i = 0; i < startPad; i++) {
      cells.push({ date: null, key: `pad-start-${i}` });
    }
    for (let d = 1; d <= lastDay.getDate(); d++) {
      cells.push({ date: new Date(year, month, d), key: `day-${d}` });
    }
    const remaining = 7 - (cells.length % 7);
    if (remaining < 7) {
      for (let i = 0; i < remaining; i++) {
        cells.push({ date: null, key: `pad-end-${i}` });
      }
    }
    return cells;
  }, [displayMonth]);

  const handlePrevMonth = useCallback(() => {
    haptic('light');
    const prev = new Date(displayMonth);
    prev.setMonth(prev.getMonth() - 1);
    onMonthChange?.(prev);
  }, [displayMonth, onMonthChange]);

  const handleNextMonth = useCallback(() => {
    haptic('light');
    const next = new Date(displayMonth);
    next.setMonth(next.getMonth() + 1);
    onMonthChange?.(next);
  }, [displayMonth, onMonthChange]);

  // ── Render a single day cell ──────────────────────────────────
  const renderDayCell = useCallback(
    (date: Date) => {
      const dateStr = formatDateStr(date);
      const day = date.getDate();
      const selected = dateStr === selectedStr;
      const today = dateStr === todayStr;
      const hasPlanned = plannedDates.has(dateStr);
      const genStatus = generationStatuses.get(dateStr);
      const thumbUrl = plannedThumbnails.get(dateStr);
      const showThumb = hasPlanned && !!thumbUrl;

      return (
        <button
          key={dateStr}
          type="button"
          onClick={() => {
            haptic('light');
            onSelectDate(date);
          }}
          aria-label={`${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}${hasPlanned ? ', planned' : ''}`}
          className={cn(
            'relative mx-auto flex h-10 w-10 items-center justify-center rounded-full text-sm transition-all active:scale-95',
            selected
              ? 'bg-foreground text-background font-semibold shadow-sm'
              : today
                ? 'bg-muted text-foreground font-semibold ring-1 ring-border/60'
                : 'text-muted-foreground font-medium hover:bg-muted/60 hover:text-foreground',
          )}
        >
          {/* Planned day: the try-on photo fills the cell */}
          {showThumb && (
            <>
              <img
                src={thumbUrl}
                alt=""
                loading="lazy"
                decoding="async"
                className="absolute inset-0 h-full w-full rounded-full object-cover"
              />
              <span className="absolute inset-0 rounded-full bg-black/30" aria-hidden="true" />
            </>
          )}

          <span
            className={cn(
              'relative z-10',
              showThumb ? 'font-semibold text-white' : undefined,
              selected && !showThumb ? 'text-background' : undefined,
            )}
          >
            {day}
          </span>

          {/* Status affordance — dot when no photo yet (pending/generating/failed),
              tiny "done" dot on the corner when the photo is ready */}
          {hasPlanned && (
            <span className="absolute -bottom-0.5 -right-0.5 z-10 flex h-4 w-4 items-center justify-center">
              {showThumb ? (
                <StatusDot status={genStatus === 'completed' ? 'completed' : genStatus} />
              ) : (
                <StatusDot status={genStatus} />
              )}
            </span>
          )}
        </button>
      );
    },
    [selectedStr, todayStr, plannedDates, generationStatuses, plannedThumbnails, onSelectDate, formatDateStr],
  );

  return (
    <div className="px-4 pb-4">
      {/* ── Header: Month/Year + Navigation ─────────────────────── */}
      <div className="flex items-center justify-between mb-3">
        <motion.button
          type="button"
          onClick={handlePrevMonth}
          whileTap={{ scale: 0.9 }}
          className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </motion.button>

        <motion.h2
          key={displayMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm font-semibold text-foreground"
        >
          {displayMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </motion.h2>

        <motion.button
          type="button"
          onClick={handleNextMonth}
          whileTap={{ scale: 0.9 }}
          className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" />
        </motion.button>
      </div>

      {/* ── Weekday headers ────────────────────────────────────── */}
      <div className="grid grid-cols-7 mb-1.5">
        {WEEKDAY_LABELS.map((label, i) => (
          <div
            key={`${label}-${i}`}
            className="flex h-6 items-center justify-center text-[11px] font-semibold text-muted-foreground/60"
          >
            {label}
          </div>
        ))}
      </div>

      {/* ── Full month grid ────────────────────────────────────── */}
      <div className="grid grid-cols-7 gap-y-1">
        {calendarCells.map(({ date, key }) => {
          if (!date) {
            return <div key={key} className="flex items-center justify-center h-10" />;
          }
          return (
            <div key={key} className="flex items-center justify-center h-10">
              {renderDayCell(date)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
