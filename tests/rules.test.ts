// G-02 harness, part 3: rules worked out by hand from the spec, so a test fails when a rule is
// wrong, not only when a value leaves its range (review 3, 9 to 14, 24, 55). Over the same dates.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { abandonedResult } from '../src/lib/abandon';
import { nextMove, STEPS } from '../src/lib/flow';
import { dayOfCard, weekday } from '../src/lib/card';
import { config, countParams, pairParams, repeatParams, sortParams, stopParams } from '../src/lib/config';
import { crowdFor, type Crowd, type SimPlayer } from '../src/lib/crowd';
import { dexp, powInt } from '../src/lib/dmath';
import { countResult, generateCount } from '../src/lib/events/count';
import { generatePair, pairResult } from '../src/lib/events/pair';
import { generateRepeat, roundLengths } from '../src/lib/events/repeat';
import { generateSort } from '../src/lib/events/sort';
import { generateStop, stopResult } from '../src/lib/events/stop';
import { fingerprint } from '../src/lib/fingerprint';
import { matched, topDoors } from '../src/lib/reads';
import { rankKey, type EventResults } from '../src/lib/results';
import { mulberry32 } from '../src/lib/rng';
import { scorecard } from '../src/lib/score';
import { shareBeaten, sharesWithin } from '../src/lib/stats';
import { streak } from '../src/lib/streak';
import { EVENTS, week } from '../src/lib/week';

const cards = Array.from({ length: 60 }, (_, i) => i + 1);
const mondays = cards.filter((n) => weekday(dayOfCard(n)) === 1);
const sundays = cards.filter((n) => weekday(dayOfCard(n)) === 0);
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

describe('the weekday tables are the spec\'s, as written', () => {
  it('doors: Mon Repeat, Tue Count, Wed Stop, Thu Sort, Fri Pair, Sat Count, Sun Stop', () => {
    expect(week.doors).toEqual(['stop', 'repeat', 'count', 'stop', 'sort', 'pair', 'count']); // from Sunday
  });
  it('read of the day: Mon Pick Count, Tue Fix Stop, Wed Pour Count, Thu Find Repeat, Fri Pick Sort, Sat Fix Pair, Sun Pour Count', () => {
    expect(week.read).toEqual([
      { form: 'pour', event: 'count' },
      { form: 'pick', event: 'count' },
      { form: 'fix', event: 'stop' },
      { form: 'pour', event: 'count' },
      { form: 'find', event: 'repeat' },
      { form: 'pick', event: 'sort' },
      { form: 'fix', event: 'pair' },
    ]);
  });
});

describe('harder at every step from Monday to Sunday, not only at the ends (round-2 a4)', () => {
  const byStep = <T,>(f: (n: number) => T) => {
    const out: T[][] = Array.from({ length: 7 }, () => []);
    for (const n of cards) out[(weekday(dayOfCard(n)) + 6) % 7].push(f(n));
    return out;
  };
  it('Stop: the notch narrows and the mean sweep shortens each day', () => {
    const w = byStep((n) => generateStop(n).notchWidth).map((xs) => xs[0]);
    const sweep = byStep((n) => generateStop(n).goes[0].sweepMs).map(mean);
    for (let s = 1; s < 7; s++) {
      expect(w[s]).toBeLessThan(w[s - 1]);
      expect(sweep[s]).toBeLessThan(sweep[s - 1]);
    }
  });
  it('Count: more figures each day; Repeat: shorter flashes each day; Sort: closer sizes each day until the floor; Pair: never fewer near shapes', () => {
    const figs = byStep((n) => generateCount(n).figures.length).map((xs) => xs[0]);
    const flash = byStep((n) => generateRepeat(n).flashMs).map((xs) => xs[0]);
    const gap = byStep((n) => { const b = generateSort(n).blobs; return b[1].area / b[0].area - 1; }).map((xs) => xs[0]);
    const near = byStep((n) => {
      const c = generatePair(n);
      const P = c.shapes[c.pair[0]];
      return c.shapes.filter((s) => [s.form !== P.form, s.kit !== P.kit, s.style !== P.style].filter(Boolean).length === 1).length;
    }).map((xs) => xs[0]);
    for (let s = 1; s < 7; s++) {
      expect(figs[s]).toBeGreaterThan(figs[s - 1]);
      expect(flash[s]).toBeLessThan(flash[s - 1]);
      expect(gap[s]).toBeLessThanOrEqual(gap[s - 1] + 1e-12);
      expect(near[s]).toBeGreaterThanOrEqual(near[s - 1]);
    }
    expect(gap[6]).toBeLessThan(gap[0]);
    expect(near[6]).toBeGreaterThan(near[0]);
  });
});

