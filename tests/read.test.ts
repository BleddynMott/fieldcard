// G-02b: Read's rules, by hand from tasks/G-02b.md "Rules" (spec: G-00d).
import { describe, expect, it } from 'vitest';
import { overlap } from '../src/lib/reads';
import { mulberry32 } from '../src/lib/rng';
import { rules } from '../src/lib/rules/params';
import {
  adjustScore,
  adjustShift,
  aschLine,
  averageDrawing,
  countPeak,
  drawFour,
  drawResult,
  findYourself,
  majority,
  meetHunch,
  numberDistance,
  pickDistance,
  pileOf,
  selectPiles,
  strokeToBins,
  thoughtAboveMiddle,
} from '../src/lib/rules/read';

const cards = Array.from({ length: 60 }, (_, i) => i + 1);
const close = (a: number[] | null, b: number[]) => {
  expect(a).not.toBeNull();
  (a as number[]).forEach((x, i) => expect(x).toBeCloseTo(b[i], 2));
};

describe('Q1 and Q2: answer blind, then meet the crowd', () => {
  it('Count: keeping the closer answer +1, the further -1, equally close 0, agreeing 0', () => {
    expect(meetHunch(15, 13, 'keep', 17, numberDistance)).toBe(1);
    expect(meetHunch(15, 13, 'switch', 17, numberDistance)).toBe(-1);
    expect(meetHunch(15, 19, 'keep', 17, numberDistance)).toBe(0);
    expect(meetHunch(15, 15, 'switch', 99, numberDistance)).toBe(0);
  });
  it('trusting a good crowd scores too: switching to the right answer is +1', () => {
    expect(meetHunch(12, 17, 'switch', 17, numberDistance)).toBe(1);
  });
  it('the signed rule is symmetric (+1 / -1 for keep and switch); the B4 option scores keep alone', () => {
    const P = rules().meet;
    expect([P.keepCloser, P.keepFurther, P.switchCloser, P.switchFurther]).toEqual([1, -1, 1, -1]);
    const B4 = { keepCloser: 2, keepFurther: -1, switchCloser: 0, switchFurther: 0, four: 4 };
    expect(meetHunch(15, 13, 'keep', 17, numberDistance, B4)).toBe(2);
    expect(meetHunch(15, 13, 'switch', 17, numberDistance, B4)).toBe(0);
    expect(meetHunch(13, 15, 'keep', 17, numberDistance, B4)).toBe(-1);
  });
  it('Pair: right vs wrong; both wrong is 0', () => {
    expect(meetHunch('a', 'b', 'switch', 'b', pickDistance)).toBe(1);
    expect(meetHunch('a', 'b', 'keep', 'b', pickDistance)).toBe(-1);
    expect(meetHunch('a', 'b', 'keep', 'c', pickDistance)).toBe(0);
  });
  it('the hill peak: most common; a tie to the one nearest the median, then the lower', () => {
    expect(countPeak([15, 15, 16, 16, 20])).toBe(16); // median 16
    expect(countPeak([14, 14, 18, 18])).toBe(14); // lower median 14
    expect(countPeak([10, 10, 14, 14, 12])).toBe(10); // both 2 from the median 12: the lower
    expect(countPeak([7])).toBe(7);
    expect(countPeak([])).toBeUndefined();
  });
  it('the four: distinct, at random, all of a small field', () => {
    const rng = mulberry32(3);
    for (let k = 0; k < 200; k++) {
      const f = drawFour(50, rng);
      expect(f.length).toBe(4);
      expect(new Set(f).size).toBe(4);
      f.forEach((i) => expect(i >= 0 && i < 50).toBe(true));
    }
    expect(drawFour(3, rng).sort()).toEqual([0, 1, 2]);
    expect(drawFour(0, rng)).toEqual([]);
  });
  it('the four are spread across the field, not hand-picked', () => {
    const rng = mulberry32(11);
    const seen = new Array(20).fill(0);
    for (let k = 0; k < 4000; k++) drawFour(20, rng).forEach((i) => seen[i]++);
    seen.forEach((n) => expect(n).toBeGreaterThan(600)); // 800 expected each
  });
  it("the four's pick: most common, a tie to the earliest drawn", () => {
    expect(majority(['a', 'b', 'b', 'a'])).toBe('a');
    expect(majority(['c', 'b', 'b', 'a'])).toBe('b');
    expect(majority([])).toBeUndefined();
  });
  it('the Asch line from blind and final records', () => {
    const r = [
      { blindRight: true, finalRight: true, switched: false },
      { blindRight: true, finalRight: false, switched: true },
      { blindRight: false, finalRight: false, switched: false },
      { blindRight: true, finalRight: true, switched: false },
    ];
    expect(aschLine(r)).toEqual({ blindRight: 75, finalRight: 50, switched: 25 });
  });
});

