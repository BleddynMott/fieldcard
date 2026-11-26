// Small numeric helpers shared by the generators, the simulated crowd and scoring.
import type { Rng } from './rng';

export function clamp(x: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, x));
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

/** For every member of a group, the share of the others they beat (ties count half), in one sort
 *  instead of comparing every pair (review 39). keys: lower is better. */
export function sharesWithin(keys: number[][]): number[] {
  const n = keys.length;
  const idx = keys.map((_, i) => i).sort((a, b) => compareKeys(keys[b], keys[a])); // worst first
  const out = new Array<number>(n);
  let i = 0;
  while (i < n) {
    let j = i;
    while (j + 1 < n && compareKeys(keys[idx[j + 1]], keys[idx[i]]) === 0) j++;
    const ties = j - i; // others tied with each member of this group
    for (let k = i; k <= j; k++) out[idx[k]] = n > 1 ? ((i + 0.5 * ties) / (n - 1)) * 100 : 50;
    i = j + 1;
  }
  return out;
}

/** Same as shareBeaten for plain numbers where higher is better. */
export function shareBelow(mine: number, others: number[]): number {
  return shareBeaten([-mine], others.map((o) => [-o]));
}
