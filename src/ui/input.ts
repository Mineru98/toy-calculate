import { calculate, type AngleMode } from '../engine';

export type KeyVariant = 'number' | 'operator' | 'function' | 'accent';

export type KeyId =
  | '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'
  | '.' | '+' | '-' | '*' | '/' | '(' | ')'
  | 'clear' | 'backspace' | 'equals'
  | 'sin' | 'cos' | 'tan' | 'asin' | 'acos' | 'atan'
  | 'log' | 'ln' | 'sqrt' | 'abs'
  | 'pi' | 'e' | '^' | '%' | '!';

export interface KeyDef {
  id: KeyId;
  label: string;
  ariaLabel?: string;
  variant: KeyVariant;
  /** Text appended to the expression when it differs from `id`. */
  insert?: string;
}

/** Keypad in row-major order for a 4-column grid. */
export const KEYS: readonly KeyDef[] = [
  { id: 'clear', label: 'AC', ariaLabel: '모두 지우기', variant: 'function' },
  { id: '(', label: '(', variant: 'function' },
  { id: ')', label: ')', variant: 'function' },
  { id: '/', label: '÷', ariaLabel: '나누기', variant: 'operator' },
  { id: '7', label: '7', variant: 'number' },
  { id: '8', label: '8', variant: 'number' },
  { id: '9', label: '9', variant: 'number' },
  { id: '*', label: '×', ariaLabel: '곱하기', variant: 'operator' },
  { id: '4', label: '4', variant: 'number' },
  { id: '5', label: '5', variant: 'number' },
  { id: '6', label: '6', variant: 'number' },
  { id: '-', label: '−', ariaLabel: '빼기', variant: 'operator' },
  { id: '1', label: '1', variant: 'number' },
  { id: '2', label: '2', variant: 'number' },
  { id: '3', label: '3', variant: 'number' },
  { id: '+', label: '+', ariaLabel: '더하기', variant: 'operator' },
  { id: '0', label: '0', variant: 'number' },
  { id: '.', label: '.', ariaLabel: '소수점', variant: 'number' },
  { id: 'backspace', label: '⌫', ariaLabel: '한 글자 지우기', variant: 'function' },
  { id: 'equals', label: '=', ariaLabel: '계산', variant: 'accent' },
];

/** Scientific keypad in row-major order for a 5-column grid. */
export const SCIENTIFIC_KEYS: readonly KeyDef[] = [
  { id: 'sin', label: 'sin', insert: 'sin(', variant: 'function' },
  { id: 'cos', label: 'cos', insert: 'cos(', variant: 'function' },
  { id: 'tan', label: 'tan', insert: 'tan(', variant: 'function' },
  { id: 'pi', label: 'π', ariaLabel: '원주율', insert: 'π', variant: 'number' },
  { id: 'e', label: 'e', ariaLabel: '자연상수', variant: 'number' },
  { id: 'asin', label: 'asin', insert: 'asin(', variant: 'function' },
  { id: 'acos', label: 'acos', insert: 'acos(', variant: 'function' },
  { id: 'atan', label: 'atan', insert: 'atan(', variant: 'function' },
  { id: '^', label: '^', ariaLabel: '거듭제곱', variant: 'operator' },
  { id: '!', label: '!', ariaLabel: '계승', variant: 'operator' },
  { id: 'log', label: 'log', ariaLabel: '상용로그', insert: 'log(', variant: 'function' },
  { id: 'ln', label: 'ln', ariaLabel: '자연로그', insert: 'ln(', variant: 'function' },
  { id: 'sqrt', label: 'sqrt', ariaLabel: '제곱근', insert: 'sqrt(', variant: 'function' },
  { id: 'abs', label: 'abs', ariaLabel: '절댓값', insert: 'abs(', variant: 'function' },
  { id: '%', label: '%', ariaLabel: '퍼센트', variant: 'operator' },
];

const ALL_KEYS: readonly KeyDef[] = [...KEYS, ...SCIENTIFIC_KEYS];

/** Function-key inputs such as `sin(`; ⌫ removes one of these as a single input. */
const FUNCTION_INPUT = /(?:asin|acos|atan|sin|cos|tan|log|ln|sqrt|abs)\($/;

export type ResultLine = { kind: 'value'; text: string } | { kind: 'error'; text: string };

export interface CalcState {
  /** Expression in engine syntax (ASCII operators). */
  expression: string;
  result: ResultLine | null;
  /** Passed to the engine as `angleMode` when evaluating. */
  angleMode: AngleMode;
}

export const initialState: CalcState = { expression: '', result: null, angleMode: 'DEG' };

export function isKeyId(value: string): value is KeyId {
  return ALL_KEYS.some((key) => key.id === value);
}

function evaluateLine(expression: string, angleMode: AngleMode): ResultLine {
  const outcome = calculate(expression, { angleMode });
  return outcome.ok
    ? { kind: 'value', text: String(outcome.value) }
    : { kind: 'error', text: outcome.error.message };
}

export function press(state: CalcState, key: KeyId): CalcState {
  switch (key) {
    case 'clear':
      return { ...initialState, angleMode: state.angleMode };
    case 'backspace': {
      const fn = FUNCTION_INPUT.exec(state.expression);
      const cut = fn ? fn[0].length : 1;
      return { ...state, expression: state.expression.slice(0, -cut), result: null };
    }
    case 'equals':
      return { ...state, result: evaluateLine(state.expression, state.angleMode) };
    default: {
      const insert = ALL_KEYS.find((def) => def.id === key)?.insert ?? key;
      return { ...state, expression: state.expression + insert, result: null };
    }
  }
}

/** Switches DEG ↔ RAD; a displayed result is re-evaluated in the new mode. */
export function toggleAngleMode(state: CalcState): CalcState {
  const angleMode: AngleMode = state.angleMode === 'DEG' ? 'RAD' : 'DEG';
  return {
    ...state,
    angleMode,
    result: state.result ? evaluateLine(state.expression, angleMode) : null,
  };
}

const DISPLAY_SYMBOLS: Record<string, string> = { '*': '×', '/': '÷', '-': '−' };

/** Renders an engine-syntax expression with the keypad's math symbols. */
export function formatExpression(expression: string): string {
  return expression.replace(/[*/-]/g, (op) => DISPLAY_SYMBOLS[op]);
}
