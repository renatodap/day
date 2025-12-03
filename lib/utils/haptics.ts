/**
 * Haptic feedback wrapper for mobile devices.
 * Falls back silently on unsupported devices.
 */

type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

export function triggerHaptic(type: HapticType = 'light'): void {
  if (typeof window === 'undefined') return;

  // Check for Vibration API
  if (!('vibrate' in navigator)) return;

  try {
    switch (type) {
      case 'light':
        navigator.vibrate(10);
        break;
      case 'medium':
        navigator.vibrate(20);
        break;
      case 'heavy':
        navigator.vibrate(30);
        break;
      case 'success':
        navigator.vibrate([10, 50, 10]);
        break;
      case 'warning':
        navigator.vibrate([20, 30, 20]);
        break;
      case 'error':
        navigator.vibrate([30, 20, 30, 20, 30]);
        break;
    }
  } catch {
    // Silently fail if vibration not supported
  }
}
