'use client';

import { useState } from 'react';
import { triggerHaptic } from '@/lib/utils/haptics';
import type { RecurringTask } from '@/lib/types';

interface RecurringTaskCardProps {
  task: RecurringTask;
  completions: number;
  onComplete: () => Promise<void>;
  onUncomplete: () => Promise<void>;
}

export function RecurringTaskCard({
  task,
  completions,
  onComplete,
  onUncomplete,
}: RecurringTaskCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  const isWeeklyTask = task.weekly_target > 1;
  const isCompleted = isWeeklyTask
    ? completions >= task.weekly_target
    : completions > 0;

  const handleToggle = async () => {
    if (isLoading) return;
    setIsLoading(true);

    triggerHaptic(isCompleted ? 'light' : 'success');

    try {
      if (isCompleted && !isWeeklyTask) {
        await onUncomplete();
      } else {
        await onComplete();
      }
    } finally {
      setTimeout(() => setIsLoading(false), 300);
    }
  };

  return (
    <div className="card">
      <div className="flex items-start gap-3">
        <button
          onClick={handleToggle}
          disabled={isLoading || (isWeeklyTask && isCompleted)}
          className="tap-target flex items-center justify-center w-6 h-6 mt-0.5"
          aria-label={isCompleted ? 'Mark incomplete' : 'Mark complete'}
        >
          <div
            className={`w-5 h-5 rounded-full border-2 transition-colors ${
              isCompleted
                ? 'bg-win border-win'
                : 'border-text-subtle bg-transparent'
            }`}
          />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3
              className={`font-medium ${
                isCompleted ? 'text-text-muted line-through' : 'text-text'
              }`}
            >
              {task.name}
            </h3>

            {isWeeklyTask && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-text-muted">
                  {completions} / {task.weekly_target}
                </span>
                {!isCompleted && (
                  <button
                    onClick={handleToggle}
                    disabled={isLoading}
                    className="w-8 h-8 rounded-lg bg-win/20 text-win flex items-center justify-center text-sm font-bold hover:bg-win/30 transition-colors"
                    aria-label="Add completion"
                  >
                    +
                  </button>
                )}
              </div>
            )}
          </div>

          {isWeeklyTask && (
            <p className="text-sm text-text-subtle mt-1">This week</p>
          )}
        </div>
      </div>
    </div>
  );
}
