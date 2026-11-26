// The weekday tables (spec, Spot it and Read of the day). Index 0 is Sunday.
import { dayOfCard, weekday } from './card';
import { config } from './config';

export type EventId = 'stop' | 'count' | 'repeat' | 'pair' | 'sort';
export type ReadForm = 'pick' | 'fix' | 'pour' | 'find';

export const EVENTS: EventId[] = ['stop', 'count', 'repeat', 'pair', 'sort'];

interface Week {
  doors: EventId[];
  read: { form: ReadForm; event: EventId }[];
  readNames: Record<ReadForm, string>;
  readShort: Record<ReadForm, string>;
}

export const week = (config as unknown as { week: Week }).week;

export function doorsEvent(card: number): EventId {
  return week.doors[weekday(dayOfCard(card))];
}

/** The day's read as the table sets it; G-02 plays every form as Pour the sand (R4). */
export function readOfDay(card: number): { form: ReadForm; event: EventId; played: ReadForm } {
  const r = week.read[weekday(dayOfCard(card))];
  return { ...r, played: 'pour' };
}
