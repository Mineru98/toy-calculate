const { calculate } = await import(process.cwd() + '/src/engine/index.ts');
const cases = ['50%', '200*10%', '5!', '0!', '(-1)!', '2.5!', '171!', '-3!', '2^3!', '3!^2', '2^3^2', '-2^2'];
for (const c of cases) console.log(c.padEnd(10), JSON.stringify(calculate(c)));
