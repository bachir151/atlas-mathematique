// Controller of <PolyFigure>: four numeric fields and the ± buttons update one
// state; the drawing, the text reading and the table are re-rendered together.
import { FIELDS, LIMITS, POLY_PRESET, clampField, int, polyReading, polyText, type PolyField, type PolyState } from '../figures/poly';
import { polySvg } from '../figures/poly-svg';

export function initPolyFigure(root: HTMLElement): void {
  const svg = root.querySelector<SVGSVGElement>('[data-poly-svg]')!;
  const rows = root.querySelector<HTMLElement>('[data-poly-rows]')!;
  const status = root.querySelector<HTMLElement>('[data-poly-status]')!;
  const table = root.querySelector<HTMLElement>('[data-poly-table]')!;
  const fields = Array.from(root.querySelectorAll<HTMLInputElement>('[data-poly-param]'));
  const buttons = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-poly-action]'));
  let state: PolyState = { ...POLY_PRESET };

  const cell = (tag: 'dt' | 'dd' | 'td' | 'th', value: string, current = false) => {
    const element = document.createElement(tag);
    element.textContent = value;
    if (tag === 'th') element.setAttribute('scope', 'row');
    if (current) element.setAttribute('aria-current', 'true');
    return element;
  };

  /** Availability of an action in the current state. */
  function available(action: string): boolean {
    if (action === 'reset') return FIELDS.some(name => state[name] !== POLY_PRESET[name]);
    const [name, direction] = action.split('-') as [PolyField, 'up' | 'down'];
    const [min, max] = LIMITS[name];
    return direction === 'up' ? state[name] < max : state[name] > min;
  }

  function render() {
    const reading = polyReading(state);
    const text = polyText(state, reading);
    svg.innerHTML = polySvg(state, reading);
    rows.replaceChildren(...text.rows.map(([term, value]) => {
      const row = document.createElement('div');
      row.append(cell('dt', term), cell('dd', value));
      return row;
    }));
    table.replaceChildren(...text.table.map(([x, y]) => {
      const row = document.createElement('tr');
      const current = x === int(state.a);
      row.append(cell('th', x, current), cell('td', y, current));
      return row;
    }));
    if (status.textContent !== text.status) status.textContent = text.status;
    for (const field of fields) {
      const value = String(state[field.dataset.polyParam as PolyField]);
      if (field.value !== value && document.activeElement !== field) field.value = value;
    }
    for (const button of buttons) button.setAttribute('aria-disabled', String(!available(button.dataset.polyAction!)));
  }

  for (const field of fields) {
    const name = field.dataset.polyParam as PolyField;
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
      const action = button.dataset.polyAction!;
      if (!available(action)) return;
      if (action === 'reset') state = { ...POLY_PRESET };
      else {
        const [name, direction] = action.split('-') as [PolyField, 'up' | 'down'];
        state = { ...state, [name]: state[name] + (direction === 'up' ? 1 : -1) };
      }
      render();
    });
  }
  svg.classList.add('is-interactive');
  render();
}
