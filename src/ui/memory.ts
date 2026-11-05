import { calculate } from '../engine';
import type { CalcState } from './input';

/** Stored memory value; `null` means the memory is empty. */
export type Memory = number | null;

export type MemoryKeyId = 'mc' | 'mr' | 'mplus' | 'mminus';

export interface MemoryKeyDef {
  id: MemoryKeyId;
  label: string;
  ariaLabel: string;
}

export const MEMORY_KEYS: readonly MemoryKeyDef[] = [
  { id: 'mc', label: 'MC', ariaLabel: '메모리 지우기' },
  { id: 'mr', label: 'MR', ariaLabel: '메모리 불러오기' },
  { id: 'mplus', label: 'M+', ariaLabel: '메모리에 더하기' },
  { id: 'mminus', label: 'M−', ariaLabel: '메모리에서 빼기' },
];

export function isMemoryKeyId(value: string): value is MemoryKeyId {
  return MEMORY_KEYS.some((key) => key.id === value);
}

export interface MemoryStep {
  memory: Memory;
  state: CalcState;
}

/**
 * Applies a memory key. M+/M- use the value of the current expression and leave
 * memory untouched when that expression is empty or evaluates to an error.
 */
export function pressMemory(memory: Memory, state: CalcState, key: MemoryKeyId): MemoryStep {
  switch (key) {
    case 'mc':
      return { memory: null, state };
    case 'mr': {
      if (memory === null) return { memory, state };
      const expression = recallInto(state, toOperand(memory));
      return expression === null ? { memory, state } : { memory, state: { expression, result: null } };
    }
    case 'mplus':
    case 'mminus': {
      const outcome = calculate(state.expression);
      if (!outcome.ok) return { memory, state };
      const next = (memory ?? 0) + (key === 'mplus' ? outcome.value : -outcome.value);
      return Number.isFinite(next) ? { memory: next, state } : { memory, state };
    }
  }
}

/**
 * Places a recalled operand: a shown result starts a new expression, a trailing
 * number is replaced, and a closed operand (`)`, `!`, `%`) cannot take a value
 * without an operator, so it yields `null` (no change).
 */
function recallInto(state: CalcState, operand: string): string | null {
  if (state.result !== null) return operand;
  if (/[\d.]$/.test(state.expression)) return state.expression.replace(/[\d.]+$/, operand);
  if (/[)!%]$/.test(state.expression)) return null;
  return state.expression + operand;
}

/**
 * Formats a number as engine input. The tokenizer has no exponent notation, so
 * values like 1e+21 are expanded to positional digits; negatives are parenthesized.
 */
export function toOperand(value: number): string {
  const magnitude = Math.abs(value);
  let text = String(magnitude);
  if (text.includes('e')) {
    const significantDigits = text.split('e')[0].replace('.', '').length;
    text = magnitude.toLocaleString('en-US', {
      useGrouping: false,
      maximumSignificantDigits: significantDigits,
    });
  }
  return value < 0 ? `(-${text})` : text;
}

export const MEMORY_STORAGE_KEY = 'toy-calculate:memory:v1';

export type MemoryStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

/** Returns `localStorage`, or `null` where it is missing or access throws. */
export function browserStorage(): MemoryStorage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

/** Reads the stored memory. Missing, corrupted or unreadable values start as empty. */
export function loadMemory(storage: MemoryStorage | null): Memory {
  if (!storage) return null;
  try {
    const raw = storage.getItem(MEMORY_STORAGE_KEY);
    if (raw === null) return null;
    const value: unknown = JSON.parse(raw);
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}

/** Persists the memory; an empty memory removes the key. Storage failures are ignored. */
export function saveMemory(storage: MemoryStorage | null, memory: Memory): void {
  if (!storage) return;
  try {
    if (memory === null) storage.removeItem(MEMORY_STORAGE_KEY);
    else storage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(memory));
  } catch {
    // Quota exceeded or storage disabled: keep working with in-memory state only.
  }
}
