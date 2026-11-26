// Sort: five blobs of close size; drag into order, smallest to largest; Done (spec, Rules 2.5).
// Raw result: pairs out of order (0 to 10), ties by time. Areas step up by at least 3% each.
import { dayOfCard, weekdayStep } from '../card';
import { config, sortParams, type SortParams } from '../config';
import { powInt } from '../dmath';
import { between, stream } from '../rng';
import { shuffle } from '../stats';

export interface Blob {
  area: number; // share of its square, 0 to 1
  wobble: number; // radius wobble, as a share of the radius
  lobes: number;
  phase: number; // radians
}

export interface SortCard {
  step: number;
  blobs: Blob[]; // in size order, smallest first
  start: number[]; // the order they are shown in, as indexes into blobs
}

export interface SortResult {
  order: number[]; // the player's order, smallest first, as indexes into blobs
  pairsOut: number;
  timeMs: number;
}

export function generateSort(card: number, p: SortParams = sortParams()): SortCard {
  const rng = stream(config.seedName, card, 'sort');
  const step = weekdayStep(dayOfCard(card));
  const gap = Math.max(p.gapMin, p.gapMonday + p.gapStepPerDay * step);
  const blobs: Blob[] = [];
  for (let i = 0; i < p.blobs; i++) {
    const lobes = Math.floor(between(rng, p.lobesFrom, p.lobesTo + 1));
    blobs.push({
      area: Math.round((p.areaLargest / powInt(1 + gap, p.blobs - 1 - i)) * 1e5) / 1e5,
      wobble: Math.round(between(rng, p.wobbleFrom, p.wobbleTo) * 1000) / 1000,
      lobes: Math.min(lobes, p.lobesTo),
      phase: Math.round(between(rng, 0, Math.PI * 2) * 1000) / 1000,
    });
  }
  const ids = blobs.map((_, i) => i);
  let start = shuffle(rng, ids);
  while (pairsOut(start) === 0) start = shuffle(rng, ids); // never already in order
  return { step, blobs, start };
}

/** Pairs out of order: how many pairs are the wrong way round. */
export function pairsOut(order: number[]): number {
  let n = 0;
  for (let i = 0; i < order.length; i++) for (let j = i + 1; j < order.length; j++) if (order[i] > order[j]) n++;
  return n;
}

/** Radius of a blob, as a share of half its square, so its area matches blob.area exactly:
 *  r(t) = R (1 + w sin(k t + phase)) has area pi R^2 (1 + w^2 / 2). */
export function blobRadius(b: Blob): number {
  return Math.sqrt((b.area * 4) / (Math.PI * (1 + (b.wobble * b.wobble) / 2)));
}

/** An SVG path for a blob in a 100-unit square centred at (50, 50). */
export function blobPath(b: Blob, points = 48): string {
  const R = blobRadius(b) * 50;
  const pts: string[] = [];
  for (let i = 0; i < points; i++) {
    const t = (i / points) * Math.PI * 2;
    const r = R * (1 + b.wobble * Math.sin(b.lobes * t + b.phase));
    pts.push(`${(50 + r * Math.cos(t)).toFixed(2)} ${(50 + r * Math.sin(t)).toFixed(2)}`);
  }
  return `M${pts.join('L')}Z`;
}

export function sortResult(order: number[], timeMs: number): SortResult {
  return { order, pairsOut: pairsOut(order), timeMs: Math.round(timeMs) };
}
