import { describe, expect, it } from 'vitest';
import { calculate } from '../engine';
import { initialState, press, toggleAngleMode, type CalcState, type KeyId } from './input';
import {
  isMemoryKeyId,
  loadMemory,
  MEMORY_KEYS,
  MEMORY_STORAGE_KEY,
  pressMemory,
  saveMemory,
  toOperand,
  type Memory,
  type MemoryStorage,
} from './memory';

function run(keys: KeyId[], from: CalcState = initialState): CalcState {
  return keys.reduce(press, from);
}

class FakeStorage implements MemoryStorage {
  readonly items = new Map<string, string>();
  getItem(key: string): string | null {
    return this.items.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.items.set(key, value);
  }
  removeItem(key: string): void {
    this.items.delete(key);
  }
}

const throwingStorage: MemoryStorage = {
  getItem: () => {
    throw new Error('SecurityError');
  },
  setItem: () => {
    throw new Error('QuotaExceededError');
  },
  removeItem: () => {
    throw new Error('SecurityError');
  },
};

describe('pressMemory — M+ / M-', () => {
  it('M+ 는 현재 결과를 메모리에 더하고 M- 는 뺀다', () => {
    let memory: Memory = null;
    memory = pressMemory(memory, run(['5', 'equals']), 'mplus').memory;
    expect(memory).toBe(5);
    memory = pressMemory(memory, run(['2', '*', '4', 'equals']), 'mplus').memory;
    expect(memory).toBe(13);
    memory = pressMemory(memory, run(['2', '0', 'equals']), 'mminus').memory;
    expect(memory).toBe(-7);
  });

  it('= 를 누르지 않은 수식도 그 계산값을 현재 결과로 쓴다', () => {
    expect(pressMemory(null, run(['3', '+', '4']), 'mplus').memory).toBe(7);
  });

  it('계산 상태(수식·결과 줄)는 바꾸지 않는다', () => {
    const state = run(['5', 'equals']);
    expect(pressMemory(1, state, 'mplus').state).toBe(state);
  });

  it('오류 결과에서는 M+/M- 가 메모리를 바꾸지 않는다', () => {
    const errored = run(['1', '/', '0', 'equals']);
    expect(errored.result?.kind).toBe('error');
    expect(pressMemory(10, errored, 'mplus').memory).toBe(10);
    expect(pressMemory(10, errored, 'mminus').memory).toBe(10);
    expect(pressMemory(null, errored, 'mplus').memory).toBeNull();
  });

  it('빈 수식에서는 M+/M- 가 메모리를 바꾸지 않는다', () => {
    expect(pressMemory(3, initialState, 'mplus').memory).toBe(3);
    expect(pressMemory(null, initialState, 'mminus').memory).toBeNull();
  });

  it('합이 유한수를 벗어나면 메모리를 바꾸지 않는다', () => {
    const state: CalcState = { ...initialState, expression: '10^308' };
    expect(calculate(state.expression)).toEqual({ ok: true, value: 1e308 });
    expect(pressMemory(1.7e308, state, 'mplus').memory).toBe(1.7e308);
    expect(pressMemory(-1.7e308, state, 'mminus').memory).toBe(-1.7e308);
  });

  it('M+ 는 현재 각도 모드로 계산한 값을 더한다', () => {
    const deg = run(['sin', '9', '0', ')']);
    expect(deg.angleMode).toBe('DEG');
    expect(pressMemory(null, deg, 'mplus').memory).toBe(1);
    const rad = calculate('sin(90)', { angleMode: 'RAD' });
    expect(rad.ok && rad.value).not.toBe(1);
    expect(pressMemory(null, toggleAngleMode(deg), 'mplus').memory).toBe(rad.ok && rad.value);
  });
});

