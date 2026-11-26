// G-02 harness (R3): the named check's four properties over 60 dates, run on the real code.
// same card for a date · no repeat · scores in range · one attempt a day
// Grows with each event built; the Stop slice comes first (the plan's gate).
import { describe, expect, it } from 'vitest';
import { cardNumber, dayOfCard, localDay, parseDay, weekdayStep, type Day } from '../src/lib/card';
import { config, stopParams } from '../src/lib/config';
import { crossingMs, generateStop, markerAt, shape, signedOff, stopResult } from '../src/lib/events/stop';
import { mulberry32 } from '../src/lib/rng';
import { AttemptStore, MemoryKV } from '../src/lib/store';

const DAYS = 60;
const REPEAT_WINDOW = 365;
const launch = parseDay(config.launch);
const cards = Array.from({ length: DAYS }, (_, i) => i + 1);
const canonical = (v: unknown) => JSON.stringify(v);

describe('same card for a date', () => {
  it('each of 60 dates maps to one card number, and back', () => {
    for (const n of cards) {
      const day = dayOfCard(n);
      expect(cardNumber(day)).toBe(n);
    }
    expect(cardNumber(launch)).toBe(1);
    expect(cardNumber({ y: launch.y, m: launch.m, d: launch.d - 1 })).toBeNull();
  });

  it('generating a card twice gives the same card', () => {
    for (const n of cards) expect(canonical(generateStop(n))).toBe(canonical(generateStop(n)));
  });

  it('the card changes exactly at local midnight, on summer-time change days too (review 60)', () => {
    const before = process.env.TZ;
    try {
      process.env.TZ = 'Europe/London';
      const card = (y: number, mo: number, d: number, h: number, mi: number, s: number) => cardNumber(localDay(new Date(y, mo - 1, d, h, mi, s)));
      for (const [y, mo, d] of [
        [2027, 3, 27], // the night the clocks go forward
        [2027, 3, 28],
        [2027, 10, 30], // and back
        [2027, 10, 31],
        [2026, 12, 31],
      ]) {
        const a = card(y, mo, d, 23, 59, 59)!;
        expect(card(y, mo, d, 0, 0, 1)).toBe(a);
        expect(card(y, mo, d + 1, 0, 0, 1)).toBe(a + 1);
      }
    } finally {
      process.env.TZ = before;
    }
  });

  it('the card follows the local date, whatever the time zone', () => {
    const before = process.env.TZ;
    const instant = new Date(Date.UTC(launch.y, launch.m - 1, launch.d + 10, 11, 30)); // 11:30 UTC
    const seen: Record<string, Day> = {};
    try {
      for (const tz of ['Pacific/Auckland', 'Europe/London', 'America/Los_Angeles']) {
        process.env.TZ = tz;
        seen[tz] = localDay(instant);
      }
    } finally {
      process.env.TZ = before;
    }
    // 11:30 UTC is already the next day in Auckland and still the same day in London and LA
    expect(cardNumber(seen['Europe/London'])).toBe(11);
    expect(cardNumber(seen['America/Los_Angeles'])).toBe(11);
    expect(cardNumber(seen['Pacific/Auckland'])).toBe(12);
  });
});

describe('no repeat', () => {
  it(`no two cards share Stop within ${REPEAT_WINDOW} days`, () => {
    const seen = new Map<string, number>();
    for (let n = 1; n <= REPEAT_WINDOW; n++) {
      const key = canonical(generateStop(n).goes);
      expect(seen.get(key), `card ${n} repeats card ${seen.get(key)}`).toBeUndefined();
      seen.set(key, n);
    }
  });

  it('a record kept under another launch date is not this card (review 6)', () => {
    const kv = new MemoryKV();
    const old = new AttemptStore(kv, true, 3660, '2026-01-01');
    old.record(3, 'stop', { mean: 1 });
    old.finish(3);
    expect(new AttemptStore(kv).load(3).finished).toBe(false);
  });

  it('a failed write is kept for the session and the store says it is not saving (review 34)', () => {
    const kv = new MemoryKV();
    kv.setItem = () => {
      throw new Error('full');
    };
    const s = new AttemptStore(kv);
    expect(s.record(4, 'stop', { mean: 2 })).toBe(true);
    expect(s.persistent).toBe(false);
    expect(s.played(4, 'stop')).toBe(true);
    expect(s.record(4, 'stop', { mean: 0 })).toBe(false);
  });

  it('difficulty spreads over at least three values and steps up Monday to Sunday', () => {
    const steps = new Set(cards.map((n) => generateStop(n).step));
    expect(steps.size).toBeGreaterThanOrEqual(3);
    for (const n of cards) expect(generateStop(n).step).toBe(weekdayStep(dayOfCard(n)));
  });
});

