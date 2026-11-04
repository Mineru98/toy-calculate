import './calculator.css';
import {
  formatExpression,
  initialState,
  isKeyId,
  KEYS,
  press,
  SCIENTIFIC_KEYS,
  toggleAngleMode,
  type CalcState,
  type KeyDef,
} from './input';

const renderKey = (key: KeyDef): string =>
  `<button type="button" class="btn btn--${key.variant}" data-key="${key.id}"${
    key.ariaLabel ? ` aria-label="${key.ariaLabel}"` : ''
  }>${key.label}</button>`;

export function mountCalculator(root: HTMLElement): void {
  root.innerHTML = `
    <section class="glass calculator" aria-label="계산기">
      <div class="calculator__display">
        <button type="button" class="calculator__angle"></button>
        <div class="calculator__expression" aria-label="수식"></div>
        <output class="calculator__result" aria-live="polite"></output>
      </div>
      <div class="calculator__scientific">${SCIENTIFIC_KEYS.map(renderKey).join('')}</div>
      <div class="calculator__keypad">${KEYS.map(renderKey).join('')}</div>
    </section>
  `;

  const expressionEl = root.querySelector<HTMLElement>('.calculator__expression')!;
  const resultEl = root.querySelector<HTMLElement>('.calculator__result')!;
  const angleEl = root.querySelector<HTMLButtonElement>('.calculator__angle')!;
  const calculatorEl = root.querySelector<HTMLElement>('.calculator')!;

  let state: CalcState = initialState;

  const render = () => {
    expressionEl.textContent = formatExpression(state.expression);
    resultEl.textContent = state.result?.text ?? '';
    resultEl.classList.toggle('calculator__result--error', state.result?.kind === 'error');
    angleEl.textContent = state.angleMode;
    angleEl.setAttribute('aria-label', `각도 모드 ${state.angleMode}, 눌러서 전환`);
  };

  angleEl.addEventListener('click', () => {
    state = toggleAngleMode(state);
    render();
  });

  calculatorEl.addEventListener('click', (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button[data-key]');
    const key = button?.dataset.key;
    if (!key || !isKeyId(key)) return;
    state = press(state, key);
    render();
  });

  render();
}
