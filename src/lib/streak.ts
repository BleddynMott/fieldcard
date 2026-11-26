// The streak (spec, Return mechanic): days a card was finished. One repair a week: a missed day is
// filled in by finishing the next card. After a miss with no repair: "23 days played · best streak
// 11", never a zero.
import { config } from './config';
import { dayOfCard, weekday } from './card';

export interface StreakLine {
  current: number; // 0 when the run is broken
  best: number;
  played: number;
}

/** Monday-based week number of a card, for the one-repair-a-week rule. */
function weekOf(card: number): number {
  const w = weekday(dayOfCard(card)); // 0 Sunday
  const mondayCard = card - ((w + 6) % 7);
  return Math.floor((mondayCard + 7 * 1000) / 7);
}

/** Streak up to and including `today`, from the set of finished card numbers. */
export function streak(finished: Set<number>, today: number): StreakLine {
  const repairs = config.streak.repairsPerWeek;
  const played = [...finished].filter((n) => n <= today).length;
  // walk forward from card 1, so best and current use the same rule
  let run = 0;
  let best = 0;
  const used = new Map<number, number>();
  for (let n = 1; n <= today; n++) {
    if (finished.has(n)) {
      run += 1;
    } else if (n < today && finished.has(n + 1) && run > 0 && (used.get(weekOf(n)) ?? 0) < repairs) {
      used.set(weekOf(n), (used.get(weekOf(n)) ?? 0) + 1);
      run += 1; // repaired: counts as a day in the run
    } else if (n < today) {
      run = 0;
    }
    best = Math.max(best, run);
  }
  return { current: finished.has(today) ? run : 0, best, played };
}

export function streakText(s: StreakLine): string {
  if (s.current > 0) return `Day ${s.current} in a row · best ${s.best}`;
  return `${s.played} days played · best streak ${s.best}`;
}
