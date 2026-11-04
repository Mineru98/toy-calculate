import { failure, type CalcFailure } from './result';

export type Operator = '+' | '-' | '*' | '/' | '^';
export type PostfixOperator = '!' | '%';

export type Token =
  | { type: 'number'; value: number; position: number }
  | { type: 'operator'; value: Operator; position: number }
  | { type: 'postfix'; value: PostfixOperator; position: number }
  | { type: 'paren'; value: '(' | ')'; position: number };

const OPERATORS = new Set<string>(['+', '-', '*', '/', '^']);

function isDigit(ch: string): boolean {
  return ch >= '0' && ch <= '9';
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

    return failure('UNKNOWN_CHARACTER', `알 수 없는 문자: '${ch}'`, i);
  }

  return { ok: true, tokens };
}
