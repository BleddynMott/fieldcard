// G-02b: Dare's rules, by hand from tasks/G-02b.md "Rules" (spec: G-00c round 4).
import { describe, expect, it } from 'vitest';
import {
  braverThan,
  doubleOrBank,
  longJumpScore,
  repeatPoints,
  repeatPrices,
  ropeLadder,
  ropePoints,
  ropeRecord,
  snapPoint,
  stopPrice,
} from '../src/lib/rules/dare';
import { generatePlayground, hideScore, seekScore, spotsFound } from '../src/lib/rules/hideseek';
import { rules } from '../src/lib/rules/params';

const SP = { window: 0.15, rareRatio: 0.25, crowdedRatio: 1.5, minPrice: 1, maxPrice: 5 };
const cards = Array.from({ length: 60 }, (_, i) => i + 1);

describe('V1 Stop: the field sets the price', () => {
  it('a stop outside the notch pays 0', () => {
    expect(stopPrice(3, 2, [0, 0, 0], SP)).toBe(0);
    expect(stopPrice(-2.01, 2, [], SP)).toBe(0);
  });
  it('an empty notch pays the most', () => {
    expect(stopPrice(0, 2, [], SP)).toBe(5);
    expect(stopPrice(0, 2, [5, -7], SP)).toBe(5); // field stops outside the notch don't count
  });
  it('where every stop is, it pays 1', () => {
    // window +-0.6 (0.15 x 4); 10 near against 10 x 1.2/4 = 3 expected: ratio 3.3
    expect(stopPrice(0, 2, Array(10).fill(0), SP)).toBe(1);
  });
  it('a bare stretch at the edge pays the most; the window is clipped at the edge', () => {
    // window [1.2, 2]: nobody there
    expect(stopPrice(1.8, 2, Array(10).fill(0), SP)).toBe(5);
  });
  it('in between, linear and rounded', () => {
    // 3 at 0, 1 at 1.0; you at 1.0: window [0.4,1.6]; near 1, expected 4 x 1.2/4 = 1.2; ratio 0.833
    // t = (1.5 - 0.833)/1.25 = 0.533; 1 + 4t = 3.13 -> 3
    expect(stopPrice(1, 2, [0, 0, 0, 1], SP)).toBe(3);
    // 8 at 0, 1 at 1.5; you at 1.5: window [0.9, 2], near 1, expected 9 x 1.1/4 = 2.475; ratio 0.404 -> 4.51 -> 5
    expect(stopPrice(1.5, 2, [...Array(8).fill(0), 1.5], SP)).toBe(5);
  });
  it('the config is the one the worked examples use', () => {
    expect(rules().stopPrice).toEqual(SP);
  });
  it('always 0, or 1 to 5, over random fields', () => {
    let seed = 7;
    const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let k = 0; k < 300; k++) {
      const field = Array.from({ length: Math.floor(r() * 50) }, () => (r() - 0.5) * 8);
      const v = stopPrice((r() - 0.5) * 6, 2, field, SP);
      expect(v === 0 || (v >= 1 && v <= 5 && Number.isInteger(v))).toBe(true);
    }
  });
});

describe('V1 Repeat: bank or go on', () => {
  const field = [3, 4, 5, 6];
  const lens = [3, 4, 5, 6, 7];
  const P = { maxPrice: 10, decimals: 1 };
  it('each round pays 1 / share who cleared it, to 0.1, 1 to max', () => {
    expect(repeatPrices(field, lens, P)).toEqual([1, 1.3, 2, 4, 10]);
    expect(repeatPrices([], lens, P)).toEqual([10, 10, 10, 10, 10]);
  });
  it('banking pays the cleared rounds; failing pays 0; finishing needs every round', () => {
    const prices = repeatPrices(field, lens, P);
    expect(repeatPoints(prices, 3, 'banked', P)).toBe(4.3);
    expect(repeatPoints(prices, 3, 'failed', P)).toBe(0);
    expect(repeatPoints(prices, 5, 'finished', P)).toBe(18.3);
    expect(() => repeatPoints(prices, 4, 'finished', P)).toThrow();
    expect(() => repeatPoints(prices, 6, 'banked', P)).toThrow();
  });
});

describe('V3 Long jump', () => {
  it('a no-jump scores 0; otherwise the share of the field beaten, field no-jumps beaten, ties half', () => {
    expect(longJumpScore(-0.2, [1, 2])).toBe(0);
    expect(longJumpScore(1, [0.5, 1, 2, -0.1])).toBe(62.5);
    expect(longJumpScore(0, [0, 0])).toBe(50);
    expect(longJumpScore(3, [])).toBe(50);
  });
});

