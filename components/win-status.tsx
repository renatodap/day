'use client';

import { useEffect, useState } from 'react';
import type { WinStatus } from '@/lib/types';

interface WinStatusProps {
  status: WinStatus;
  deficit: boolean;
  protein: boolean;
  workoutsOnTrack: boolean;
  streak: number;
}

export function WinStatusCard({ status, deficit, protein, workoutsOnTrack, streak }: WinStatusProps) {
  const [flash, setFlash] = useState(false);
  const [prevStatus, setPrevStatus] = useState(status);

  useEffect(() => {
    if (status === 'won' && prevStatus !== 'won') {
      setFlash(true);
      const timer = setTimeout(() => setFlash(false), 150);
      return () => clearTimeout(timer);
    }
    setPrevStatus(status);
  }, [status, prevStatus]);

  const isWon = status === 'won';

  return (
    <div
      className={`card text-center py-6 transition-colors ${
        flash ? 'animate-flash-green' : ''
      } ${isWon ? 'bg-win-bg' : 'bg-surface'}`}
    >
      <h2
        className={`text-[28px] font-semibold mb-4 ${
          isWon ? 'text-win' : 'text-text-subtle'
        }`}
      >
        {isWon ? 'YOU WON' : 'NOT YET'}
      </h2>

      <div className="flex justify-center gap-6 mb-2">
        <StatusDot active={deficit} label="deficit" />
        <StatusDot active={protein} label="protein" />
        <StatusDot active={workoutsOnTrack} label="workouts" half={status === 'behind'} />
      </div>

      {isWon && streak > 1 && (
        <p className="text-sm text-text-muted mt-3">{streak} day streak</p>
      )}
    </div>
  );
}

interface StatusDotProps {
  active: boolean;
  label: string;
  half?: boolean;
}

function StatusDot({ active, label, half }: StatusDotProps) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`w-4 h-4 rounded-full border-2 transition-colors ${
          active
            ? 'bg-win border-win'
            : half
            ? 'border-accent bg-accent/30'
            : 'border-text-subtle bg-transparent'
        }`}
      />
      <span className="text-xs text-text-muted">{label}</span>
    </div>
  );
}
