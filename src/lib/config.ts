import raw from '../../config/games.json';

export interface StopParams {
  goes: number;
  notchFrom: number;
  notchTo: number;
  notchApartMin: number;
  sweepMsMonday: number;
  sweepMsStepPerDay: number;
  sweepMsJitter: number;
  goSpeedUp: number;
  turnSpeedUp: number;
  sweepMsFloor: number;
  easeFrom: number;
  easeTo: number;
  pauseBetweenGoesMs: number;
  resultDecimals: number;
}

export interface CountParams {
  showMs: number;
  crossMsMonday: number;
  crossMsStepPerDay: number;
  totalMonday: number;
  totalStepPerDay: number;
  targetShareFrom: number;
  targetShareTo: number;
  targetMin: number;
  targetMax: number;
  lanes: number;
  guessMax: number;
  colourIntroMs: number;
  holdRepeatMs: number;
  holdDelayMs: number;
}

export interface RepeatParams {
  grid: number;
  startLength: number;
  maxLength: number;
  flashMsMonday: number;
  flashMsStepPerDay: number;
  gapMs: number;
  pauseBeforeMs: number;
  betweenRoundsMs: number;
}

export interface PairParams {
  shapes: number;
  forms: number;
  styles: number;
  nearShareMonday: number;
  nearShareStepPerDay: number;
  wrongPenaltyMs: number;
  columns: number;
}

export interface SortParams {
  blobs: number;
  gapMonday: number;
  gapStepPerDay: number;
  gapMin: number;
  wobbleFrom: number;
  wobbleTo: number;
  lobesFrom: number;
  lobesTo: number;
  areaLargest: number;
}

export interface GameEntry {
  id: string;
  name: string;
  mark: string;
  colour: string;
  how: string;
  params: unknown;
}

export const config = raw;
const games = raw.games as GameEntry[];

export function game(id: string): GameEntry {
  const found = games.find((g) => g.id === id);
  if (!found) throw new Error(`config/games.json has no game "${id}"`);
  return found;
}

export const allGames = (): GameEntry[] => games;
export const stopParams = () => game('stop').params as StopParams;
export const countParams = () => game('count').params as CountParams;
export const repeatParams = () => game('repeat').params as RepeatParams;
export const pairParams = () => game('pair').params as PairParams;
export const sortParams = () => game('sort').params as SortParams;
