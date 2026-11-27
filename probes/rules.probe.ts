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
import { ropePoints, ropeRecord, snapPoint, stopPrice } from '../src/lib/rules/dare';
import { rollingField, values } from '../src/lib/rules/field';
import { trapFor } from '../src/lib/rules/layers';
import { rules } from '../src/lib/rules/params';
import { countPeak, meetHunch, numberDistance } from '../src/lib/rules/read';

const log = (s: string) => process.stdout.write(s + '\n');
const f3 = (x: number) => (x >= 0 ? ' ' : '') + x.toFixed(3);

describe('probe A: the rope over 14 days, both record rules', () => {
  it('runs', () => {
    // 2,000 players a day. "Gut" players let go at a target round x2.2 (sd 0.6, at least x1.1).
    // "Learners" aim 2% to 15% below yesterday's final snap; they rise from 0% to 70% over 14
    // days. Releases sit on the ladder (step 0.5). Day 1's dawn field is 500 gut players.
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
          const release = onLadder(rng() < learn ? ySnap * (1 - (0.02 + 0.13 * rng())) : gut());
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
