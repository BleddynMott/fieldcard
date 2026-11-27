// Typed access to config/games.json "rules" (G-02b). Every number the Dare and Read rules use is there.
import { config } from '../config';

export interface RulesParams {
  field: { size: number };
  stopPrice: { window: number; rareRatio: number; crowdedRatio: number; minPrice: number; maxPrice: number };
  dareStop: { mode: 'notch' | 'open'; notchWidth: number; openWindow: number };
  repeatBank: { maxPrice: number; decimals: number };
  double: { bankRight: number; doubleRight: number; doubleWrong: number };
  rope: {
    step: number;
    max: number;
    snapKeep: number;
    emptySnap: number;
    decimals: number;
    snapped: 'at' | 'above';
    snapRule: 'load' | 'median' | 'medianPlus';
    capacity: number;
    ceilingShare: number;
  };
  hideSeek: {
    spots: number;
    minGap: number;
    seekRadius: number;
    edge: number;
    placeTries: number;
    kinds: string[];
    habit: number[];
  };
  meet: { keepCloser: number; keepFurther: number; switchCloser: number; switchFurther: number; four: number };
  draw: { bins: number; minPoints: number };
  select: { recipes: SelectRecipe[]; spreadFactor: number; shiftBins: number; skew: number; noise: number; minSd: number; maxOverlap: number };
  adjust: { maxShift: number };
  find: { middle: number };
  traps: { share: number; strengthFrom: number; strengthTo: number; thirds: number; earlyAt: number };
  personality: { minChances: number; dare: [string, string]; read: [string, string] };
  sim: {
    rope: { mean: number; sd: number; min: number };
    longJump: { mean: number; sd: number; decimals: number };
    seekJitter: number;
    openStop: { sd: number; mix: { share: number; mean: number; sd: number }[] };
    drawing: { weightFrom: number; weightTo: number; noise: number };
  };
}

export type SelectRecipe = 'tidy' | 'spread' | 'shift' | 'skew';

export const rules = (): RulesParams => (config as unknown as { rules: RulesParams }).rules;

/** The switches and the numbers with limits are valid (K05 round 3, 19 and 25): a typo in a switch
 *  or a negative ceiling would otherwise run silently as something else. */
export function badChoices(r: RulesParams = rules()): string[] {
  const bad: string[] = [];
  if (!['load', 'median', 'medianPlus'].includes(r.rope.snapRule)) bad.push('rope.snapRule');
  if (!['at', 'above'].includes(r.rope.snapped)) bad.push('rope.snapped');
  if (!(r.rope.capacity > 0)) bad.push('rope.capacity');
  if (!(r.rope.ceilingShare >= 0 && r.rope.ceilingShare < 1)) bad.push('rope.ceilingShare');
  if (!['notch', 'open'].includes(r.dareStop.mode)) bad.push('dareStop.mode');
  if (!(r.dareStop.notchWidth > 0 && r.dareStop.notchWidth < 1)) bad.push('dareStop.notchWidth');
  if (!(r.dareStop.openWindow > 0 && r.dareStop.openWindow < 0.5)) bad.push('dareStop.openWindow');
  const shares = r.sim.openStop.mix.reduce((s, m) => s + m.share, 0);
  if (Math.abs(shares - 1) > 1e-9 || r.sim.openStop.mix.some((m) => !(m.share >= 0))) bad.push('sim.openStop.mix shares');
  return bad;
}

/** Every number in rules is finite (K05 23): a missing or mistyped key would otherwise run as NaN. */
export function badNumbers(node: unknown = rules(), path = 'rules'): string[] {
  if (typeof node === 'number') return Number.isFinite(node) ? [] : [path];
  if (node === null || node === undefined) return [path];
  if (Array.isArray(node)) return node.flatMap((x, i) => badNumbers(x, `${path}[${i}]`));
  if (typeof node === 'object') return Object.entries(node).flatMap(([k, v]) => badNumbers(v, `${path}.${k}`));
  return [];
}