describe('one step harder each day, Monday to Sunday (review 11)', () => {
  it('there are Mondays and Sundays in the 60 dates', () => {
    expect(mondays.length).toBeGreaterThan(5);
    expect(sundays.length).toBeGreaterThan(5);
  });
  it('Stop: faster and a narrower notch on Sunday', () => {
    expect(mean(sundays.map((n) => generateStop(n).goes[0].sweepMs))).toBeLessThan(mean(mondays.map((n) => generateStop(n).goes[0].sweepMs)));
    for (const [m, s] of [[mondays[0], sundays[0]]]) expect(generateStop(s).notchWidth).toBeLessThan(generateStop(m).notchWidth);
  });
  it('Count: more figures and faster on Sunday', () => {
    expect(mean(sundays.map((n) => generateCount(n).figures.length))).toBeGreaterThan(mean(mondays.map((n) => generateCount(n).figures.length)));
    expect(mean(sundays.map((n) => generateCount(n).figures[0].crossMs))).toBeLessThan(mean(mondays.map((n) => generateCount(n).figures[0].crossMs)));
  });
  it('Repeat: faster flashes on Sunday', () => {
    expect(generateRepeat(sundays[0]).flashMs).toBeLessThan(generateRepeat(mondays[0]).flashMs);
  });
  it('Pair: more shapes one feature from the pair on Sunday', () => {
    const near = (n: number) => {
      const c = generatePair(n);
      const P = c.shapes[c.pair[0]];
      return c.shapes.filter((s) => [s.form !== P.form, s.kit !== P.kit, s.style !== P.style].filter(Boolean).length === 1).length;
    };
    expect(mean(sundays.map(near))).toBeGreaterThan(mean(mondays.map(near)));
  });
  it('Sort: closer sizes on Sunday, never under 3%', () => {
    const gap = (n: number) => {
      const b = generateSort(n).blobs;
      return b[1].area / b[0].area - 1;
    };
    expect(mean(sundays.map(gap))).toBeLessThan(mean(mondays.map(gap)));
    for (const n of sundays) expect(gap(n)).toBeGreaterThanOrEqual(0.03 - 1e-9);
  });
});

describe('Count: no figure catches the one ahead in its lane (review 40)', () => {
  it('one speed per lane, entries in order', () => {
    for (const n of cards) {
      const c = generateCount(n);
      for (let lane = 0; lane < countParams().lanes; lane++) {
        const fs = c.figures.filter((f) => f.lane === lane);
        for (let i = 1; i < fs.length; i++) {
          expect(fs[i].crossMs).toBe(fs[0].crossMs);
          // far enough apart at entry not to overlap (round-2 b15)
          expect(fs[i].startMs - fs[i - 1].startMs).toBeGreaterThanOrEqual(countParams().minLaneGapMs);
        }
      }
    }
  });
});

/** A crowd of hand-made players, for worked examples. */
function fakeCrowd(players: Partial<SimPlayer>[], doorShares: number[], boxShares: number[]): Crowd {
  return { card: 1, simulated: true, players: players as SimPlayer[], doorEvent: 'stop', doorShares, readEvent: 'count', boxShares };
}
const res = (stopMean: number): EventResults => ({
  stop: stopResult([stopMean, stopMean, stopMean]),
  count: countResult(10, 10),
  repeat: { longest: 5, timeMs: 5000 },
  pair: pairResult(5000, 0),
  sort: { order: [0, 1, 2, 3, 4], pairsOut: 0, timeMs: 5000 },
});

