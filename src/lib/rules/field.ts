// The field (G-00c C1): the last `size` real finishers of an event. Until that many exist, the gap
// is filled with modelled players, each flagged, so a reveal can say so. G-03 feeds real rows in;
// this is only the rule.
import type { Rng } from '../rng';
import { rules } from './params';

export interface FieldEntry<T> {
  value: T;
  modelled: boolean;
}

/** real: oldest first, in finish order. modelled: used from the front, only to fill the gap. */
export function rollingField<T>(real: T[], modelled: T[], size = rules().field.size): FieldEntry<T>[] {
  const kept = real.slice(Math.max(0, real.length - size)).map((value) => ({ value, modelled: false }));
  const gap = size - kept.length;
  const fill = modelled.slice(0, Math.max(0, gap)).map((value) => ({ value, modelled: true }));
  return [...fill, ...kept];
}

export const values = <T>(field: FieldEntry<T>[]): T[] => field.map((e) => e.value);

/** Share of the field that is modelled, 0 to 100. */
export function modelledShare<T>(field: FieldEntry<T>[]): number {
  if (field.length === 0) return 0;
  return (field.filter((e) => e.modelled).length / field.length) * 100;
}

/** Carry-over: yesterday's players' signed errors, laid on today's truth. */
export function carryOver(yesterdayErrors: number[], todayTruth: number): number[] {
  return yesterdayErrors.map((e) => todayTruth + e);
}

/** R-1: draws n indices from habit weights (Hide and Seek have no errors to carry over). */
export function fromHabits(weights: number[], n: number, rng: Rng): number[] {
  const total = weights.reduce((a, b) => a + b, 0);
  if (total <= 0 || weights.length === 0) throw new Error('fromHabits: weights must be positive');
  const out: number[] = [];
  for (let k = 0; k < n; k++) {
    let r = rng() * total;
    let i = 0;
    while (i < weights.length - 1 && r >= weights[i]) {
      r -= weights[i];
      i++;
    }
    out.push(i);
  }
  return out;
}
