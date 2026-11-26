// Count: a crowd of figures crosses the screen; some wear today's colour, shown first. Say how many,
// with a stepper (spec, Rules 2.2). Raw result: absolute error, % of the true count, lower is
// better. Also kept: the signed error (guess minus true count).
import { dayOfCard, weekdayStep } from '../card';
import { config, countParams, type CountParams } from '../config';
import { stream } from '../rng';
import { clamp, pickIndex, shuffle } from '../stats';

export interface Figure {
  kit: number; // index into config.kits
  lane: number; // 0 .. lanes-1, top to bottom
  startMs: number; // when it enters on the left
  crossMs: number; // how long it takes to cross
}

export interface CountCard {
  step: number;
  todayKit: number;
  target: number;
  figures: Figure[];
}

export interface CountResult {
  guess: number;
  actual: number;
  signedError: number;
  errorPct: number;
}

export function generateCount(card: number, p: CountParams = countParams()): CountCard {
  const rng = stream(config.seedName, card, 'count');
  const step = weekdayStep(dayOfCard(card));
  const kits = config.kits.length;
  const todayKit = pickIndex(rng, kits);
  const total = p.totalMonday + p.totalStepPerDay * step;
  const share = p.targetShareFrom + (p.targetShareTo - p.targetShareFrom) * rng();
  const target = clamp(Math.round(total * share), p.targetMin, Math.min(p.targetMax, total));
  const crossMs = p.crossMsMonday + p.crossMsStepPerDay * step;
  const others = Array.from({ length: kits - 1 }, (_, i) => (i >= todayKit ? i + 1 : i));
  const kitsInOrder = shuffle(rng, [
    ...Array.from({ length: target }, () => todayKit),
    ...Array.from({ length: total - target }, () => others[pickIndex(rng, others.length)]),
  ]);
  const window = Math.max(0, p.showMs - crossMs);
  const figures = kitsInOrder.map((kit, i) => ({
    kit,
    lane: i % p.lanes,
    // spread entries evenly over the window, jittered, so figures rarely overlap
    startMs: Math.round(((i + rng()) / kitsInOrder.length) * window),
    crossMs: Math.round(crossMs * (0.9 + 0.2 * rng())),
  }));
  return { step, todayKit, target, figures };
}

export function countResult(guess: number, actual: number): CountResult {
  const signedError = guess - actual;
  return { guess, actual, signedError, errorPct: Math.round((Math.abs(signedError) / actual) * 1000) / 10 };
}
