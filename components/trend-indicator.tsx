'use client';

interface TrendIndicatorProps {
  currentWeight: number | null;
  weekAgoWeight: number | null;
}

export function TrendIndicator({ currentWeight, weekAgoWeight }: TrendIndicatorProps) {
  // Can't show trend without both weights
  if (currentWeight === null || weekAgoWeight === null) {
    return (
      <div className="text-trend text-text-muted animate-fade-in-delay opacity-50">
        —
      </div>
    );
  }

  const change = currentWeight - weekAgoWeight;
  const absChange = Math.abs(change);
  const formattedChange = absChange.toFixed(1);

  // Determine direction and color
  let arrow: string;
  let colorClass: string;

  if (change < -0.1) {
    // Weight down = winning
    arrow = '↓';
    colorClass = 'text-trend-down';
  } else if (change > 0.1) {
    // Weight up = losing
    arrow = '↑';
    colorClass = 'text-trend-up';
  } else {
    // Flat
    arrow = '→';
    colorClass = 'text-trend-flat';
  }

  return (
    <div
      className={`text-trend ${colorClass} animate-fade-in-delay`}
      aria-label={`Weight ${change < 0 ? 'down' : change > 0 ? 'up' : 'unchanged'} ${formattedChange} pounds from 7 days ago`}
    >
      {arrow} {formattedChange}
    </div>
  );
}
