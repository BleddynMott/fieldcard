// What each event's result is, how results compare, and the number the reads look at.
import type { CountResult } from './events/count';
import type { PairResult } from './events/pair';
import type { RepeatResult } from './events/repeat';
import type { SortResult } from './events/sort';
import type { StopResult } from './events/stop';
import type { EventId } from './week';

export interface EventResults {
  stop: StopResult;
  count: CountResult;
  repeat: RepeatResult;
  pair: PairResult;
  sort: SortResult;
}

/** Below any real result: an event left after Ready (R11). */
const ABANDONED = Number.MAX_SAFE_INTEGER;

export const isAbandoned = (r: unknown): boolean => !!(r && typeof r === 'object' && (r as { abandoned?: boolean }).abandoned);

/** Rank key: lower is better, compared left to right (ties by time where the spec says so). */
export function rankKey<E extends EventId>(event: E, r: EventResults[E]): number[] {
  if (isAbandoned(r)) return [ABANDONED];
  switch (event) {
    case 'stop':
      return [(r as StopResult).mean];
    case 'count':
      return [(r as CountResult).errorPct];
    case 'repeat':
      return [-(r as RepeatResult).longest, (r as RepeatResult).timeMs];
    case 'pair':
      return [(r as PairResult).ms];
    case 'sort':
      return [(r as SortResult).pairsOut, (r as SortResult).timeMs];
  }
  throw new Error(`unknown event ${event}`);
}

/** The number the doors and the boxes sort a result by (config doors/boxes "metric"). */
export function metricOf<E extends EventId>(event: E, r: EventResults[E]): number {
  switch (event) {
    case 'stop':
      return (r as StopResult).signedMean;
    case 'count':
      return (r as CountResult).signedError;
    case 'repeat':
      return (r as RepeatResult).longest;
    case 'pair':
      return (r as PairResult).seconds;
    case 'sort':
      return (r as SortResult).pairsOut;
  }
  throw new Error(`unknown event ${event}`);
}
