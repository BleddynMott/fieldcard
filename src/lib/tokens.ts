// Reads a duration token from design/tokens.css at run time, so timers in code use the same value
// as the stylesheet (R10: look durations are tokens). "120ms" -> 120, "0.6s" -> 600.
export function tokenMs(name: string): number {
  if (typeof document === 'undefined') return 0;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const n = parseFloat(v);
  if (Number.isNaN(n)) return 0;
  return v.endsWith('ms') ? n : n * 1000;
}