describe('scores worked out by hand (review 13)', () => {
  // four others: Stop means 1, 2, 2 and 4 (lower is better); all else equal to the player's
  const others = [1, 2, 2, 4].map((m, i) => ({ results: res(m), hands: [20, 40, 60, 80][i], hunchRaw: [10, 50, 50, 90][i] }));
  const crowd = fakeCrowd(others, [50, 30, 20], [0, 0, 100, 0, 0]);

  it('a percentile is the share beaten, ties counting half', () => {
    // Stop mean 2: beats the 4 (1), ties two 2s (0.5 each), loses to the 1: 2 of 4 = 50
    const s = scorecard(crowd, res(2), { door: 0, read: [0, 0, 100, 0, 0] }, 50);
    expect(s.beat.stop).toBe(50);
    // every other event ties all four: 50 each
    expect(s.beat.count).toBe(50);
  });
  it('Hands is the rounded mean of the five percentiles; place ranks Hands among everyone\'s', () => {
    const s = scorecard(crowd, res(0.5), { door: 0, read: [0, 0, 100, 0, 0] }, 50);
    expect(s.beat.stop).toBe(100);
    expect(s.hands).toBe(60); // (100 + 50 x 4) / 5
    expect(s.place).toBe(63); // beats 20 and 40, ties 60 (half), loses to 80: 2.5 of 4 = 62.5 -> 63
  });
  it('Hunch is out of 90 with no Hot Seat (R5), then ranked', () => {
    const s = scorecard(crowd, res(2), { door: 0, read: [0, 0, 100, 0, 0] }, 50);
    expect(s.spotPoints).toBe(10);
    expect(s.overlap).toBe(100);
    expect(s.readPoints).toBe(80);
    expect(s.hunchRaw).toBeCloseTo(100, 9); // (10 + 80) / 90 x 100
    expect(s.hunch).toBe(100); // above 10, 50, 50 and 90
    const wrongDoor = scorecard(crowd, res(2), { door: 1, read: [0, 0, 100, 0, 0] }, 50);
    expect(wrongDoor.hunchRaw).toBeCloseTo((80 / 90) * 100, 9);
  });
  it('the flag: +c when place reaches it, -2 x the gap when short', () => {
    expect(scorecard(crowd, res(2), { door: 0, read: [0, 0, 100, 0, 0] }, 30).flagPoints).toBe(30);
    const s = scorecard(crowd, res(2), { door: 0, read: [0, 0, 100, 0, 0] }, 90);
    expect(s.flagPoints).toBe(-2 * (90 - s.place));
  });
  it('two doors showing the same whole percentage are both right (review 22), and so are exactly level ones (round-2 b1)', () => {
    expect(topDoors([49.25, 49, 1.75])).toEqual([0, 1]);
    expect(topDoors([37.5, 37.5, 25])).toEqual([0, 1]);
    expect(topDoors([25, 37.5, 37.5])).toEqual([1, 2]);
    expect(topDoors([100 / 3, 100 / 3, 100 / 3])).toEqual([0, 1, 2]);
    expect(topDoors([50, 30, 20])).toEqual([0]);
  });
  it('Pour\'s tick follows the number shown (review 21)', () => {
    expect(matched(69.4)).toBe(false);
    expect(matched(69.6)).toBe(true);
  });
});

describe('the crowd', () => {
  it('in-group shares agree with comparing every pair (review 39)', () => {
    const rng = mulberry32(3);
    const keys = Array.from({ length: 200 }, () => [Math.floor(rng() * 20), Math.floor(rng() * 3)]);
    const fast = sharesWithin(keys);
    keys.forEach((k, i) => expect(fast[i]).toBeCloseTo(shareBeaten(k, keys.filter((_, j) => j !== i)), 9));
  });
  it('Repeat runs are 0 or a played length; time counts every tap, as the player\'s does (review 24)', () => {
    const played = new Set([0, ...roundLengths(repeatParams())]);
    for (const n of [1, 9, 33]) for (const p of crowdFor(n).players) expect(played.has(p.results.repeat.longest)).toBe(true);
  });
  it('an abandoned event beats no one, not even the worst real result (round-2 a1)', () => {
    const worst: EventResults = {
      stop: stopResult([100, 100, 100]),
      count: countResult(countParams().guessMax, countParams().targetMin), // 1900% off
      repeat: { longest: 0, timeMs: 1e9 },
      pair: pairResult(1e9, 99),
      sort: { order: [4, 3, 2, 1, 0], pairsOut: 10, timeMs: 1e9 },
    };
    for (const n of [2, 30]) {
      const c = crowdFor(n);
      for (const ev of EVENTS) {
        const r = abandonedResult(ev, n);
        expect(shareBeaten(rankKey(ev, r), c.players.map((p) => rankKey(ev, p.results[ev])))).toBe(0);
        expect(shareBeaten(rankKey(ev, r), [rankKey(ev, worst[ev])])).toBe(0);
      }
    }
  });
});

describe('the order of play and one attempt (round-2 a2)', () => {
  it('goes through the steps in order, and to the Scorecard once the flag is planted', () => {
    const steps: Record<string, unknown> = {};
    for (const s of STEPS) {
      expect(nextMove(3, steps, false).screen).toBe(s);
      steps[s] = {};
    }
    expect(nextMove(3, steps, false).screen).toBe('scorecard');
    expect(nextMove(3, { ...steps, scorecard: {} }, true).screen).toBe('scorecard');
  });
  it('an event started and not finished is recorded as abandoned, and play moves on with a notice', () => {
    const m = nextMove(3, { stop: {}, 'count:started': true }, false);
    expect(m.screen).toBe('repeat');
    expect(m.record).toHaveLength(1);
    expect(m.record[0][0]).toBe('count');
    expect((m.record[0][1] as { abandoned?: boolean }).abandoned).toBe(true);
    expect(m.notice).toContain('Count');
  });
  it('a finished card with no scorecard (unreadable record) goes home, never back to an event', () => {
    expect(nextMove(3, {}, true)).toEqual({ screen: 'home', record: [], notice: '' });
  });
  it('every event screen marks itself started at Ready', () => {
    for (const f of ['Stop', 'Count', 'Repeat', 'Pair', 'Sort']) {
      const src = readFileSync(`src/screens/${f}.svelte`, 'utf8');
      expect(src, f).toMatch(/onstart\(\)/);
    }
  });
});

