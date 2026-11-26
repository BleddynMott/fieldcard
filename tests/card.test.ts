// G-02 harness, part 2 (R3): the other four events, the reads, the crowd, the scores and the share
// text, over the same 60 dates. Part 1 (tests/harness.test.ts) covers the card number, Stop and the
// one-attempt store.
import { describe, expect, it } from 'vitest';
import { config, countParams, pairParams, repeatParams, sortParams } from '../src/lib/config';
import { crowdFor, simulateCrowd } from '../src/lib/crowd';
import { countResult, generateCount } from '../src/lib/events/count';
import { generatePair, identicalPairs, pairResult } from '../src/lib/events/pair';
import { generateRepeat } from '../src/lib/events/repeat';
import { blobRadius, generateSort, pairsOut, sortResult } from '../src/lib/events/sort';
import { generateStop, stopResult } from '../src/lib/events/stop';
import { boxOf, doorOf, overlap, wholeShares } from '../src/lib/reads';
import type { EventResults } from '../src/lib/results';
import { mulberry32 } from '../src/lib/rng';
import { flagPoints, scorecard } from '../src/lib/score';
import { shareText } from '../src/lib/share';
import { streak, streakText } from '../src/lib/streak';
import { doorsEvent, readOfDay, week } from '../src/lib/week';
import { AttemptStore, MemoryKV } from '../src/lib/store';

const cards = Array.from({ length: 60 }, (_, i) => i + 1);
const canonical = (v: unknown) => JSON.stringify(v);
const gens = { count: generateCount, repeat: generateRepeat, pair: generatePair, sort: generateSort } as const;

describe('same card for a date, every event', () => {
  it('each generator gives the same card twice', () => {
    for (const n of cards) for (const g of Object.values(gens)) expect(canonical(g(n))).toBe(canonical(g(n)));
  });
  it('the crowd is the same for a date, built afresh each time (review 9)', () => {
    for (const n of [1, 17, 60]) {
      const a = simulateCrowd(n);
      const b = simulateCrowd(n);
      expect(a).not.toBe(b);
      expect(canonical(a.doorShares)).toBe(canonical(b.doorShares));
      expect(canonical(a.boxShares)).toBe(canonical(b.boxShares));
    }
  });
});

describe('no repeat within 365 days, every event and the whole card', () => {
  it('no two cards share an event or the whole card', () => {
    const seen: Record<string, Map<string, number>> = { count: new Map(), repeat: new Map(), pair: new Map(), sort: new Map(), card: new Map() };
    for (let n = 1; n <= 365; n++) {
      const parts: Record<string, unknown> = {};
      // what the player sees, not float noise (review 10): Stop's notches to the nearest 1% of the
      // track, the Repeat sequence, Count's colours in order, Pair's shapes, Sort's order and wobble
      const seen1 = {
        count: (() => { const c = generateCount(n); return [c.todayKit, c.figures.map((f) => f.kit)]; })(),
        repeat: generateRepeat(n).sequence,
        pair: generatePair(n).shapes,
        sort: (() => { const c = generateSort(n); return [c.start, c.blobs.map((b) => [b.lobes, Math.round(b.wobble * 100)])]; })(),
      } as Record<string, unknown>;
      for (const id of Object.keys(gens)) {
        const content = seen1[id];
        parts[id] = content;
        const k = canonical(content);
        expect(seen[id].get(k), `${id} on card ${n} repeats card ${seen[id].get(k)}`).toBeUndefined();
        seen[id].set(k, n);
      }
      const whole = canonical({ ...parts, stop: generateStop(n).goes.map((g) => Math.round(g.notch * 100)) });
      expect(seen.card.get(whole)).toBeUndefined();
      seen.card.set(whole, n);
    }
  });
});

