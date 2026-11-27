// G-02b: the field and the layers (Z1, Z2, Z4), by hand from tasks/G-02b.md "Rules".
import { describe, expect, it } from 'vitest';
import { stopParams } from '../src/lib/config';
import { mulberry32 } from '../src/lib/rng';
import { carryOver, fromHabits, modelledShare, rollingField, values } from '../src/lib/rules/field';
import { crowdTwin, isTrap, mostPickedWrong, notchFromYesterday, personality, trapFor } from '../src/lib/rules/layers';
import { rules } from '../src/lib/rules/params';
import { EVENTS } from '../src/lib/week';

describe('the field', () => {
  it('the last `size` real finishers; the gap filled from modelled, flagged', () => {
    const f = rollingField([1, 2, 3], [10, 11, 12, 13], 5);
    expect(values(f)).toEqual([12, 13, 1, 2, 3]); // yesterday's newest fill the gap; the oldest drop first
    expect(f.map((e) => e.modelled)).toEqual([true, true, false, false, false]);
    expect(modelledShare(f)).toBe(40);
  });
  it('once full, only real players, oldest dropped first', () => {
    const f = rollingField([1, 2, 3, 4, 5, 6], [10], 4);
    expect(values(f)).toEqual([3, 4, 5, 6]);
    expect(modelledShare(f)).toBe(0);
  });
  it('the field size is 500', () => {
    expect(rules().field.size).toBe(500);
    expect(rollingField(Array(600).fill(1), []).length).toBe(500);
  });
  it('carry-over: yesterday\'s errors on today\'s truth', () => {
    expect(carryOver([-2, 0, 3], 17)).toEqual([15, 17, 20]);
  });
  it('habits: draws follow the weights', () => {
    const rng = mulberry32(5);
    const d = fromHabits([3, 1], 4000, rng);
    const share0 = d.filter((i) => i === 0).length / 4000;
    expect(share0).toBeGreaterThan(0.7);
    expect(share0).toBeLessThan(0.8);
    expect(() => fromHabits([0, 0], 1, rng)).toThrow();
  });
});

describe('config', () => {
  it('every number in rules is finite', async () => {
    const { badNumbers } = await import('../src/lib/rules/params');
    expect(badNumbers()).toEqual([]);
    expect(badNumbers({ a: 1, b: { c: Number.NaN } })).toEqual(['rules.b.c']);
  });
});

describe('Z1 traps', () => {
  const cards = Array.from({ length: 365 }, (_, i) => i + 1);
  it('never the same event two cards running', () => {
    for (const e of EVENTS) for (const c of cards.slice(1)) expect(isTrap(c, e) && isTrap(c - 1, e)).toBe(false);
  });
  it('some days and not others, at a strength in range', () => {
    const P = rules().traps;
    for (const e of EVENTS) {
      const n = cards.filter((c) => isTrap(c, e)).length;
      expect(n).toBeGreaterThan(40); // share 0.3, less the no-repeat rule: about 84 a year
      expect(n).toBeLessThan(140);
      for (const c of cards) {
        const t = trapFor(c, e);
        if (t.trap) {
          expect(t.strength).toBeGreaterThanOrEqual(P.strengthFrom);
          expect(t.strength).toBeLessThanOrEqual(P.strengthTo);
        } else expect(t.strength).toBe(0);
      }
    }
  });
  it('the notch moves to the part where yesterday\'s field was most often early', () => {
    const sp = stopParams();
    const early = Array.from({ length: 10 }, () => ({ at: 0.75, off: -3 }));
    const late = Array.from({ length: 20 }, () => ({ at: 0.1, off: 3 })); // late stops don't count
    for (let c = 1; c <= 30; c++) {
      const n = notchFromYesterday(c, [...early, ...late]);
      expect(n).toBeGreaterThanOrEqual(2 / 3);
      expect(n).toBeLessThanOrEqual(sp.notchTo);
    }
  });
  it('no early stops: the middle part; a tie: the tied part nearest the middle, then the lower', () => {
    const sp = stopParams();
    const tieEnds = [
      { at: 0.1, off: -2 },
      { at: 0.9, off: -2 },
    ];
    const tieMid = [
      { at: 0.1, off: -2 },
      { at: 0.5, off: -2 },
    ];
    for (let c = 1; c <= 30; c++) {
      const none = notchFromYesterday(c, []);
      expect(none >= 1 / 3 && none <= 2 / 3).toBe(true);
      const e = notchFromYesterday(c, tieEnds); // parts 0 and 2 tie, both 1 from the middle: the lower
      expect(e >= sp.notchFrom && e <= 1 / 3).toBe(true);
      const m = notchFromYesterday(c, tieMid);
      expect(m >= 1 / 3 && m <= 2 / 3).toBe(true);
    }
  });
  it('the trap cache keeps shares apart (K05 4)', () => {
    const hi = { ...rules().traps, share: 0.9 };
    const lo = Array.from({ length: 200 }, (_, i) => i + 1).filter((c) => isTrap(c, 'stop')).length;
    const many = Array.from({ length: 200 }, (_, i) => i + 1).filter((c) => isTrap(c, 'stop', hi)).length;
    expect(many).toBeGreaterThan(lo);
  });
  it('the decoy: yesterday\'s most-picked wrong answer, a tie to the lowest key', () => {
    expect(mostPickedWrong(['c', 'b', 'c', 'b', 'a'])).toBe('b');
    expect(mostPickedWrong(['c', 'c', 'a'])).toBe('c');
    expect(mostPickedWrong([])).toBeUndefined();
  });
});

