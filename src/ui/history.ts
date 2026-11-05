import type { CalcState } from './input';
import type { MemoryStorage } from './memory';

export interface HistoryEntry {
  /** Expression in engine syntax (ASCII operators). */
  expression: string;
  result: string;
}

export const HISTORY_LIMIT = 50;

/** Prepends an entry, dropping the oldest ones beyond `limit`. */
export function addEntry(
  history: readonly HistoryEntry[],
  entry: HistoryEntry,
  limit: number = HISTORY_LIMIT,
): readonly HistoryEntry[] {
  return [entry, ...history].slice(0, limit);
}

/** Records a successful calculation. Error results and uncalculated states are not recorded. */
export function record(history: readonly HistoryEntry[], state: CalcState): readonly HistoryEntry[] {
  if (state.result?.kind !== 'value') return history;
  return addEntry(history, { expression: state.expression, result: state.result.text });
}

export function clearHistory(): readonly HistoryEntry[] {
  return [];
}

export const HISTORY_STORAGE_KEY = 'toy-calculate:history:v1';

function isHistoryEntry(value: unknown): value is HistoryEntry {
  if (typeof value !== 'object' || value === null) return false;
  const { expression, result } = value as Record<string, unknown>;
  return typeof expression === 'string' && typeof result === 'string';
}

/** Reads the stored history. Missing, corrupted or unreadable values start as an empty history. */
export function loadHistory(storage: MemoryStorage | null): readonly HistoryEntry[] {
  if (!storage) return [];
  try {
    const raw = storage.getItem(HISTORY_STORAGE_KEY);
    if (raw === null) return [];
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value) || !value.every(isHistoryEntry)) return [];
    return value.slice(0, HISTORY_LIMIT).map(({ expression, result }) => ({ expression, result }));
  } catch {
    return [];
  }
}

/** Persists the history; an empty history removes the key. Storage failures are ignored. */
export function saveHistory(storage: MemoryStorage | null, history: readonly HistoryEntry[]): void {
  if (!storage) return;
  try {
    if (history.length === 0) storage.removeItem(HISTORY_STORAGE_KEY);
    else storage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
  } catch {
    // Quota exceeded or storage disabled: keep working with in-memory history only.
  }
}
