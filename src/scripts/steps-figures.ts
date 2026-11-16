// Controller of <StepsFigure>: four numeric fields and the coefficient buttons
// update one state; the line, the text reading and the table are re-rendered.
import { COEFFICIENT_LIMITS, FIELDS, STEPS_PRESET, clampField, stepsReading, stepsText, type StepsField, type StepsState } from '../figures/steps';
import { stepsSvg } from '../figures/steps-svg';

export function initStepsFigure(root: HTMLElement): void {
  const svg = root.querySelector<SVGSVGElement>('[data-steps-svg]')!;
  const rows = root.querySelector<HTMLElement>('[data-steps-rows]')!;
  const status = root.querySelector<HTMLElement>('[data-steps-status]')!;
  const table = root.querySelector<HTMLElement>('[data-steps-table]')!;
  const fields = Array.from(root.querySelectorAll<HTMLInputElement>('[data-param]'));
  const buttons = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-action]'));
  let state: StepsState = { ...STEPS_PRESET };

  const cell = (tag: 'dt' | 'dd' | 'td', value: string) => {
    const element = document.createElement(tag);
    element.textContent = value;
    return element;
  };

  /** Availability of an action in the current state. */
  function available(action: string): boolean {
    if (action === 'reset') return state.m !== 0 || state.n !== 0;
    const [name, direction] = action.split('-') as ['m' | 'n', 'up' | 'down'];
    const [min, max] = COEFFICIENT_LIMITS[name];
    return direction === 'up' ? state[name] < max : state[name] > min;
  }

  function render() {
    const reading = stepsReading(state);
    const text = stepsText(state, reading);
    svg.innerHTML = stepsSvg(reading);
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
    if (status.textContent !== text.status) status.textContent = text.status;
    for (const field of fields) {
      const value = String(state[field.dataset.param as StepsField]);
      if (field.value !== value && document.activeElement !== field) field.value = value;
    }
    for (const button of buttons) button.setAttribute('aria-disabled', String(!available(button.dataset.action!)));
  }

  for (const field of fields) {
    const name = field.dataset.param as StepsField;
    if (!FIELDS.includes(name)) continue;
    field.disabled = false;
    field.addEventListener('input', () => {
      if (field.value === '') return;
      const value = clampField(name, field.value, state[name]);
      if (value === state[name]) return;
      state = { ...state, [name]: value };
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
      if (action === 'reset') state = { ...state, m: 0, n: 0 };
      else {
        const [name, direction] = action.split('-') as ['m' | 'n', 'up' | 'down'];
        state = { ...state, [name]: state[name] + (direction === 'up' ? 1 : -1) };
      }
      render();
    });
  }
  svg.classList.add('is-interactive');
  render();
}
