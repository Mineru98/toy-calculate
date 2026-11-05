import { describe, expect, it } from 'vitest';
import { initialState, press, type CalcState, type InputKey } from './input';
import { keyFromEvent } from './keyboard';

function key(name: string, mods: Partial<Pick<KeyboardEvent, 'ctrlKey' | 'metaKey' | 'altKey' | 'isComposing'>> = {}) {
  return keyFromEvent({ key: name, ctrlKey: false, metaKey: false, altKey: false, isComposing: false, ...mods });
}

/** Feeds `KeyboardEvent.key` values through the mapping and the same `press` the keypad uses. */
function type(keys: string[], from: CalcState = initialState): CalcState {
  return keys.reduce((state, name) => {
    const mapped = key(name);
    return mapped ? press(state, mapped) : state;
  }, from);
}

describe('keyFromEvent — 키 매핑', () => {
  it('숫자·소수점·사칙·괄호는 같은 문자의 키패드 키로', () => {
    for (const ch of '0123456789.+-*/()') expect(key(ch)).toBe(ch);
  });

  it('^ % ! 는 엔진 문자 그대로', () => {
    expect(key('^')).toBe('^');
    expect(key('%')).toBe('%');
    expect(key('!')).toBe('!');
  });

  it('Enter·= → =, Backspace → ⌫, Escape → AC', () => {
    const expected: Record<string, InputKey> = { Enter: 'equals', '=': 'equals', Backspace: 'backspace', Escape: 'clear' };
    for (const [name, id] of Object.entries(expected)) expect(key(name)).toBe(id);
  });

  it('다루지 않는 키는 null', () => {
    for (const name of ['a', 'x', ' ', 'Tab', 'ArrowLeft', 'Shift', 'F5', 'clear', 'equals']) expect(key(name)).toBeNull();
  });

  it('Ctrl·Meta·Alt 조합과 IME 조합 중에는 가로채지 않는다', () => {
    expect(key('r', { ctrlKey: true })).toBeNull();
    expect(key('+', { ctrlKey: true })).toBeNull();
    expect(key('Backspace', { metaKey: true })).toBeNull();
    expect(key('1', { altKey: true })).toBeNull();
    expect(key('Enter', { isComposing: true })).toBeNull();
  });
});

describe('키보드 입력 → press', () => {
  it('(2+3)*4 입력 후 Enter → 20', () => {
    const state = type(['(', '2', '+', '3', ')', '*', '4', 'Enter']);
    expect(state).toEqual({ ...initialState, expression: '(2+3)*4', result: { kind: 'value', text: '20' } });
  });

  it('Backspace 는 ⌫ 와 같은 결과', () => {
    const typed = type(['1', '2', '+', 'Backspace']);
    expect(typed).toEqual(press(type(['1', '2', '+']), 'backspace'));
    expect(typed).toEqual({ ...initialState, expression: '12', result: null });
  });

  it('Escape 는 AC 와 같은 결과', () => {
    const before = type(['1', '+', '2', 'Enter']);
    expect(type(['Escape'], before)).toEqual(press(before, 'clear'));
    expect(type(['Escape'], before)).toEqual(initialState);
  });

  it('^ % ! 는 엔진이 받는 문자로 수식에 들어가 계산된다', () => {
    const state = type(['3', '!', '+', '2', '^', '3', '+', '5', '0', '%', 'Enter']);
    expect(state.expression).toBe('3!+2^3+50%');
    expect(state.result).toEqual({ kind: 'value', text: '14.5' });
  });
});
