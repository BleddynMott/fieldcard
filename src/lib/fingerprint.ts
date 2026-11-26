// A fingerprint of everything seeded for a run of cards: the five events and the simulated crowd.
// The harness pins it, so any change to what players get is deliberate; run in a browser engine it
// shows whether iPhones and Android phones build the same cards (review 8).
import { crowdFor } from './crowd';
import { generateCount } from './events/count';
import { generatePair } from './events/pair';
import { generateRepeat } from './events/repeat';
import { generateSort } from './events/sort';
import { generateStop } from './events/stop';
import { hash32 } from './rng';

export function fingerprint(from: number, to: number): string {
  let h = '';
  for (let n = from; n <= to; n++) {
    const c = crowdFor(n);
    const text = JSON.stringify([
      generateStop(n),
      generateCount(n),
      generateRepeat(n),
      generatePair(n),
      generateSort(n),
      c.doorShares,
      c.boxShares,
      c.players.map((p) => [p.hands, p.place, p.flag, p.hunchRaw, p.results.stop.mean, p.results.pair.ms]),
    ]);
    h = hash32(h + text).toString(16);
  }
  return h;
}
