'use client';

import { useState, useCallback } from 'react';

interface WeightDisplayProps {
  weight: number | null;
  onTap: () => void;
  isPulsing?: boolean;
}

export function WeightDisplay({ weight, onTap, isPulsing = false }: WeightDisplayProps) {
  const [isPressed, setIsPressed] = useState(false);

  const handleTouchStart = useCallback(() => {
    setIsPressed(true);
  }, []);

  const handleTouchEnd = useCallback(() => {
    setIsPressed(false);
    onTap();
  }, [onTap]);

  // Format weight: show one decimal if needed, otherwise whole number
  const displayWeight = weight !== null
    ? (weight % 1 === 0 ? weight.toString() : weight.toFixed(1))
    : '---';

  return (
    <button
      className={`
        weight-number tap-target animate-fade-in
        transition-transform duration-150 ease-out
        ${isPressed ? 'scale-[0.98]' : 'scale-100'}
        ${isPulsing ? 'animate-number-pulse' : ''}
      `}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
      onMouseLeave={() => setIsPressed(false)}
      aria-label={weight !== null ? `Current weight: ${displayWeight} pounds. Tap to update.` : 'Tap to enter weight'}
    >
      {displayWeight}
    </button>
  );
}
