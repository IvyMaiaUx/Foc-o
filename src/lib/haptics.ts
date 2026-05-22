export const haptics = {
  light: () => navigator.vibrate?.(10),
  medium: () => navigator.vibrate?.(25),
  success: () => navigator.vibrate?.([15, 50, 30]),
  error: () => navigator.vibrate?.(100),
};
