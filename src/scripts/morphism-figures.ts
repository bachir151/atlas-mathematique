// Controller of <MorphismFigure>: two numeric fields and the buttons update one
// state; the line, the text reading and the table are re-rendered.
import { FIELDS, MORPHISM_PRESET, RANGE, clampField, morphismReading, morphismText, type MorphismField, type MorphismState } from '../figures/morphism';
import { morphismSvg } from '../figures/morphism-svg';

export function initMorphismFigure(root: HTMLElement): void {
  const svg = root.querySelector<SVGSVGElement>('[data-morphism-svg]')!;
  const rows = root.querySelector<HTMLElement>('[data-morphism-rows]')!;
  const status = root.querySelector<HTMLElement>('[data-morphism-status]')!;
  const table = root.querySelector<HTMLElement>('[data-morphism-table]')!;
  const fields = Array.from(root.querySelectorAll<HTMLInputElement>('[data-param]'));
  const buttons = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-action]'));
  let state: MorphismState = { ...MORPHISM_PRESET };

  const cell = (tag: 'dt' | 'dd' | 'td', value: string) => {
    const element = document.createElement(tag);
    element.textContent = value;
    return element;
  };

  /** Availability of an action in the current state. */
  function available(action: string): boolean {
    if (action === 'reset') return state.m !== MORPHISM_PRESET.m || state.n !== MORPHISM_PRESET.n;
    const [name, direction] = action.split('-') as [MorphismField, 'up' | 'down'];
    return direction === 'up' ? state[name] < RANGE[1] : state[name] > RANGE[0];
  }

  function render() {
    const reading = morphismReading(state);
    const text = morphismText(reading);
    svg.innerHTML = morphismSvg(reading);
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
      const value = String(state[field.dataset.param as MorphismField]);
      if (field.value !== value && document.activeElement !== field) field.value = value;
    }
    for (const button of buttons) button.setAttribute('aria-disabled', String(!available(button.dataset.action!)));
  }

  for (const field of fields) {
    const name = field.dataset.param as MorphismField;
    if (!FIELDS.includes(name)) continue;
    field.disabled = false;
    field.addEventListener('input', () => {
      if (field.value === '') return;
      const value = clampField(field.value, state[name]);
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
      if (action === 'reset') state = { ...MORPHISM_PRESET };
      else {
        const [name, direction] = action.split('-') as [MorphismField, 'up' | 'down'];
        state = { ...state, [name]: state[name] + (direction === 'up' ? 1 : -1) };
      }
      render();
    });
  }
  svg.classList.add('is-interactive');
  render();
}
