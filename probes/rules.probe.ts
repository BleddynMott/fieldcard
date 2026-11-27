// G-02b probes: put numbers on the open risks. MODELS, not measurements: the players below are
// made up from stated assumptions, and only real play settles any of it. Not part of CI.
// Run: npx vitest run --config probes/vitest.config.ts
// Revised after K05 round 1 (findings 1, 10, 11, 12): the rope's record rule is compared both
// ways; Count's players follow G-02's crowd model (one lean per card, skill through dexp); Stop
// runs over several seeds with random tie-breaks and reports what each aim actually pays.
import { describe, it } from 'vitest';
import { config } from '../src/lib/config';
import { dexp, dgauss } from '../src/lib/dmath';
import { mulberry32, type Rng } from '../src/lib/rng';
import { openStopPrice, ropeLadder, ropePoints, ropeRarestPoints, ropeRarity, ropeRecord, snapPoint, stopPrice } from '../src/lib/rules/dare';
import { rollingField, values } from '../src/lib/rules/field';
import { trapFor } from '../src/lib/rules/layers';
import { rules } from '../src/lib/rules/params';
import { countPeak, meetHunch, numberDistance } from '../src/lib/rules/read';

const log = (s: string) => process.stdout.write(s + '\n');
const f3 = (x: number) => (x >= 0 ? ' ' : '') + x.toFixed(3);

describe('probe A: the rope over 14 days, both record rules', () => {
  it('runs', () => {
    // 2,000 players a day. "Gut" players let go at a target round x2.2 (sd 0.6, at least x1.1).
    // "Learners" let go one rung below yesterday's final snap (K05 round 2, 3: on a 0.5 ladder,
    // "a few % below" rounds back onto the snap); they rise from 0% to 70% over 14 days.
    // Releases sit on the ladder (step 0.5). Day 1's dawn field is 500 gut players.
    const R = rules().rope;
    const onLadder = (x: number) => 1 + Math.round((Math.max(1, x) - 1) / R.step) * R.step;
    for (const snapped of ['at', 'above'] as const) {
      const P = { ...R, snapped };
      const rng = mulberry32(42);
      const gut = () => Math.max(1.1, 2.2 + 0.6 * dgauss(rng));
      let field: number[] = Array.from({ length: 500 }, () => onLadder(gut()));
      let ySnap = snapPoint(field, P);
      const rows: string[] = [];
      for (let day = 1; day <= 14; day++) {
        const learn = (0.7 * (day - 1)) / 13;
        let pay = 0;
        const today: number[] = [];
        for (let k = 0; k < 2000; k++) {
          const snap = snapPoint(values(rollingField(today, field, 500)), P);
          const release = rng() < learn ? Math.max(1, ySnap - R.step) : onLadder(gut());
          pay += ropePoints(100, release, snap, P);
          today.push(ropeRecord(release, snap, P));
        }
        field = today.slice(-500);
        ySnap = snapPoint(field, P);
        if (day === 1 || day === 7 || day === 14) rows.push(`day ${day}: learners ${Math.round(learn * 100)}%, night snap x${ySnap}, pays ${Math.round(pay / 2000)}/100`);
      }
      log(`A. snapped recorded ${snapped.padEnd(5)} | ${rows.join(' | ')}`);
    }
  });
});

