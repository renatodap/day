'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface WeightInputProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (weight: number) => void;
  currentWeight: number | null;
}

export function WeightInput({ isOpen, onClose, onSave, currentWeight }: WeightInputProps) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize with current weight when opening
  useEffect(() => {
    if (isOpen) {
      setValue(currentWeight?.toString() || '');
      // Focus input after animation
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, currentWeight]);

  // Handle keyboard input
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && value) {
      const weight = parseFloat(value);
      if (!isNaN(weight) && weight > 0 && weight < 1000) {
        // Haptic on save
        if ('vibrate' in navigator) {
          navigator.vibrate(8);
        }
        onSave(weight);
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  }, [value, onSave, onClose]);

  const handleSave = useCallback(() => {
    if (value) {
      const weight = parseFloat(value);
      if (!isNaN(weight) && weight > 0 && weight < 1000) {
        if ('vibrate' in navigator) {
          navigator.vibrate(8);
        }
        onSave(weight);
        onClose();
      }
    }
  }, [value, onSave, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-bg flex flex-col items-center justify-center safe-area animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 text-text-muted text-2xl tap-target p-2"
        aria-label="Close"
      >
        ✕
      </button>

      {/* Large input display */}
      <div className="flex flex-col items-center gap-8">
        <input
          ref={inputRef}
          type="number"
          inputMode="decimal"
          step="0.1"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="186"
          className="
            weight-number text-center
            bg-transparent border-none outline-none
            placeholder:text-text-muted placeholder:opacity-30
            w-full max-w-[300px]
          "
          aria-label="Enter your weight"
        />

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={!value || isNaN(parseFloat(value)) || parseFloat(value) <= 0}
          className="
            text-lg font-medium text-text px-8 py-3 rounded-full
            bg-white/10 tap-target
            transition-all duration-150
            disabled:opacity-30 disabled:cursor-not-allowed
            hover:bg-white/20 active:scale-95
          "
        >
          Done
        </button>
      </div>
    </div>
  );
}
