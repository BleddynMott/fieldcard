// Seeded randomness. One stream per (card, purpose), so adding a stream never changes another.

/** 32-bit FNV-1a hash of a string. */
export function hash32(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export type Rng = () => number;

/** mulberry32: a small, fast generator with a full 2^32 period. Returns floats in [0, 1). */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function stream(seedName: string, card: number, purpose: string): Rng {
  return mulberry32(hash32(`${seedName}:${card}:${purpose}`));
}

export function between(rng: Rng, from: number, to: number): number {
  return from + (to - from) * rng();
}
