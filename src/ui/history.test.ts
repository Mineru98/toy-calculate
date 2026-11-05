import { describe, expect, it } from 'vitest';
import { addEntry, clearHistory, HISTORY_LIMIT, record, type HistoryEntry } from './history';
import { initialState, press, type CalcState, type KeyId } from './input';

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
