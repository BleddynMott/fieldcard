// The share text (spec, Share artefact): plain text, no link, three lines, nothing about the card's
// contents. The team result joins the third line in G-04c.
import type { Scorecard } from './score';

const signed = (n: number) => (n >= 0 ? `+${n}` : `−${Math.abs(n)}`);

export function shareText(s: Scorecard): string {
  return [`Fieldcard #${s.card}`, `Hands ${s.hands} · Hunch ${s.hunch}`, `Flag ${s.flag}, finished ${s.place} · ${signed(s.flagPoints)}`].join('\n');
}

export { signed };
