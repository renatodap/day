'use client';

import { useState } from 'react';
import { triggerHaptic } from '@/lib/utils/haptics';

interface CheckCardProps {
  label: string;
  checked: boolean;
  onToggle: () => Promise<void>;
}

export function CheckCard({ label, checked, onToggle }: CheckCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [confirmUncheck, setConfirmUncheck] = useState(false);

  const handleTap = async () => {
    if (isLoading) return;

    // If currently checked, require confirmation to uncheck
    if (checked && !confirmUncheck) {
      setConfirmUncheck(true);
      triggerHaptic('light');
      // Reset confirmation after 2 seconds
      setTimeout(() => setConfirmUncheck(false), 2000);
      return;
    }

    setIsLoading(true);
    setConfirmUncheck(false);
    triggerHaptic(checked ? 'light' : 'success');

    try {
      await onToggle();
    } finally {
      setTimeout(() => setIsLoading(false), 300);
    }
  };

  return (
    <button
      onClick={handleTap}
      disabled={isLoading}
      className={`card tap-target flex-1 flex flex-col items-center justify-center gap-2 min-h-[100px] ${
        checked ? 'border border-win/30' : ''
      } ${confirmUncheck ? 'border border-danger/50' : ''}`}
      aria-label={`${label}: ${checked ? 'completed' : 'not completed'}${confirmUncheck ? ', tap again to uncheck' : ''}`}
    >
      <span className="text-sm font-medium text-text-muted uppercase tracking-wider">
        {label}
      </span>
      <div
        className={`text-2xl transition-transform ${
          isLoading ? 'opacity-50' : ''
        }`}
      >
        {confirmUncheck ? (
          <span className="text-danger">?</span>
        ) : checked ? (
          <span className="text-win">✓</span>
        ) : (
          <span className="text-text-subtle">✗</span>
        )}
      </div>
      {confirmUncheck && (
        <span className="text-xs text-danger">tap again</span>
      )}
    </button>
  );
}
