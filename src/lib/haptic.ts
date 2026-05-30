/**
 * Triggers a short vibration for haptic feedback if supported by the browser/device.
 * @param pattern Duration in ms or vibration pattern (e.g. 12ms for light tap, [15, 60, 20] for success)
 */
export function triggerHapticFeedback(pattern: number | number[] = 12) {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try {
      navigator.vibrate(pattern);
    } catch (e) {
      // Safely ignore if blocked by browser policies
    }
  }
}

/**
 * A suttle, light tap for standard button clicks and options selection
 */
export function hapticLightTap() {
  triggerHapticFeedback(12);
}

/**
 * A double pulse for successful operations (e.g., check-in registered, training completed)
 */
export function hapticSuccessTap() {
  triggerHapticFeedback([15, 60, 20]);
}

/**
 * A heavier pulse for warning or error operations
 */
export function hapticWarningTap() {
  triggerHapticFeedback([30, 80, 30]);
}
