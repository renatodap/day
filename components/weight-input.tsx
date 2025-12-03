'use client';

import { useState } from 'react';
import { triggerHaptic } from '@/lib/utils/haptics';
import { getDaysUntil } from '@/lib/utils/dates';
import { WEIGHT_VALIDATION } from '@/lib/constants';
import type { WeightLog, Goal } from '@/lib/types';

interface WeightInputProps {
  todayWeight: WeightLog | null;
  weekWeights: WeightLog[];
  average: number | null;
  goal: Goal | null;
  onUpdate: (weight: number) => Promise<void>;
}

export function WeightInput({
  todayWeight,
  weekWeights,
  average,
  goal,
  onUpdate,
}: WeightInputProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingWeight, setPendingWeight] = useState<number | null>(null);

  const currentWeight = todayWeight?.weight ?? null;

  const handleOpenEdit = () => {
    setInputValue(currentWeight?.toString() ?? '');
    setIsEditing(true);
    triggerHaptic('light');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const weight = parseFloat(inputValue);
    if (isNaN(weight)) {
      setIsEditing(false);
      return;
    }

    // Validate range
    if (weight < WEIGHT_VALIDATION.min || weight > WEIGHT_VALIDATION.max) {
      triggerHaptic('error');
      return;
    }

    // Check for large change
    const yesterday = weekWeights.find(
      (w) => w.date !== todayWeight?.date
    );
    if (yesterday) {
      const diff = Math.abs(weight - Number(yesterday.weight));
      if (diff > WEIGHT_VALIDATION.warningDelta && !showConfirm) {
        setPendingWeight(weight);
        setShowConfirm(true);
        triggerHaptic('warning');
        return;
      }
    }

    await saveWeight(weight);
  };

  const saveWeight = async (weight: number) => {
    setIsLoading(true);
    setShowConfirm(false);
    setPendingWeight(null);
    triggerHaptic('success');

    try {
      await onUpdate(weight);
      setIsEditing(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = () => {
    if (pendingWeight !== null) {
      saveWeight(pendingWeight);
    }
  };

  const handleCancel = () => {
    setShowConfirm(false);
    setPendingWeight(null);
    setIsEditing(false);
  };

  // Calculate goal progress
  const targetWeight = goal?.target_value ?? 178;
  const targetDate = goal?.target_date ?? '2026-02-06';
  const daysUntil = getDaysUntil(targetDate);
  const toGo = average ? average - targetWeight : null;
  const isOverdue = daysUntil < 0;
  const isAchieved = toGo !== null && toGo <= 0;

  // Generate sparkline data
  const sparklineData = generateSparklineData(weekWeights);

  return (
    <div className="card">
      {isEditing ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="number"
            step="0.1"
            min={WEIGHT_VALIDATION.min}
            max={WEIGHT_VALIDATION.max}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Enter weight"
            className="text-center text-2xl font-bold"
            autoFocus
            disabled={isLoading}
          />

          {showConfirm && (
            <div className="bg-accent/10 border border-accent/30 rounded-lg p-3 text-center">
              <p className="text-sm text-accent mb-2">
                This is {Math.abs(pendingWeight! - (weekWeights.find(w => w.date !== todayWeight?.date)?.weight ?? pendingWeight!)).toFixed(1)} lbs different from recent entries.
              </p>
              <div className="flex gap-2 justify-center">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-3 py-1.5 text-sm rounded-lg bg-surface-hover"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="px-3 py-1.5 text-sm rounded-lg bg-accent text-white"
                >
                  Save anyway
                </button>
              </div>
            </div>
          )}

          {!showConfirm && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="flex-1 py-2 rounded-lg bg-surface-hover text-text-muted"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 rounded-lg bg-accent text-white"
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : 'Save'}
              </button>
            </div>
          )}
        </form>
      ) : (
        <>
          <button
            onClick={handleOpenEdit}
            className="tap-target w-full text-left"
            aria-label="Edit weight"
          >
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-3xl font-bold">
                {currentWeight?.toFixed(1) ?? '—'}
              </span>
              <span className="text-sm text-text-muted">lbs</span>
              <span className="text-xs text-text-subtle ml-auto">tap to edit</span>
            </div>
          </button>

          <div className="flex items-end gap-3 mb-3">
            <div className="sparkline flex-1">
              {sparklineData.map((height, idx) => (
                <div
                  key={idx}
                  className="sparkline-bar"
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>
            {average && (
              <span className="text-sm text-text-muted">
                avg {average.toFixed(1)}
              </span>
            )}
          </div>

          <div className="text-sm">
            {isAchieved ? (
              <span className="text-win">✓ Goal achieved!</span>
            ) : isOverdue ? (
              <span className="text-accent">
                Overdue — {toGo?.toFixed(1)} lbs to go
              </span>
            ) : (
              <span className="text-text-muted">
                → {targetWeight} by {formatGoalDate(targetDate)}
                {toGo !== null && toGo > 0 && (
                  <span className="text-text-subtle"> ({toGo.toFixed(1)} lbs to go)</span>
                )}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function generateSparklineData(weights: WeightLog[]): number[] {
  if (weights.length === 0) {
    return Array(7).fill(50);
  }

  const values = weights.map((w) => Number(w.weight));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  // Normalize to 20-100% height
  const normalized = values.map((v) => 20 + ((v - min) / range) * 80);

  // Pad to 7 values if needed
  while (normalized.length < 7) {
    normalized.unshift(50);
  }

  return normalized.slice(-7);
}

function formatGoalDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const month = d.toLocaleDateString('en-US', { month: 'short' });
  const day = d.getDate();
  return `${month} ${day}`;
}