describe('pressMemory — MC / MR', () => {
  it('MC 는 메모리를 비운다', () => {
    expect(pressMemory(42, initialState, 'mc').memory).toBeNull();
  });

  it('MR 은 메모리 값을 수식 끝에 이어 붙이고 결과 줄을 비운다', () => {
    const step = pressMemory(25, run(['2', '+']), 'mr');
    expect(step.state).toEqual({ ...initialState, expression: '2+25', result: null });
    expect(step.memory).toBe(25);
    expect(calculate(step.state.expression)).toEqual({ ok: true, value: 27 });
  });

  it('음수 메모리는 괄호로 감싸 계산 가능한 수식으로 넣는다', () => {
    const step = pressMemory(-3, run(['2', '*']), 'mr');
    expect(step.state.expression).toBe('2*(-3)');
    expect(calculate(step.state.expression)).toEqual({ ok: true, value: -6 });
  });

  it('결과가 표시된 뒤 MR 은 메모리 값으로 새 수식을 시작한다', () => {
    const step = pressMemory(25, run(['2', '+', '3', 'equals']), 'mr');
    expect(step.state).toEqual({ ...initialState, expression: '25', result: null });
  });

  it('수식 끝이 숫자면 MR 은 그 숫자를 메모리 값으로 바꾼다', () => {
    expect(pressMemory(25, run(['7']), 'mr').state.expression).toBe('25');
    expect(pressMemory(-3, run(['2', '+', '1', '.', '5']), 'mr').state.expression).toBe('2+(-3)');
  });

  it('수식 끝이 닫힌 피연산자()·!·%)면 MR 은 아무것도 하지 않는다', () => {
    const state = run(['(', '2', ')']);
    expect(pressMemory(25, state, 'mr')).toEqual({ memory: 25, state });
  });

  it('수식 끝이 상수(π·e)면 MR 은 아무것도 하지 않는다', () => {
    for (const keys of [['2', '*', 'pi'], ['e']] satisfies KeyId[][]) {
      const state = run(keys);
      expect(pressMemory(25, state, 'mr')).toEqual({ memory: 25, state });
    }
  });

  it('MR 은 각도 모드를 유지한다', () => {
    const rad = toggleAngleMode(run(['2', '+']));
    expect(pressMemory(25, rad, 'mr').state).toEqual({ expression: '2+25', result: null, angleMode: 'RAD' });
  });

  it('메모리가 비어 있으면 MR 은 아무것도 하지 않는다', () => {
    const state = run(['7']);
    expect(pressMemory(null, state, 'mr')).toEqual({ memory: null, state });
  });

  it('M+ → MR → = 흐름으로 누적값을 계산에 쓴다', () => {
    let memory: Memory = null;
    memory = pressMemory(memory, run(['1', '0', 'equals']), 'mplus').memory;
    memory = pressMemory(memory, run(['4', 'equals']), 'mminus').memory;
    const step = pressMemory(memory, run(['clear']), 'mr');
    expect(press(step.state, 'equals').result).toEqual({ kind: 'value', text: '6' });
  });
});

describe('toOperand', () => {
  it.each([0, 6, 0.1, 1.5, 123456.789, 1e21, 1.5e-7, 2.5e300, -4.2, -1e-7])(
    '%s 는 엔진이 같은 값으로 다시 읽는다',
    (value) => {
      expect(toOperand(value)).not.toMatch(/e/);
      expect(calculate(toOperand(value))).toEqual({ ok: true, value });
    },
  );
});

describe('loadMemory / saveMemory', () => {
  it('버전 있는 키로 저장하고 다시 읽는다', () => {
    const storage = new FakeStorage();
    saveMemory(storage, -12.5);
    expect(MEMORY_STORAGE_KEY).toMatch(/:v\d+$/);
    expect(storage.getItem(MEMORY_STORAGE_KEY)).toBe('-12.5');
    expect(loadMemory(storage)).toBe(-12.5);
  });

  it('빈 메모리 저장은 키를 지운다', () => {
    const storage = new FakeStorage();
    saveMemory(storage, 3);
    saveMemory(storage, null);
    expect(storage.items.has(MEMORY_STORAGE_KEY)).toBe(false);
    expect(loadMemory(storage)).toBeNull();
  });

  it.each(['not json', '"5"', 'null', '{"value":5}', '[5]', 'true', ''])(
    '손상된 저장값 %j 은 메모리 없음으로 읽는다',
    (raw) => {
      const storage = new FakeStorage();
      storage.setItem(MEMORY_STORAGE_KEY, raw);
      expect(loadMemory(storage)).toBeNull();
    },
  );

  it('localStorage 접근 예외에서도 던지지 않는다', () => {
    expect(loadMemory(throwingStorage)).toBeNull();
    expect(() => saveMemory(throwingStorage, 1)).not.toThrow();
    expect(() => saveMemory(throwingStorage, null)).not.toThrow();
  });

  it('저장소가 없으면 메모리 없음으로 시작하고 저장은 무시한다', () => {
    expect(loadMemory(null)).toBeNull();
    expect(() => saveMemory(null, 1)).not.toThrow();
  });
});

describe('MEMORY_KEYS', () => {
  it('MC·MR·M+·M- 네 키를 가진다', () => {
    expect(MEMORY_KEYS.map((key) => key.id)).toEqual(['mc', 'mr', 'mplus', 'mminus']);
    expect(MEMORY_KEYS.every((key) => isMemoryKeyId(key.id))).toBe(true);
    expect(isMemoryKeyId('equals')).toBe(false);
  });
});
