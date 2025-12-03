'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

interface DayData {
  date: string;
  dayLabel: string;
  weight: number | null;
  deficit: boolean;
  protein: boolean;
  workout: boolean;
}

interface WeekViewProps {
  isOpen: boolean;
  onClose: () => void;
  days: DayData[];
}

export function WeekView({ isOpen, onClose, days }: WeekViewProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const startY = useRef(0);
  const currentY = useRef(0);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      requestAnimationFrame(() => setIsAnimating(true));
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle swipe down to close
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    currentY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback(() => {
    const diff = currentY.current - startY.current;
    if (diff > 100) {
      onClose();
    }
  }, [onClose]);

  if (!isVisible) return null;

  return (
    <div
      className={`
        fixed inset-0 z-40 bg-bg
        transition-transform duration-300 ease-out
        ${isAnimating ? 'translate-y-0' : 'translate-y-full'}
      `}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="safe-area h-full overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 sticky top-0 bg-bg/90 backdrop-blur-sm">
          <button
            onClick={onClose}
            className="text-text-muted text-lg tap-target"
            aria-label="Go back"
          >
            ←
          </button>
          <h1 className="text-lg font-medium">THIS WEEK</h1>
          <div className="w-8" /> {/* Spacer for centering */}
        </div>

        {/* Day list */}
        <div className="px-6">
          {days.map((day) => (
            <div
              key={day.date}
              className="py-4 border-b border-white/5 last:border-b-0"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-text-muted uppercase tracking-wide">
                    {day.dayLabel}
                  </div>
                  <div className="text-2xl font-medium mt-1">
                    {day.weight?.toFixed(1) ?? '—'}
                  </div>
                </div>

                {/* Dots */}
                <div className="flex items-center gap-3">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      day.deficit ? 'bg-dot-filled' : 'border border-dot-empty'
                    }`}
                    aria-label={`Deficit: ${day.deficit ? 'done' : 'not done'}`}
                  />
                  <div
                    className={`w-3 h-3 rounded-full ${
                      day.protein ? 'bg-dot-filled' : 'border border-dot-empty'
                    }`}
                    aria-label={`Protein: ${day.protein ? 'done' : 'not done'}`}
                  />
                  <div
                    className={`w-3 h-3 rounded-full ${
                      day.workout ? 'bg-dot-filled' : 'border border-dot-empty'
                    }`}
                    aria-label={`Workout: ${day.workout ? 'done' : 'not done'}`}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Swipe indicator */}
        <div className="flex justify-center py-8">
          <div className="text-text-muted text-sm">Swipe down to close</div>
        </div>
      </div>
    </div>
  );
}
