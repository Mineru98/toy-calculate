export type CalcErrorCode =
  | 'EMPTY_INPUT'
  | 'UNKNOWN_CHARACTER'
  | 'INVALID_NUMBER'
  | 'UNEXPECTED_TOKEN'
  | 'MISMATCHED_PARENTHESIS'
  | 'DIVISION_BY_ZERO'
  | 'TOO_DEEP';

export interface CalcError {
  code: CalcErrorCode;
  message: string;
  /** 0-based index into the input string, when the error points at a location. */
  position?: number;
}

export type CalcSuccess = { ok: true; value: number };
export type CalcFailure = { ok: false; error: CalcError };
export type CalcResult = CalcSuccess | CalcFailure;

export function success(value: number): CalcSuccess {
  return { ok: true, value };
}

export function failure(code: CalcErrorCode, message: string, position?: number): CalcFailure {
  return position === undefined
    ? { ok: false, error: { code, message } }
    : { ok: false, error: { code, message, position } };
}
