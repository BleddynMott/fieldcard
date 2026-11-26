// Small numeric helpers shared by the generators, the simulated crowd and scoring.
import type { Rng } from './rng';

export function clamp(x: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, x));
}

/** Standard normal draw (Box-Muller). */
export function gauss(rng: Rng): number {
  const u = 1 - rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng());
}

export function pickIndex(rng: Rng, n: number): number {
  return Math.min(n - 1, Math.floor(rng() * n));
}

export function shuffle<T>(rng: Rng, items: T[]): T[] {
  const a = items.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = pickIndex(rng, i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Lexicographic compare of rank keys; lower is better. */
export function compareKeys(a: number[], b: number[]): number {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const d = (a[i] ?? 0) - (b[i] ?? 0);
    if (d !== 0) return d;
  }
  return 0;
}

/** The share of others you beat, 0 to 100: strictly worse count in full, ties count half. */
export function shareBeaten(mine: number[], others: number[][]): number {
  if (others.length === 0) return 50;
  let score = 0;
  for (const o of others) {
    const c = compareKeys(mine, o);
    if (c < 0) score += 1;
    else if (c === 0) score += 0.5;
  }
  return (score / others.length) * 100;
}

/** Same as shareBeaten for plain numbers where higher is better. */
export function shareBelow(mine: number, others: number[]): number {
  return shareBeaten([-mine], others.map((o) => [-o]));
}