describe('probe A2: the rope under the load rule (R-13), 14 days', () => {
  it('runs', () => {
    // As A: 2,000 players a day, gut players round x2.2 (sd 0.6). Learners rise from 0% to 70%:
    // "undercut" learners let go one rung below last night's snap; "copy" learners let go at the
    // fixed release that paid best yesterday. Fixed releases are scored against the snap every
    // player faced that day, so "which choice paid best" can be read per day. Median rule shown
    // for comparison. Day pays are per 100 points; x1 always pays 100.
    const base = rules().rope;
    const onLadder = (x: number) => 1 + Math.round((Math.max(1, x) - 1) / base.step) * base.step;
    const fixed = [1, 1.5, 2, 2.5, 3, 4, 5];
    // "safe" learners let go two rungs below last night's snap. Load runs carry the ceiling
    // (ceilingShare 0.1) unless marked ceil 0.
    type Run = { rule: 'load' | 'median' | 'medianPlus'; capacity: number; ceil: number; learner: 'undercut' | 'copy' | 'safe'; to: number };
    const runs: Run[] = [];
    for (const learner of ['undercut', 'copy', 'safe'] as const) {
      runs.push({ rule: 'median', capacity: 1, ceil: 0, learner, to: 0.7 });
      runs.push({ rule: 'medianPlus', capacity: 1, ceil: 0, learner, to: 0.7 });
      runs.push({ rule: 'load', capacity: 1.5, ceil: 0, learner, to: 0.7 });
      for (const capacity of [1, 1.5, 2]) runs.push({ rule: 'load', capacity, ceil: 0.1, learner, to: 0.7 });
    }
    for (const run of runs) {
      const P = { ...base, snapRule: run.rule, capacity: run.capacity, ceilingShare: run.ceil };
      const rng = mulberry32(42);
      const gut = () => onLadder(Math.max(1.1, 2.2 + 0.6 * dgauss(rng)));
      let field: number[] = Array.from({ length: 500 }, gut);
      let ySnap = snapPoint(field, P);
      let yBest = 2;
      const snaps: number[] = [];
      const bests: number[] = [];
      let allPay = 0;
      let gutPay = 0;
      let gutN = 0;
      for (let day = 1; day <= 14; day++) {
        const learn = (run.to * (day - 1)) / 13;
        const fixedPay = fixed.map(() => 0);
        const today: number[] = [];
        for (let k = 0; k < 2000; k++) {
          const snap = snapPoint(values(rollingField(today, field, 500)), P);
          const isLearner = rng() < learn;
          const below = (n: number) => Math.max(1, Math.min(P.max, ySnap) - n * P.step);
          const release = isLearner ? (run.learner === 'copy' ? yBest : below(run.learner === 'undercut' ? 1 : 2)) : gut();
          const pay = ropePoints(100, release, snap, P);
          allPay += pay;
          if (!isLearner) {
            gutPay += pay;
            gutN++;
          }
          fixed.forEach((r, i) => (fixedPay[i] += ropePoints(100, r, snap, P)));
          today.push(ropeRecord(release, snap, P));
        }
        field = today.slice(-500);
        ySnap = snapPoint(field, P);
        const best = fixedPay.indexOf(Math.max(...fixedPay));
        yBest = fixed[best];
        snaps.push(ySnap);
        bests.push(fixed[best]);
      }
      log(
        `A2. ${run.rule.padEnd(10)} ${run.rule === 'load' ? `cap ${run.capacity} ceil ${run.ceil}` : ''.padEnd(16)} ${run.learner.padEnd(8)} learners to ${run.to * 100}%: night snaps ${snaps.map((s) => 'x' + s).join(' ')} | best fixed release ${bests.map((b) => 'x' + b).join(' ')} | everyone ${Math.round(allPay / 28000)}/100, gut players ${Math.round(gutPay / Math.max(1, gutN))}/100`,
      );
    }
  });
});

