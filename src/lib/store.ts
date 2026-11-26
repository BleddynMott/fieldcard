// One attempt a day, held on the device (G-02 R6). A step's result is written once and never
// replaced, so a reload resumes at the next unplayed step and a played step cannot be replayed.
// G-03 adds the server's hold.

export interface KeyValue {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface Attempt {
  card: number;
  steps: Record<string, unknown>;
  finished: boolean;
}

const PREFIX = 'fieldcard:card:';

export class AttemptStore {
  constructor(
    private readonly kv: KeyValue,
    private readonly lookBack = 366,
  ) {}

  load(card: number): Attempt {
    const text = this.kv.getItem(PREFIX + card);
    if (text) {
      try {
        const a = JSON.parse(text) as Attempt;
        if (a && a.card === card && a.steps && typeof a.steps === 'object') return a;
      } catch {
        /* falls through */
      }
      // unreadable or not this card's record: treated as played, never as a fresh attempt
      return { card, steps: {}, finished: true };
    }
    return { card, steps: {}, finished: false };
  }

  /** Records a step's result. Returns false, and changes nothing, if the step was already played. */
  record(card: number, step: string, result: unknown): boolean {
    const a = this.load(card);
    if (a.finished || step in a.steps) return false;
    a.steps[step] = result;
    this.kv.setItem(PREFIX + card, JSON.stringify(a));
    return true;
  }

  /** Marks the card finished. Returns false if it already was. */
  finish(card: number): boolean {
    const a = this.load(card);
    if (a.finished) return false;
    a.finished = true;
    this.kv.setItem(PREFIX + card, JSON.stringify(a));
    return true;
  }

  played(card: number, step: string): boolean {
    const a = this.load(card);
    return a.finished || step in a.steps;
  }

  /** True once any card before this one has been played on this device. */
  playedBefore(card: number): boolean {
    for (let n = card - 1; n >= Math.max(1, card - this.lookBack); n--) {
      if (this.kv.getItem(PREFIX + n) !== null) return true;
    }
    return false;
  }

  /** Preview builds only (VITE_PREVIEW): lets him play today's card again while it is reviewed. */
  clear(card: number): void {
    this.kv.removeItem(PREFIX + card);
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

/** The device store, or memory when storage is blocked (private browsing). */
export function deviceStore(): AttemptStore {
  try {
    const probe = 'fieldcard:probe';
    localStorage.setItem(probe, '1');
    localStorage.removeItem(probe);
    return new AttemptStore(localStorage);
  } catch {
    return new AttemptStore(new MemoryKV());
  }
}
