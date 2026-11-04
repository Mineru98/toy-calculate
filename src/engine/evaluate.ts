import { applyFunction, type AngleMode } from './functions';
import type { Node } from './parse';
import { failure, success, type CalcResult } from './result';

export function evaluate(node: Node, angleMode: AngleMode): CalcResult {
  switch (node.type) {
    case 'number':
      return success(node.value);
    case 'negate': {
      const operand = evaluate(node.operand, angleMode);
      return operand.ok ? success(-operand.value) : operand;
    }
    case 'call': {
      const argument = evaluate(node.argument, angleMode);
      if (!argument.ok) return argument;
      const value = applyFunction(node.name, argument.value, angleMode);
      return value === null
        ? failure('DOMAIN_ERROR', `${node.name}(${argument.value}) 는 정의역 밖입니다`, node.position)
        : success(value);
    }
    case 'binary': {
      const left = evaluate(node.left, angleMode);
      if (!left.ok) return left;
      const right = evaluate(node.right, angleMode);
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
