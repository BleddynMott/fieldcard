// G-02b probes: put numbers on three open risks. MODELS, not measurements: the players below are
// made up from stated assumptions, and only real play settles any of it. Not part of CI.
// Run: npx vitest run --config probes/vitest.config.ts
import { describe, it } from 'vitest';
import { config } from '../src/lib/config';
import { dgauss } from '../src/lib/dmath';
import { mulberry32 } from '../src/lib/rng';
import { ropePoints, ropeRecord, snapPoint, stopPrice } from '../src/lib/rules/dare';
import { rollingField, values } from '../src/lib/rules/field';
import { trapFor } from '../src/lib/rules/layers';
import { countPeak, meetHunch, numberDistance } from '../src/lib/rules/read';

const log = (s: string) => process.stdout.write(s + '\n');
const r1 = (x: number) => Math.round(x * 10) / 10;

describe('probe A: does the rope talk itself down? (G-00c C5, item 4)', () => {
  it('runs', () => {
    // Assumptions: 2,000 players a day. A "gut" player lets go at a target spread round x2.2 (sd 0.6,
    // at least x1.1). A "learner" knows yesterday's final snap and aims 2% to 15% below it. The
    // learner share rises from 0% on day 1 to 70% on day 14. Day 1's dawn field is 500 gut players.
    const rng = mulberry32(42);
    const gut = () => Math.max(1.1, 2.2 + 0.6 * dgauss(rng));
    let field: number[] = Array.from({ length: 500 }, gut);
    let yesterdaySnap = snapPoint(field);
    log('A. day  learners  snap at dawn  snap at night  mean payout per 100');
    for (let day = 1; day <= 14; day++) {
      const learnShare = (0.7 * (day - 1)) / 13;
      const dawn = snapPoint(field);
      let pay = 0;
      const today: number[] = [];
      for (let k = 0; k < 2000; k++) {
        const f = rollingField(today, field, 500);
        const snap = snapPoint(values(f));
        const target = rng() < learnShare ? yesterdaySnap * (1 - (0.02 + 0.13 * rng())) : gut();
        const release = Math.max(1, Math.round(target * 10) / 10);
        pay += ropePoints(100, release, snap);
        today.push(ropeRecord(release, snap));
      }
      field = today.slice(-500);
      yesterdaySnap = snapPoint(field);
      log(`A. ${String(day).padStart(3)}  ${String(Math.round(learnShare * 100)).padStart(7)}%  ${r1(dawn).toFixed(1).padStart(12)}  ${r1(yesterdaySnap).toFixed(1).padStart(13)}  ${Math.round(pay / 2000).toString().padStart(8)}`);
    }
  });
});

describe('probe B: is switching to the crowd always right? (G-00d Read 7.3)', () => {
  it('runs', () => {
    // Assumptions: Count's crowd model from config (bias mean -6%, sd 8%; noise sd 16%; skill cuts
    // noise by up to 30%). On a trap day everyone is pulled low by strength x 25%, unless they see
    // through it (chance = skill x 0.5). Truth 20. Field = the 500 players before you. 365 cards,
    // traps from the real schedule (Z1). Strategies: always switch, always keep, and "keep if my
    // blind answer is 3 or more from the peak".
    const C = config.crowd.count;
    const rng = mulberry32(7);
    const truth = 20;
    const player = (trap: { trap: boolean; strength: number }) => {
      const skill = rng();
      const fooled = trap.trap && rng() > skill * 0.5;
      const bias = C.biasMean + C.biasSd * dgauss(rng) - (fooled ? trap.strength * 0.25 : 0);
      const noise = C.sd * (1 - C.skillEffect * skill) * dgauss(rng);
      return Math.max(0, Math.round(truth * (1 + bias + noise)));
    };
    const tot = { switch: 0, keep: 0, gap3: 0 };
    const trapTot = { switch: 0, keep: 0, gap3: 0, n: 0 };
    const plainTot = { switch: 0, keep: 0, gap3: 0, n: 0 };
    for (let card = 1; card <= 365; card++) {
      const trap = trapFor(card, 'count');
      const fieldVals = Array.from({ length: 500 }, () => player(trap));
      const peak = countPeak(fieldVals) as number;
      const t = trap.trap ? trapTot : plainTot;
      for (let k = 0; k < 200; k++) {
        const blind = player(trap);
        const s = meetHunch(blind, peak, 'switch', truth, numberDistance);
        const kp = meetHunch(blind, peak, 'keep', truth, numberDistance);
        const g = meetHunch(blind, peak, Math.abs(blind - peak) >= 3 ? 'keep' : 'switch', truth, numberDistance);
        tot.switch += s; tot.keep += kp; tot.gap3 += g;
        t.switch += s; t.keep += kp; t.gap3 += g; t.n += 1;
      }
    }
    const per = (x: number, n: number) => (x / n).toFixed(3);
    log(`B. plain days (${plainTot.n / 200}): Hunch per meeting  switch ${per(plainTot.switch, plainTot.n)}  keep ${per(plainTot.keep, plainTot.n)}  keep-if-3-off ${per(plainTot.gap3, plainTot.n)}`);
    log(`B. trap days  (${trapTot.n / 200}): Hunch per meeting  switch ${per(trapTot.switch, trapTot.n)}  keep ${per(trapTot.keep, trapTot.n)}  keep-if-3-off ${per(trapTot.gap3, trapTot.n)}`);
    log(`B. whole year: switch ${per(tot.switch, 73000)}  keep ${per(tot.keep, 73000)}  keep-if-3-off ${per(tot.gap3, 73000)}`);
  });
});

