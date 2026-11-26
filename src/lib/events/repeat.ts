// Repeat: a 3 by 3 grid lights a sequence; tap it back; it starts at 3 and grows by one to 9; it
// ends at the first wrong tap (spec, Rules 2.3). Raw result: the longest sequence repeated (0 if the
// first is missed), ties by time.
import { dayOfCard, weekdayStep } from '../card';
import { config, repeatParams, type RepeatParams } from '../config';
import { stream } from '../rng';
import { pickIndex } from '../stats';

export interface RepeatCard {
  step: number;
  sequence: number[]; // cell indexes, length maxLength; round k plays the first startLength + k
  flashMs: number;
}

export interface RepeatResult {
  longest: number;
  timeMs: number;
}

export function generateRepeat(card: number, p: RepeatParams = repeatParams()): RepeatCard {
  const rng = stream(config.seedName, card, 'repeat');
  const step = weekdayStep(dayOfCard(card));
  const cells = p.grid * p.grid;
  const sequence: number[] = [];
  while (sequence.length < p.maxLength) {
    const c = pickIndex(rng, cells);
    if (c !== sequence[sequence.length - 1]) sequence.push(c); // never the same square twice running
  }
  return { step, sequence, flashMs: p.flashMsMonday + p.flashMsStepPerDay * step };
}

/** The lengths played, in order: 3, 4, ... 9. */
export function roundLengths(p: RepeatParams = repeatParams()): number[] {
  return Array.from({ length: p.maxLength - p.startLength + 1 }, (_, i) => p.startLength + i);
}
