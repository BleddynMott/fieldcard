// Stop: a marker sweeps along a track with a notch; tap to stop it; three goes, each with its own
// notch and speed (spec, Rules 2.1). Raw result: mean distance from the notch, % of track, lower is
// better. Also kept: the signed mean, negative early and positive late in the direction of travel.
import { dayOfCard, weekdayStep } from '../card';
import { config, stopParams, type StopParams } from '../config';
import { between, stream } from '../rng';

export interface StopGo {
  notch: number; // centre of the notch, 0 to 1 along the track
  sweepMs: number; // time for the marker to cross the track once
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
    const sweepMs = Math.round(base * between(rng, 1 - p.sweepMsJitter, 1 + p.sweepMsJitter));
    goes.push({ notch: round(notch, 4), sweepMs });
  }
  return { step, goes };
}

/** Where the marker is at time t (ms since the go started): it sweeps there and back from 0. */
export function markerAt(t: number, sweepMs: number): { pos: number; dir: 1 | -1 } {
  const phase = (Math.max(0, t) / sweepMs) % 2;
  return phase < 1 ? { pos: phase, dir: 1 } : { pos: 2 - phase, dir: -1 };
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
