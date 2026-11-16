// Controller of <CycleFigure>: the fields n and k restart the dial; the three
// buttons move the hand. The dial, the text reading and the history table are
// re-rendered after each change.
import { CYCLE_PRESET, FIELDS, canGesture, clampField, cycleText, gesture, startState, type CycleField, type CycleState } from '../figures/cycle';
import { cycleSvg } from '../figures/cycle-svg';

export function initCycleFigure(root: HTMLElement): void {
  const svg = root.querySelector<SVGSVGElement>('[data-cycle-svg]')!;
  const rows = root.querySelector<HTMLElement>('[data-cycle-rows]')!;
  const status = root.querySelector<HTMLElement>('[data-cycle-status]')!;
  const note = root.querySelector<HTMLElement>('[data-cycle-note]')!;
  const table = root.querySelector<HTMLElement>('[data-cycle-table]')!;
  const fields = Array.from(root.querySelectorAll<HTMLInputElement>('[data-param]'));
  const buttons = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-action]'));
  let state: CycleState = startState(CYCLE_PRESET.n, CYCLE_PRESET.k);

  const cell = (tag: 'dt' | 'dd' | 'td', value: string) => {
    const element = document.createElement(tag);
    element.textContent = value;
    return element;
  };

  /** Availability of an action in the current state. */
  const available = (action: string) => (action === 'reset' ? state.gestures > 0 : canGesture(state));

  function render() {
    const text = cycleText(state);
    svg.innerHTML = cycleSvg(state);
    rows.replaceChildren(...text.rows.map(([term, value]) => {
      const row = document.createElement('div');
      row.append(cell('dt', term), cell('dd', value));
      return row;
    }));
    table.replaceChildren(...text.table.map(values => {
      const row = document.createElement('tr');
      row.append(...values.map(value => cell('td', value)));
      return row;
    }));
    note.textContent = text.historyNote;
    if (status.textContent !== text.status) status.textContent = text.status;
    for (const field of fields) {
      const value = String(state[field.dataset.param as CycleField]);
      if (field.value !== value && document.activeElement !== field) field.value = value;
    }
    for (const button of buttons) button.setAttribute('aria-disabled', String(!available(button.dataset.action!)));
  }

  for (const field of fields) {
    const name = field.dataset.param as CycleField;
    if (!FIELDS.includes(name)) continue;
    field.disabled = false;
    field.addEventListener('input', () => {
      if (field.value === '') return;
      const value = clampField(name, field.value, state[name]);
      if (value === state[name]) return;
      // Changing n or k restarts the dial at position 0.
      state = startState(name === 'n' ? value : state.n, name === 'k' ? value : state.k);
      render();
    });
    // On leaving the field, show the value actually used (clamped, rounded).
    field.addEventListener('change', () => { field.value = String(state[name]); });
  }
  for (const button of buttons) {
    button.disabled = false;
    button.addEventListener('click', () => {
      const action = button.dataset.action!;
      if (!available(action)) return;
      if (action === 'reset') state = startState(state.n, state.k);
      else state = gesture(state, action === 'forward' ? 1 : -1);
      render();
    });
  }
  svg.classList.add('is-interactive');
  render();
}
