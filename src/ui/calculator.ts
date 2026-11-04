import './calculator.css';
import { formatExpression, initialState, isKeyId, KEYS, press, type CalcState } from './input';
import { browserStorage, isMemoryKeyId, loadMemory, MEMORY_KEYS, pressMemory, saveMemory } from './memory';

export function mountCalculator(root: HTMLElement): void {
  root.innerHTML = `
    <section class="glass calculator" aria-label="계산기">
      <div class="calculator__display">
        <div class="calculator__memory" aria-label="메모리" hidden></div>
        <div class="calculator__expression" aria-label="수식"></div>
        <output class="calculator__result" aria-live="polite"></output>
      </div>
      <div class="calculator__memory-keys">
        ${MEMORY_KEYS.map(
          (key) =>
            `<button type="button" class="btn btn--function" data-memory-key="${key.id}" aria-label="${key.ariaLabel}">${key.label}</button>`,
        ).join('')}
      </div>
      <div class="calculator__keypad">
        ${KEYS.map(
          (key) =>
            `<button type="button" class="btn btn--${key.variant}" data-key="${key.id}"${
              key.ariaLabel ? ` aria-label="${key.ariaLabel}"` : ''
            }>${key.label}</button>`,
        ).join('')}
      </div>
    </section>
  `;

  const expressionEl = root.querySelector<HTMLElement>('.calculator__expression')!;
  const resultEl = root.querySelector<HTMLElement>('.calculator__result')!;
  const memoryEl = root.querySelector<HTMLElement>('.calculator__memory')!;
  const memoryKeys = root.querySelector<HTMLElement>('.calculator__memory-keys')!;
  const keypad = root.querySelector<HTMLElement>('.calculator__keypad')!;

  const storage = browserStorage();
  let state: CalcState = initialState;
  let memory = loadMemory(storage);

  const render = () => {
    expressionEl.textContent = formatExpression(state.expression);
    resultEl.textContent = state.result?.text ?? '';
    resultEl.classList.toggle('calculator__result--error', state.result?.kind === 'error');
    memoryEl.hidden = memory === null;
    memoryEl.textContent = memory === null ? '' : `M ${formatExpression(String(memory))}`;
  };

  keypad.addEventListener('click', (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button[data-key]');
    const key = button?.dataset.key;
    if (!key || !isKeyId(key)) return;
    state = press(state, key);
    render();
  });

  memoryKeys.addEventListener('click', (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button[data-memory-key]');
    const key = button?.dataset.memoryKey;
    if (!key || !isMemoryKeyId(key)) return;
    const step = pressMemory(memory, state, key);
    if (step.memory !== memory) saveMemory(storage, step.memory);
    ({ memory, state } = step);
    render();
  });

  render();
}
