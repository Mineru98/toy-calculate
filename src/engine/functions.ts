export type AngleMode = 'DEG' | 'RAD';

export type FunctionName =
  | 'sin'
  | 'cos'
  | 'tan'
  | 'asin'
  | 'acos'
  | 'atan'
  | 'log'
  | 'ln'
  | 'sqrt'
  | 'abs';

export const CONSTANTS: Readonly<Record<string, number>> = { pi: Math.PI, π: Math.PI, e: Math.E };

const DEG_PER_RAD = 180 / Math.PI;

/**
 * Floating-point cleanup for trigonometric results: values within 1e-12 of zero become 0, others are
 * rounded to 15 significant digits. So DEG `sin(180)` is 0, DEG `cos(60)` is 0.5, DEG `asin(0.5)` is 30.
 */
function cleanTrig(value: number): number {
  return Math.abs(value) < 1e-12 ? 0 : Number(value.toPrecision(15));
}

/** Returns the result, or `null` when the input is outside the function's domain. */
type Impl = (x: number, mode: AngleMode) => number | null;

const toRad = (x: number, mode: AngleMode): number => (mode === 'DEG' ? x / DEG_PER_RAD : x);
const fromRad = (x: number, mode: AngleMode): number => (mode === 'DEG' ? x * DEG_PER_RAD : x);

const IMPLS: Record<FunctionName, Impl> = {
  sin: (x, mode) => cleanTrig(Math.sin(toRad(x, mode))),
  cos: (x, mode) => cleanTrig(Math.cos(toRad(x, mode))),
  tan: (x, mode) => {
    const rad = toRad(x, mode);
    // tan is undefined where cos is 0 (DEG 90, RAD π/2, ...); cleanTrig absorbs rounding near those points.
    return cleanTrig(Math.cos(rad)) === 0 ? null : cleanTrig(Math.tan(rad));
  },
  asin: (x, mode) => (Math.abs(x) > 1 ? null : cleanTrig(fromRad(Math.asin(x), mode))),
  acos: (x, mode) => (Math.abs(x) > 1 ? null : cleanTrig(fromRad(Math.acos(x), mode))),
  atan: (x, mode) => cleanTrig(fromRad(Math.atan(x), mode)),
  log: (x) => (x <= 0 ? null : Math.log10(x)),
  ln: (x) => (x <= 0 ? null : Math.log(x)),
  sqrt: (x) => (x < 0 ? null : Math.sqrt(x)),
  abs: (x) => Math.abs(x),
};

export function isFunctionName(name: string): name is FunctionName {
  return Object.hasOwn(IMPLS, name);
}

/** Applies a function; `null` means a domain error (including non-finite results). */
export function applyFunction(name: FunctionName, x: number, mode: AngleMode): number | null {
  const value = IMPLS[name](x, mode);
  return value === null || !Number.isFinite(value) ? null : value;
}