describe('Z4 personality', () => {
  const field = [
    { acts: 10, chances: 20, right: 8 },
    { acts: 8, chances: 20, right: 6 },
    { acts: 12, chances: 20, right: 9 },
  ];
  it('"Bold. You doubled 14 of 20 and were right on 8. Most double 10 and are right on 8."', () => {
    const p = personality('dare', { acts: 14, chances: 20, right: 8 }, field);
    expect(p?.word).toBe('Bold');
    expect(p?.most).toEqual({ acts: 10, right: 8 }); // median rate 0.5 -> 10; median right/acts 0.8 -> 8
  });
  it('at or below the median rate: Careful; Read words are Loner and Joiner', () => {
    expect(personality('dare', { acts: 10, chances: 20, right: 5 }, field)?.word).toBe('Careful');
    expect(personality('read', { acts: 15, chances: 20, right: 5 }, field)?.word).toBe('Loner');
    expect(personality('read', { acts: 2, chances: 20, right: 1 }, field)?.word).toBe('Joiner');
  });
  it('no word with no field to compare with', () => {
    expect(personality('dare', { acts: 3, chances: 4, right: 1 }, [])).toBeNull();
  });
  it('no word under minChances', () => {
    expect(personality('dare', { acts: 3, chances: rules().personality.minChances - 1, right: 1 }, field)).toBeNull();
  });
});

describe('Z2 crowd twin', () => {
  it('the nearest by your choices; a tie to the earliest; the town only if they opted in', () => {
    const field = [
      { choices: [1, 0, 1], optedIn: false, town: 'Leeds', modelled: false },
      { choices: [1, 1, 1], optedIn: true, town: 'Lisbon', modelled: false },
      { choices: [1, 1, 1], optedIn: true, town: 'Cardiff', modelled: false },
    ];
    expect(crowdTwin([1, 1, 1], field)).toEqual({ index: 1, distance: 0, town: 'Lisbon' });
    expect(crowdTwin([1, 0, 1], field)).toEqual({ index: 0, distance: 0 });
    expect(crowdTwin([1, 1], field)).toBeNull();
    // modelled players are never a twin
    expect(crowdTwin([1, 0, 1], [{ choices: [1, 0, 1], optedIn: false, modelled: true }, ...field])).toEqual({ index: 1, distance: 0 });
  });
});

describe('the simulated fields (until G-03)', () => {
  const cards = Array.from({ length: 60 }, (_, i) => i + 1);
  it('the same twice for a card, every entry flagged modelled, values in range', async () => {
    const { fieldsFor, simulatedDrawings } = await import('../src/lib/rules/fields');
    const { stopPrice, repeatPrices, longJumpScore, snapPoint, ropeLadder } = await import('../src/lib/rules/dare');
    const { hideScore, seekScore } = await import('../src/lib/rules/hideseek');
    const { countPeak, thoughtAboveMiddle } = await import('../src/lib/rules/read');
    const { roundLengths } = await import('../src/lib/events/repeat');
    const ladder = ropeLadder();
    for (const c of cards) {
      const f = fieldsFor(c);
      expect(f.simulated).toBe(true);
      for (const list of [f.stop.offs, f.count.answers, f.repeat.longest, f.rope.records, f.longJump.takeoffs, f.hideSeek.hides, f.hideSeek.seeks, f.find.guesses]) {
        expect(list.length).toBeGreaterThan(0);
        expect(list.every((e) => e.modelled)).toBe(true);
      }
      const v = <T,>(xs: { value: T }[]) => xs.map((e) => e.value);
      expect(f.stop.offs.length).toBe(400); // one stop per simulated player (K05 3)
      for (const at of [-f.stop.notchHalf, 0, f.stop.notchHalf / 2]) {
        const price = stopPrice(at, f.stop.notchHalf, v(f.stop.offs));
        expect(price >= 1 && price <= 5).toBe(true);
      }
      repeatPrices(v(f.repeat.longest), roundLengths()).forEach((p) => expect(p >= 1 && p <= rules().repeatBank.maxPrice).toBe(true));
      const snap = snapPoint(v(f.rope.records));
      expect(snap).toBeGreaterThanOrEqual(1);
      expect(snap).toBeLessThanOrEqual(ladder[ladder.length - 1]);
      const lj = longJumpScore(1, v(f.longJump.takeoffs));
      expect(lj >= 0 && lj <= 100).toBe(true);
      const s0 = f.hideSeek.playground[0];
      for (const x of [hideScore(s0, v(f.hideSeek.seeks)), seekScore(s0, v(f.hideSeek.hides))]) expect(x >= 0 && x <= 100).toBe(true);
      expect(countPeak(v(f.count.answers))).toBeDefined();
      const above = thoughtAboveMiddle(v(f.find.guesses));
      expect(above).not.toBeNull();
      expect((above as number) >= 0 && (above as number) <= 100).toBe(true);
    }
    const { simulateFields } = await import('../src/lib/rules/fields');
    for (const c of [1, 7, 30]) expect(JSON.stringify(simulateFields(c))).toBe(JSON.stringify(fieldsFor(c)));
    const d = simulatedDrawings(3, 'count', [1, 2, 2, 3, 3, 3, 4], 0, 6, 20);
    expect(d.length).toBe(20);
    d.forEach((x) => expect(x.reduce((a, b) => a + b, 0)).toBeCloseTo(100, 6));
    expect(JSON.stringify(simulatedDrawings(3, 'count', [1, 2, 2, 3, 3, 3, 4], 0, 6, 20))).toBe(JSON.stringify(d));
  });
});
