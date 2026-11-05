import type { CalcState } from './input';

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
