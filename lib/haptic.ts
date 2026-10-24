// Short vibration on phones that support it (Android). Silently does nothing elsewhere or with reduced motion.
export function haptic(pattern: number | number[] = 10) {
  try {
    if (typeof navigator === "undefined" || !("vibrate" in navigator) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    navigator.vibrate(pattern);
  } catch { /* not supported */ }
}
