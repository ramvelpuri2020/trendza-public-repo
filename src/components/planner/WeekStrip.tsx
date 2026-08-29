'use client';

import { useMemo, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';
import { StatusDot } from './StatusDot';

const DAY_ABBREVIATIONS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

interface WeekStripProps {
  /** The currently selected date */
  selectedDate: Date;
  /** Called when a day is tapped */
  onSelectDate: (date: Date) => void;
  /**
   * Set of date strings (YYYY-MM-DD) that have a planned outfit.
   * Used to show a small indicator dot below planned days.
   */
  plannedDates?: Set<string>;
  /**
   * Map of date string -> generation status for showing loading states.
   */
  generationStatuses?: Map<string, 'pending' | 'generating' | 'completed' | 'failed'>;
  /**
   * Map of date string -> small try-on thumbnail URL for planned days.
   * Shown as a mini image instead of a plain dot so the week is scannable.
   */
  plannedThumbnails?: Map<string, string>;
}

/**
 * 7-day horizontal week strip starting from the Monday of the week containing
 * `selectedDate`. Each day shows the abbreviation + date number.
 * The currently selected day is a filled black circle.
 * Days with planned outfits show a small dot indicator.
 */
export function WeekStrip({
  selectedDate,
  onSelectDate,
  plannedDates = new Set(),
  generationStatuses = new Map(),
  plannedThumbnails = new Map(),
}: WeekStripProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Compute the Monday of the current week
  const weekDays = useMemo(() => {
    const dayOfWeek = selectedDate.getDay(); // 0=Sun, 1=Mon, ...
    // Convert to Mon=0 ... Sun=6
    const monIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(selectedDate);
    monday.setDate(selectedDate.getDate() - monIndex);

    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      return date;
    });
  }, [selectedDate]);

  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const formatDateStr = useCallback((date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }, []);

  const isToday = useCallback(
    (date: Date) => formatDateStr(date) === todayStr,
    [formatDateStr, todayStr],
  );

  const isSelected = useCallback(
    (date: Date) => formatDateStr(date) === formatDateStr(selectedDate),
    [formatDateStr, selectedDate],
  );

  // Scroll to make selected day visible
  const selectedIndex = weekDays.findIndex((d) => isSelected(d));
  // Auto-scroll could be added here with scrollRef

  return (
    <div
      ref={scrollRef}
      className="flex items-center justify-between px-4 py-1.5"
    >
      {weekDays.map((date, i) => {
        const dateStr = formatDateStr(date);
        const dayNum = date.getDate();
        const abbr = DAY_ABBREVIATIONS[i];
        const selected = isSelected(date);
        const today = isToday(date);
        const hasPlanned = plannedDates.has(dateStr);
        const genStatus = generationStatuses.get(dateStr);
        const thumbUrl = plannedThumbnails.get(dateStr);

        return (
          <button
            key={dateStr}
            type="button"
            onClick={() => {
              haptic('light');
              onSelectDate(date);
            }}
            className="flex flex-col items-center gap-1 relative"
            aria-label={`${abbr} ${dayNum}`}
          >
            {/* Day abbreviation */}
            <span
              className={cn(
                'text-[11px] font-medium tracking-tight transition-colors',
                selected
                  ? 'text-white'
                  : today
                    ? 'text-foreground'
                    : 'text-muted-foreground',
              )}
            >
              {abbr}
            </span>

            {/* Day number circle */}
            <div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition-all duration-200',
                selected
                  ? 'bg-foreground text-background shadow-md scale-105'
                  : today
                    ? 'bg-muted text-foreground ring-1 ring-border'
                    : 'bg-transparent text-muted-foreground hover:bg-muted/60',
              )}
            >
              {dayNum}
            </div>

            {/* Planned day indicator — try-on thumbnail if available, else status dot */}
            {hasPlanned && (
              <span className="absolute -bottom-2 flex h-4 w-4 items-center justify-center">
                {thumbUrl ? (
                  <img
                    src={thumbUrl}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="h-4 w-4 rounded-[5px] border border-border/60 object-cover shadow-sm"
                  />
                ) : (
                  <StatusDot status={genStatus} />
                )}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
