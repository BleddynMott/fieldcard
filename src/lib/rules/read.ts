// Read's rules (G-00d Q1 to Q4; Q1 and Q2 shared into Dare's Count and Pair). Pure and seeded.
import { config } from '../config';
import { dexp } from '../dmath';
import { overlap } from '../reads';
import { stream, type Rng } from '../rng';
import { clamp } from '../stats';
import { rules, type SelectRecipe } from './params';

// ---- Q1 and Q2: answer blind, then meet the crowd -------------------------------------------

export type Meet = 'keep' | 'switch';

/**
 * Hunch for one meeting. If blind and crowd agree, 0. Otherwise +1 when your final answer is the
 * closer of the two to the truth, -1 when it is further, 0 when equally close.
 */
export function meetHunch<T>(
  blind: T,
  crowd: T,
  final: Meet,
  truth: T,
  distance: (a: T, b: T) => number,
  p = rules().meet,
): number {
  if (distance(blind, crowd) === 0) return 0;
  const mine = final === 'keep' ? blind : crowd;
  const other = final === 'keep' ? crowd : blind;
  const dm = distance(mine, truth);
  const dO = distance(other, truth);
  if (dm < dO) return p.hunchCloser;
  if (dm > dO) return p.hunchFurther;
  return 0;
}

export const numberDistance = (a: number, b: number) => Math.abs(a - b);
export const pickDistance = <T>(a: T, b: T) => (a === b ? 0 : 1);

/** Count's crowd answer, the hill's peak: the most common answer; a tie goes to the one closest
 *  to the median, then to the lower. Undefined for an empty field. */
export function countPeak(answers: number[]): number | undefined {
  if (answers.length === 0) return undefined;
  const tally = new Map<number, number>();
  for (const a of answers) tally.set(a, (tally.get(a) ?? 0) + 1);
  const top = Math.max(...tally.values());
  const sorted = answers.slice().sort((a, b) => a - b);
  const median = sorted[Math.floor((sorted.length - 1) / 2)];
  const modes = [...tally.entries()].filter(([, c]) => c === top).map(([v]) => v);
  modes.sort((a, b) => Math.abs(a - median) - Math.abs(b - median) || a - b);
  return modes[0];
}