describe('parameters in range', () => {
  it('Count: between 3 and 30 of today\'s colour; every figure crosses inside the time shown', () => {
    const p = countParams();
    for (const n of cards) {
      const c = generateCount(n);
      expect(c.target).toBeGreaterThanOrEqual(3);
      expect(c.target).toBeLessThanOrEqual(30);
      expect(c.figures.filter((f) => f.kit === c.todayKit)).toHaveLength(c.target);
      for (const f of c.figures) {
        expect(f.startMs).toBeGreaterThanOrEqual(0);
        expect(f.startMs + f.crossMs).toBeLessThanOrEqual(p.showMs);
        expect(f.kit).toBeGreaterThanOrEqual(0);
        expect(f.kit).toBeLessThan(config.kits.length);
      }
    }
  });
  it('Repeat: 9 squares in the sequence, never the same square twice running', () => {
    const p = repeatParams();
    for (const n of cards) {
      const r = generateRepeat(n);
      expect(r.sequence).toHaveLength(p.maxLength);
      r.sequence.forEach((c, i) => {
        expect(c).toBeGreaterThanOrEqual(0);
        expect(c).toBeLessThan(p.grid * p.grid);
        if (i > 0) expect(c).not.toBe(r.sequence[i - 1]);
      });
      expect(r.flashMs).toBeGreaterThan(p.gapMs);
    }
  });
  it('Pair: twelve shapes with exactly one identical pair', () => {
    for (const n of cards) {
      const c = generatePair(n);
      expect(c.shapes).toHaveLength(pairParams().shapes);
      const pairs = identicalPairs(c.shapes);
      expect(pairs).toHaveLength(1);
      expect(pairs[0]).toEqual(c.pair);
    }
  });
  it('Sort: five blobs, each at least 3% larger in area than the one before, inside their square, not shown in order', () => {
    const p = sortParams();
    for (const n of cards) {
      const c = generateSort(n);
      expect(c.blobs).toHaveLength(p.blobs);
      for (let i = 1; i < c.blobs.length; i++) expect(c.blobs[i].area / c.blobs[i - 1].area).toBeGreaterThanOrEqual(1.03 - 1e-9);
      for (const b of c.blobs) expect(blobRadius(b) * (1 + b.wobble)).toBeLessThanOrEqual(1);
      expect(pairsOut(c.start)).toBeGreaterThan(0);
    }
  });
  it('the doors\' event and the read\'s event are never the same on a day', () => {
    for (let d = 0; d < 7; d++) expect(week.doors[d]).not.toBe(week.read[d].event);
    for (const n of cards) expect(doorsEvent(n)).not.toBe(readOfDay(n).event);
  });
});

/** A random play of a whole card: any result the screens can produce. */
function randomPlay(n: number, rng: () => number): { results: EventResults; door: number; read: number[]; flag: number } {
  const st = generateStop(n);
  const ct = generateCount(n);
  const so = generateSort(n);
  const offs = st.goes.map(() => (rng() - 0.5) * 200);
  const order = so.start.slice().sort(() => rng() - 0.5);
  const raw = [rng(), rng(), rng(), rng(), rng()];
  const tot = raw.reduce((a, b) => a + b, 0);
  return {
    results: {
      stop: stopResult(offs),
      count: countResult(Math.floor(rng() * (countParams().guessMax + 1)), ct.target),
      repeat: { longest: Math.floor(rng() * 10), timeMs: Math.floor(rng() * 60000) },
      pair: pairResult(rng() * 60000, Math.floor(rng() * 6)),
      sort: sortResult(order, rng() * 60000),
    },
    door: Math.floor(rng() * 3),
    read: raw.map((x) => (x / tot) * 100),
    flag: Math.floor(rng() * 101),
  };
}

