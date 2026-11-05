import './calculator.css';
import { clearHistory, record, type HistoryEntry } from './history';
import { formatExpression, initialState, isKeyId, KEYS, press, type CalcState, type InputKey } from './input';
import { isEditableTarget, keyFromEvent } from './keyboard';

export function mountCalculator(root: HTMLElement): void {
  root.innerHTML = `
    <div class="app-layout">
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
      <section class="glass history" aria-labelledby="history-title">
        <div class="history__header">
          <h2 class="history__title" id="history-title">기록</h2>
          <button type="button" class="btn btn--function history__clear">전체 삭제</button>
        </div>
        <p class="history__empty">아직 계산 기록이 없습니다</p>
        <ol class="history__list"></ol>
      </section>
    </div>
  `;

  const expressionEl = root.querySelector<HTMLElement>('.calculator__expression')!;
  const resultEl = root.querySelector<HTMLElement>('.calculator__result')!;
  const keypad = root.querySelector<HTMLElement>('.calculator__keypad')!;
  const historyList = root.querySelector<HTMLOListElement>('.history__list')!;
  const historyEmpty = root.querySelector<HTMLElement>('.history__empty')!;
  const historyClear = root.querySelector<HTMLButtonElement>('.history__clear')!;

  let state: CalcState = initialState;
  let history: readonly HistoryEntry[] = [];

  const render = () => {
    expressionEl.textContent = formatExpression(state.expression);
    resultEl.textContent = state.result?.text ?? '';
    resultEl.classList.toggle('calculator__result--error', state.result?.kind === 'error');
  };

  const renderHistory = () => {
    historyList.replaceChildren(
      ...history.map((entry, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'btn btn--number history__item';
        button.dataset.index = String(index);
        const expression = document.createElement('span');
        expression.className = 'history__expression';
        expression.textContent = formatExpression(entry.expression);
        const result = document.createElement('span');
        result.className = 'history__result';
        result.textContent = `= ${entry.result}`;
        button.append(expression, result);
        const item = document.createElement('li');
        item.append(button);
        return item;
      }),
    );
    historyEmpty.hidden = history.length > 0;
    historyClear.disabled = history.length === 0;
  };

  /** Shared by keypad clicks and keyboard input: a successful `=` also lands in the history. */
  const apply = (key: InputKey) => {
    state = press(state, key);
    render();
    if (key === 'equals') {
      history = record(history, state);
      renderHistory();
    }
  };

  keypad.addEventListener('click', (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button[data-key]');
    const key = button?.dataset.key;
    if (!key || !isKeyId(key)) return;
    apply(key);
  });

  historyList.addEventListener('click', (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button[data-index]');
    const entry = button && history[Number(button.dataset.index)];
    if (!entry) return;
    state = { expression: entry.expression, result: null };
    render();
  });

  historyClear.addEventListener('click', () => {
    history = clearHistory();
    renderHistory();
  });

  document.addEventListener('keydown', (event) => {
    if (isEditableTarget(event.target)) return;
    const key = keyFromEvent(event);
    if (!key) return;
    // Enter on a non-keypad button (history item, clear, ...) keeps its own activation.
    if (event.key === 'Enter' && event.target instanceof HTMLElement && event.target.matches('button:not([data-key])')) return;
    // Stops a focused keypad button from also firing its click on Enter.
    event.preventDefault();
    // A held Enter/= auto-repeats; only the first press computes and records.
    if (event.repeat && key === 'equals') return;
    apply(key);
  });

  render();
  renderHistory();
}