describe('parameters in range', () => {
  const p = stopParams();
  it('Stop: three goes, notches inside the track and apart, each go faster, faster as the week goes on', () => {
    for (const n of cards) {
      const c = generateStop(n);
      expect(c.goes).toHaveLength(p.goes);
      c.goes.forEach((g, i) => {
        expect(g.notch).toBeGreaterThanOrEqual(p.notchFrom);
        expect(g.notch).toBeLessThanOrEqual(p.notchTo);
        expect(g.sweepMs).toBeGreaterThan(0);
        const base = (p.sweepMsMonday + p.sweepMsStepPerDay * c.step) * p.goSpeedUp ** i;
        expect(g.ease).toBeGreaterThanOrEqual(p.easeFrom);
        expect(g.ease).toBeLessThanOrEqual(p.easeTo);
        expect(g.sweepMs).toBeGreaterThanOrEqual(p.sweepMsFloor);
        expect(g.sweepMs).toBeGreaterThanOrEqual(Math.floor(base * (1 - p.sweepMsJitter)));
        expect(g.sweepMs).toBeLessThanOrEqual(Math.ceil(base * (1 + p.sweepMsJitter)));
        if (i > 0) expect(Math.abs(g.notch - c.goes[i - 1].notch)).toBeGreaterThanOrEqual(p.notchApartMin);
      });
    }
  });

  it('Stop: every turn is faster, never below the floor; the marker stays on the track and turns at the ends', () => {
    for (const n of cards) {
      for (const g of generateStop(n).goes) {
        let total = 0;
        for (let k = 0; k < 40; k++) {
          const ms = crossingMs(g, k);
          if (k > 0) expect(ms).toBeLessThanOrEqual(crossingMs(g, k - 1));
          expect(ms).toBeGreaterThanOrEqual(p.sweepMsFloor);
          const mid = markerAt(total + ms / 2, g);
          expect(mid.dir).toBe(k % 2 === 0 ? 1 : -1);
          expect(mid.pos).toBeGreaterThan(0);
          expect(mid.pos).toBeLessThan(1);
          total += ms;
        }
        expect(markerAt(0, g).pos).toBe(0);
        expect(markerAt(crossingMs(g, 0) - 1e-6, g).pos).toBeCloseTo(1, 4);
      }
    }
  });

  it('Stop: the motion is fastest in the middle and always moves forward within a crossing', () => {
    for (const ease of [0, p.easeFrom, p.easeTo]) {
      let last = -1;
      for (let f = 0; f <= 1.0001; f += 0.01) {
        const x = shape(Math.min(1, f), ease);
        expect(x).toBeGreaterThan(last);
        last = x;
      }
    }
    const step = 0.05;
    expect(shape(0.5 + step, p.easeTo) - shape(0.5, p.easeTo)).toBeGreaterThan(shape(step, p.easeTo) - shape(0, p.easeTo));
  });
});

describe('scores in range', () => {
  it('Stop: any tap time gives a mean of 0 to 100 and a signed mean of -100 to 100', () => {
    const rng = mulberry32(7);
    for (const n of cards) {
      const c = generateStop(n);
      const plays: number[][] = [
        c.goes.map(() => 0), // tapped the instant the go began
        c.goes.map((g) => g.sweepMs), // tapped at the far end
        c.goes.map((g) => g.sweepMs * 2), // part way back
        c.goes.map(() => 10 * 60 * 1000), // waited ten minutes
        ...Array.from({ length: 20 }, () => c.goes.map((g) => rng() * g.sweepMs * 6)),
      ];
      for (const times of plays) {
        const offs = times.map((t, i) => {
          const { pos, dir } = markerAt(t, c.goes[i]);
          return signedOff(pos, dir, c.goes[i].notch);
        });
        const r = stopResult(offs);
        expect(r.mean).toBeGreaterThanOrEqual(0);
        expect(r.mean).toBeLessThanOrEqual(100);
        expect(r.signedMean).toBeGreaterThanOrEqual(-100);
        expect(r.signedMean).toBeLessThanOrEqual(100);
      }
    }
  });

  it('Stop: a tap on the notch scores 0; early is negative and late positive', () => {
    expect(signedOff(0.5, 1, 0.5)).toBe(0);
    expect(signedOff(0.4, 1, 0.5)).toBeLessThan(0);
    expect(signedOff(0.6, 1, 0.5)).toBeGreaterThan(0);
    expect(signedOff(0.6, -1, 0.5)).toBeLessThan(0); // coming back, not yet at the notch
  });
});

describe('one attempt a day', () => {
  it('a played step cannot be played again, and a finished card takes nothing more', () => {
    for (const n of cards) {
      const s = new AttemptStore(new MemoryKV());
      expect(s.record(n, 'stop', { mean: 1 })).toBe(true);
      expect(s.record(n, 'stop', { mean: 0 })).toBe(false);
      expect((s.load(n).steps.stop as { mean: number }).mean).toBe(1);
      expect(s.finish(n)).toBe(true);
      expect(s.finish(n)).toBe(false);
      expect(s.record(n, 'count', {})).toBe(false);
      expect(s.load(n + 1).finished).toBe(false); // the next day's card is open
    }
  });

  it('an unreadable record counts as played, never as a fresh attempt', () => {
    const kv = new MemoryKV();
    kv.setItem(`fieldcard:${config.launch}:card:3`, '{not json');
    const s = new AttemptStore(kv);
    expect(s.played(3, 'stop')).toBe(true);
    expect(s.record(3, 'stop', {})).toBe(false);
  });
});
