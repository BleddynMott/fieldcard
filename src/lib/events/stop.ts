// Stop: a marker sweeps along a track with a notch; press Stop to stop it; three goes, each with its
// own notch and speed (spec, Rules 2.1). Raw result: mean distance from the notch, % of track, lower
// is better. Also kept: the signed mean, negative early and positive late in the direction of travel.
// Harder after his first play (26 Nov, "just really easy"): each go is faster than the last, the
// marker speeds up every time it turns (waiting for the rhythm does not help), and it moves fastest
// through the middle of the track, where the notches are.
import { dayOfCard, weekdayStep } from '../card';
import { config, stopParams, type StopParams } from '../config';
import { between, stream } from '../rng';

export interface StopGo {
  notch: number; // centre of the notch, 0 to 1 along the track
  sweepMs: number; // time for the marker's first crossing of the track
  ease: number; // 0 = even speed; higher = slower at the ends, faster through the middle
}

export interface StopCard {
  step: number;
  goes: StopGo[];
}

export interface StopResult {
  offs: number[]; // per go, % of track, signed (negative early)
  mean: number; // raw result: mean absolute distance, % of track
  signedMean: number;
}

export function generateStop(card: number, p: StopParams = stopParams()): StopCard {
  const rng = stream(config.seedName, card, 'stop');
  const step = weekdayStep(dayOfCard(card));
  const base = p.sweepMsMonday + p.sweepMsStepPerDay * step;
  const goes: StopGo[] = [];
  for (let i = 0; i < p.goes; i++) {
    let notch = between(rng, p.notchFrom, p.notchTo);
    // each go its own notch: keep it clear of the one before
    for (let tries = 0; i > 0 && Math.abs(notch - goes[i - 1].notch) < p.notchApartMin && tries < 20; tries++) {
      notch = between(rng, p.notchFrom, p.notchTo);
    }
    const sweepMs = Math.round(base * p.goSpeedUp ** i * between(rng, 1 - p.sweepMsJitter, 1 + p.sweepMsJitter));
    const ease = round(between(rng, p.easeFrom, p.easeTo), 3);
    goes.push({ notch: round(notch, 4), sweepMs, ease });
  }
  return { step, goes };
}

/** How long crossing number k (0 = the first) takes: each turn is faster, down to the floor. */
export function crossingMs(go: StopGo, k: number, p: StopParams = stopParams()): number {
  return Math.max(p.sweepMsFloor, go.sweepMs * p.turnSpeedUp ** k);
}

/** Where the marker is at time t (ms since the go started). It starts at 0 and sweeps there and
 *  back; dir is the direction of travel. */
export function markerAt(t: number, go: StopGo, p: StopParams = stopParams()): { pos: number; dir: 1 | -1 } {
  let rest = Math.max(0, t);
  let k = 0;
  let ms = crossingMs(go, k, p);
  while (rest >= ms && ms > p.sweepMsFloor) {
    rest -= ms;
    k += 1;
    ms = crossingMs(go, k, p);
  }
  if (rest >= ms) {
    // at the floor every crossing takes the same time
    k += Math.floor(rest / ms);
    rest %= ms;
  }
  const x = shape(rest / ms, go.ease);
  return k % 2 === 0 ? { pos: x, dir: 1 } : { pos: 1 - x, dir: -1 };
}

/** Position along one crossing for the share of its time gone: even speed blended with smoothstep.
 *  Rises from 0 to 1 for any ease below 1. */
export function shape(f: number, ease: number): number {
  const smooth = f * f * (3 - 2 * f);
  return (1 - ease) * f + ease * smooth;
}

/** Signed distance from the notch, % of track: negative when the marker had not reached it yet. */
export function signedOff(pos: number, dir: 1 | -1, notch: number): number {
  return (pos - notch) * dir * 100;
}

export function stopResult(offs: number[], p: StopParams = stopParams()): StopResult {
  const mean = offs.reduce((s, o) => s + Math.abs(o), 0) / offs.length;
  const signedMean = offs.reduce((s, o) => s + o, 0) / offs.length;
  return { offs, mean: round(mean, p.resultDecimals), signedMean: round(signedMean, p.resultDecimals) };
}

export function round(x: number, decimals: number): number {
  const f = 10 ** decimals;
  return Math.round(x * f) / f;
}
