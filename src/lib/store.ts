// One attempt a day, held on the device (G-02 R6). A step's result is written once and never
// replaced, so a reload resumes at the next unplayed step and a played step cannot be replayed.
// Records are keyed by the launch date as well as the card number, so moving the launch date (R8)
// starts afresh (review 6). A failed write is kept in memory for the session (review 34).
// G-03 adds the server's hold.
import { config } from './config';

export interface KeyValue {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface Attempt {
  card: number;
  steps: Record<string, unknown>;
  finished: boolean;
  unreadable?: boolean; // the stored record could not be read; treated as played
}

export class AttemptStore {
  private readonly prefix: string;
  private readonly overlay = new Map<string, string>();
  /** False once a write has failed, or when the device would not store anything. */
  persistent: boolean;

  constructor(
    private readonly kv: KeyValue,
    persistent = true,
    private readonly lookBack = config.store.lookBackCards,
    launch = config.launch,
  ) {
    this.prefix = `fieldcard:${launch}:card:`;
    this.persistent = persistent;
  }

  private get(card: number): string | null {
    return this.overlay.get(this.prefix + card) ?? this.kv.getItem(this.prefix + card);
  }

  private put(card: number, a: Attempt): void {
    const text = JSON.stringify(a);
    try {
      this.kv.setItem(this.prefix + card, text);
      this.overlay.delete(this.prefix + card);
    } catch {
      this.overlay.set(this.prefix + card, text);
      this.persistent = false;
    }
  }

  load(card: number): Attempt {
    const text = this.get(card);
    if (text !== null) {
      try {
        const a = JSON.parse(text) as Attempt;
        if (a && a.card === card && a.steps && typeof a.steps === 'object') return a;
      } catch {
        /* falls through */
      }
      // unreadable or not this card's record: treated as played, never as a fresh attempt
      return { card, steps: {}, finished: true, unreadable: true };
    }
    return { card, steps: {}, finished: false };
  }

  /** Records a step's result. Returns false, and changes nothing, if the step was already played. */
  record(card: number, step: string, result: unknown): boolean {
    const a = this.load(card);
    if (a.finished || step in a.steps) return false;
    a.steps[step] = result;
    this.put(card, a);
    return true;
  }

  /** Marks the card finished. Returns false if it already was. */
  finish(card: number): boolean {
    const a = this.load(card);
    if (a.finished) return false;
    a.finished = true;
    this.put(card, a);
    return true;
  }

  played(card: number, step: string): boolean {
    const a = this.load(card);
    return a.finished || step in a.steps;
  }

  /** True once any card before this one has been played on this device. */
  playedBefore(card: number): boolean {
    for (let n = card - 1; n >= Math.max(1, card - this.lookBack); n--) if (this.get(n) !== null) return true;
    return false;
  }

  /** Card numbers finished on this device, up to `today`, for the streak. */
  finishedCards(today: number): Set<number> {
    const out = new Set<number>();
    for (let n = today; n >= Math.max(1, today - this.lookBack); n--) if (this.get(n) !== null && this.load(n).finished) out.add(n);
    return out;
  }

  /** Preview builds only (VITE_PREVIEW): lets him play today's card again while it is reviewed. */
  clear(card: number): void {
    this.overlay.delete(this.prefix + card);
    try {
      this.kv.removeItem(this.prefix + card);
    } catch {
      /* nothing stored */
    }
  }
}

export class MemoryKV implements KeyValue {
  private readonly map = new Map<string, string>();
  getItem(key: string): string | null {
    return this.map.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }
  removeItem(key: string): void {
    this.map.delete(key);
  }
}

/** The device store, or memory when storage is blocked (private browsing); then `persistent` is
 *  false and the home screen says the card will not be kept (review 35). */
export function deviceStore(): AttemptStore {
  try {
    const probe = 'fieldcard:probe';
    localStorage.setItem(probe, '1');
    localStorage.removeItem(probe);
    return new AttemptStore(localStorage);
  } catch {
    return new AttemptStore(new MemoryKV(), false);
  }
}
