import { calculate } from '../engine';

export type KeyVariant = 'number' | 'operator' | 'function' | 'accent';

export type KeyId =
  | '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'
  | '.' | '+' | '-' | '*' | '/' | '(' | ')'
  | 'clear' | 'backspace' | 'equals';

export interface KeyDef {
  id: KeyId;
  label: string;
  ariaLabel?: string;
  variant: KeyVariant;
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

export type ResultLine = { kind: 'value'; text: string } | { kind: 'error'; text: string };

export interface CalcState {
  /** Expression in engine syntax (ASCII operators). */
  expression: string;
  result: ResultLine | null;
}

export const initialState: CalcState = { expression: '', result: null };

export function isKeyId(value: string): value is KeyId {
  return KEYS.some((key) => key.id === value);
}

export function press(state: CalcState, key: KeyId): CalcState {
  switch (key) {
    case 'clear':
      return initialState;
    case 'backspace':
      return { expression: state.expression.slice(0, -1), result: null };
    case 'equals': {
      const outcome = calculate(state.expression);
      return {
        expression: state.expression,
        result: outcome.ok
          ? { kind: 'value', text: String(outcome.value) }
          : { kind: 'error', text: outcome.error.message },
      };
    }
    default:
      return { expression: state.expression + key, result: null };
  }
}

const DISPLAY_SYMBOLS: Record<string, string> = { '*': '×', '/': '÷', '-': '−' };

/** Renders an engine-syntax expression with the keypad's math symbols. */
export function formatExpression(expression: string): string {
  return expression.replace(/[*/-]/g, (op) => DISPLAY_SYMBOLS[op]);
}
