// Dare's rules (G-00c round 4: V1, V2, V3, V4). Pure and seeded; every number in config "rules".
import { round } from '../events/stop';
import { clamp } from '../stats';
import { rules } from './params';

// ---- V1, Stop: the field's stops set the price ---------------------------------------------

/**
 * Price of a stop, 0 or 1 to 5. you and field are signed offsets from the notch's centre, in % of
 * the track (as stopResult's offs); notchHalf is half the notch's width in the same unit.
 * R-2: the field's stops inside the notch, counted within +-window x notch width of yours (clipped
 * at the notch's edges), against what an even spread across the notch would put there.
 */
export function stopPrice(you: number, notchHalf: number, field: number[], p = rules().stopPrice): number {
  if (!(notchHalf > 0)) throw new Error('stopPrice: notchHalf must be positive');
  if (Math.abs(you) > notchHalf) return 0;
  const inside = field.filter((f) => Math.abs(f) <= notchHalf);
  if (inside.length === 0) return p.maxPrice;
  const w = p.window * 2 * notchHalf;
  const lo = Math.max(-notchHalf, you - w);
  const hi = Math.min(notchHalf, you + w);
  const near = inside.filter((f) => f >= lo && f <= hi).length;
  const expected = (inside.length * (hi - lo)) / (2 * notchHalf);
  const ratio = near / expected;
  if (ratio <= p.rareRatio) return p.maxPrice;
  if (ratio >= p.crowdedRatio) return p.minPrice;
  const t = (p.crowdedRatio - ratio) / (p.crowdedRatio - p.rareRatio);
  return Math.round(p.minPrice + (p.maxPrice - p.minPrice) * t);
}

// ---- V1, Repeat: bank or go on ----------------------------------------------------------------

/** Each round's price: 1 / (share of the field who cleared it), to 0.1, clamped to 1..maxPrice. */
export function repeatPrices(fieldLongest: number[], roundLens: number[], p = rules().repeatBank): number[] {
  return roundLens.map((len) => {
    if (fieldLongest.length === 0) return p.maxPrice;
    const share = fieldLongest.filter((l) => l >= len).length / fieldLongest.length;
    if (share === 0) return p.maxPrice;
    return clamp(round(1 / share, p.decimals), 1, p.maxPrice);
  });
}

export type RepeatOutcome = 'banked' | 'failed' | 'finished';

/** Banking (or clearing the last round) pays the sum of the cleared rounds' prices; failing pays 0. */
export function repeatPoints(prices: number[], cleared: number, outcome: RepeatOutcome, p = rules().repeatBank): number {
  if (cleared < 0 || cleared > prices.length) throw new Error('repeatPoints: cleared out of range');
  if (outcome === 'failed') return 0;
  if (outcome === 'finished' && cleared !== prices.length) throw new Error('repeatPoints: finished needs every round');
  return round(prices.slice(0, cleared).reduce((s, x) => s + x, 0), p.decimals);
}

// ---- V3, Long jump ----------------------------------------------------------------------------

/**
 * takeoff: distance behind the line (0 is on it); below 0 is over the line, a no-jump.
 * Score: share of the field beaten, 0 to 100; further back is worse, a field no-jump is beaten,
 * ties count half. A no-jump scores 0. An empty field scores 50, as shareBeaten does.
 */
export function longJumpScore(takeoff: number, field: number[]): number {
  if (takeoff < 0) return 0;
  if (field.length === 0) return 50;
  let s = 0;
  for (const f of field) {
    if (f < 0 || f > takeoff) s += 1;
    else if (f === takeoff) s += 0.5;
  }
  return (s / field.length) * 100;
}

// ---- V2, double or bank -----------------------------------------------------------------------

export type DareChoice = 'bank' | 'double';

/** Bank: base if right, 0 if wrong. Double: 2 x base if right, -base if wrong (C7, round 2). */
export function doubleOrBank(right: boolean, base: number, choice: DareChoice, p = rules().double): number {
  if (choice === 'bank') return right ? base * p.bankRight : 0;
  return right ? base * p.doubleRight : base * p.doubleWrong;
}

// ---- V4, hold your day ------------------------------------------------------------------------

/** The multiples the pot climbs through: 1, 1 + step, ... up to max. */
export function ropeLadder(p = rules().rope): number[] {
  const out: number[] = [];
  const n = Math.round((p.max - 1) / p.step);
  for (let i = 0; i <= n; i++) out.push(round(1 + i * p.step, p.decimals));
  return out;
}

/** The snap: the multiple by which half of the field had let go (the lower median). R-3: an
 *  empty field snaps at emptySnap. Field entries are ropeRecord values. */
export function snapPoint(fieldRecords: number[], p = rules().rope): number {
  if (fieldRecords.length === 0) return p.emptySnap;
  const s = fieldRecords.slice().sort((a, b) => a - b);
  return s[Math.ceil(s.length / 2) - 1];
}

/** What a player adds to the field: where they let go, or the snap if it snapped on them. */
export function ropeRecord(release: number | null, snap: number): number {
  return release !== null && release < snap ? release : snap;
}

/** Letting go below the snap banks dayPoints x your multiple; otherwise you keep snapKeep of it. */
export function ropePoints(dayPoints: number, release: number | null, snap: number, p = rules().rope): number {
  if (release !== null && release < 1) throw new Error('ropePoints: the pot starts at x1');
  if (release !== null && release < snap) return Math.round(dayPoints * release);
  return Math.round(dayPoints * p.snapKeep);
}

/** "braver than N in 10": share of the field who let go before you (ties half), 0 to 100. */
export function braverThan(record: number, fieldRecords: number[]): number {
  if (fieldRecords.length === 0) return 50;
  let s = 0;
  for (const f of fieldRecords) {
    if (f < record) s += 1;
    else if (f === record) s += 0.5;
  }
  return (s / fieldRecords.length) * 100;
}