describe('every duration token the code reads exists (round-2 a7)', () => {
  it('tokenMs names are defined in tokens.css', () => {
    const tokens = readFileSync('design/tokens.css', 'utf8');
    for (const f of ['Stop', 'Repeat', 'Pair']) {
      const src = readFileSync(`src/screens/${f}.svelte`, 'utf8');
      for (const m of src.matchAll(/tokenMs\('(--[a-z0-9-]+)'\)/g)) expect(tokens, `${f}: ${m[1]}`).toMatch(new RegExp(`^\\s*${m[1]}:\\s*\\d+m?s;`, 'm'));
    }
  });
});

describe('streak: one repair a week (review 14)', () => {
  it('a second missed day in the same week breaks the run', () => {
    // cards 5 to 11 are Monday to Sunday of one week (card 1 is Thu 26 Nov 2026)
    expect(weekday(dayOfCard(5))).toBe(1);
    expect(streak(new Set([5, 6, 8, 10, 11]), 11).current).toBe(2); // 7 repaired, 9 not
    expect(streak(new Set([5, 6, 8, 9, 10, 11]), 11).current).toBe(7); // only 7 missed
  });
});

describe('deterministic maths (review 8)', () => {
  it('dexp matches e^x closely and powInt multiplies exactly', () => {
    for (const x of [-5, -1, -0.3, 0, 0.2, 1, 3.7]) expect(dexp(x) / Math.exp(x)).toBeCloseTo(1, 12);
    expect(powInt(2, 10)).toBe(1024);
    expect(powInt(0.5, -3)).toBe(8);
  });
  it('the fingerprint of cards 1 to 60 is pinned: any change to what players get is deliberate', () => {
    expect(fingerprint(1, 60)).toBe(PINNED);
  });
});

describe('the config can be played (review 55)', () => {
  it('holds values the code can use', () => {
    const s = stopParams(), c = countParams(), r = repeatParams(), p = pairParams(), so = sortParams();
    expect(config.kits.length).toBeGreaterThanOrEqual(2);
    expect(config.kitNames).toHaveLength(config.kits.length);
    expect(c.lanes).toBeGreaterThanOrEqual(2);
    expect(c.showMs).toBeGreaterThan(c.crossMsMonday * (1 + c.laneSpeedJitter));
    expect(s.notchTo - s.notchFrom).toBeGreaterThan(2 * s.notchApartMin);
    expect(s.notchWidthMonday + 6 * s.notchWidthStepPerDay).toBeGreaterThan(0);
    expect(s.sweepMsFloor).toBeGreaterThan(0);
    expect(r.flashMsMonday + 6 * r.flashMsStepPerDay).toBeGreaterThan(r.gapMs);
    expect(p.nearShareMonday + 6 * p.nearShareStepPerDay).toBeLessThanOrEqual(1);
    expect(p.formNames).toHaveLength(p.forms);
    expect(p.styleNames).toHaveLength(p.styles);
    expect(so.gapMin).toBeGreaterThanOrEqual(0.03);
    for (const ev of EVENTS) {
      const d = (config.doors as Record<string, { labels: string[]; facts: string[]; below: number; above: number }>)[ev];
      expect(d.labels).toHaveLength(3);
      expect(d.facts).toHaveLength(3);
      expect(d.below).toBeLessThanOrEqual(d.above);
      const b = (config.boxes as unknown as Record<string, { cuts: number[]; labels: string[] }>)[ev];
      expect(b.labels).toHaveLength(b.cuts.length + 1);
      for (let i = 1; i < b.cuts.length; i++) expect(b.cuts[i]).toBeGreaterThan(b.cuts[i - 1]);
    }
    expect(week.doors).toHaveLength(7);
    expect(week.read).toHaveLength(7);
  });
});

// pinned 26 Nov; the same in WebKit, Chromium and Node (cards 1 to 60 and 61 to 400 checked)
const PINNED = 'c6a79c1e';
