import type { Node } from './parse';
import { failure, success, type CalcResult } from './result';

export function evaluate(node: Node): CalcResult {
  switch (node.type) {
    case 'number':
      return success(node.value);
    case 'negate': {
      const operand = evaluate(node.operand);
      return operand.ok ? success(-operand.value) : operand;
    }
    case 'postfix': {
      const operand = evaluate(node.operand);
      if (!operand.ok) return operand;
      if (node.operator === '%') return success(operand.value / 100);
      return factorial(operand.value, node.position);
    }
    case 'binary': {
      const left = evaluate(node.left);
      if (!left.ok) return left;
      const right = evaluate(node.right);
      if (!right.ok) return right;
      switch (node.operator) {
        case '+':
          return success(left.value + right.value);
        case '-':
          return success(left.value - right.value);
        case '*':
          return success(left.value * right.value);
        case '/':
          if (right.value === 0) {
            return failure('DIVISION_BY_ZERO', '0 으로 나눌 수 없습니다', node.position);
          }
          return success(left.value / right.value);
        case '^':
          return success(left.value ** right.value);
      }
    }
  }
}

function factorial(n: number, position: number): CalcResult {
  if (!Number.isInteger(n) || n < 0) {
    return failure('DOMAIN_ERROR', '계승은 0 이상의 정수에만 정의됩니다', position);
  }
  let product = 1;
  for (let k = 2; k <= n; k++) {
    product *= k;
    if (!Number.isFinite(product)) {
      return failure('OVERFLOW', '계승 결과가 너무 큽니다', position);
    }
  }
  return success(product);
}
