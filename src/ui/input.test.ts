import { describe, expect, it } from 'vitest';
import { calculate } from '../engine';
import {
  formatExpression,
  initialState,
  isKeyId,
  KEYS,
  press,
  SCIENTIFIC_KEYS,
  toggleAngleMode,
  type CalcState,
  type KeyId,
} from './input';

function run(keys: KeyId[], from: CalcState = initialState): CalcState {
  return keys.reduce(press, from);
}

describe('press — 입력 누적', () => {
  it('키를 누른 순서대로 엔진 문법 수식을 쌓는다', () => {
    expect(run(['(', '2', '+', '3', ')', '*', '4']).expression).toBe('(2+3)*4');
  });

  it('소수점과 나누기·빼기를 엔진 문자로 쌓는다', () => {
    expect(run(['1', '.', '5', '/', '3', '-', '1']).expression).toBe('1.5/3-1');
  });

  it('입력은 이전 상태를 바꾸지 않는다', () => {
    const before = run(['1']);
    press(before, '2');
    expect(before.expression).toBe('1');
  });
});

describe('press — = 평가', () => {
  it('(2+3)×4 → 20, 엔진 결과와 같다', () => {
    const state = run(['(', '2', '+', '3', ')', '*', '4', 'equals']);
    const engine = calculate('(2+3)*4');
    expect(engine.ok && engine.value).toBe(20);
    expect(state.result).toEqual({ kind: 'value', text: '20' });
    expect(state.expression).toBe('(2+3)*4');
  });

  it('0 으로 나누기는 오류 줄로 표시한다', () => {
    const state = run(['1', '/', '0', 'equals']);
    const engine = calculate('1/0');
    expect(engine.ok).toBe(false);
    expect(state.result).toEqual({ kind: 'error', text: engine.ok ? '' : engine.error.message });
  });

  it('잘못된 수식은 오류 줄로 표시한다', () => {
    const state = run(['2', '+', '*', 'equals']);
    expect(state.result?.kind).toBe('error');
  });

  it('빈 수식에서 = 는 오류 줄을 표시한다', () => {
    expect(press(initialState, 'equals').result?.kind).toBe('error');
  });

  it('결과 표시 뒤 새 입력은 수식에 이어 붙이고 결과 줄을 비운다', () => {
    const state = run(['2', 'equals', '+', '1']);
    expect(state).toEqual({ ...initialState, expression: '2+1' });
  });
});

describe('press — AC / ⌫', () => {
  it('AC 는 수식과 결과를 모두 초기화한다', () => {
    expect(run(['1', '+', '2', 'equals', 'clear'])).toEqual(initialState);
  });

  it('⌫ 는 수식 마지막 입력 하나를 지우고 결과 줄을 비운다', () => {
    expect(run(['1', '2', '+', 'backspace'])).toEqual({ ...initialState, expression: '12' });
    expect(run(['3', 'equals', 'backspace'])).toEqual(initialState);
  });

  it('빈 수식에서 ⌫ 는 아무것도 하지 않는다', () => {
    expect(press(initialState, 'backspace')).toEqual(initialState);
  });
});

describe('formatExpression / KEYS', () => {
  it('엔진 연산자를 화면 기호로 바꾼다', () => {
    expect(formatExpression('(2+3)*4/2-1')).toBe('(2+3)×4÷2−1');
  });

  it('기본 키패드 20개와 공학 키패드 15개는 중복 없이 모두 KeyId 다', () => {
    const ids = [...KEYS, ...SCIENTIFIC_KEYS].map((key) => key.id);
    expect(KEYS).toHaveLength(20);
    expect(SCIENTIFIC_KEYS).toHaveLength(15);
    expect(new Set(ids).size).toBe(35);
    expect(ids.every(isKeyId)).toBe(true);
    expect(isKeyId('angle')).toBe(false);
  });

  it('공학 함수 키는 함수 변형 버튼이다', () => {
    const functions = SCIENTIFIC_KEYS.filter((key) => key.insert?.endsWith('('));
    expect(functions.map((key) => key.id)).toEqual([
      'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'log', 'ln', 'sqrt', 'abs',
    ]);
    expect(functions.every((key) => key.variant === 'function')).toBe(true);
  });
});

