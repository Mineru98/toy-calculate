import { CONSTANTS, isFunctionName, type FunctionName } from './functions';
import { failure, type CalcFailure } from './result';

export type Operator = '+' | '-' | '*' | '/' | '^';
export type PostfixOperator = '!' | '%';

export type Token =
  | { type: 'number'; value: number; position: number }
  | { type: 'operator'; value: Operator; position: number }
  | { type: 'postfix'; value: PostfixOperator; position: number }
  | { type: 'paren'; value: '(' | ')'; position: number }
  | { type: 'constant'; value: number; position: number }
  | { type: 'function'; name: FunctionName; position: number };

const OPERATORS = new Set<string>(['+', '-', '*', '/', '^']);

function isDigit(ch: string): boolean {
  return ch >= '0' && ch <= '9';
}

function isLetter(ch: string): boolean {
  return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z');
}

export function tokenize(input: string): { ok: true; tokens: Token[] } | CalcFailure {
  const tokens: Token[] = [];
  let i = 0;

  while (i < input.length) {
    const ch = input[i];

    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    if (isDigit(ch) || ch === '.') {
      const start = i;
      let digits = 0;
      let dots = 0;
      while (i < input.length && (isDigit(input[i]) || input[i] === '.')) {
        if (input[i] === '.') dots++;
        else digits++;
        i++;
      }
      const text = input.slice(start, i);
      if (digits === 0 || dots > 1) {
        return failure('INVALID_NUMBER', `잘못된 숫자: '${text}'`, start);
      }
      tokens.push({ type: 'number', value: Number(text), position: start });
      continue;
    }

    if (OPERATORS.has(ch)) {
      tokens.push({ type: 'operator', value: ch as Operator, position: i });
      i++;
      continue;
    }

    if (ch === '!' || ch === '%') {
      tokens.push({ type: 'postfix', value: ch, position: i });
      i++;
      continue;
    }

    if (ch === '(' || ch === ')') {
      tokens.push({ type: 'paren', value: ch, position: i });
      i++;
      continue;
    }

    if (ch === 'π') {
      tokens.push({ type: 'constant', value: CONSTANTS.π, position: i });
      i++;
      continue;
    }

    if (isLetter(ch)) {
      const start = i;
      while (i < input.length && isLetter(input[i])) i++;
      const name = input.slice(start, i);
      if (isFunctionName(name)) {
        tokens.push({ type: 'function', name, position: start });
        continue;
      }
      if (Object.hasOwn(CONSTANTS, name)) {
        tokens.push({ type: 'constant', value: CONSTANTS[name], position: start });
        continue;
      }
      // A name used as a call is an unknown function; otherwise it is just an unknown character.
      if (input.slice(i).trimStart().startsWith('(')) {
        return failure('UNKNOWN_FUNCTION', `알 수 없는 함수: '${name}'`, start);
      }
      return failure('UNKNOWN_CHARACTER', `알 수 없는 문자: '${ch}'`, start);
    }

    return failure('UNKNOWN_CHARACTER', `알 수 없는 문자: '${ch}'`, i);
  }

  return { ok: true, tokens };
}