describe('probe A3: the rope with a mixed crowd of learners', () => {
  it('runs', () => {
    // As A2, but learners (to 70% by day 14) are a third each undercut, copy and safe, and each
    // reads one of the last three nights at random, so they don't all react to the same night.
    // 28 days. Reported: the night snaps, the best fixed release by day, and what each kind earned.
    const base = rules().rope;
    const onLadder = (x: number) => 1 + Math.round((Math.max(1, x) - 1) / base.step) * base.step;
    const fixed = [1, 1.5, 2, 2.5, 3, 3.5, 4, 5];
    const runs = [
      { snapRule: 'medianPlus' as const, capacity: 1, ceilingShare: 0 },
      ...[1.25, 1.5, 1.75].map((capacity) => ({ snapRule: 'load' as const, capacity, ceilingShare: 0.1 })),
    ];
    // K05 round 3 (findings 1, 2, 32): also each fixed release's average over the run, the share of
    // players whose snap the ceiling set, and three seeds.
    for (const run of runs) for (const seed of [99, 7, 2024]) {
      const P = { ...base, ...run };
      const rng = mulberry32(seed);
      const runFixed = fixed.map(() => 0);
      let byCeiling = 0;
      let faced = 0;
      const gut = () => onLadder(Math.max(1.1, 2.2 + 0.6 * dgauss(rng)));
      let field: number[] = Array.from({ length: 500 }, gut);
      const nights: { snap: number; best: number }[] = [{ snap: snapPoint(field, P), best: 2 }];
      const earned: Record<string, [number, number]> = { gut: [0, 0], undercut: [0, 0], copy: [0, 0], safe: [0, 0] };
      for (let day = 1; day <= 28; day++) {
        const learn = Math.min(0.7, (0.7 * (day - 1)) / 13);
        const fixedPay = fixed.map(() => 0);
        const today: number[] = [];
        for (let k = 0; k < 2000; k++) {
          const fv = values(rollingField(today, field, 500));
          const snap = snapPoint(fv, P);
          if (P.snapRule === 'load' && snap !== snapPoint(fv, { ...P, ceilingShare: 0 })) byCeiling++;
          faced++;
          const night = nights[Math.max(0, nights.length - 1 - Math.floor(rng() * 3))];
          const kind = rng() < learn ? (['undercut', 'copy', 'safe'] as const)[Math.floor(rng() * 3)] : 'gut';
          const top = Math.min(P.max, night.snap);
          const release = kind === 'gut' ? gut() : kind === 'copy' ? night.best : Math.max(1, top - (kind === 'undercut' ? 1 : 2) * P.step);
          const pay = ropePoints(100, release, snap, P);
          earned[kind][0] += pay;
          earned[kind][1] += 1;
          fixed.forEach((r, i) => (fixedPay[i] += ropePoints(100, r, snap, P)));
          today.push(ropeRecord(release, snap, P));
        }
        field = today.slice(-500);
        fixedPay.forEach((v, i) => (runFixed[i] += v));
        nights.push({ snap: snapPoint(field, P), best: fixed[fixedPay.indexOf(Math.max(...fixedPay))] });
      }
      const label = `${run.snapRule === 'load' ? `load cap ${run.capacity} ceil ${run.ceilingShare}` : 'medianPlus'} seed ${seed}`;
      if (seed === 99) {
        log(`A3. ${label.padEnd(30)} night snaps ${nights.slice(1).map((n) => 'x' + n.snap).join(' ')}`);
        log(`A3. ${''.padEnd(30)} best fixed  ${nights.slice(1).map((n) => 'x' + n.best).join(' ')}`);
      }
      log(`A3. ${label.padEnd(30)} earned per 100: ${Object.entries(earned).map(([k, [s, n]]) => `${k} ${n ? Math.round(s / n) : '-'}`).join(', ')} | always ${fixed.map((r, i) => `x${r} ${Math.round(runFixed[i] / 56000)}`).join(', ')} | ceiling set the snap for ${Math.round((100 * byCeiling) / faced)}%`);
    }
  });
});

