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

describe('calculate — 후위 연산자 % !', () => {
  it.each([
    ['50%', 0.5],
    ['200*10%', 20],
    ['50%%', 0.005],
    ['(20+30)%', 0.5],
    ['5!', 120],
    ['0!', 1],
    ['1!', 1],
    ['3!!', 720],
    ['170!', 7.257415615307994e306],
    ['3!+1', 7],
    ['2*3!', 12],
    ['(2+1)!', 6],
    ['5!%', 1.2],
  ])('%s = %d', (expression, expected) => {
    expect(valueOf(expression)).toBe(expected);
  });

  it.each([
    ['-3!', -6],
    ['-50%', -0.5],
    ['2^3!', 64],
    ['3!^2', 36],
    ['2^-3!', 2 ** -6],
    ['-2^2!', -4],
    ['2^200%', 4],
  ])('우선순위: %s = %d (후위가 ^·단항 마이너스보다 먼저)', (expression, expected) => {
    expect(valueOf(expression)).toBe(expected);
  });

  it.each<[string, CalcErrorCode]>([
    ['(-1)!', 'DOMAIN_ERROR'],
    ['(-3)!', 'DOMAIN_ERROR'],
    ['2.5!', 'DOMAIN_ERROR'],
    ['50%!', 'DOMAIN_ERROR'],
    ['171!', 'OVERFLOW'],
    ['1000000000!', 'OVERFLOW'],
    ['6!!', 'OVERFLOW'],
    ['9'.repeat(400) + '!', 'OVERFLOW'],
    ['(10^400)!', 'OVERFLOW'],
    ['!5', 'UNEXPECTED_TOKEN'],
    ['%', 'UNEXPECTED_TOKEN'],
    ['2+!', 'UNEXPECTED_TOKEN'],
    ['(!)', 'UNEXPECTED_TOKEN'],
    ['5!3', 'UNEXPECTED_TOKEN'],
  ])("'%s' → %s", (expression, code) => {
    expect(() => calculate(expression)).not.toThrow();
    expect(errorCodeOf(expression)).toBe(code);
  });

  it('계승 오류는 ! 위치를 돌려준다', () => {
    expect(calculate('(-1)!')).toMatchObject({ ok: false, error: { code: 'DOMAIN_ERROR', position: 4 } });
    expect(calculate('1+171!')).toMatchObject({ ok: false, error: { code: 'OVERFLOW', position: 5 } });
  });

  it('깊게 이어진 후위 연산자는 TOO_DEEP', () => {
    const expression = '1' + '%'.repeat(20000);
    expect(() => calculate(expression)).not.toThrow();
    expect(errorCodeOf(expression)).toBe('TOO_DEEP');
  });
});
