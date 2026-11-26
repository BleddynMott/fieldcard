// Which screen comes next, given what is stored (R6, R11). Pure, so the harness can run it (round-2
// a2): App.svelte only carries out what this returns.
import { abandonedResult } from './abandon';
import { game } from './config';
import { EVENTS, type EventId } from './week';

export const STEPS = ['stop', 'count', 'repeat', 'pair', 'sort', 'spot', 'read', 'flag'] as const;
export type Step = (typeof STEPS)[number];

export interface NextMove {
  screen: Step | 'scorecard' | 'home';
  record: [string, unknown][]; // results to store first, in order
  notice: string;
}

export function nextMove(card: number, steps: Record<string, unknown>, finished: boolean): NextMove {
  if (finished) return { screen: 'scorecard' in steps ? 'scorecard' : 'home', record: [], notice: '' };
  const record: [string, unknown][] = [];
  const left: string[] = [];
  for (const s of STEPS) {
    if (s in steps) continue;
    if ((EVENTS as string[]).includes(s) && `${s}:started` in steps) {
      record.push([s, abandonedResult(s as EventId, card)]);
      left.push(game(s).name);
      continue;
    }
    return { screen: s, record, notice: noticeFor(left) };
  }
  return { screen: 'scorecard', record, notice: noticeFor(left) };
}

function noticeFor(left: string[]): string {
  if (left.length === 0) return '';
  return `You left ${left.join(' and ')} before it finished, so it counts as played.`;
}