describe('probe A4: his rope (R-16, let go where fewest let go), 28 days', () => {
  it('runs', () => {
    // 2,000 players a day; gut players round x2.2 (sd 0.6) on the ladder. Learners rise to 70%:
    // half "copy" (last night's emptiest rung, a tie at random), half "spread" (one of last
    // night's five emptiest, at random). Reported over 3 seeds: what each kind earned per 100
    // points, and what always letting go at a fixed rung earned. Waiting longer costs nothing here;
    // in play, holding to x10 takes time. A model, not a measurement.
    const P = { ...rules().rope, snapRule: 'rarest' as const };
    const ladder = ropeLadder(P);
    const onLadder = (x: number) => ladder.reduce((b, r) => (Math.abs(r - x) < Math.abs(b - x) ? r : b), 1);
    const fixed = [1, 1.5, 2, 2.5, 3, 4, 5, 7, 10];
    for (const seed of [11, 12, 13]) {
      const rng = mulberry32(seed);
      const gut = () => onLadder(Math.max(1.1, 2.2 + 0.6 * dgauss(rng)));
      let field: number[] = Array.from({ length: 500 }, gut);
      const earned: Record<string, [number, number]> = { gut: [0, 0], copy: [0, 0], spread: [0, 0] };
      const always = fixed.map(() => 0);
      const tops: number[] = [];
      for (let day = 1; day <= 28; day++) {
        const learn = Math.min(0.7, (0.7 * (day - 1)) / 13);
        const night = ladder.map((r) => ropeRarity(r, field, P) + rng() * 1e-3); // tie-break at random
        const order = ladder.map((r, i) => [r, night[i]] as const).sort((a, b) => b[1] - a[1]).map(([r]) => r);
        tops.push(order[0]);
        const today: number[] = [];
        for (let k = 0; k < 2000; k++) {
          const f = values(rollingField(today, field, 500));
          const kind = rng() >= learn ? 'gut' : rng() < 0.5 ? 'copy' : 'spread';
          const release = kind === 'gut' ? gut() : kind === 'copy' ? order[0] : order[Math.floor(rng() * 5)];
          earned[kind][0] += ropeRarestPoints(100, release, f, P);
          earned[kind][1] += 1;
          fixed.forEach((r, i) => (always[i] += ropeRarestPoints(100, r, f, P)));
          today.push(release);
        }
        field = today.slice(-500);
      }
      log(`A4. seed ${seed}: earned per 100: ${Object.entries(earned).map(([k, [s, n]]) => `${k} ${n ? Math.round(s / n) : '-'}`).join(', ')} | always ${fixed.map((r, i) => `x${r} ${Math.round(always[i] / 56000)}`).join(', ')}`);
      if (seed === 11) log(`A4. seed 11: last night's emptiest rung, day by day: ${tops.map((t) => 'x' + t).join(' ')}`);
    }
  });
});

// Count's players as G-02 makes them: a lean shared by the whole card, then each player's noise,
// smaller with skill (crowd.ts). On a trap day a player is pulled low by strength x pull, unless
// they see through it (chance skill01 x seeThrough).
function countWorld(rng: Rng, truth: number) {
  const C = config.crowd.count;
  const lean = C.biasMean + C.biasSd * dgauss(rng);
  return (trap: boolean, strength: number, pull: number, seeThrough: number) => {
    const e = dgauss(rng); // skill, as G-02's skillOf: a standard normal
    const skill01 = Math.min(1, Math.max(0, 0.5 + e / 4));
    const fooled = trap && rng() > skill01 * seeThrough;
    const noise = C.sd * dexp(-C.skillEffect * e) * dgauss(rng);
    return { e, guess: Math.max(0, Math.round(truth * (1 + lean + noise - (fooled ? strength * pull : 0)))) };
  };
}

describe('probe B: meeting the crowd (Count), three scoring rules', () => {
  it('runs', () => {
    // 365 cards, traps from the Z1 schedule, pull 0.25, see-through 0.5, truth 20, field 500.
    // SYM = Read 3's wording (keep and switch +1/-1). ONE = keep +1/-1, switch 0. B4 = keep
    // +2/-1, switch 0 (the default after K05, R-7). Averages are per meeting, agreements (0) included.
    const SYM = { keepCloser: 1, keepFurther: -1, switchCloser: 1, switchFurther: -1, four: 4 };
    const ONE = { keepCloser: 1, keepFurther: -1, switchCloser: 0, switchFurther: 0, four: 4 };
    const B4 = { keepCloser: 2, keepFurther: -1, switchCloser: 0, switchFurther: 0, four: 4 };
    const rng = mulberry32(7);
    const acc: Record<string, number> = {};
    const n: Record<string, number> = {};
    const add = (k: string, v: number) => {
      acc[k] = (acc[k] ?? 0) + v;
      n[k] = (n[k] ?? 0) + 1;
    };
    for (let card = 1; card <= 365; card++) {
      const t = trapFor(card, 'count');
      const make = countWorld(rng, 20);
      const peak = countPeak(Array.from({ length: 500 }, () => make(t.trap, t.strength, 0.25, 0.5).guess)) as number;
      const day = t.trap ? 'trap ' : 'plain';
      for (let j = 0; j < 200; j++) {
        const { e, guess } = make(t.trap, t.strength, 0.25, 0.5);
        const band = e < -0.43 ? 'low ' : e < 0.43 ? 'mid ' : 'high';
        add(`${day} SYM switch`, meetHunch(guess, peak, 'switch', 20, numberDistance, SYM));
        add(`${day} SYM keep  `, meetHunch(guess, peak, 'keep', 20, numberDistance, SYM));
        add(`${day} ONE keep ${band}`, meetHunch(guess, peak, 'keep', 20, numberDistance, ONE));
        add(`${day} B4  keep ${band}`, meetHunch(guess, peak, 'keep', 20, numberDistance, B4));
      }
    }
    for (const k of Object.keys(acc).sort()) log(`B. ${k}: ${f3(acc[k] / n[k])}${k.includes('keep') && !k.includes('SYM') ? '  (switch scores 0)' : ''}`);
  });
});

