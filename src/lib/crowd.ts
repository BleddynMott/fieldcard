// The simulated crowd (spec, "Fixed at finish" and Content supply): until 200 real players finish a
// card, every comparison is against a crowd made from the card's seed, and every reveal says
// "simulated crowd". Each simulated player has a skill; their results come from the same card the
// player saw, so the doors, the boxes and the percentiles move with the card. All numbers are in
// config/games.json under "crowd".
import { config, countParams, pairParams, repeatParams } from './config';
import { dexp, dgauss as gauss } from './dmath';
import { countResult, generateCount } from './events/count';
import { generatePair, pairResult } from './events/pair';
import { generateRepeat, roundLengths } from './events/repeat';
import { generateSort, sortResult } from './events/sort';
import { generateStop, stopResult } from './events/stop';
import { boxOf, doorOf, shares } from './reads';
import { rankKey, type EventResults } from './results';
import { stream } from './rng';
import { clamp, sharesWithin } from './stats';
import { doorsEvent, EVENTS, readOfDay, type EventId } from './week';

export interface SimPlayer {
  results: EventResults;
  beat: Record<EventId, number>;
  hands: number;
  place: number;
  spotRight: boolean;
  read: number[]; // the player's five-box read, shares summing to 100
  overlap: number;
  hunchRaw: number; // points earned / points available, x 100
  flag: number;
}

export interface Crowd {
  card: number;
  simulated: true;
  players: SimPlayer[];
  doorEvent: EventId;
  doorShares: number[]; // share of the crowd behind each of the three doors
  readEvent: EventId;
  boxShares: number[]; // the crowd's real spread over the five boxes
}

const C = config.crowd;
const cache = new Map<number, Crowd>();

/** Builds the crowd afresh, without the cache; for the harness. */
export const simulateCrowd = (card: number): Crowd => simulate(card);

export function crowdFor(card: number): Crowd {
  let c = cache.get(card);
  if (!c) {
    c = simulate(card);
    cache.set(card, c);
  }
  return c;
}