/** Pair's four: `four` distinct field players drawn at random (all of them if the field is smaller). */
export function drawFour(fieldSize: number, rng: Rng, p = rules().meet): number[] {
  const idx = Array.from({ length: fieldSize }, (_, i) => i);
  const k = Math.min(p.four, fieldSize);
  for (let i = 0; i < k; i++) {
    const j = i + Math.min(fieldSize - 1 - i, Math.floor(rng() * (fieldSize - i)));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return idx.slice(0, k);
}

/** The crowd's pick among the four: the most common; a tie goes to the earliest drawn. */
export function majority<T>(picks: T[]): T | undefined {
  let best: T | undefined;
  let bestCount = 0;
  for (const p of picks) {
    const c = picks.filter((q) => q === p).length;
    if (c > bestCount) {
      best = p;
      bestCount = c;
    }
  }
  return best;
}

export interface MeetRecord {
  blindRight: boolean;
  finalRight: boolean;
  switched: boolean;
}

/** The Asch line, from today's own records: right blind, right after the crowd, switched (0-100). */
export function aschLine(records: MeetRecord[]): { blindRight: number; finalRight: number; switched: number } {
  const n = records.length;
  const share = (f: (r: MeetRecord) => boolean) => (n === 0 ? 0 : (records.filter(f).length / n) * 100);
  return { blindRight: share((r) => r.blindRight), finalRight: share((r) => r.finalRight), switched: share((r) => r.switched) };
}

// ---- Q3: the graph read (draw, select, adjust) ---------------------------------------------

export interface StrokePoint {
  x: number; // 0..1 along the event's axis
  y: number; // 0..1 height
}

/**
 * A stroke as shares over `bins` (summing to 100): the highest point over each bin, gaps inside
 * the stroke's span filled in a straight line, nothing outside it. Fewer than minPoints, or a flat
 * stroke at zero, is no drawing (null).
 */
export function strokeToBins(points: StrokePoint[], bins = rules().draw.bins, p = rules().draw): number[] | null {
  if (points.length < p.minPoints) return null;
  const h: (number | null)[] = new Array(bins).fill(null);
  for (const pt of points) {
    const i = Math.min(bins - 1, Math.max(0, Math.floor(clamp(pt.x, 0, 1) * bins)));
    const y = clamp(pt.y, 0, 1);
    h[i] = h[i] === null ? y : Math.max(h[i] as number, y);
  }
  const filled = h.map((_, i) => i).filter((i) => h[i] !== null);
  const first = filled[0];
  const last = filled[filled.length - 1];
  const out = new Array<number>(bins).fill(0);
  for (let i = first; i <= last; i++) {
    if (h[i] !== null) {
      out[i] = h[i] as number;
      continue;
    }
    const a = filled.filter((j) => j < i).pop() as number;
    const b = filled.find((j) => j > i) as number;
    out[i] = (h[a] as number) + (((h[b] as number) - (h[a] as number)) * (i - a)) / (b - a);
  }
  return normalise(out);
}

/** Shares summing to 100; null if everything is zero. */
export function normalise(xs: number[]): number[] | null {
  const s = xs.reduce((a, b) => a + b, 0);
  if (!(s > 0)) return null;
  return xs.map((x) => (x / s) * 100);
}

/** Values into `bins` equal bins over [from, to]; shares summing to 100 (null if none). */
export function pileOf(values: number[], from: number, to: number, bins = rules().draw.bins): number[] | null {
  if (!(to > from)) throw new Error('pileOf: to must be above from');
  const c = new Array<number>(bins).fill(0);
  for (const v of values) c[Math.min(bins - 1, Math.max(0, Math.floor(((v - from) / (to - from)) * bins)))] += 1;
  return normalise(c);
}

/** Everyone's average drawing: the mean share per bin, renormalised. */
export function averageDrawing(drawings: number[][]): number[] | null {
  if (drawings.length === 0) return null;
  const bins = drawings[0].length;
  const sum = new Array<number>(bins).fill(0);
  for (const d of drawings) {
    if (d.length !== bins) throw new Error('averageDrawing: drawings differ in bins');
    d.forEach((x, i) => (sum[i] += x));
  }
  return normalise(sum);
}

/** Draw's score and badge: overlap with the real pile; the badge when you beat everyone's average. */
export function drawResult(mine: number[], real: number[], everyone: number[][]): { score: number; crowdScore: number | null; badge: boolean } {
  const score = overlap(mine, real);
  const avg = averageDrawing(everyone);
  const crowdScore = avg ? overlap(avg, real) : null;
  return { score, crowdScore, badge: crowdScore !== null && score > crowdScore };
}

function meanSd(shares: number[]): { mean: number; sd: number } {
  const mean = shares.reduce((s, x, i) => s + x * i, 0) / 100;
  const v = shares.reduce((s, x, i) => s + x * (i - mean) * (i - mean), 0) / 100;
  return { mean, sd: Math.sqrt(v) };
}

function normalPile(bins: number, mean: number, sd: number): number[] {
  const s = Math.max(sd, 0.35);
  return normalise(Array.from({ length: bins }, (_, i) => dexp(-((i - mean) * (i - mean)) / (2 * s * s)))) as number[];
}

function shiftPile(shares: number[], by: number): number[] {
  const out = new Array<number>(shares.length).fill(0);
  shares.forEach((x, i) => (out[clamp(i + by, 0, shares.length - 1)] += x));
  return out;
}

export function makeFake(real: number[], recipe: SelectRecipe, sign: 1 | -1, p = rules().select): number[] {
  const { mean, sd } = meanSd(real);
  if (recipe === 'tidy') return normalPile(real.length, mean, sd);
  if (recipe === 'spread') return normalPile(real.length, mean, sd * p.spreadFactor);
  return shiftPile(real, sign * p.shiftBins);
}

/**
 * Select's two piles for a card. The recipe is seeded; R-4: a fake overlapping the real pile by
 * more than maxOverlap is replaced by the next recipe, then by wider shifts.
 */
export function selectPiles(card: number, real: number[], p = rules().select): { left: number[]; right: number[]; realSide: 'left' | 'right'; recipe: SelectRecipe | 'wide-shift' } {
  const rng = stream(config.seedName, card, 'select');
  const start = Math.min(p.recipes.length - 1, Math.floor(rng() * p.recipes.length));
  const sign: 1 | -1 = rng() < 0.5 ? -1 : 1;
  const realSide = rng() < 0.5 ? 'left' : 'right';
  let fake: number[] | null = null;
  let recipe: SelectRecipe | 'wide-shift' = p.recipes[start];
  for (let k = 0; k < p.recipes.length && !fake; k++) {
    const r = p.recipes[(start + k) % p.recipes.length];
    const f = makeFake(real, r, sign);
    if (overlap(f, real) <= p.maxOverlap) {
      fake = f;
      recipe = r;
    }
  }
  for (let by = p.shiftBins + 1; by < real.length && !fake; by++) {
    for (const s of [sign, -sign]) {
      const f = shiftPile(real, s * by);
      if (!fake && overlap(f, real) <= p.maxOverlap) {
        fake = f;
        recipe = 'wide-shift';
      }
    }
  }
  if (!fake) throw new Error(`selectPiles: no fake differs enough from the real pile on card ${card}`);
  return realSide === 'left' ? { left: real, right: fake, realSide, recipe } : { left: fake, right: real, realSide, recipe };
}

/** Adjust: the seeded shift the pile is shown at, a whole number of bins, never 0. */
export function adjustShift(card: number, p = rules().adjust): number {
  const rng = stream(config.seedName, card, 'adjust');
  const size = 1 + Math.min(p.maxShift - 1, Math.floor(rng() * p.maxShift));
  return rng() < 0.5 ? -size : size;
}

/** Adjust's score: 100 x (1 - |shift + slide| / maxShift), clamped to 0..100. */
export function adjustScore(shift: number, slide: number, p = rules().adjust): number {
  return clamp(100 * (1 - Math.abs(shift + slide) / p.maxShift), 0, 100);
}

// ---- Q4: find yourself ------------------------------------------------------------------------

/** gap = guess - truth (both 0..100, truth your Hands share beaten); Hunch = -|gap|. */
export function findYourself(guess: number, truth: number): { gap: number; hunch: number } {
  const gap = Math.round(clamp(guess, 0, 100) - clamp(truth, 0, 100));
  return { gap, hunch: -Math.abs(gap) };
}

/** "71% thought they beat most of the field": the share of guesses above the middle, 0..100. */
export function thoughtAboveMiddle(guesses: number[], p = rules().find): number {
  if (guesses.length === 0) return 0;
  return (guesses.filter((g) => g > p.middle).length / guesses.length) * 100;
}