describe('probe B2: with the symmetric rule, could any trap setting stop "always switch"?', () => {
  it('runs', () => {
    const SYM = { keepCloser: 1, keepFurther: -1, switchCloser: 1, switchFurther: -1, four: 4 };
    for (const share of [0.3, 0.7]) {
      for (const pull of [0.25, 0.5]) {
        const rng = mulberry32(13);
        let s = 0;
        let m = 0;
        for (let card = 0; card < 200; card++) {
          const trap = rng() < share;
          const strength = 0.4 + 0.6 * rng();
          const make = countWorld(rng, 20);
          const peak = countPeak(Array.from({ length: 500 }, () => make(trap, strength, pull, 0.5).guess)) as number;
          for (let j = 0; j < 150; j++) {
            s += meetHunch(make(trap, strength, pull, 0.5).guess, peak, 'switch', 20, numberDistance, SYM);
            m++;
          }
        }
        log(`B2. trap share ${share}, pull ${pull}: always-switch ${f3(s / m)} per meeting (always-keep is its negative)`);
      }
    }
  });
});

describe('probe C: Stop, what each aim pays', () => {
  it('runs', () => {
    // Notch 7% of the track, half-width 3.5. A stop lands at the aim plus noise sd 2.5. Plain
    // players aim at the centre; seekers aim at the highest-priced of 15 aims across the notch
    // (ties broken at random). 1,500 players, 5 seeds. Reported: the average points a fresh
    // player gets aiming at the centre, at +-1.75, and at +-3 (a miss pays 0), against the last
    // 500 players' field.
    const half = 3.5;
    const aims = Array.from({ length: 15 }, (_, i) => -half + (2 * half * (i + 0.5)) / 15);
    for (const seekers of [0, 0.3, 0.6]) {
      const pay: Record<string, number> = { centre: 0, mid: 0, edge: 0 };
      let trials = 0;
      for (let seed = 1; seed <= 5; seed++) {
        const rng = mulberry32(100 + seed);
        const today: number[] = [];
        const price = (x: number) => stopPrice(x, half, today.slice(-500));
        for (let k = 0; k < 1500; k++) {
          let aim = 0;
          if (rng() < seekers && today.length > 0) {
            const ps = aims.map(price);
            const top = Math.max(...ps);
            const best = aims.filter((_, i) => ps[i] === top);
            aim = best[Math.min(best.length - 1, Math.floor(rng() * best.length))];
          }
          today.push(aim + 2.5 * dgauss(rng));
        }
        for (let t = 0; t < 400; t++) {
          const side = rng() < 0.5 ? -1 : 1;
          pay.centre += price(2.5 * dgauss(rng));
          pay.mid += price(side * 1.75 + 2.5 * dgauss(rng));
          pay.edge += price(side * 3 + 2.5 * dgauss(rng));
          trials++;
        }
      }
      log(`C. seekers ${String(Math.round(seekers * 100)).padStart(2)}%: average points aiming at centre ${(pay.centre / trials).toFixed(2)}, +-1.75 ${(pay.mid / trials).toFixed(2)}, +-3 ${(pay.edge / trials).toFixed(2)}`);
    }
  });
});

