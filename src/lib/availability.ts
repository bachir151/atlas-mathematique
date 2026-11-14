/**
 * Marks a control as temporarily unavailable without removing it from the
 * keyboard order. A natively disabled button that holds focus drops it to
 * <body>, so keyboard and screen-reader users would lose their place when a
 * control becomes unavailable under their focus. Server-rendered `disabled`
 * attributes only describe the no-JavaScript state and are lifted here.
 *
 * `aria-disabled` does not block activation: every handler must check
 * `isAvailable()` before acting.
 */
export function setAvailable(button: HTMLButtonElement, available: boolean): void {
  button.disabled = false;
  if (available) button.removeAttribute('aria-disabled');
  else button.setAttribute('aria-disabled', 'true');
}

export function isAvailable(button: HTMLButtonElement): boolean {
  return !button.disabled && button.getAttribute('aria-disabled') !== 'true';
}
