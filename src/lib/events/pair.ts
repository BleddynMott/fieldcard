// Pair: twelve shapes; exactly two identical; tap both; a wrong tap adds 3 seconds (spec, Rules 2.4).
// Raw result: seconds. Harder through the week: more of the others differ from the pair in only one
// feature (form, colour or style).
import { dayOfCard, weekdayStep } from '../card';
import { config, pairParams, type PairParams } from '../config';
import { stream } from '../rng';
import { clamp, pickIndex, shuffle } from '../stats';

export interface Shape {
  form: number;
  kit: number;
  style: number;
}

export interface PairCard {
  step: number;
  shapes: Shape[];
  pair: [number, number]; // indexes of the two identical shapes, lower first
}

export interface PairResult {
  ms: number; // time including penalties
  wrong: number;
  seconds: number;
}

const key = (s: Shape) => `${s.form}.${s.kit}.${s.style}`;

export function generatePair(card: number, p: PairParams = pairParams()): PairCard {
  const rng = stream(config.seedName, card, 'pair');
  const step = weekdayStep(dayOfCard(card));
  const kits = config.kits.length;
  const P: Shape = { form: pickIndex(rng, p.forms), kit: pickIndex(rng, kits), style: pickIndex(rng, p.styles) };
  const near: Shape[] = [];
  for (let f = 0; f < p.forms; f++) if (f !== P.form) near.push({ ...P, form: f });
  for (let k = 0; k < kits; k++) if (k !== P.kit) near.push({ ...P, kit: k });
  for (let s = 0; s < p.styles; s++) if (s !== P.style) near.push({ ...P, style: s });
  const others = p.shapes - 2;
  const nearWanted = clamp(Math.round((p.nearShareMonday + p.nearShareStepPerDay * step) * others), 0, near.length);
  const chosen = shuffle(rng, near).slice(0, nearWanted);
  const used = new Set([key(P), ...chosen.map(key)]);
  while (chosen.length < others) {
    const s: Shape = { form: pickIndex(rng, p.forms), kit: pickIndex(rng, kits), style: pickIndex(rng, p.styles) };
    if (!used.has(key(s))) {
      used.add(key(s));
      chosen.push(s);
    }
  }
  const shapes = shuffle(rng, [P, { ...P }, ...chosen]);
  const idx = shapes.map((s, i) => (key(s) === key(P) ? i : -1)).filter((i) => i >= 0);
  return { step, shapes, pair: [idx[0], idx[1]] };
}

export function pairResult(elapsedMs: number, wrong: number, p: PairParams = pairParams()): PairResult {
  const ms = Math.round(elapsedMs + wrong * p.wrongPenaltyMs);
  return { ms, wrong, seconds: Math.round(ms / 100) / 10 };
}

/** Indexes of shapes identical to each other, for the harness. */
export function identicalPairs(shapes: Shape[]): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 0; i < shapes.length; i++)
    for (let j = i + 1; j < shapes.length; j++) if (key(shapes[i]) === key(shapes[j])) out.push([i, j]);
  return out;
}