describe('probe D: the 12% notch (R-14) with an adapting crowd', () => {
  it('runs', () => {
    // As C (price-seekers see the strip and aim at its best-priced spot; the rest aim at the
    // centre; stop noise sd 2.5), at notch half-widths 3.5 (today's Monday) and 6 (12%). Reported:
    // what a fresh player gets aiming at the centre, halfway out, and at 85% of the half-width.
    for (const half of [3.5, 6]) {
      const aims = Array.from({ length: 15 }, (_, i) => -half + (2 * half * (i + 0.5)) / 15);
      for (const seekers of [0, 0.3, 0.6]) {
        const pay = { centre: 0, mid: 0, edge: 0 };
        let trials = 0;
        for (let seed = 1; seed <= 5; seed++) {
          const rng = mulberry32(400 + seed);
          const today: number[] = [];
          const price = (x: number) => stopPrice(x, half, today.slice(-500));
          for (let k = 0; k < 1500; k++) {
            let aim = 0;
            if (rng() < seekers && today.length > 0) {
              const ps = aims.map(price);
              const top = Math.max(...ps);
              const best = aims.filter((_, i) => ps[i] === top);
              aim = best[Math.min(best.length - 1, Math.floor(rng() * best.length))];
            }
            today.push(aim + 2.5 * dgauss(rng));
          }
          for (let t = 0; t < 400; t++) {
            const side = rng() < 0.5 ? -1 : 1;
            pay.centre += price(2.5 * dgauss(rng));
            pay.mid += price(side * 0.5 * half + 2.5 * dgauss(rng));
            pay.edge += price(side * 0.85 * half + 2.5 * dgauss(rng));
            trials++;
          }
        }
        log(`D. notch ${2 * half}% of track, seekers ${String(seekers * 100).padStart(2)}%: centre ${(pay.centre / trials).toFixed(2)}, halfway out ${(pay.mid / trials).toFixed(2)}, near the edge ${(pay.edge / trials).toFixed(2)}`);
      }
    }
  });
});

describe('probe E: his open Stop (R-15), the field hidden, 14 days', () => {
  it('runs', () => {
    // No notch. 2,000 players a day. Habit players aim from a made-up mix (below); learners
    // (rising to 70%) aim at the thinnest of 21 spots in last night's field (a tie at random).
    // A stop lands at the aim plus noise that grows with the marker's speed there: fastest in
    // the middle (ease 0.5: x1.25), slowest at the ends (x0.5); sd 2% of the track at x1.
    // Reported on days 1, 7 and 14: the best fixed aim and what it paid, a random aim, the
    // learners and the habit players. Run under two habit mixes, since real habits are unknown.
    const mixes: Record<string, { share: number; mean: number; sd: number }[]> = {
      'centre-heavy': [
        { share: 0.4, mean: 50, sd: 8 },
        { share: 0.15, mean: 6, sd: 3 },
        { share: 0.15, mean: 94, sd: 3 },
        { share: 0.3, mean: 50, sd: 30 },
      ],
      spread: [
        { share: 0.2, mean: 50, sd: 8 },
        { share: 0.2, mean: 25, sd: 6 },
        { share: 0.2, mean: 75, sd: 6 },
        { share: 0.4, mean: 50, sd: 30 },
      ],
    };
    const spots = Array.from({ length: 21 }, (_, i) => i / 20);
    const reflect = (x: number) => (x < 0 ? -x : x > 1 ? 2 - x : x);
    const land = (rng: Rng, aim: number) => {
      const speed = 0.5 + 6 * 0.5 * aim * (1 - aim);
      return Math.min(1, Math.max(0, reflect(aim + 0.02 * speed * dgauss(rng))));
    };
    for (const [name, mix] of Object.entries(mixes)) {
      const rng = mulberry32(77);
      const habit = () => {
        let r = rng();
        for (const m of mix) {
          if (r < m.share) return Math.min(1, Math.max(0, (m.mean + m.sd * dgauss(rng)) / 100));
          r -= m.share;
        }
        return 0.5;
      };
      let field = Array.from({ length: 500 }, () => land(rng, habit()));
      const rows: string[] = [];
      for (let day = 1; day <= 14; day++) {
        const learn = (0.7 * (day - 1)) / 13;
        const night = spots.map((s) => openStopPrice(s, field));
        const top = Math.max(...night);
        const thin = spots.filter((_, i) => night[i] === top);
        const fixedPay = spots.map(() => 0);
        let rand = 0;
        const earned = { habit: [0, 0], learner: [0, 0] };
        const today: number[] = [];
        for (let k = 0; k < 2000; k++) {
          const f = values(rollingField(today, field, 500));
          const learner = rng() < learn;
          const pos = land(rng, learner ? thin[Math.floor(rng() * thin.length)] : habit());
          const pay = openStopPrice(pos, f);
          earned[learner ? 'learner' : 'habit'][0] += pay;
          earned[learner ? 'learner' : 'habit'][1] += 1;
          spots.forEach((s, i) => (fixedPay[i] += openStopPrice(land(rng, s), f)));
          rand += openStopPrice(land(rng, rng()), f);
          today.push(pos);
        }
        field = today.slice(-500);
        if (day === 1 || day === 7 || day === 14) {
          const b = fixedPay.indexOf(Math.max(...fixedPay));
          const avg = (e: number[]) => (e[1] ? (e[0] / e[1]).toFixed(2) : '-');
          rows.push(`day ${day}: best aim ${Math.round(spots[b] * 100)}% pays ${(fixedPay[b] / 2000).toFixed(2)}, random ${(rand / 2000).toFixed(2)}, learners ${avg(earned.learner)}, habit ${avg(earned.habit)}`);
        }
      }
      log(`E. ${name.padEnd(12)} | ${rows.join(' | ')}`);
    }
  });
});

