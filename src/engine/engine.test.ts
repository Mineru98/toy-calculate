import { describe, expect, it } from 'vitest';
import { calculate, type CalcErrorCode, type CalcOptions } from './index';

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

describe('calculate — 함수·상수·각도 모드', () => {
  const deg = { angleMode: 'DEG' } as const;
  const rad = { angleMode: 'RAD' } as const;

  function valueIn(expression: string, options: CalcOptions): number {
    const result = calculate(expression, options);
    if (!result.ok) throw new Error(`expected success for '${expression}', got ${result.error.code}`);
    return result.value;
  }

  it.each<[string, number]>([
    ['sin(90)', 1],
    ['sin(30)', 0.5],
    ['cos(0)', 1],
    ['cos(60)', 0.5],
    ['tan(45)', 1],
    ['asin(1)', 90],
    ['asin(0.5)', 30],
    ['acos(0)', 90],
    ['acos(-1)', 180],
    ['atan(1)', 45],
    ['sin(-90)', -1],
  ])('DEG %s = %d', (expression, expected) => {
    expect(valueIn(expression, deg)).toBe(expected);
  });

  it.each<[string, number]>([
    ['sin(π/2)', 1],
    ['sin(pi/6)', 0.5],
    ['cos(0)', 1],
    ['cos(pi)', -1],
    ['tan(pi/4)', 1],
    ['asin(1)', Math.PI / 2],
    ['acos(-1)', Math.PI],
    ['atan(1)', Math.PI / 4],
  ])('RAD %s = %d', (expression, expected) => {
    expect(valueIn(expression, rad)).toBeCloseTo(expected, 14);
  });

  it.each(['DEG', 'RAD'] as const)('%s 모드와 무관한 함수·상수', (angleMode) => {
    const options = { angleMode };
    expect(valueIn('log(1000)', options)).toBe(3);
    expect(valueIn('log(0.01)', options)).toBe(-2);
    expect(valueIn('ln(e)', options)).toBe(1);
    expect(valueIn('ln(1)', options)).toBe(0);
    expect(valueIn('sqrt(16)', options)).toBe(4);
    expect(valueIn('abs(-3.5)', options)).toBe(3.5);
    expect(valueIn('abs(2)', options)).toBe(2);
    expect(valueIn('pi', options)).toBe(Math.PI);
    expect(valueIn('π', options)).toBe(Math.PI);
    expect(valueIn('e', options)).toBe(Math.E);
    expect(valueIn('2*π', options)).toBe(2 * Math.PI);
  });

  it('함수는 중첩·연산자와 조합된다', () => {
    expect(valueIn('sqrt(abs(-16))+1', rad)).toBe(5);
    expect(valueIn('-sin(90)', deg)).toBe(-1);
    expect(valueIn('sin(30)^2', deg)).toBe(0.25);
    expect(valueIn('2^sqrt(4)', rad)).toBe(4);
    expect(valueIn(' sin ( 90 ) ', deg)).toBe(1);
    expect(valueIn('asin(sin(30))', deg)).toBe(30);
  });

  it('부동소수 규칙: 삼각 결과는 1e-12 미만이면 0, 그 외 15 유효숫자', () => {
    expect(valueIn('sin(180)', deg)).toBe(0);
    expect(valueIn('sin(360)', deg)).toBe(0);
    expect(valueIn('cos(90)', deg)).toBe(0);
    expect(valueIn('cos(270)', deg)).toBe(0);
    expect(valueIn('sin(π)', rad)).toBe(0);
    expect(valueIn('cos(π/2)', rad)).toBe(0);
    expect(valueIn('sin(1)', rad)).toBe(0.841470984807897);
  });

  it('각도 모드를 생략하면 RAD', () => {
    expect(valueOf('sin(π/2)')).toBe(1);
    expect(valueOf('asin(1)')).toBeCloseTo(Math.PI / 2, 14);
  });

  it.each<[string, CalcOptions]>([
    ['sqrt(-1)', rad],
    ['log(0)', rad],
    ['log(-5)', rad],
    ['ln(0)', rad],
    ['ln(-1)', rad],
    ['asin(2)', deg],
    ['asin(-1.5)', rad],
    ['acos(-2)', deg],
    ['acos(1.01)', rad],
    ['tan(90)', deg],
    ['tan(-270)', deg],
    ['tan(π/2)', rad],
    ['sqrt(sin(-90))', deg],
  ])("정의역 밖 '%s' → DOMAIN_ERROR (예외 없음)", (expression, options) => {
    expect(() => calculate(expression, options)).not.toThrow();
    expect(calculate(expression, options)).toMatchObject({ ok: false, error: { code: 'DOMAIN_ERROR' } });
  });

  it('정의역 오류는 함수 이름 위치를 가리킨다', () => {
    expect(calculate('1+sqrt(-1)')).toMatchObject({ ok: false, error: { code: 'DOMAIN_ERROR', position: 2 } });
  });

  it.each<[string, CalcErrorCode, number]>([
    ['foo(1)', 'UNKNOWN_FUNCTION', 0],
    ['2+sinh(1)', 'UNKNOWN_FUNCTION', 2],
    ['SIN (1)', 'UNKNOWN_FUNCTION', 0],
    ['sinx', 'UNKNOWN_CHARACTER', 0],
    ['sin', 'UNEXPECTED_TOKEN', 3],
    ['sin 30', 'UNEXPECTED_TOKEN', 4],
    ['sin()', 'UNEXPECTED_TOKEN', 4],
    ['sin(30', 'MISMATCHED_PARENTHESIS', 3],
    ['2pi', 'UNEXPECTED_TOKEN', 1],
    ['pi(2)', 'UNEXPECTED_TOKEN', 2],
  ])("'%s' → %s", (expression, code, position) => {
    expect(() => calculate(expression)).not.toThrow();
    expect(calculate(expression)).toMatchObject({ ok: false, error: { code, position } });
  });
});
