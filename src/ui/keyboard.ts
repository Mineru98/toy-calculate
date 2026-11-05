import { isKeyId, type InputKey } from './input';

const NAMED_KEYS: Record<string, InputKey> = {
  Enter: 'equals',
  '=': 'equals',
  Backspace: 'backspace',
  Escape: 'clear',
};

const ENGINE_ONLY_CHARS = new Set<string>(['^', '%', '!']);

/** Maps a keydown to a calculator input. Returns `null` for keys the calculator does not handle. */
export function keyFromEvent(
  event: Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'metaKey' | 'altKey' | 'isComposing'>,
): InputKey | null {
  // Leave browser/OS shortcuts (Ctrl+R, Cmd+C, ...) and IME composition alone.
  if (event.ctrlKey || event.metaKey || event.altKey || event.isComposing) return null;
  const named = NAMED_KEYS[event.key];
  if (named) return named;
  if (event.key.length !== 1) return null;
  if (ENGINE_ONLY_CHARS.has(event.key)) return event.key as InputKey;
  // Word keys like 'clear' are multi-character, so single characters only match keypad symbols.
  return isKeyId(event.key) ? event.key : null;
}

/** True when the event comes from a field that needs its own typing (input, textarea, ...). */
export function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || target.matches('input, textarea, select');
}