describe('probe C2: what would make the edge worth aiming at?', () => {
  it('runs', () => {
    // As C with no seekers (everyone aims at the centre), over 5 seeds: the average points for a
    // fresh player aiming at the centre vs at +-3, for a top price of 5, 8 and 10 and a player's
    // noise of sd 1.5 (sharp), 2.5 (steady).
    const half = 3.5;
    const base = rules().stopPrice;
    for (const maxPrice of [5, 8, 10]) {
      for (const sd of [1.5, 2.5]) {
        const P = { ...base, maxPrice };
        let c = 0;
        let e = 0;
        let t = 0;
        for (let seed = 1; seed <= 5; seed++) {
          const rng = mulberry32(200 + seed);
          const field = Array.from({ length: 500 }, () => 2.5 * dgauss(rng));
          for (let k = 0; k < 400; k++) {
            c += stopPrice(sd * dgauss(rng), half, field, P);
            e += stopPrice((rng() < 0.5 ? -3 : 3) + sd * dgauss(rng), half, field, P);
            t++;
          }
        }
        log(`C2. top price ${String(maxPrice).padStart(2)}, player sd ${sd}: centre ${(c / t).toFixed(2)}, edge ${(e / t).toFixed(2)}`);
      }
    }
  });
});

describe('probe C3: a wider notch for Dare\'s Stop', () => {
  it('runs', () => {
    // As C2, field and player noise sd 2.5, aiming at the centre or at 85% of the half-width.
    const base = rules().stopPrice;
    for (const half of [3.5, 6, 8]) {
      for (const maxPrice of [5, 8]) {
        const P = { ...base, maxPrice };
        let c = 0;
        let e = 0;
        let t = 0;
        for (let seed = 1; seed <= 5; seed++) {
          const rng = mulberry32(300 + seed);
          const field = Array.from({ length: 500 }, () => 2.5 * dgauss(rng));
          for (let k = 0; k < 400; k++) {
            c += stopPrice(2.5 * dgauss(rng), half, field, P);
            e += stopPrice((rng() < 0.5 ? -1 : 1) * 0.85 * half + 2.5 * dgauss(rng), half, field, P);
            t++;
          }
        }
        log(`C3. notch half-width ${half} (${2 * half}% of track), top price ${maxPrice}: centre ${(c / t).toFixed(2)}, near the edge ${(e / t).toFixed(2)}`);
      }
    }
  });
});