function simulate(card: number): Crowd {
  const rng = stream(config.seedName, card, 'crowd');
  const stop = generateStop(card);
  const count = generateCount(card);
  const repeat = generateRepeat(card);
  const pair = generatePair(card);
  const sort = generateSort(card);
  const rp = repeatParams();
  const pp = pairParams();
  const cp = countParams();
  // the card's own leanings, so the crowd is not the same every day
  const stopBias = gauss(rng) * C.stop.biasSd;
  const countBias = C.count.biasMean + gauss(rng) * C.count.biasSd;
  const nearShare = Math.min(1, pp.nearShareMonday + pp.nearShareStepPerDay * pair.step);

  const skillOf = (s: number) => C.skillShare * s + Math.sqrt(1 - C.skillShare * C.skillShare) * gauss(rng);
  const lengths = roundLengths(rp);
  const raw = Array.from({ length: C.size }, () => {
    const s = gauss(rng);
    const e: Record<EventId, number> = { stop: skillOf(s), count: skillOf(s), repeat: skillOf(s), pair: skillOf(s), sort: skillOf(s) };
    const offs = stop.goes.map((g) => {
      const sd = C.stop.sdBase * dexp(-C.stop.skillEffect * e.stop) * (C.stop.refSweepMs / g.sweepMs);
      return clamp(stopBias + sd * gauss(rng), -C.stop.offClamp, C.stop.offClamp);
    });
    const guess = clamp(
      Math.round(count.target * (1 + countBias + C.count.sd * dexp(-C.count.skillEffect * e.count) * gauss(rng))),
      0,
      cp.guessMax,
    );
    // a run is 0 (the first missed) or one of the lengths played, 3 to 9 (review 24)
    const wanted = Math.round(C.repeat.mean + C.repeat.skillEffect * e.repeat - C.repeat.stepPenalty * repeat.step + C.repeat.noise * gauss(rng));
    const longest = wanted < lengths[0] ? (wanted < lengths[0] / 2 ? 0 : lengths[0]) : Math.min(rp.maxLength, wanted);
    // time as the player's is counted: every tap of every round completed, plus the tap that missed
    const taps = lengths.filter((l) => l <= longest).reduce((a, b) => a + b, 0) + (longest < rp.maxLength ? 1 : 0);
    const repeatMs = taps * C.repeat.msPerTap * dexp(C.repeat.timeNoise * gauss(rng));
    const pairMs = C.pair.medianMs * (1 + C.pair.nearEffect * nearShare) * dexp(-C.pair.skillEffect * e.pair + C.pair.noise * gauss(rng));
    let wrong = 0;
    while (wrong < C.pair.wrongCap && rng() < C.pair.wrongChance) wrong++;
    const sd = C.sort.perceptionSd * dexp(-C.sort.skillEffect * e.sort);
    const seen = sort.blobs.map((b, i) => ({ i, a: b.area * (1 + sd * gauss(rng)) }));
    const order = seen.sort((a, b) => a.a - b.a).map((x) => x.i);
    const sortMs = C.sort.medianMs * dexp(C.sort.timeNoise * gauss(rng));
    const results: EventResults = {
      stop: stopResult(offs),
      count: countResult(guess, count.target),
      repeat: { longest, timeMs: Math.round(repeatMs) },
      pair: pairResult(pairMs, wrong),
      sort: sortResult(order, sortMs),
    };
    return { s, e, results };
  });

  const doorEvent = doorsEvent(card);
  const readEvent = readOfDay(card).event;
  const doorShares = shares(doorEvent, raw.map((r) => r.results[doorEvent]), doorOf, 3);
  const boxShares = shares(readEvent, raw.map((r) => r.results[readEvent]), boxOf, 5);

  const keys = Object.fromEntries(EVENTS.map((ev) => [ev, raw.map((r) => rankKey(ev, r.results[ev]))])) as Record<EventId, number[][]>;
  const within = Object.fromEntries(EVENTS.map((ev) => [ev, sharesWithin(keys[ev])])) as Record<EventId, number[]>;
  const players: SimPlayer[] = raw.map((r, idx) => {
    const beat = Object.fromEntries(EVENTS.map((ev) => [ev, within[ev][idx]])) as Record<EventId, number>;
    const hands = Math.round(EVENTS.reduce((t, ev) => t + beat[ev], 0) / EVENTS.length);
    const skill = r.s;
    const spotRight = rng() < clamp(C.spot.rightBase + C.spot.skillEffect * skill, C.spot.rightMin, C.spot.rightMax);
    const w = clamp(C.read.weightBase + C.read.weightSkill * skill, 0, 1);
    const even = 100 / boxShares.length;
    const blend = boxShares.map((x) => Math.max(0, w * x + (1 - w) * even + C.read.noise * 100 * gauss(rng)));
    const total = blend.reduce((a, b) => a + b, 0) || 1;
    const read = blend.map((x) => (x / total) * 100);
    const ov = read.reduce((t, x, i) => t + Math.min(x, boxShares[i]), 0);
    const pts = (spotRight ? config.scoring.spotPoints : 0) + ov * config.pour.pointsPerOverlap;
    const avail = config.scoring.spotPoints + config.scoring.readPoints;
    return { results: r.results, beat, hands, place: 0, spotRight, read, overlap: ov, hunchRaw: (pts / avail) * 100, flag: 0 };
  });
  const places = sharesWithin(players.map((p) => [-p.hands]));
  players.forEach((p, idx) => {
    p.place = Math.round(places[idx]);
    p.flag = clamp(Math.round(p.place + C.flag.bias + C.flag.sd * gauss(rng)), 0, 100);
  });
  return { card, simulated: true, players, doorEvent, doorShares, readEvent, boxShares };
}