describe('press — 공학용 키', () => {
  it('함수 키는 여는 괄호까지 입력한다', () => {
    for (const fn of ['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'log', 'ln', 'sqrt', 'abs'] as const) {
      expect(press(initialState, fn).expression).toBe(`${fn}(`);
    }
  });

  it('상수·거듭제곱·후위 연산자를 엔진 문자로 쌓는다', () => {
    expect(run(['pi', '*', 'e', '^', '2']).expression).toBe('π*e^2');
    expect(run(['5', '!', '+', '5', '0', '%']).expression).toBe('5!+50%');
  });

  it('공학 키로 쌓은 수식은 엔진이 그대로 평가한다', () => {
    const cases: [KeyId[], string][] = [
      [['log', '1', '0', '0', ')', 'equals'], '2'],
      [['ln', 'e', ')', 'equals'], '1'],
      [['sqrt', '1', '6', ')', 'equals'], '4'],
      [['abs', '-', '3', ')', 'equals'], '3'],
      [['2', '^', '1', '0', 'equals'], '1024'],
      [['4', '!', 'equals'], '24'],
      [['5', '0', '%', 'equals'], '0.5'],
    ];
    for (const [keys, text] of cases) {
      expect(run(keys).result).toEqual({ kind: 'value', text });
    }
  });

  it('⌫ 는 함수 키 입력(sin( 등)을 한 번에 지운다', () => {
    expect(run(['2', '*', 'asin', 'backspace']).expression).toBe('2*');
    expect(run(['sqrt', '4', 'backspace', 'backspace']).expression).toBe('');
    expect(run(['(', 'backspace']).expression).toBe('');
  });

  it('정의역 밖 입력은 오류 줄로 표시한다', () => {
    const state = run(['sqrt', '-', '1', ')', 'equals']);
    const engine = calculate('sqrt(-1)');
    expect(engine.ok).toBe(false);
    expect(state.result).toEqual({ kind: 'error', text: engine.ok ? '' : engine.error.message });
    expect(state.expression).toBe('sqrt(-1)');
  });
});

describe('각도 모드 DEG/RAD', () => {
  const sin90: KeyId[] = ['sin', '9', '0', ')', 'equals'];

  it('기본 모드는 DEG 이고 sin(90) = 1', () => {
    expect(initialState.angleMode).toBe('DEG');
    expect(run(sin90).result).toEqual({ kind: 'value', text: '1' });
  });

  /** Result line the engine gives for `expression` in `angleMode`. */
  const engineText = (expression: string, angleMode: 'DEG' | 'RAD') => {
    const outcome = calculate(expression, { angleMode });
    if (!outcome.ok) throw new Error(outcome.error.message);
    return String(outcome.value);
  };

  it('= 는 상태의 각도 모드를 엔진에 전달한다', () => {
    const rad = toggleAngleMode(initialState);
    expect(rad.angleMode).toBe('RAD');
    expect(engineText('sin(90)', 'RAD')).not.toBe('1');
    expect(run(sin90, rad).result).toEqual({ kind: 'value', text: engineText('sin(90)', 'RAD') });
    expect(run(['asin', '1', ')', 'equals']).result).toEqual({ kind: 'value', text: '90' });
    expect(run(['asin', '1', ')', 'equals'], rad).result).toEqual({
      kind: 'value',
      text: engineText('asin(1)', 'RAD'),
    });
  });

  it('결과가 떠 있을 때 전환하면 같은 수식을 새 모드로 다시 평가한다', () => {
    const deg = run(sin90);
    const rad = toggleAngleMode(deg);
    expect(rad.expression).toBe('sin(90)');
    expect(rad.result).toEqual({ kind: 'value', text: engineText('sin(90)', 'RAD') });
    expect(toggleAngleMode(rad)).toEqual(deg);
  });

  it('결과가 없으면 전환해도 수식과 결과 줄을 건드리지 않는다', () => {
    const typing = run(['sin', '9']);
    expect(toggleAngleMode(typing)).toEqual({ ...typing, angleMode: 'RAD' });
  });

  it('AC 는 각도 모드를 유지한다', () => {
    const rad = toggleAngleMode(initialState);
    expect(run(['sin', '1', 'clear'], rad)).toEqual({ ...initialState, angleMode: 'RAD' });
  });
});
