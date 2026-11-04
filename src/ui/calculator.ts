import './calculator.css';
import { formatExpression, initialState, isKeyId, KEYS, press, type CalcState } from './input';

export function mountCalculator(root: HTMLElement): void {
  root.innerHTML = `
    <section class="glass calculator" aria-label="계산기">
      <div class="calculator__display">
        <div class="calculator__expression" aria-label="수식"></div>
        <output class="calculator__result" aria-live="polite"></output>
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
  const keypad = root.querySelector<HTMLElement>('.calculator__keypad')!;

  let state: CalcState = initialState;

  const render = () => {
    expressionEl.textContent = formatExpression(state.expression);
    resultEl.textContent = state.result?.text ?? '';
    resultEl.classList.toggle('calculator__result--error', state.result?.kind === 'error');
  };

  keypad.addEventListener('click', (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button[data-key]');
    const key = button?.dataset.key;
    if (!key || !isKeyId(key)) return;
    state = press(state, key);
    render();
  });

  render();
}
