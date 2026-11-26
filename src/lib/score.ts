// The Scorecard's numbers (spec, Scores), fixed when the player finishes, against the crowd.
// Hands: the average of your five event percentiles, rounded. Place: where your Hands ranks among
// everyone's. Hunch: points earned at Spot it (10) and the Read of the day (80), over the 90
// available with no Hot Seat (G-02 R5), x 100, then ranked against everyone's. Flag: +c if your
// place p >= c, else -2 (c - p).
import { config } from './config';
import type { Crowd } from './crowd';
import { overlap, topDoors } from './reads';
import { rankKey, type EventResults } from './results';
import { shareBeaten, shareBelow } from './stats';
import { EVENTS, type EventId } from './week';

export interface Reads {
  door: number; // the door the player picked
  read: number[]; // the player's five-box read, summing to 100
}

export interface Scorecard {
  card: number;
  beat: Record<EventId, number>; // rounded, 0 to 100
  hands: number;
  place: number;
  spotRight: boolean;
  spotPoints: number;
  overlap: number; // rounded, 0 to 100
  readPoints: number;
  hunchRaw: number;
  hunch: number;
  flag: number;
  flagPoints: number;
  simulated: boolean;
}

export function flagPoints(flag: number, place: number): number {
  return place >= flag ? flag : -config.scoring.flagShortMultiplier * (flag - place);
}

export function readPoints(ov: number): number {
  return Math.round(ov * config.pour.pointsPerOverlap);
}

/** Everything but the flag, which the player plants after seeing these reads. */
export function scoreBeforeFlag(crowd: Crowd, results: EventResults, reads: Reads) {
  const beatRaw = Object.fromEntries(
    EVENTS.map((ev) => [ev, shareBeaten(rankKey(ev, results[ev]), crowd.players.map((p) => rankKey(ev, p.results[ev])))]),
  ) as Record<EventId, number>;
  const beat = Object.fromEntries(EVENTS.map((ev) => [ev, Math.round(beatRaw[ev])])) as Record<EventId, number>;
  const hands = Math.round(EVENTS.reduce((t, ev) => t + beatRaw[ev], 0) / EVENTS.length);
  const place = Math.round(shareBelow(hands, crowd.players.map((p) => p.hands)));
  const spotRight = topDoors(crowd.doorShares).includes(reads.door);
  const spotPoints = spotRight ? config.scoring.spotPoints : 0;
  const ov = overlap(reads.read, crowd.boxShares);
  const rp = readPoints(ov);
  const avail = config.scoring.spotPoints + config.scoring.readPoints;
  const hunchRaw = ((spotPoints + ov * config.pour.pointsPerOverlap) / avail) * 100;
  const hunch = Math.round(shareBelow(hunchRaw, crowd.players.map((p) => p.hunchRaw)));
  return { card: crowd.card, beat, hands, place, spotRight, spotPoints, overlap: Math.round(ov), readPoints: rp, hunchRaw, hunch, simulated: crowd.simulated };
}

export function scorecard(crowd: Crowd, results: EventResults, reads: Reads, flag: number): Scorecard {
  const s = scoreBeforeFlag(crowd, results, reads);
  return { ...s, flag, flagPoints: flagPoints(flag, s.place) };
}
