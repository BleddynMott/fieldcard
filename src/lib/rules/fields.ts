// Every field the Dare and Read rules read, built from the simulated crowd (src/lib/crowd.ts)
// until G-03 brings real players. Every entry is flagged modelled, and the bundle says
// simulated: true, so every reveal can say "simulated crowd" (G-02 spec). R-6: the new rules'
// made-up numbers are in config rules.sim.
import { config } from '../config';
import { crowdFor } from '../crowd';
import { dgauss } from '../dmath';
import { generateCount } from '../events/count';
import { round } from '../events/stop';
import { stream } from '../rng';
import { clamp } from '../stats';
import { dareStopCard, ropeRecord, snapPoint } from './dare';
import { fromHabits, rollingField, type FieldEntry } from './field';
import { generatePlayground, type Point, type Spot } from './hideseek';
import { rules } from './params';
import { normalise, pileOf } from './read';

export interface Fields {
  card: number;
  simulated: true;
  stop: { notchHalf: number; offs: FieldEntry<number>[] }; // R-9: each player's middle stop (the median of three), signed, % of track; notchHalf is Dare's (R-14)
  openStop: { places: FieldEntry<number>[][] }; // R-15: per go, each player's place along the track, 0 to 1
  count: { truth: number; answers: FieldEntry<number>[] };
  repeat: { longest: FieldEntry<number>[] };
  rope: { records: FieldEntry<number>[] };
  longJump: { takeoffs: FieldEntry<number>[] };
  hideSeek: { playground: Spot[]; hides: FieldEntry<Point>[]; seeks: FieldEntry<Point>[] };
  find: { guesses: FieldEntry<number>[]; truths: FieldEntry<number>[] }; // where they thought / finished
}

const asField = <T>(xs: T[]): FieldEntry<T>[] => rollingField([], xs);
const middleOf = (xs: number[]) => xs.slice().sort((a, b) => a - b)[Math.floor((xs.length - 1) / 2)];
const cache = new Map<number, Fields>();

/** Builds the fields afresh, without the cache; for the tests. */
export const simulateFields = (card: number): Fields => build(card);

export function fieldsFor(card: number): Fields {
  let f = cache.get(card);
  if (!f) {
    f = build(card);
    cache.set(card, f);
  }
  return f;
}

function build(card: number): Fields {
  const crowd = crowdFor(card);
  const S = rules().sim;
  const HS = rules().hideSeek;
  const rng = stream(config.seedName, card, 'fields');
  const n = crowd.players.length;

  const RP = rules().rope;
  const onLadder = (x: number) => round(1 + Math.round((x - 1) / RP.step) * RP.step, RP.decimals);
  const releases = Array.from({ length: n }, () => onLadder(Math.max(S.rope.min, S.rope.mean + S.rope.sd * dgauss(rng))));
  const records: number[] = [];
  for (const r of releases) records.push(ropeRecord(r, snapPoint(records)));

  const playground = generatePlayground(card);
  const weights = playground.map((s) => HS.habit[s.kind]);
  const jitter = (p: Point): Point => ({
    x: clamp(p.x + S.seekJitter * dgauss(rng), 0, 1),
    y: clamp(p.y + S.seekJitter * dgauss(rng), 0, 1),
  });
  const hides = fromHabits(weights, n, rng).map((i) => ({ x: playground[i].x, y: playground[i].y }));
  const seeks = fromHabits(weights, n, rng).map((i) => jitter(playground[i]));

  // R-15: open Stop's habits are made up (config rules.sim.openStop). A stop lands at the aim plus
  // noise that grows with the marker's speed there on that go (fast through the middle).
  const O = S.openStop;
  const habitAim = () => {
    let r = rng();
    for (const m of O.mix) {
      if (r < m.share) return clamp((m.mean + m.sd * dgauss(rng)) / 100, 0, 1);
      r -= m.share;
    }
    return 0.5;
  };
  const places = dareStopCard(card).goes.map((go) =>
    asField(
      Array.from({ length: n }, () => {
        const aim = habitAim();
        const speed = 1 - go.ease + 6 * go.ease * aim * (1 - aim);
        return round(clamp(aim + O.sd * speed * dgauss(rng), 0, 1), 4);
      }),
    ),
  );

  return {
    card,
    simulated: true,
    stop: { notchHalf: (dareStopCard(card).notchWidth * 100) / 2, offs: asField(crowd.players.map((p) => middleOf(p.results.stop.offs))) },
    openStop: { places },
    count: { truth: generateCount(card).target, answers: asField(crowd.players.map((p) => p.results.count.guess)) },
    repeat: { longest: asField(crowd.players.map((p) => p.results.repeat.longest)) },
    rope: { records: asField(records) },
    longJump: { takeoffs: asField(Array.from({ length: n }, () => round(S.longJump.mean + S.longJump.sd * dgauss(rng), S.longJump.decimals))) },
    hideSeek: { playground, hides: asField(hides), seeks: asField(seeks) },
    find: { guesses: asField(crowd.players.map((p) => p.flag)), truths: asField(crowd.players.map((p) => p.place)) },
  };
}

/** Everyone's drawings for the draw read, simulated: each a blend of the real pile and an even
 *  spread, plus noise, seeded per card and axis. */
export function simulatedDrawings(card: number, axis: string, values: number[], from: number, to: number, count: number): number[][] {
  const S = rules().sim.drawing;
  const real = pileOf(values, from, to);
  if (!real) return [];
  const rng = stream(config.seedName, card, `drawings:${axis}`);
  const even = 100 / real.length;
  const out: number[][] = [];
  for (let k = 0; k < count; k++) {
    const w = S.weightFrom + (S.weightTo - S.weightFrom) * rng();
    const d = normalise(real.map((x) => Math.max(0, w * x + (1 - w) * even + S.noise * 100 * dgauss(rng))));
    if (d) out.push(d);
  }
  return out;
}
