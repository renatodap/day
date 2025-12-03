'use client';

import type { WeekDay } from '@/lib/types';

interface WeekRibbonProps {
  weekData: WeekDay[];
}

export function WeekRibbon({ weekData }: WeekRibbonProps) {
  // Reorder to show M T W T F S S (Monday first)
  // weekData is already Monday-first from the hook

  return (
    <div className="flex justify-center gap-3 mb-6">
      {weekData.map((day, idx) => (
        <DayIndicator key={day.date} day={day} label={getDayLabel(idx)} />
      ))}
    </div>
  );
}

const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function getDayLabel(index: number): string {
  return dayLabels[index];
}

interface DayIndicatorProps {
  day: WeekDay;
  label: string;
}

function DayIndicator({ day, label }: DayIndicatorProps) {
  const { won, isToday } = day;
  const isFuture = won === null && !isToday;

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs text-text-muted">{label}</span>
      <div className="relative">
        {won === true && (
          <div className="w-3 h-3 rounded-full bg-win" />
        )}
        {won === false && !isToday && (
          <span className="text-xs text-text-subtle">✗</span>
        )}
        {isToday && won !== true && (
          <div className="w-3 h-3 rounded-full border-2 border-text-subtle bg-transparent" />
        )}
        {isFuture && (
          <div className="w-1.5 h-1.5 rounded-full bg-text-subtle/30" />
        )}
        {isToday && won === true && (
          <div className="w-3 h-3 rounded-full bg-win" />
        )}
      </div>
    </div>
  );
}