describe('V2 double or bank', () => {
  const P = { bankRight: 1, doubleRight: 2, doubleWrong: -1 };
  it('bank keeps it if right, 0 if wrong; double pays 2x if right and costs it if wrong', () => {
    expect(doubleOrBank(true, 10, 'bank', P)).toBe(10);
    expect(doubleOrBank(false, 10, 'bank', P)).toBe(0);
    expect(doubleOrBank(true, 10, 'double', P)).toBe(20);
    expect(doubleOrBank(false, 10, 'double', P)).toBe(-10);
    expect(rules().double).toEqual(P);
  });
  it('neither button always wins: banking is better below 1 in 2 sure, doubling above', () => {
    const ev = (pRight: number, c: 'bank' | 'double') => pRight * doubleOrBank(true, 10, c, P) + (1 - pRight) * doubleOrBank(false, 10, c, P);
    expect(ev(0.4, 'bank')).toBeGreaterThan(ev(0.4, 'double'));
    expect(ev(0.6, 'double')).toBeGreaterThan(ev(0.6, 'bank'));
    // and banking a wrong answer beats doubling it (the round-2 fix)
    expect(doubleOrBank(false, 10, 'bank', P)).toBeGreaterThan(doubleOrBank(false, 10, 'double', P));
  });
});

describe('V4 hold your day', () => {
  const P = { step: 0.1, max: 10, snapKeep: 0.5, emptySnap: 2, decimals: 1 };
  it('the ladder climbs from x1 in steps of 0.1 to x10', () => {
    const l = ropeLadder(P);
    expect(l[0]).toBe(1);
    expect(l[1]).toBe(1.1);
    expect(l[l.length - 1]).toBe(10);
    expect(l.length).toBe(91);
  });
  it('the snap is where half the field had let go (lower median); empty snaps at emptySnap', () => {
    expect(snapPoint([3, 1.2, 2, 1.5], P)).toBe(1.5);
    expect(snapPoint([1.2, 1.5, 2, 3, 4], P)).toBe(2);
    expect(snapPoint([], P)).toBe(2);
  });
  it('letting go below the snap banks it; at or past it, or holding, keeps half', () => {
    expect(ropePoints(100, 1.4, 1.5, P)).toBe(140);
    expect(ropePoints(100, 1.5, 1.5, P)).toBe(50);
    expect(ropePoints(100, null, 1.5, P)).toBe(50);
    expect(() => ropePoints(100, 0.9, 1.5, P)).toThrow();
  });
  it('a snapped player counts at the snap', () => {
    expect(ropeRecord(null, 1.5)).toBe(1.5);
    expect(ropeRecord(2, 1.5)).toBe(1.5);
    expect(ropeRecord(1.2, 1.5)).toBe(1.2);
  });
  it('braver than: the share who let go before you, ties half', () => {
    expect(braverThan(1.5, [1.2, 1.5, 2, 3])).toBe(37.5);
  });
  it('no choice wins every time: letting go at once is beaten when the snap is late, and wins when it is early', () => {
    expect(ropePoints(100, 1.9, 2, P)).toBeGreaterThan(ropePoints(100, 1, 2, P));
    expect(ropePoints(100, 1, 1.05, P)).toBeGreaterThan(ropePoints(100, 1.1, 1.05, P));
  });
});

describe('V3 Hide and Seek', () => {
  const R = rules().hideSeek;
  it('the playground: same twice for a card, spots apart and inside the edges, every kind once', () => {
    for (const c of cards) {
      const a = generatePlayground(c);
      expect(generatePlayground(c)).toEqual(a);
      expect(a.length).toBe(R.spots);
      expect(new Set(a.map((s) => s.kind)).size).toBe(R.spots);
      for (const s of a) {
        expect(s.x).toBeGreaterThanOrEqual(R.edge);
        expect(s.x).toBeLessThanOrEqual(1 - R.edge);
        for (const t of a) if (t !== s) expect(Math.hypot(s.x - t.x, s.y - t.y)).toBeGreaterThanOrEqual(R.minGap);
      }
    }
  });
  it('the playground changes from day to day', () => {
    expect(generatePlayground(1)).not.toEqual(generatePlayground(2));
  });
  it('hide: share of seeks that miss you; seek: share of hiders within reach', () => {
    const P = { ...R, seekRadius: 0.16 };
    expect(hideScore({ x: 0.5, y: 0.55 }, [{ x: 0.1, y: 0.1 }, { x: 0.5, y: 0.5 }], P)).toBe(50);
    expect(seekScore({ x: 0.5, y: 0.5 }, [{ x: 0.5, y: 0.6 }, { x: 0.9, y: 0.9 }], P)).toBe(50);
    expect(hideScore({ x: 0.5, y: 0.5 }, [], P)).toBe(50);
    const spots = generatePlayground(5);
    expect(spotsFound(spots[0], spots, P)).toContain(spots[0].id);
  });
});