describe('scores in range', () => {
  it('every score on the card stays in range for random plays', () => {
    const rng = mulberry32(11);
    for (const n of cards) {
      const crowd = crowdFor(n);
      for (let k = 0; k < 6; k++) {
        const play = randomPlay(n, rng);
        const s = scorecard(crowd, play.results, { door: play.door, read: play.read }, play.flag);
        for (const v of Object.values(s.beat)) {
          expect(v).toBeGreaterThanOrEqual(0);
          expect(v).toBeLessThanOrEqual(100);
        }
        for (const v of [s.hands, s.place, s.hunch, s.overlap]) {
          expect(Number.isInteger(v)).toBe(true);
          expect(v).toBeGreaterThanOrEqual(0);
          expect(v).toBeLessThanOrEqual(100);
        }
        expect([0, config.scoring.spotPoints]).toContain(s.spotPoints);
        expect(s.readPoints).toBeGreaterThanOrEqual(0);
        expect(s.readPoints).toBeLessThanOrEqual(config.scoring.readPoints);
        expect(s.flagPoints).toBeGreaterThanOrEqual(-200);
        expect(s.flagPoints).toBeLessThanOrEqual(100);
        expect(s.simulated).toBe(true);
      }
    }
  });
  it('the crowd\'s shares are whole: doors and boxes each sum to 100, and its members score in range', () => {
    for (const n of cards) {
      const c = crowdFor(n);
      expect(c.players).toHaveLength(config.crowd.size);
      expect(c.doorShares.reduce((a, b) => a + b, 0)).toBeCloseTo(100, 6);
      expect(c.boxShares.reduce((a, b) => a + b, 0)).toBeCloseTo(100, 6);
      expect(wholeShares(c.doorShares).reduce((a, b) => a + b, 0)).toBe(100);
      for (const p of c.players) {
        expect(p.hands).toBeGreaterThanOrEqual(0);
        expect(p.hands).toBeLessThanOrEqual(100);
        expect(p.flag).toBeGreaterThanOrEqual(0);
        expect(p.flag).toBeLessThanOrEqual(100);
        expect(p.hunchRaw).toBeGreaterThanOrEqual(0);
        expect(p.hunchRaw).toBeLessThanOrEqual(100 + 1e-9);
      }
    }
  });
  it('the flag rule: +c when you make it, -2 x the gap when you fall short', () => {
    expect(flagPoints(50, 57)).toBe(50);
    expect(flagPoints(57, 57)).toBe(57);
    expect(flagPoints(70, 57)).toBe(-26);
    expect(flagPoints(95, 44)).toBe(-102);
    expect(flagPoints(100, 0)).toBe(-200);
  });
  it('doors and boxes: the cut points sort as the spec says', () => {
    expect([-2.1, -2, 2, 2.1].map((v) => doorOf('stop', v))).toEqual([0, 1, 1, 2]);
    expect([-1, 0, 1].map((v) => doorOf('count', v))).toEqual([0, 1, 2]);
    expect([4, 5, 6, 7].map((v) => doorOf('repeat', v))).toEqual([0, 1, 1, 2]);
    expect([0, 1, 2].map((v) => doorOf('sort', v))).toEqual([0, 1, 2]);
    expect([-3, -2, -1, 0, 1, 2, 3].map((v) => boxOf('count', v))).toEqual([0, 1, 1, 2, 3, 3, 4]);
    expect(overlap([20, 20, 20, 20, 20], [20, 20, 20, 20, 20])).toBe(100);
    expect(overlap([100, 0, 0, 0, 0], [0, 0, 0, 0, 100])).toBe(0);
  });
});

describe('share text', () => {
  it('three lines in the fixed form, short, and nothing about the card\'s contents', () => {
    const rng = mulberry32(5);
    for (const n of cards) {
      const play = randomPlay(n, rng);
      const s = scorecard(crowdFor(n), play.results, { door: play.door, read: play.read }, play.flag);
      const text = shareText(s);
      const lines = text.split('\n');
      expect(lines).toHaveLength(3);
      expect(lines[0]).toBe(`Fieldcard #${n}`);
      expect(lines[1]).toMatch(/^Hands \d{1,3} · Hunch \d{1,3}$/);
      expect(lines[2]).toMatch(/^Flag \d{1,3}, finished \d{1,3} · [+−]\d{1,3}$/);
      expect(text.length).toBeLessThanOrEqual(280);
      expect(text).not.toMatch(/https?:|www\./);
    }
  });
});

describe('one attempt a day, the whole card', () => {
  it('after the flag is planted the card is finished and takes nothing more; the next card is open', () => {
    const s = new AttemptStore(new MemoryKV());
    for (const step of ['stop', 'count', 'repeat', 'pair', 'sort', 'spot', 'read', 'flag']) expect(s.record(9, step, {})).toBe(true);
    expect(s.finish(9)).toBe(true);
    for (const step of ['stop', 'count', 'flag', 'scorecard']) expect(s.record(9, step, {})).toBe(false);
    expect(s.finishedCards(10)).toEqual(new Set([9]));
    expect(s.load(10).finished).toBe(false);
  });
});

describe('streak', () => {
  it('counts days played, repairs one missed day a week, and never shows a zero', () => {
    expect(streak(new Set([1, 2, 3]), 3)).toEqual({ current: 3, best: 3, played: 3 });
    expect(streak(new Set([1, 2, 4]), 4).current).toBe(4); // day 3 repaired by finishing day 4
    expect(streak(new Set([1, 2, 5]), 5).current).toBe(1); // two days missed: no repair
    const broken = streak(new Set([1, 2, 3, 6]), 7);
    expect(broken.current).toBe(0);
    expect(streakText(broken)).toBe('4 days played · best streak 3');
    expect(streakText(streak(new Set([1, 2, 3]), 3))).toBe('Day 3 in a row · best 3');
  });
});