describe('Q3: draw, select, adjust', () => {
  it('a stroke: highest point per bin, gaps filled straight, nothing outside it', () => {
    close(strokeToBins([{ x: 0.1, y: 1 }, { x: 0.9, y: 1 }], 4), [25, 25, 25, 25]);
    close(strokeToBins([{ x: 0.1, y: 0.5 }, { x: 0.6, y: 1 }], 4), [22.22, 33.33, 44.44, 0]);
    close(strokeToBins([{ x: 0.1, y: 0.2 }, { x: 0.15, y: 0.8 }, { x: 0.6, y: 0.4 }], 4), [44.44, 33.33, 22.22, 0]); // 0.8, 0.6 (filled), 0.4, 0 over 1.8
  });
  it('fewer than two points, or a flat line at 0, is no drawing', () => {
    expect(strokeToBins([{ x: 0.5, y: 1 }], 4)).toBeNull();
    expect(strokeToBins([{ x: 0.1, y: 0 }, { x: 0.9, y: 0 }], 4)).toBeNull();
  });
  it('the real pile in bins', () => {
    close(pileOf([0, 1, 1, 3, 4], 0, 4, 4), [20, 40, 0, 40]);
    expect(pileOf([], 0, 4, 4)).toBeNull();
  });
  it('score is the overlap; the badge when you beat everyone\'s average drawing', () => {
    const real = [10, 40, 40, 10];
    const mine = [10, 40, 40, 10];
    const everyone = [
      [40, 40, 10, 10],
      [10, 10, 40, 40],
    ];
    expect(averageDrawing(everyone)).toEqual([25, 25, 25, 25]);
    const r = drawResult(mine, real, everyone);
    expect(r.score).toBe(100);
    expect(r.crowdScore).toBe(70);
    expect(r.badge).toBe(true);
    expect(drawResult(everyone[0], real, everyone).badge).toBe(false);
  });
  it('select: two piles, one real, the fake never too close, same twice for a card', () => {
    const P = rules().select;
    const real = [2, 6, 14, 22, 20, 14, 9, 6, 4, 2, 1, 0];
    for (const c of cards) {
      const s = selectPiles(c, real);
      expect(selectPiles(c, real)).toEqual(s);
      const fake = s.realSide === 'left' ? s.right : s.left;
      expect(s.realSide === 'left' ? s.left : s.right).toEqual(real);
      expect(overlap(fake, real)).toBeLessThanOrEqual(P.maxOverlap);
      expect(fake.reduce((a, b) => a + b, 0)).toBeCloseTo(100, 6);
    }
    const recipes = new Set(cards.map((c) => selectPiles(c, real).recipe));
    expect(recipes.size).toBeGreaterThan(1); // the recipe varies
    const sides = new Set(cards.map((c) => selectPiles(c, real).realSide));
    expect(sides.size).toBe(2);
  });
  it('adjust: a shift of 1 to maxShift bins, never 0; the score', () => {
    const M = rules().adjust.maxShift;
    for (const c of cards) {
      const s = adjustShift(c);
      expect(s).not.toBe(0);
      expect(Math.abs(s)).toBeLessThanOrEqual(M);
      expect(adjustShift(c)).toBe(s);
    }
    const P = { maxShift: 3 };
    expect(adjustScore(2, -2, P)).toBe(100);
    expect(adjustScore(2, 0, P)).toBeCloseTo(33.33, 2);
    expect(adjustScore(2, 2, P)).toBe(0);
  });
});

describe('Q4: find yourself', () => {
  it('"You thought 70%; you beat 57%. 13 points too proud": Hunch -13', () => {
    expect(findYourself(70, 57)).toEqual({ gap: 13, hunch: -13 });
    expect(findYourself(40, 57)).toEqual({ gap: -17, hunch: -17 });
  });
  it('"71% thought they beat most of the field": the share above the middle', () => {
    expect(thoughtAboveMiddle([60, 40, 70, 50])).toBe(50);
    expect(thoughtAboveMiddle([])).toBe(0);
  });
});
