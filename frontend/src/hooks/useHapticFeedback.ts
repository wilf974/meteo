/**
 * Hook pour gérer le Haptic Feedback (vibrations)
 * Best practice 2025 pour améliorer l'UX mobile
 */

type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

const HAPTIC_PATTERNS: Record<HapticPattern, number | number[]> = {
  light: 10,
  medium: 20,
  heavy: 30,
  success: [10, 50, 10],
  warning: [20, 100, 20],
  error: [50, 100, 50, 100, 50],
};

/**
 * Vérifie si le Vibration API est disponible
 */
function isVibrationSupported(): boolean {
  return 'vibrate' in navigator;
}

/**
 * Hook pour utiliser le haptic feedback
 */
export function useHapticFeedback() {
  const vibrate = (pattern: HapticPattern = 'light') => {
    if (!isVibrationSupported()) {
      console.debug('Haptic feedback not supported on this device');
      return false;
    }

    const vibrationPattern = HAPTIC_PATTERNS[pattern];

    try {
      navigator.vibrate(vibrationPattern);
      return true;
    } catch (error) {
      console.error('Error triggering haptic feedback:', error);
      return false;
    }
  };

  const vibrateCustom = (duration: number | number[]) => {
    if (!isVibrationSupported()) {
      return false;
    }

    try {
      navigator.vibrate(duration);
      return true;
    } catch (error) {
      console.error('Error triggering custom haptic feedback:', error);
      return false;
    }
  };

  const cancelVibration = () => {
    if (!isVibrationSupported()) {
      return false;
    }

    try {
      navigator.vibrate(0);
      return true;
    } catch (error) {
      console.error('Error cancelling vibration:', error);
      return false;
    }
  };

  return {
    vibrate,
    vibrateCustom,
    cancelVibration,
    isSupported: isVibrationSupported(),
  };
}

/**
 * Hook pour ajouter du haptic feedback aux clics
 * Usage: <button {...useHapticClick('medium')}>Click me</button>
 */
export function useHapticClick(pattern: HapticPattern = 'light') {
  const { vibrate } = useHapticFeedback();

  return {
    onClick: () => vibrate(pattern),
    onTouchStart: () => vibrate(pattern),
  };
}
