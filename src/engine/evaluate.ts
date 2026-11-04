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
