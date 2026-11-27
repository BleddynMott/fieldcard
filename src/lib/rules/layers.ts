// The layers under both branches (G-00c C3): traps (Z1), personality (Z4), crowd twin (Z2).
import { config, stopParams } from '../config';
import { stream } from '../rng';
import { clamp } from '../stats';
import type { EventId } from '../week';
import { rules } from './params';

// ---- Z1: traps ----------------------------------------------------------------------------------

export interface Trap {
  trap: boolean;
  strength: number; // 0 when there is no trap
}

const trapCache = new Map<string, boolean>();

function rawTrap(card: number, event: EventId, p = rules().traps): boolean {
  return stream(config.seedName, card, `trap:${event}`)() < p.share;
}

/** Is this event a trap on this card? Seeded, never the same event two cards running. */
export function isTrap(card: number, event: EventId, p = rules().traps): boolean {
  if (card < 1) return false;
  const key = `${p.share}:${card}:${event}`; // the share is in the key (K05 4)
  const hit = trapCache.get(key);
  if (hit !== undefined) return hit;
  // walk forward from the first card so there is no deep recursion
  let prev = false;
  for (let n = 1; n <= card; n++) {
    const k = `${p.share}:${n}:${event}`;
    let v = trapCache.get(k);
    if (v === undefined) {
      v = rawTrap(n, event, p) && !prev;
      trapCache.set(k, v);
    }
    prev = v;
  }
  return trapCache.get(key) as boolean;
}

export function trapFor(card: number, event: EventId, p = rules().traps): Trap {
  if (!isTrap(card, event, p)) return { trap: false, strength: 0 };
  const rng = stream(config.seedName, card, `trap-strength:${event}`);
  return { trap: true, strength: p.strengthFrom + (p.strengthTo - p.strengthFrom) * rng() };
}

export interface YesterdayStop {
  at: number; // where the marker was when they stopped, 0..1 along the track
  off: number; // signed % off the notch (negative: early)
}

/**
 * R-5 (revised, K05 22): the notch for go `go` goes in the part of the track (of `thirds`) where
 * yesterday's field was most often early, at a seeded place inside it, within Stop's notch range.
 * A tie goes to the tied part nearest the middle, then the lower; no early stops, the middle.
 */
export function notchFromYesterday(card: number, yesterday: YesterdayStop[], go = 0, p = rules().traps, sp = stopParams()): number {
  const counts = new Array<number>(p.thirds).fill(0);
  for (const s of yesterday) if (s.off <= p.earlyAt) counts[clamp(Math.floor(s.at * p.thirds), 0, p.thirds - 1)] += 1;
  const top = Math.max(...counts);
  const mid = Math.floor(p.thirds / 2);
  const tops = counts.map((c, i) => (c === top ? i : -1)).filter((i) => i >= 0);
  const part = top === 0 ? mid : tops.sort((a, b) => Math.abs(a - mid) - Math.abs(b - mid) || a - b)[0];
  const lo = Math.max(part / p.thirds, sp.notchFrom);
  const hi = Math.min((part + 1) / p.thirds, sp.notchTo);
  const rng = stream(config.seedName, card, `trap-notch:${go}`);
  if (hi <= lo) return sp.notchFrom + (sp.notchTo - sp.notchFrom) * rng();
  return lo + (hi - lo) * rng();
}

/** The decoy to copy: yesterday's most-picked wrong answer; a tie goes to the lowest key. */
export function mostPickedWrong(wrongPicks: string[]): string | undefined {
  const tally = new Map<string, number>();
  for (const w of wrongPicks) tally.set(w, (tally.get(w) ?? 0) + 1);
  return [...tally.entries()].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))[0]?.[0];
}

// ---- Z4: personality ----------------------------------------------------------------------------

export interface Tally {
  acts: number; // doubles (Dare) or breaks from the crowd (Read)
  chances: number; // times you could have
  right: number; // of the acts, how many came off
}

export interface Personality {
  word: string;
  you: Tally;
  most: { acts: number; right: number }; // the field's medians, on your number of chances
}

const median = (xs: number[]) => {
  const s = xs.slice().sort((a, b) => a - b);
  const n = s.length;
  return n === 0 ? 0 : n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
};

/** Bold/Careful (Dare) or Loner/Joiner (Read): your act rate against the field's median rate.
 *  R-12: for Dare, acts are every bold choice the card had (V1 the bare stretch or going on, V2
 *  doubles, V4 holding past the field's halfway point), summed by the caller. No word under
 *  minChances, or with no field to compare with. */
export function personality(kind: 'dare' | 'read', you: Tally, field: Tally[], p = rules().personality): Personality | null {
  if (you.chances < p.minChances) return null;
  const rates = field.filter((t) => t.chances > 0).map((t) => t.acts / t.chances);
  if (rates.length === 0) return null;
  const rightRates = field.filter((t) => t.acts > 0).map((t) => t.right / t.acts);
  const medRate = median(rates);
  const words = kind === 'dare' ? p.dare : p.read;
  const word = you.acts / you.chances > medRate ? words[0] : words[1];
  const mostActs = Math.round(medRate * you.chances);
  return { word, you, most: { acts: mostActs, right: Math.round(median(rightRates) * mostActs) } };
}

// ---- Z2: crowd twin -----------------------------------------------------------------------------

export interface TwinCandidate {
  choices: number[]; // the same choices, in the same order, as yours
  town?: string;
  optedIn: boolean;
  modelled?: boolean;
}

/** The nearest real field player by your choices (Euclidean); modelled players are never a twin
 *  (K05 8); a tie goes to the earliest. The town comes back only if they opted in. */
export function crowdTwin(mine: number[], field: TwinCandidate[]): { index: number; distance: number; town?: string } | null {
  let best = -1;
  let bestD = Infinity;
  field.forEach((c, i) => {
    if (c.modelled || c.choices.length !== mine.length) return;
    const d = Math.sqrt(c.choices.reduce((s, x, k) => s + (x - mine[k]) * (x - mine[k]), 0));
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  });
  if (best < 0) return null;
  const twin = field[best];
  return twin.optedIn && twin.town ? { index: best, distance: bestD, town: twin.town } : { index: best, distance: bestD };
}
