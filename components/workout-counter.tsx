'use client';

import { useState } from 'react';
import { triggerHaptic } from '@/lib/utils/haptics';
import { getExpectedWorkoutsForDay, getDayOfWeek } from '@/lib/utils/dates';
import { WIN_CONDITIONS } from '@/lib/constants';

interface WorkoutCounterProps {
  count: number;
  onAdd: () => Promise<void>;
  onRemove: () => Promise<void>;
}

export function WorkoutCounter({ count, onAdd, onRemove }: WorkoutCounterProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  const target = WIN_CONDITIONS.weeklyWorkouts;
  const expected = getExpectedWorkoutsForDay(getDayOfWeek());
  const progress = Math.min((count / target) * 100, 100);

  const diff = count - expected;
  let statusText = 'on track for this week';
  let isBehind = false;

  if (diff < 0) {
    statusText = `behind by ${Math.abs(diff)}`;
    isBehind = true;
  } else if (diff > 0) {
    statusText = `ahead by ${diff}`;
  }

  const handleAdd = async () => {
    if (isLoading) return;
    setIsLoading(true);
    triggerHaptic('success');

    try {
      await onAdd();
    } finally {
      setTimeout(() => setIsLoading(false), 300);
    }
  };

  const handleRemove = async () => {
    if (isLoading || count <= 0) return;

    if (!showRemoveConfirm) {
      setShowRemoveConfirm(true);
      triggerHaptic('warning');
      setTimeout(() => setShowRemoveConfirm(false), 2000);
      return;
    }

    setIsLoading(true);
    setShowRemoveConfirm(false);
    triggerHaptic('light');

    try {
      await onRemove();
    } finally {
      setTimeout(() => setIsLoading(false), 300);
    }
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-text-muted uppercase tracking-wider">
          Workouts
        </span>
        <span className="text-lg font-semibold">
          {count} / {target}
        </span>
      </div>

      <div className="flex items-center gap-3 mb-3">
        <div className="flex-1 progress-bar">
          <div
            className={`progress-fill ${isBehind ? 'behind' : ''}`}
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex gap-2">
          {count > 0 && (
            <button
              onClick={handleRemove}
              disabled={isLoading}
              className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold transition-colors tap-target ${
                showRemoveConfirm
                  ? 'bg-danger/20 text-danger'
                  : 'bg-surface-hover text-text-muted hover:text-text'
              }`}
              aria-label={showRemoveConfirm ? 'Confirm remove workout' : 'Remove workout'}
            >
              {showRemoveConfirm ? '?' : '-'}
            </button>
          )}
          <button
            onClick={handleAdd}
            disabled={isLoading}
            className="w-10 h-10 rounded-lg bg-win/20 text-win flex items-center justify-center text-lg font-bold hover:bg-win/30 transition-colors tap-target"
            aria-label="Add workout"
          >
            +
          </button>
        </div>
      </div>

      <p className={`text-sm ${isBehind ? 'text-accent' : 'text-text-muted'}`}>
        {statusText}
      </p>
    </div>
  );
}
