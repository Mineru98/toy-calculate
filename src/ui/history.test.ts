import { describe, expect, it } from 'vitest';
import {
  addEntry,
  clearHistory,
  HISTORY_LIMIT,
  HISTORY_STORAGE_KEY,
  loadHistory,
  record,
  saveHistory,
  type HistoryEntry,
} from './history';
import { initialState, press, type CalcState, type KeyId } from './input';
import type { MemoryStorage } from './memory';

function run(keys: KeyId[]): CalcState {
  return keys.reduce(press, initialState);
}

function entry(n: number): HistoryEntry {
  return { expression: `${n}+0`, result: String(n) };
}

describe('addEntry — 추가와 상한', () => {
  it('새 항목을 맨 위에 추가한다', () => {
    const history = addEntry(addEntry([], entry(1)), entry(2));
    expect(history).toEqual([entry(2), entry(1)]);
  });

  it('상한을 넘으면 가장 오래된 항목부터 빠진다', () => {
    const history = addEntry([entry(3), entry(2), entry(1)], entry(4), 3);
    expect(history).toEqual([entry(4), entry(3), entry(2)]);
  });

  it(`기본 상한은 ${HISTORY_LIMIT}건이다`, () => {
    let history: readonly HistoryEntry[] = [];
    for (let n = 1; n <= HISTORY_LIMIT + 1; n += 1) history = addEntry(history, entry(n));
    expect(history).toHaveLength(HISTORY_LIMIT);
    expect(history[0]).toEqual(entry(HISTORY_LIMIT + 1));
    expect(history[HISTORY_LIMIT - 1]).toEqual(entry(2));
  });

  it('이전 기록 배열을 바꾸지 않는다', () => {
    const before: readonly HistoryEntry[] = [entry(1)];
    addEntry(before, entry(2));
    expect(before).toEqual([entry(1)]);
  });
});

describe('record — = 결과 기록', () => {
  it('성공한 계산은 수식과 결과를 기록한다', () => {
    const state = run(['(', '2', '+', '3', ')', '*', '4', 'equals']);
    expect(record([], state)).toEqual([{ expression: '(2+3)*4', result: '20' }]);
  });

  it('오류 결과는 기록하지 않는다', () => {
    const history = [entry(1)];
    expect(record(history, run(['1', '/', '0', 'equals']))).toBe(history);
  });

  it('계산하지 않은 상태는 기록하지 않는다', () => {
    const history = [entry(1)];
    expect(record(history, run(['1', '+', '2']))).toBe(history);
  });
});

describe('clearHistory — 전체 삭제', () => {
  it('빈 기록을 돌려준다', () => {
    expect(clearHistory()).toEqual([]);
  });
});

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

describe('loadHistory / saveHistory', () => {
  it('버전 있는 키로 저장하고 순서·내용 그대로 다시 읽는다', () => {
    const storage = new FakeStorage();
    const history = [entry(3), entry(2), entry(1)];
    saveHistory(storage, history);
    expect(HISTORY_STORAGE_KEY).toMatch(/:v\d+$/);
    expect(loadHistory(storage)).toEqual(history);
  });

  it('= 로 쌓인 기록이 저장·복원을 거쳐도 같다', () => {
    const storage = new FakeStorage();
    let history = record([], run(['2', '+', '3', 'equals']));
    history = record(history, run(['7', '*', '6', 'equals']));
    saveHistory(storage, history);
    expect(loadHistory(storage)).toEqual([
      { expression: '7*6', result: '42' },
      { expression: '2+3', result: '5' },
    ]);
  });

  it('전체 삭제(빈 기록) 저장은 키를 지운다', () => {
    const storage = new FakeStorage();
    saveHistory(storage, [entry(1)]);
    saveHistory(storage, clearHistory());
    expect(storage.items.has(HISTORY_STORAGE_KEY)).toBe(false);
    expect(loadHistory(storage)).toEqual([]);
  });

  it('저장값이 없으면 빈 기록으로 시작한다', () => {
    expect(loadHistory(new FakeStorage())).toEqual([]);
  });

  it.each([
    'not json',
    '{broken',
    '',
    'null',
    '5',
    '"text"',
    '{"expression":"1+1","result":"2"}',
    '[1]',
    '[null]',
    '[{"expression":"1+1"}]',
    '[{"expression":"1+1","result":2}]',
    '[{"expression":"1+1","result":"2"},{"result":"3"}]',
  ])('손상된 저장값 %j 은 빈 기록으로 읽는다', (raw) => {
    const storage = new FakeStorage();
    storage.setItem(HISTORY_STORAGE_KEY, raw);
    expect(loadHistory(storage)).toEqual([]);
  });

  it('저장값이 상한을 넘으면 앞에서부터 상한만큼만 읽는다', () => {
    const storage = new FakeStorage();
    const many = Array.from({ length: HISTORY_LIMIT + 5 }, (_, n) => entry(n));
    storage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(many));
    expect(loadHistory(storage)).toEqual(many.slice(0, HISTORY_LIMIT));
  });

  it('항목의 추가 필드는 버리고 수식·결과만 읽는다', () => {
    const storage = new FakeStorage();
    storage.setItem(HISTORY_STORAGE_KEY, '[{"expression":"1+1","result":"2","extra":true}]');
    expect(loadHistory(storage)).toEqual([{ expression: '1+1', result: '2' }]);
  });

  it('localStorage 접근 예외에서도 던지지 않는다', () => {
    expect(loadHistory(throwingStorage)).toEqual([]);
    expect(() => saveHistory(throwingStorage, [entry(1)])).not.toThrow();
    expect(() => saveHistory(throwingStorage, [])).not.toThrow();
  });

  it('저장소가 없으면 빈 기록으로 시작하고 저장은 무시한다', () => {
    expect(loadHistory(null)).toEqual([]);
    expect(() => saveHistory(null, [entry(1)])).not.toThrow();
  });
});
