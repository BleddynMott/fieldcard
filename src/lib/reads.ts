// The reads after the events: the doors (Spot it), the five boxes (Read of the day), overlap.
import { config } from './config';
import { metricOf, type EventResults } from './results';
import type { EventId } from './week';

export interface DoorSpec {
  metric: string;
  below: number;
  above: number;
  labels: string[];
  facts: string[];
  ask: string;
}

export interface BoxSpec {
  metric: string;
  cuts: number[];
  labels: string[];
  ask: string;
}

export const doorSpec = (e: EventId) => (config.doors as Record<EventId, DoorSpec>)[e];
export const boxSpec = (e: EventId) => (config.boxes as unknown as Record<EventId, BoxSpec>)[e];

/** Door 0 below the low cut, door 2 above the high cut, door 1 between (inclusive). */
export function doorOf(e: EventId, value: number): number {
  const d = doorSpec(e);
  if (value < d.below) return 0;
  if (value > d.above) return 2;
  return 1;
}

export function boxOf(e: EventId, value: number): number {
  const cuts = boxSpec(e).cuts;
  for (let i = 0; i < cuts.length; i++) if (value < cuts[i]) return i;
  return cuts.length;
}

/** Shares (0 to 100, summing to 100) of results in each bin. */
export function shares<E extends EventId>(e: E, results: EventResults[E][], bin: (e: EventId, v: number) => number, bins: number): number[] {
  const counts = new Array(bins).fill(0);
  for (const r of results) counts[bin(e, metricOf(e, r))] += 1;
  return counts.map((c) => (results.length ? (c / results.length) * 100 : 0));
}

/** The doors with the biggest share, judged on the whole percentages the player is shown, so two
 *  doors showing the same number are both right (spec: "either is right"; review 22). */
export function topDoors(doorShares: number[]): number[] {
  const shown = wholeShares(doorShares);
  const max = Math.max(...shown);
  return shown.map((s, i) => (s === max ? i : -1)).filter((i) => i >= 0);
}

/** Pour's ✓: the overlap as shown, a whole number, at or above the line (review 21). */
export function matched(ov: number): boolean {
  return Math.round(ov) >= config.pour.matchTick;
}

/** Overlap of two spreads: the sum over the boxes of the smaller share, 0 to 100. */
export function overlap(a: number[], b: number[]): number {
  return a.reduce((s, x, i) => s + Math.min(x, b[i] ?? 0), 0);
}

/** Whole-number shares that sum to exactly 100 (largest remainder), for display. */
export function wholeShares(s: number[]): number[] {
  return apportion(s, 100);
}

/** Whole numbers in proportion to s that sum to exactly `total` (largest remainder). */
export function apportion(s: number[], total: number): number[] {
  const sum = s.reduce((a, b) => a + b, 0) || 1;
  const scaled = s.map((x) => (x / sum) * total);
  const floors = scaled.map(Math.floor);
  let left = total - floors.reduce((a, b) => a + b, 0);
  const order = scaled.map((x, i) => [x - Math.floor(x), i]).sort((a, b) => b[0] - a[0] || a[1] - b[1]);
  for (const [, i] of order) {
    if (left <= 0) break;
    floors[i] += 1;
    left -= 1;
  }
  return floors;
}
