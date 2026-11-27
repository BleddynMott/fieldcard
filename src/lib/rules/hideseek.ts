// Hide and Seek (G-00c V3; G-00d Q5). One playground a day; Hide is played first and both reveals
// stay sealed until both are played (the screens' job). In Dare the scores are points, in Read Hunch.
import { config } from '../config';
import { stream, type Rng } from '../rng';
import { rules } from './params';

export interface Spot {
  id: number;
  kind: number; // index into config rules.hideSeek.kinds
  x: number; // 0..1 across the playground
  y: number; // 0..1 down it
}

export interface Point {
  x: number;
  y: number;
}

const dist = (a: Point, b: Point) => Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y));

/** Today's playground: `spots` spots of different kinds, kept `minGap` apart, new every card. */
export function generatePlayground(card: number, p = rules().hideSeek): Spot[] {
  if (p.spots > p.kinds.length) throw new Error('hideSeek: more spots than kinds');
  const rng = stream(config.seedName, card, 'playground');
  const kinds = order(rng, p.kinds.length).slice(0, p.spots);
  const spots: Spot[] = [];
  for (const kind of kinds) {
    let placed: Spot | null = null;
    for (let t = 0; t < p.placeTries && !placed; t++) {
      const c = { x: p.edge + rng() * (1 - 2 * p.edge), y: p.edge + rng() * (1 - 2 * p.edge) };
      if (spots.every((s) => dist(s, c) >= p.minGap)) placed = { id: spots.length, kind, ...c };
    }
    if (!placed) throw new Error(`hideSeek: could not place ${p.spots} spots ${p.minGap} apart on card ${card}`);
    spots.push(placed);
  }
  return spots;
}

function order(rng: Rng, n: number): number[] {
  const a = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.min(i, Math.floor(rng() * (i + 1)));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Hide: share of the field's seeks that would NOT have found your spot, 0 to 100. */
export function hideScore(spot: Point, fieldSeeks: Point[], p = rules().hideSeek): number {
  if (fieldSeeks.length === 0) return 50;
  const missed = fieldSeeks.filter((s) => dist(s, spot) > p.seekRadius).length;
  return (missed / fieldSeeks.length) * 100;
}

/** Seek: share of the field's hiders within seekRadius of your tap, 0 to 100. */
export function seekScore(tap: Point, fieldHides: Point[], p = rules().hideSeek): number {
  if (fieldHides.length === 0) return 50;
  const found = fieldHides.filter((h) => dist(h, tap) <= p.seekRadius).length;
  return (found / fieldHides.length) * 100;
}

/** The spots that lie within seekRadius of a tap: what the reveal rings. */
export function spotsFound(tap: Point, spots: Spot[], p = rules().hideSeek): number[] {
  return spots.filter((s) => dist(s, tap) <= p.seekRadius).map((s) => s.id);
}
