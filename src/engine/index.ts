import { evaluate } from './evaluate';
import { parse } from './parse';
import { failure, type CalcResult } from './result';
import { tokenize } from './tokenize';

export type { CalcError, CalcErrorCode, CalcFailure, CalcResult, CalcSuccess } from './result';

/** Evaluates an arithmetic expression string. Never throws; errors come back as `{ ok: false }`. */
export function calculate(expression: string): CalcResult {
  if (expression.trim() === '') {
    return failure('EMPTY_INPUT', '수식이 비어 있습니다');
  }
  const lexed = tokenize(expression);
  if (!lexed.ok) return lexed;
  try {
    const parsed = parse(lexed.tokens, expression.length);
    if (!parsed.ok) return parsed;
    return evaluate(parsed.ast);
  } catch (error) {
    // Parser and evaluator are recursive; pathological nesting can exhaust the call stack.
    if (error instanceof RangeError) {
      return failure('TOO_DEEP', '수식이 너무 깊게 중첩되었습니다');
    }
    throw error;
  }
}
