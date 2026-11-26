// An event left after Ready counts as played, with the worst result for that event (G-02 R11).
import { config } from './config';
import { countResult, generateCount } from './events/count';
import { pairResult } from './events/pair';
import { generateSort, sortResult } from './events/sort';
import { generateStop, stopResult } from './events/stop';
import type { EventResults } from './results';
import type { EventId } from './week';

export function abandonedResult<E extends EventId>(event: E, card: number): EventResults[E] {
  const A = config.abandoned;
  const r: EventResults = {
    stop: stopResult(generateStop(card).goes.map(() => A.stopOff)),
    count: countResult(0, generateCount(card).target),
    repeat: { longest: 0, timeMs: A.ms },
    pair: pairResult(A.ms, 0),
    sort: sortResult(generateSort(card).blobs.map((_, i, all) => all.length - 1 - i), A.ms),
  };
  return r[event];
}
