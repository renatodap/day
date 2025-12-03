'use client';

export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-bg">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 border-4 border-border rounded-full" />
        <div className="absolute inset-0 border-4 border-transparent border-t-accent rounded-full animate-spin" />
      </div>
    </div>
  );
}
