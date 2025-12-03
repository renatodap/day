'use client';

import { useState, useCallback } from 'react';

interface DotProps {
  filled: boolean;
  onTap: () => void;
  onLongPress: () => void;
  label: 'deficit' | 'protein' | 'workout';
  allComplete?: boolean;
}

export function Dot({ filled, onTap, onLongPress, label, allComplete = false }: DotProps) {
  const [isPressed, setIsPressed] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);

  // Haptic feedback
  const triggerHaptic = useCallback((type: 'medium' | 'light' | 'success') => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      switch (type) {
        case 'medium':
          navigator.vibrate(15);
          break;
        case 'light':
          navigator.vibrate(8);
          break;
        case 'success':
          navigator.vibrate([10, 50, 15]);
          break;
      }
    }
  }, []);

  const handleTouchStart = useCallback(() => {
    setIsPressed(true);

    // Start long press timer
    const timer = setTimeout(() => {
      if (filled) {
        triggerHaptic('light');
        onLongPress();
      }
    }, 500);

    setLongPressTimer(timer);
  }, [filled, onLongPress, triggerHaptic]);

  const handleTouchEnd = useCallback(() => {
    setIsPressed(false);

    // Clear long press timer
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }

    // Only trigger tap if it wasn't a long press
    if (!filled) {
      triggerHaptic('medium');
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 300);
    }

    onTap();
  }, [filled, longPressTimer, onTap, triggerHaptic]);

  const handleTouchCancel = useCallback(() => {
    setIsPressed(false);
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  }, [longPressTimer]);

  return (
    <button
      className={`
        w-4 h-4 rounded-full tap-target
        transition-all duration-150 ease-out
        ${filled
          ? 'bg-dot-filled shadow-[0_0_12px_rgba(255,255,255,0.3)]'
          : 'bg-transparent border-2 border-dot-empty'
        }
        ${isPressed ? 'scale-90' : 'scale-100'}
        ${isAnimating ? 'animate-dot-fill' : ''}
        ${allComplete && filled ? 'animate-dot-pulse' : ''}
      `}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
      onMouseLeave={handleTouchCancel}
      aria-label={`${label}: ${filled ? 'done' : 'not done'}. ${filled ? 'Long press to undo.' : 'Tap to mark done.'}`}
      aria-pressed={filled}
    />
  );
}
