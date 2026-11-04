import { describe, expect, it } from 'vitest';
import { calculate } from '../engine';
import { formatExpression, initialState, isKeyId, KEYS, press, type CalcState, type KeyId } from './input';

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
    expect(state).toEqual({ expression: '2+1', result: null });
  });
});

describe('press — AC / ⌫', () => {
  it('AC 는 수식과 결과를 모두 초기화한다', () => {
    expect(run(['1', '+', '2', 'equals', 'clear'])).toEqual(initialState);
  });

  it('⌫ 는 수식 마지막 입력 하나를 지우고 결과 줄을 비운다', () => {
    expect(run(['1', '2', '+', 'backspace'])).toEqual({ expression: '12', result: null });
    expect(run(['3', 'equals', 'backspace'])).toEqual({ expression: '', result: null });
  });

  it('빈 수식에서 ⌫ 는 아무것도 하지 않는다', () => {
    expect(press(initialState, 'backspace')).toEqual(initialState);
  });
});

describe('formatExpression / KEYS', () => {
  it('엔진 연산자를 화면 기호로 바꾼다', () => {
    expect(formatExpression('(2+3)*4/2-1')).toBe('(2+3)×4÷2−1');
  });

  it('키패드는 요구된 키 20개를 중복 없이 가진다', () => {
    const ids = KEYS.map((key) => key.id);
    expect(new Set(ids).size).toBe(20);
    expect(ids.every(isKeyId)).toBe(true);
    expect(isKeyId('sin')).toBe(false);
  });
});
