import { calculate } from '/home/mineru/workspace/toy-calculate-issue-3/src/engine/index';
const cases: [string, 'DEG' | 'RAD'][] = [
  ['sin(90)', 'DEG'], ['sin(π/2)', 'RAD'], ['asin(1)', 'DEG'], ['sin(180)', 'DEG'],
  ['cos(60)', 'DEG'], ['tan(45)', 'DEG'], ['tan(90)', 'DEG'], ['log(1000)', 'RAD'],
  ['ln(e)', 'RAD'], ['sqrt(16)', 'RAD'], ['abs(-3)', 'RAD'], ['2*pi', 'RAD'],
  ['sqrt(-1)', 'RAD'], ['log(0)', 'RAD'], ['ln(-1)', 'RAD'], ['asin(2)', 'DEG'],
  ['acos(-2)', 'DEG'], ['foo(1)', 'RAD'], ['2+3*4', 'RAD'],
];
for (const [expr, mode] of cases) {
  const r = (calculate as (e: string, o?: unknown) => ReturnType<typeof calculate>)(expr, { angleMode: mode });
  console.log(`${mode} ${expr.padEnd(10)} → ${r.ok ? `ok ${r.value}` : `error ${r.error.code}`}`);
}
