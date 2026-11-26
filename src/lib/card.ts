// The card for a date. Card #1 is the launch day; the card number is days since launch plus one,
// counted on the player's local calendar date (spec, Daily loop). Everything else follows from it.
import { config } from './config';

export interface Day {
  y: number;
  m: number; // 1 to 12
  d: number;
}

const MS_PER_DAY = 86_400_000;
export const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function parseDay(iso: string): Day {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) throw new Error(`not a YYYY-MM-DD date: ${iso}`);
  return { y: Number(m[1]), m: Number(m[2]), d: Number(m[3]) };
}

/** The player's local calendar date for an instant. */
export function localDay(at: Date): Day {
  return { y: at.getFullYear(), m: at.getMonth() + 1, d: at.getDate() };
}

function dayIndex(day: Day): number {
  return Math.round(Date.UTC(day.y, day.m - 1, day.d) / MS_PER_DAY);
}

function dayFromIndex(index: number): Day {
  const at = new Date(index * MS_PER_DAY);
  return { y: at.getUTCFullYear(), m: at.getUTCMonth() + 1, d: at.getUTCDate() };
}

/** Card number for a local date, or null before launch. */
export function cardNumber(day: Day, launch: Day = parseDay(config.launch)): number | null {
  const n = dayIndex(day) - dayIndex(launch) + 1;
  return n >= 1 ? n : null;
}

export function dayOfCard(card: number, launch: Day = parseDay(config.launch)): Day {
  return dayFromIndex(dayIndex(launch) + card - 1);
}

/** 0 = Sunday ... 6 = Saturday. */
export function weekday(day: Day): number {
  return new Date(Date.UTC(day.y, day.m - 1, day.d)).getUTCDay();
}

/** Difficulty step: Monday 0, one harder each day, Sunday 6 (spec, Difficulty model). */
export function weekdayStep(day: Day): number {
  return (weekday(day) + 6) % 7;
}

/** "Wed 25 Nov", as on the sign board. */
export function boardDate(day: Day): string {
  return `${WEEKDAYS[weekday(day)]} ${day.d} ${MONTHS[day.m - 1]}`;
}