describe('probe C: is Stop just "edges pay more"? (G-00c C5, item 2)', () => {
  it('runs', () => {
    // Assumptions: notch 7% of the track (Monday), so half-width 3.5. A player's stop lands at their
    // aim plus noise sd 2.5 (a steady player; the crowd model's 4.5 is the whole field, misses
    // included). "Plain" players aim at the centre. "Seekers" look at the pile and aim at the bare
    // spot (of 15 evenly spaced aims across the notch) with the highest price. 1,500 players.
    for (const seekers of [0, 0.3, 0.6]) {
      const rng = mulberry32(99);
      const half = 3.5;
      const aims = Array.from({ length: 15 }, (_, i) => -half + (2 * half * (i + 0.5)) / 15);
      const today: number[] = [];
      const priceAt = (x: number) => stopPrice(x, half, today.slice(-500));
      const snapshot = () => [-3, -1.5, 0, 1.5, 3].map((x) => priceAt(x)).join(' ');
      const marks: string[] = [];
      for (let k = 0; k < 1500; k++) {
        let aim = 0;
        if (rng() < seekers && today.length > 0) {
          let best = -1;
          for (const a of aims) {
            const p = priceAt(a);
            if (p > best) { best = p; aim = a; }
          }
        }
        today.push(aim + 2.5 * dgauss(rng));
        if (k === 99 || k === 499 || k === 1499) marks.push(`after ${k + 1}: ${snapshot()}`);
      }
      log(`C. seekers ${Math.round(seekers * 100)}%: price at -3, -1.5, 0, +1.5, +3 | ${marks.join(' | ')}`);
    }
  });
});

describe('probe B2: what would stop "always switch" winning?', () => {
  it('runs', () => {
    // Same model as B, but trap days drawn at a chosen share (not the Z1 schedule), with a chosen
    // pull and see-through chance. Reports the whole-run Hunch per meeting for always-switch and
    // always-keep. Switching stops dominating when keep >= switch.
    const C = config.crowd.count;
    const truth = 20;
    for (const share of [0.3, 0.5, 0.7]) {
      for (const pull of [0.25, 0.5]) {
        for (const seeThrough of [0.5, 0.9]) {
          const rng = mulberry32(13);
          const player = (trap: boolean, strength: number) => {
            const skill = rng();
            const fooled = trap && rng() > skill * seeThrough;
            const bias = C.biasMean + C.biasSd * dgauss(rng) - (fooled ? strength * pull : 0);
            const noise = C.sd * (1 - C.skillEffect * skill) * dgauss(rng);
            return Math.max(0, Math.round(truth * (1 + bias + noise)));
          };
          let s = 0;
          let k = 0;
          const n = 200 * 150;
          for (let card = 0; card < 200; card++) {
            const trap = rng() < share;
            const strength = 0.4 + 0.6 * rng();
            const peak = countPeak(Array.from({ length: 500 }, () => player(trap, strength))) as number;
            for (let j = 0; j < 150; j++) {
              const blind = player(trap, strength);
              s += meetHunch(blind, peak, 'switch', truth, numberDistance);
              k += meetHunch(blind, peak, 'keep', truth, numberDistance);
            }
          }
          log(`B2. trap share ${share}  pull ${pull}  see-through ${seeThrough}:  switch ${(s / n).toFixed(3)}  keep ${(k / n).toFixed(3)}`);
        }
      }
    }
  });
});

