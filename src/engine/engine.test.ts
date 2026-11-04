import { describe, expect, it } from 'vitest';
import { calculate, type CalcErrorCode } from './index';

function valueOf(expression: string): number {
  const result = calculate(expression);
  if (!result.ok) throw new Error(`expected success for '${expression}', got ${result.error.code}`);
  return result.value;
}

function errorCodeOf(expression: string): CalcErrorCode {
  const result = calculate(expression);
  if (result.ok) throw new Error(`expected error for '${expression}', got ${result.value}`);
  return result.error.code;
}

describe('calculate — 성공', () => {
  it.each([
    ['2+3*4', 14],
    ['(2+3)*4', 20],
    ['2^3^2', 512],
    ['-2^2', -4],
    ['(-2)^2', 4],
    ['2^-2', 0.25],
    ['10-4-3', 3],
    ['24/4/2', 3],
    ['1.5+.5', 2],
    ['2*-3', -6],
    ['2--3', 5],
    ['--2', 2],
    [' 7 * ( 1 + 2 ) ', 21],
    ['((3))', 3],
    ['0/5', 0],
  ])('%s = %d', (expression, expected) => {
    expect(valueOf(expression)).toBe(expected);
  });
});

describe('calculate — 오류 결과 (예외 없음)', () => {
  it.each<[string, CalcErrorCode]>([
    ['', 'EMPTY_INPUT'],
    ['   ', 'EMPTY_INPUT'],
    ['(2+3', 'MISMATCHED_PARENTHESIS'],
    ['2+3)', 'MISMATCHED_PARENTHESIS'],
    [')(', 'MISMATCHED_PARENTHESIS'],
    ['2+*3', 'UNEXPECTED_TOKEN'],
    ['2**3', 'UNEXPECTED_TOKEN'],
    ['*2', 'UNEXPECTED_TOKEN'],
    ['2+', 'UNEXPECTED_TOKEN'],
    ['()', 'UNEXPECTED_TOKEN'],
    ['(2+)', 'UNEXPECTED_TOKEN'],
    ['(2+', 'MISMATCHED_PARENTHESIS'],
    ['(', 'MISMATCHED_PARENTHESIS'],
    ['2 3', 'UNEXPECTED_TOKEN'],
    ['2(3)', 'UNEXPECTED_TOKEN'],
    ['2a', 'UNKNOWN_CHARACTER'],
    ['2#3', 'UNKNOWN_CHARACTER'],
    ['1.2.3', 'INVALID_NUMBER'],
    ['.', 'INVALID_NUMBER'],
    ['1/0', 'DIVISION_BY_ZERO'],
    ['5/(2-2)', 'DIVISION_BY_ZERO'],
  ])("'%s' → %s", (expression, code) => {
    expect(() => calculate(expression)).not.toThrow();
    expect(errorCodeOf(expression)).toBe(code);
  });

  it.each([
    ['('.repeat(20000) + '1' + ')'.repeat(20000)],
    ['-'.repeat(20000) + '1'],
    [Array(20000).fill('1').join('+')],
    [Array(10000).fill('1').join('^')],
  ])('깊게 중첩된 수식은 TOO_DEEP (길이 %#)', (expression) => {
    expect(() => calculate(expression)).not.toThrow();
    expect(errorCodeOf(expression)).toBe('TOO_DEEP');
  });

  it('오류 위치를 함께 돌려준다', () => {
    expect(calculate('2#3')).toEqual({
      ok: false,
      error: { code: 'UNKNOWN_CHARACTER', message: expect.any(String), position: 1 },
    });
    expect(calculate('8/0')).toMatchObject({ ok: false, error: { position: 1 } });
  });
});
