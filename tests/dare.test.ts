// G-02b: Dare's rules, by hand from tasks/G-02b.md "Rules" (spec: G-00c round 4).
import { describe, expect, it } from 'vitest';
import { generateStop } from '../src/lib/events/stop';
import { mulberry32 } from '../src/lib/rng';
import {
  braverThan,
  dareStopCard,
  dareStopParams,
  doubleOrBank,
  longJumpScore,
  openStopPoints,
  openStopPrice,
  repeatPoints,
  repeatPrices,
  ropeHolds,
  ropeLadder,
  ropePoints,
  ropeRarestPoints,
  ropeRarity,
  ropeRecord,
  snapPoint,
  stillOn,
  stopPrice,
} from '../src/lib/rules/dare';
import { generatePlayground, hideScore, seekScore, spotsFound } from '../src/lib/rules/hideseek';
import { rules, type RulesParams } from '../src/lib/rules/params';

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
  it('the window is clipped at the notch edge (a case where clipping changes the price)', () => {
    // you at 1.9: clipped window [1.3, 2], width 0.7; 2 near of 8 inside; expected 8 x 0.7/4 = 1.4;
    // ratio 1.43 -> 1.23 -> 1. Unclipped (width 1.2) it would be 2/2.4 = 0.83 -> 3.
    expect(stopPrice(1.9, 2, [1.5, 1.5, ...Array(6).fill(0)], SP)).toBe(1);
  });
  it('a zero window is refused, not NaN', () => {
    expect(() => stopPrice(0, 2, [0], { ...SP, window: 0 })).toThrow();
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

describe('V4 hold your day (the signed median rule, kept for comparison)', () => {
  const P = { step: 0.5, max: 10, snapKeep: 0.5, emptySnap: 2, decimals: 1, snapped: 'above' as const, snapRule: 'median' as const, capacity: 1.5, ceilingShare: 0.1, rarestScale: 0.5 };
  const AT = { ...P, snapped: 'at' as const };
  it('the ladder climbs x1, x1.5, x2 and on, to x10, never past max', () => {
    const l = ropeLadder(P);
    expect(l.slice(0, 3)).toEqual([1, 1.5, 2]);
    expect(l[l.length - 1]).toBe(10);
    expect(l.length).toBe(19);
    expect(ropeLadder({ ...P, max: 3.3 }).pop()).toBe(3);
    expect(rules().rope.step).toBe(0.5);
  });
  it('the snap is where half the field had let go (lower median); empty snaps at emptySnap', () => {
    expect(snapPoint([3, 1.2, 2, 1.5], P)).toBe(1.5);
    expect(snapPoint([1.2, 1.5, 2, 3, 4], P)).toBe(2);
    expect(snapPoint([], P)).toBe(2);
  });
  it('letting go below the snap banks it; at or past it, or holding, keeps half', () => {
    expect(ropePoints(100, 1.5, 2, P)).toBe(150);
    expect(ropePoints(100, 2, 2, P)).toBe(50);
    expect(ropePoints(100, null, 2, P)).toBe(50);
    expect(() => ropePoints(100, 0.5, 2, P)).toThrow();
  });
  it('R-8: a snapped player is recorded one step above the snap; the signed wording records them at it', () => {
    expect(ropeRecord(null, 1.5, P)).toBe(2);
    expect(ropeRecord(2, 1.5, P)).toBe(2);
    expect(ropeRecord(1, 1.5, P)).toBe(1);
    expect(ropeRecord(null, 1.5, AT)).toBe(1.5);
    expect(rules().rope.snapped).toBe('above');
  });
  it('K05 1: recorded at the snap, the snap can never rise; recorded above it, a braver crowd lifts it', () => {
    const run = (q: typeof P | typeof AT) => {
      const field: number[] = Array(500).fill(1.5);
      let top = 0;
      for (let k = 0; k < 3000; k++) {
        const snap = snapPoint(field.slice(-500), q);
        top = Math.max(top, snap);
        field.push(ropeRecord(3, snap, q)); // everyone now aims at x3
      }
      return top;
    };
    expect(run(AT)).toBe(1.5);
    expect(run(P)).toBeGreaterThanOrEqual(3);
  });
  it('R-8 is capped: holders cannot lift the snap past the ladder top (K05 round 2, 1)', () => {
    const field: number[] = Array(500).fill(2);
    let top = 0;
    for (let k = 0; k < 20000; k++) {
      const snap = snapPoint(field.slice(-500), P);
      top = Math.max(top, snap);
      field.push(ropeRecord(null, snap, P)); // nobody ever lets go
    }
    expect(top).toBe(P.max);
    expect(ropeRecord(null, P.max, P)).toBe(P.max);
    // at the top, letting go at the top is at the snap, so it snaps: holding to x max never banks
    expect(ropePoints(100, P.max, P.max, P)).toBe(50);
  });
  it('braver than: the share who let go before you, ties half', () => {
    expect(braverThan(1.5, [1, 1.5, 2, 3])).toBe(37.5);
  });
  it('no choice wins every time: letting go at once is beaten when the snap is late, and wins when it is early', () => {
    expect(ropePoints(100, 1.5, 2, P)).toBeGreaterThan(ropePoints(100, 1, 2, P));
    expect(ropePoints(100, 1, 1.5, P)).toBeGreaterThan(ropePoints(100, 1.5, 1.5, P));
  });
});

describe('V4 hold your day: R-13, the load rule (the default)', () => {
  const L: RulesParams['rope'] = { step: 0.5, max: 10, snapKeep: 0.5, emptySnap: 2, decimals: 1, snapped: 'above', snapRule: 'load', capacity: 1.5, ceilingShare: 0.1, rarestScale: 0.5 };
  it('the rope holds capacity / multiple of the field, at most all of it', () => {
    expect(ropeHolds(1.5, L)).toBe(1);
    expect(ropeHolds(2, L)).toBe(0.75);
    expect(ropeHolds(3, L)).toBe(0.5);
    expect(stillOn(2, [1, 2, 3, 1.5])).toBe(0.5);
    expect(stillOn(2, [])).toBe(0);
  });
  it('by hand: a bold crowd overloads it at x2 (8 in 10 still on, it holds 3 in 4)', () => {
    expect(snapPoint([1, 1, 2, 2, 2, 3, 3, 3, 4, 5], L)).toBe(2);
  });
  it('by hand: an early crowd lifts it until the ceiling, one rung past the bravest tenth (x3 + 0.5)', () => {
    // still on: x1.5 6/10 (holds all), x2 4/10 (holds .75), x2.5 2/10 (.6), x3 2/10 (.5); x3.5 is the ceiling
    expect(snapPoint([1, 1, 1, 1, 1.5, 1.5, 2, 2, 3, 3], L)).toBe(3.5);
  });
  it('the ceiling stops the jackpot: a crowd all at x1 snaps at x1.5, not never', () => {
    expect(snapPoint(Array(10).fill(1), L)).toBe(1.5);
    // without the ceiling nothing overloads, so it never snaps and holding to the top banks x10
    const noCeiling = { ...L, ceilingShare: 0 };
    expect(snapPoint(Array(10).fill(1), noCeiling)).toBe(10.5);
    expect(ropePoints(100, 10, 10.5, noCeiling)).toBe(1000);
  });
  it('empty field: emptySnap (R-3)', () => {
    expect(snapPoint([], L)).toBe(2);
  });
  it('medianPlus: one rung past the lower median', () => {
    expect(snapPoint([3, 1.2, 2, 1.5], { ...L, snapRule: 'medianPlus' })).toBe(2);
  });
  it('everyone undercutting by a rung: the load rule settles one rung above where the median rule falls', () => {
    const run = (q: RulesParams['rope']) => {
      let field: number[] = Array(500).fill(2.5);
      let night = snapPoint(field, q);
      const nights: number[] = [];
      for (let day = 0; day < 20; day++) {
        const today: number[] = [];
        for (let k = 0; k < 600; k++) {
          const snap = snapPoint([...field, ...today].slice(-500), q);
          today.push(ropeRecord(Math.max(1, Math.min(q.max, night) - q.step), snap, q));
        }
        field = today.slice(-500);
        night = snapPoint(field, q);
        nights.push(night);
      }
      return nights.slice(-10);
    };
    // everyone undercutting together: the load rule settles with the snap at x2 (they bank x1.5,
    // the ceiling holds it there); the median rule falls to x1.5 or below
    expect(Math.min(...run(L))).toBeGreaterThanOrEqual(2);
    expect(Math.max(...run({ ...L, snapRule: 'median' }))).toBeLessThanOrEqual(1.5);
  });
  // Not "no choice wins every time": at capacity 1.5, x1.5 can only snap via the ceiling, so it
  // beats x1 on almost every field (K05 round 3, 5 and 6). That hole is open, in the task file.
  it('x1 against x2 only: x1 wins on a bold day and loses on an early one', () => {
    const bold = snapPoint([1, 1, 2, 2, 2, 3, 3, 3, 4, 5], L);
    const early = snapPoint([1, 1, 1, 1, 1.5, 1.5, 2, 2, 3, 3], L);
    expect(ropePoints(100, 1, bold, L)).toBeGreaterThan(ropePoints(100, 2, bold, L));
    expect(ropePoints(100, 2, early, L)).toBeGreaterThan(ropePoints(100, 1, early, L));
  });
});

describe('V4 hold your day: R-16, his rope (the default): let go where fewest let go', () => {
  const R: RulesParams['rope'] = { ...rules().rope, snapRule: 'rarest', rarestScale: 0.5, step: 0.5, max: 10, decimals: 1 };
  it('is the default switch (its numbers are his to tune, so not pinned here)', () => {
    expect(rules().rope.snapRule).toBe('rarest');
  });
  it('an empty field pays 5; a rung nobody chose pays 5; the rung everyone chose pays 1', () => {
    expect(ropeRarity(2, [], R)).toBe(5);
    const all2 = Array(10).fill(2);
    expect(ropeRarity(2, all2, R)).toBe(1);
    expect(ropeRarity(3, all2, R)).toBe(5);
  });
  it('by hand: one record on each of the 19 rungs is an even spread, ratio 1, price 3', () => {
    // ratio 1: (1.5 - 1) / (1.5 - 0.25) = 0.4 of the way to rare, 1 + 4 x 0.4 = 2.6, rounded to 3
    const even = ropeLadder(R);
    expect(even.length).toBe(19);
    for (const r of even) expect(ropeRarity(r, even, R)).toBe(3);
  });
  it('only your own rung counts, not its neighbours', () => {
    expect(ropeRarity(2.5, Array(10).fill(2), R)).toBe(5);
  });
  it('points: day points x price x 0.5, so x0.5 to x2.5; the multiple itself is not paid', () => {
    const all2 = Array(10).fill(2);
    expect(ropeRarestPoints(100, 3, all2, R)).toBe(250);
    expect(ropeRarestPoints(100, 10, all2, R)).toBe(250); // the top pays no more than any empty rung
    expect(ropeRarestPoints(100, 2, all2, R)).toBe(50);
  });
  it('a release off the ladder throws; the rarest rope has no snap', () => {
    expect(() => ropeRarity(2.2, [], R)).toThrow();
    expect(() => snapPoint([2], R)).toThrow();
  });
  it('no choice wins every time: the same rung pays 5 one day and 1 the next', () => {
    expect(ropeRarity(1, Array(10).fill(3), R)).toBeGreaterThan(ropeRarity(3, Array(10).fill(3), R));
    expect(ropeRarity(3, Array(10).fill(1), R)).toBeGreaterThan(ropeRarity(1, Array(10).fill(1), R));
  });
});

describe("Dare's Stop: R-14 the 12% notch, R-15 his open track", () => {
  it('the dare notch is 12% every day, and the goes match plain Stop', () => {
    for (const c of cards) {
      const d = dareStopCard(c);
      expect(d.notchWidth).toBe(0.12);
      expect(d.goes).toEqual(generateStop(c).goes);
    }
    expect(dareStopParams().notchWidthStepPerDay).toBe(0);
  });
  it('open: anywhere on the track pays; an empty field pays 5; a crowded spot pays 1, an empty one 5', () => {
    expect(openStopPrice(0, [])).toBe(5);
    const crowd = Array(100).fill(0.5);
    expect(openStopPrice(0.5, crowd)).toBe(1);
    expect(openStopPrice(0.9, crowd)).toBe(5);
    expect(openStopPrice(0.52, crowd)).toBe(1); // within 3% of the track
    expect(openStopPrice(0.54, crowd)).toBe(5);
  });
  it('open: by hand, an even field pays the middle price', () => {
    // 100 stops at 0.5%, 1.5%, ... 99.5%: the window +-3% round the middle holds 6 of them, what an
    // even spread puts there, so the ratio is 1. That's (1.5 - 1) / (1.5 - 0.25) = 0.4 of the way
    // from crowded to rare: 1 + 4 x 0.4 = 2.6, rounded to 3. (Off the window's edges on purpose.)
    const even = Array.from({ length: 100 }, (_, i) => (i + 0.5) / 100);
    expect(openStopPrice(0.5, even)).toBe(3);
  });
  it('open: a stop exactly 3% away counts the same anywhere on the track (K05 round 3, 20)', () => {
    const crowd = Array(10).fill(0);
    for (const at of [0.1, 0.3, 0.5, 0.7]) {
      const c = crowd.map(() => at);
      expect(openStopPrice(at + 0.03, c)).toBe(openStopPrice(0.13, crowd.map(() => 0.1)));
    }
  });
  it('open: the points are the average of the three go prices, to 0.1 (R-15b)', () => {
    const crowd = Array(100).fill(0.5);
    // prices 1, 5, 5: average 3.7 (11 / 3 = 3.67)
    expect(openStopPoints([0.5, 0.9, 0.1], [crowd, crowd, crowd])).toBe(3.7);
    expect(() => openStopPoints([0.5], [crowd, crowd])).toThrow();
    expect(() => openStopPoints([], [])).toThrow();
  });
  it('the dare card carries the mode', () => {
    expect(dareStopCard(1).mode).toBe(rules().dareStop.mode);
    expect(dareStopCard(1, { ...rules().dareStop, mode: 'open' }).mode).toBe('open');
  });
  it('open: a place off the track throws', () => {
    expect(() => openStopPrice(-0.01, [])).toThrow();
    expect(() => openStopPrice(1.01, [])).toThrow();
  });
  it('open: prices stay 1 to 5 over random fields', () => {
    const r = mulberry32(5);
    for (let t = 0; t < 300; t++) {
      const field = Array.from({ length: 1 + Math.floor(r() * 80) }, () => r());
      const v = openStopPrice(r(), field);
      expect(v).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThanOrEqual(5);
    }
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
        for (const v of [s.x, s.y]) {
          expect(v).toBeGreaterThanOrEqual(R.edge);
          expect(v).toBeLessThanOrEqual(1 - R.edge);
        }
        for (const t of a) if (t !== s) expect(Math.sqrt((s.x - t.x) ** 2 + (s.y - t.y) ** 2)).toBeGreaterThanOrEqual(R.minGap);
      }
    }
  });
  it('the playground changes from day to day, and so do its kinds (K05 5: no spot every day)', () => {
    expect(generatePlayground(1)).not.toEqual(generatePlayground(2));
    expect(R.kinds.length).toBeGreaterThan(R.spots);
    const kindsSeen = new Set(cards.flatMap((c) => generatePlayground(c).map((s) => s.kind)));
    expect(kindsSeen.size).toBe(R.kinds.length);
    const shedDays = cards.filter((c) => generatePlayground(c).some((s) => R.kinds[s.kind] === 'shed')).length;
    expect(shedDays).toBeLessThan(cards.length);
  });
  it('hide: share of seeks that miss you; seek: share of hiders within reach', () => {
    const P = { ...R, seekRadius: 0.16 };
    expect(hideScore({ x: 0.5, y: 0.55 }, [{ x: 0.1, y: 0.1 }, { x: 0.5, y: 0.5 }], P)).toBe(50);
    expect(seekScore({ x: 0.5, y: 0.5 }, [{ x: 0.5, y: 0.6 }, { x: 0.9, y: 0.9 }], P)).toBe(50);
    expect(hideScore({ x: 0.5, y: 0.5 }, [], P)).toBe(50);
    const spots = [
      { id: 0, kind: 0, x: 0.2, y: 0.2 },
      { id: 1, kind: 1, x: 0.3, y: 0.2 },
      { id: 2, kind: 2, x: 0.8, y: 0.8 },
    ];
    expect(spotsFound({ x: 0.25, y: 0.2 }, spots, P)).toEqual([0, 1]);
  });
});