describe('probe B3: meet four people instead of the 500-player peak', () => {
  it('runs', () => {
    // Same player model as B2 (trap share 0.3, pull 0.25, see-through 0.5). The crowd you meet is
    // four field players: their median answer (Count), or their majority pick (Pair, modelled as
    // right with the player's own chance). Reports always-switch against always-keep.
    const C = config.crowd.count;
    const truth = 20;
    const rng = mulberry32(21);
    const player = (trap: boolean, strength: number) => {
      const skill = rng();
      const fooled = trap && rng() > skill * 0.5;
      const bias = C.biasMean + C.biasSd * dgauss(rng) - (fooled ? strength * 0.25 : 0);
      const noise = C.sd * (1 - C.skillEffect * skill) * dgauss(rng);
      return Math.max(0, Math.round(truth * (1 + bias + noise)));
    };
    let s = 0;
    let k = 0;
    let n = 0;
    for (let card = 0; card < 300; card++) {
      const trap = rng() < 0.3;
      const strength = 0.4 + 0.6 * rng();
      for (let j = 0; j < 150; j++) {
        const four = [0, 1, 2, 3].map(() => player(trap, strength)).sort((a, b) => a - b);
        const crowd = Math.round((four[1] + four[2]) / 2);
        const blind = player(trap, strength);
        s += meetHunch(blind, crowd, 'switch', truth, numberDistance);
        k += meetHunch(blind, crowd, 'keep', truth, numberDistance);
        n++;
      }
    }
    log(`B3. Count, four people's median: switch ${(s / n).toFixed(3)}  keep ${(k / n).toFixed(3)}`);
    // Pair: each player right with chance q (0.8 plain; 0.4 on a trap day, when the decoy fools most).
    let ps = 0;
    let pk = 0;
    let pn = 0;
    for (let card = 0; card < 300; card++) {
      const trap = rng() < 0.3;
      const q = trap ? 0.4 : 0.8;
      for (let j = 0; j < 150; j++) {
        // a wrong pick is the decoy on a trap day, else one of five wrong pairs
        const pick = () => (rng() < q ? 'right' : trap ? 'decoy' : `w${Math.floor(rng() * 5)}`);
        const four = [pick(), pick(), pick(), pick()];
        const tally = new Map<string, number>();
        four.forEach((p) => tally.set(p, (tally.get(p) ?? 0) + 1));
        const crowd = [...tally.entries()].sort((a, b) => b[1] - a[1])[0][0];
        const blind = pick();
        const d = (a: string, b: string) => (a === b ? 0 : 1);
        ps += meetHunch(blind, crowd, 'switch', 'right', d);
        pk += meetHunch(blind, crowd, 'keep', 'right', d);
        pn++;
      }
    }
    log(`B3. Pair, four people's majority: switch ${(ps / pn).toFixed(3)}  keep ${(pk / pn).toFixed(3)}`);
  });
});

describe('probe B4: a fix to test: switching is safe (0), keeping is the dare (+2 / -1)', () => {
  it('runs', () => {
    // Model as B (Z1-like: trap share 0.3, pull 0.25, see-through 0.5), crowd = the 500-player peak.
    // Keep's average Hunch, by player skill and by day kind. Switching is 0 by definition here, so a
    // positive number means keeping pays for that group, and a choice exists.
    const C = config.crowd.count;
    const truth = 20;
    const rng = mulberry32(31);
    const make = (trap: boolean, strength: number, skill: number) => {
      const fooled = trap && rng() > skill * 0.5;
      const bias = C.biasMean + C.biasSd * dgauss(rng) - (fooled ? strength * 0.25 : 0);
      const noise = C.sd * (1 - C.skillEffect * skill) * dgauss(rng);
      return Math.max(0, Math.round(truth * (1 + bias + noise)));
    };
    const P = { keepCloser: 2, keepFurther: -1, switchCloser: 0, switchFurther: 0, four: 4 };
    const acc: Record<string, { s: number; n: number }> = {};
    for (let card = 0; card < 300; card++) {
      const trap = rng() < 0.3;
      const strength = 0.4 + 0.6 * rng();
      const peak = countPeak(Array.from({ length: 500 }, () => make(trap, strength, rng()))) as number;
      for (let j = 0; j < 150; j++) {
        const skill = rng();
        const blind = make(trap, strength, skill);
        const key = `${trap ? 'trap ' : 'plain'} skill ${skill < 0.33 ? 'low ' : skill < 0.67 ? 'mid ' : 'high'}`;
        acc[key] ??= { s: 0, n: 0 };
        acc[key].s += meetHunch(blind, peak, 'keep', truth, numberDistance, P);
        acc[key].n++;
      }
    }
    for (const k of Object.keys(acc).sort()) log(`B4. ${k}: keep ${(acc[k].s / acc[k].n).toFixed(3)} per meeting (switch 0)`);
  });
});
