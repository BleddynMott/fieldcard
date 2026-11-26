import raw from '../../config/games.json';

export interface StopParams {
  goes: number;
  notchFrom: number;
  notchTo: number;
  notchApartMin: number;
  sweepMsMonday: number;
  sweepMsStepPerDay: number;
  sweepMsJitter: number;
  pauseBetweenGoesMs: number;
  resultDecimals: number;
}

export interface GameEntry {
  id: string;
  name: string;
  mark: string;
  colour: string;
  how?: string;
  params?: unknown;
}

export interface Config {
  launch: string;
  seedName: string;
  weekdaySteps: number;
  games: GameEntry[];
}

export const config = raw as Config;

export function game(id: string): GameEntry {
  const found = config.games.find((g) => g.id === id);
  if (!found) throw new Error(`config/games.json has no game "${id}"`);
  return found;
}

export function stopParams(): StopParams {
  return game('stop').params as StopParams;
}
