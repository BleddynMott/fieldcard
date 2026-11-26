// Deterministic maths for everything seeded (review finding 8). Math.exp, Math.log, Math.cos and
// ** are not required to give the same last bit in every browser engine, so a crowd built on an
// iPhone (JavaScriptCore) could round differently from one built on Android (V8) and flip a door
// share. These use only + - * / and comparisons, which IEEE 754 rounds the same everywhere.
import type { Rng } from './rng';

const LN2 = 0.6931471805599453;

/** b to a whole power n, by repeated multiplication. */
export function powInt(b: number, n: number): number {
  let out = 1;
  for (let i = 0; i < Math.abs(n); i++) out *= b;
  return n < 0 ? 1 / out : out;
}

/** e^x: range-reduced by ln 2, then a Taylor series. Accurate to about 1e-15 relative. */
export function dexp(x: number): number {
  const k = Math.round(x / LN2);
  const r = x - k * LN2;
  let term = 1;
  let sum = 1;
  for (let i = 1; i < 25; i++) {
    term = (term * r) / i;
    sum += term;
  }
  return sum * powInt(2, k);
}

/** A standard normal draw, approximated as the sum of 12 uniforms minus 6 (bounded to +-6). */
export function dgauss(rng: Rng): number {
  let s = 0;
  for (let i = 0; i < 12; i++) s += rng();
  return s - 6;
}
