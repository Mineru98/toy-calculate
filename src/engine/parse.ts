import { failure, type CalcFailure } from './result';
import type { Operator, PostfixOperator, Token } from './tokenize';

export type Node =
  | { type: 'number'; value: number }
  | { type: 'negate'; operand: Node }
  | { type: 'postfix'; operator: PostfixOperator; operand: Node; position: number }
  | { type: 'binary'; operator: Operator; left: Node; right: Node; position: number };

class ParseError {
  constructor(readonly result: CalcFailure) {}
}

/**
 * Recursive-descent parser. Precedence, lowest to highest:
 *   expression := term (('+' | '-') term)*
 *   term       := unary (('*' | '/') unary)*
 *   unary      := '-' unary | power
 *   power      := postfix ('^' unary)?      (right-associative)
 *   postfix    := primary ('!' | '%')*
 *   primary    := number | '(' expression ')'
 * So `-2^2` is `-(2^2)` and `2^-2` is `2^(-2)`.
 * Postfix binds tightest: `-3!` is `-(3!)`, `2^3!` is `2^(3!)`, `3!^2` is `(3!)^2`.
 */
export function parse(tokens: Token[], inputLength: number): { ok: true; ast: Node } | CalcFailure {
  let index = 0;
  let depth = 0;

  const peek = (): Token | undefined => tokens[index];
  const fail = (...args: Parameters<typeof failure>): never => {
    throw new ParseError(failure(...args));
  };
  const isOperator = (token: Token | undefined, ...ops: Operator[]): boolean =>
    token?.type === 'operator' && ops.includes(token.value);

  function expression(): Node {
    let left = term();
    while (isOperator(peek(), '+', '-')) {
      const token = tokens[index++] as Extract<Token, { type: 'operator' }>;
      left = { type: 'binary', operator: token.value, left, right: term(), position: token.position };
    }
    return left;
  }

  function term(): Node {
    let left = unary();
    while (isOperator(peek(), '*', '/')) {
      const token = tokens[index++] as Extract<Token, { type: 'operator' }>;
      left = { type: 'binary', operator: token.value, left, right: unary(), position: token.position };
    }
    return left;
  }

  function unary(): Node {
    if (isOperator(peek(), '-')) {
      index++;
      return { type: 'negate', operand: unary() };
    }
    return power();
  }

  function power(): Node {
    const base = postfix();
    if (isOperator(peek(), '^')) {
      const token = tokens[index++] as Extract<Token, { type: 'operator' }>;
      return { type: 'binary', operator: '^', left: base, right: unary(), position: token.position };
    }
    return base;
  }

  function postfix(): Node {
    let operand = primary();
    for (let token = peek(); token?.type === 'postfix'; token = peek()) {
      index++;
      operand = { type: 'postfix', operator: token.value, operand, position: token.position };
    }
    return operand;
  }

  function primary(): Node {
    const token = peek();
    if (token === undefined) {
      return depth > 0
        ? fail('MISMATCHED_PARENTHESIS', "닫는 괄호 ')' 가 없습니다", inputLength)
        : fail('UNEXPECTED_TOKEN', '수식 끝에 피연산자가 빠졌습니다', inputLength);
    }
    if (token.type === 'number') {
      index++;
      return { type: 'number', value: token.value };
    }
    if (token.type === 'paren' && token.value === '(') {
      index++;
      depth++;
      const inner = expression();
      const closing = peek();
      if (closing?.type !== 'paren' || closing.value !== ')') {
        return fail('MISMATCHED_PARENTHESIS', "닫는 괄호 ')' 가 없습니다", token.position);
      }
      index++;
      depth--;
      return inner;
    }
    if (token.type === 'paren') {
      return depth > 0
        ? fail('UNEXPECTED_TOKEN', "')' 앞에 피연산자가 빠졌습니다", token.position)
        : fail('MISMATCHED_PARENTHESIS', "짝이 없는 닫는 괄호 ')'", token.position);
    }
    return fail('UNEXPECTED_TOKEN', `피연산자 자리에 연산자 '${token.value}' 가 왔습니다`, token.position);
  }

  try {
    const ast = expression();
    const rest = peek();
    if (rest !== undefined) {
      if (rest.type === 'paren' && rest.value === ')') {
        fail('MISMATCHED_PARENTHESIS', "짝이 없는 닫는 괄호 ')'", rest.position);
      }
      fail('UNEXPECTED_TOKEN', '연산자가 빠졌습니다', rest.position);
    }
    return { ok: true, ast };
  } catch (error) {
    if (error instanceof ParseError) return error.result;
    throw error;
  }
}
