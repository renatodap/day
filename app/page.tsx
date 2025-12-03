'use client';

import { useState, useCallback, useRef } from 'react';
import { WeightDisplay } from '@/components/weight-display';
import { TrendIndicator } from '@/components/trend-indicator';
import { Dot } from '@/components/dot';
import { WeightInput } from '@/components/weight-input';
import { WeekView } from '@/components/week-view';
import { useWeightData } from '@/lib/hooks/use-weight-data';

export default function Home() {
  const {
    todayWeight,
    weekAgoWeight,
    todayChecks,
    weekData,
    isLoading,
    saveWeight,
    toggleCheck,
  } = useWeightData();

  const [showWeightInput, setShowWeightInput] = useState(false);
  const [showWeekView, setShowWeekView] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);

  // Touch handling for swipe up
  const touchStartY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Determine ambient glow state
  const allComplete = todayChecks.deficit && todayChecks.protein && todayChecks.workout;
  const trendingDown = todayWeight !== null && weekAgoWeight !== null && todayWeight < weekAgoWeight;
  const trendingUp = todayWeight !== null && weekAgoWeight !== null && todayWeight > weekAgoWeight;

  let ambientClass = '';
  if (allComplete) {
    ambientClass = 'complete';
  } else if (trendingDown) {
    ambientClass = 'winning';
  } else if (trendingUp) {
    ambientClass = 'losing';
  }

  // Handle weight save with pulse animation
  const handleWeightSave = useCallback(async (weight: number) => {
    await saveWeight(weight);
    setIsPulsing(true);
    setTimeout(() => setIsPulsing(false), 300);
  }, [saveWeight]);

  // Handle check toggle with haptic for all complete
  const handleToggleCheck = useCallback(async (type: 'deficit' | 'protein' | 'workout') => {
    await toggleCheck(type);

    // Check if this completes all three
    const newChecks = { ...todayChecks, [type]: !todayChecks[type] };
    if (newChecks.deficit && newChecks.protein && newChecks.workout) {
      // Success haptic for completing all
      if ('vibrate' in navigator) {
        navigator.vibrate([10, 50, 15]);
      }
    }
  }, [toggleCheck, todayChecks]);

  // Swipe up detection
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const endY = e.changedTouches[0].clientY;
    const diff = touchStartY.current - endY;

    // Swipe up threshold: 100px
    if (diff > 100) {
      setShowWeekView(true);
    }
  }, []);

  // Handle undo (long press on filled dot)
  const handleUndo = useCallback((type: 'deficit' | 'protein' | 'workout') => {
    if (todayChecks[type]) {
      toggleCheck(type);
    }
  }, [toggleCheck, todayChecks]);

  // Loading state
  if (isLoading) {
    return (
      <main className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-text-muted animate-pulse">...</div>
      </main>
    );
  }

  return (
    <>
      {/* Ambient background glow */}
      <div className={`ambient-glow ${ambientClass}`} />

      {/* Main screen */}
      <main
        ref={containerRef}
        className="min-h-screen bg-transparent flex flex-col items-center justify-between safe-area"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Top spacer */}
        <div className="flex-1" />

        {/* Center content: Weight + Trend */}
        <div className="flex flex-col items-center gap-4">
          <WeightDisplay
            weight={todayWeight}
            onTap={() => setShowWeightInput(true)}
            isPulsing={isPulsing}
          />

          <TrendIndicator
            currentWeight={todayWeight}
            weekAgoWeight={weekAgoWeight}
          />
        </div>

        {/* Bottom spacer */}
        <div className="flex-1" />

        {/* Three dots */}
        <div className="flex items-center gap-6 pb-12 animate-fade-in-delay-2">
          <Dot
            filled={todayChecks.deficit}
            onTap={() => handleToggleCheck('deficit')}
            onLongPress={() => handleUndo('deficit')}
            label="deficit"
            allComplete={allComplete}
          />
          <Dot
            filled={todayChecks.protein}
            onTap={() => handleToggleCheck('protein')}
            onLongPress={() => handleUndo('protein')}
            label="protein"
            allComplete={allComplete}
          />
          <Dot
            filled={todayChecks.workout}
            onTap={() => handleToggleCheck('workout')}
            onLongPress={() => handleUndo('workout')}
            label="workout"
            allComplete={allComplete}
          />
        </div>

        {/* Swipe hint */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-text-muted/30 text-xs">
          ↑
        </div>
      </main>

      {/* Weight input modal */}
      <WeightInput
        isOpen={showWeightInput}
        onClose={() => setShowWeightInput(false)}
        onSave={handleWeightSave}
        currentWeight={todayWeight}
      />

      {/* Week view */}
      <WeekView
        isOpen={showWeekView}
        onClose={() => setShowWeekView(false)}
        days={weekData.map(d => ({
          date: d.date,
          dayLabel: d.dayLabel,
          weight: d.weight,
          deficit: d.deficit,
          protein: d.protein,
          workout: d.workout,
        }))}
      />
    </>
  );
}
