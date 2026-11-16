// Controller of <QuotientFigure>: three numeric fields (n, a, b) and the
// +n / −n buttons update one state; drawing, text reading and table are
// re-rendered.
import { FIELDS, QUOTIENT_PRESET, clampField, quotientReading, quotientText, shifted, type QuotientField, type QuotientState } from '../figures/quotient';
import { quotientSvg } from '../figures/quotient-svg';

export function initQuotientFigure(root: HTMLElement): void {
  const svg = root.querySelector<SVGSVGElement>('[data-quotient-svg]')!;
  const rows = root.querySelector<HTMLElement>('[data-quotient-rows]')!;
  const status = root.querySelector<HTMLElement>('[data-quotient-status]')!;
  const head = root.querySelector<HTMLElement>('[data-quotient-head]')!;
  const table = root.querySelector<HTMLElement>('[data-quotient-table]')!;
  const caption = root.querySelector<HTMLElement>('[data-quotient-caption]')!;
  const fields = Array.from(root.querySelectorAll<HTMLInputElement>('[data-param]'));
  const buttons = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-action]'));
  let state: QuotientState = { ...QUOTIENT_PRESET };

  const cell = (tag: 'dt' | 'dd' | 'td' | 'th', value: string, scope?: 'col' | 'row') => {
    const element = document.createElement(tag);
    element.textContent = value;
    if (scope) element.setAttribute('scope', scope);
    return element;
  };

  /** Availability of an action in the current state. */
  function available(action: string): boolean {
    if (action === 'reset') return FIELDS.some(name => state[name] !== QUOTIENT_PRESET[name]);
    const [name, direction] = action.split('-') as ['a' | 'b', 'up' | 'down'];
    return shifted(state, name, direction === 'up' ? 1 : -1) !== undefined;
  }

  function render() {
    const reading = quotientReading(state);
    const text = quotientText(reading);
    svg.innerHTML = quotientSvg(reading);
    rows.replaceChildren(...text.rows.map(([term, value]) => {
      const row = document.createElement('div');
      row.append(cell('dt', term), cell('dd', value));
      return row;
    }));
    const headRow = document.createElement('tr');
    headRow.append(cell('th', '+', 'col'), ...text.head.map(label => cell('th', label, 'col')));
    head.replaceChildren(headRow);
    table.replaceChildren(...text.body.map(({ header, cells }, i) => {
      const row = document.createElement('tr');
      row.append(cell('th', header, 'row'), ...cells.map((value, j) => {
        const td = cell('td', value);
        if (i === text.current.row && j === text.current.col) td.setAttribute('aria-current', 'true');
        return td;
      }));
      return row;
    }));
    if (caption.textContent !== text.caption) caption.textContent = text.caption;
    if (status.textContent !== text.status) status.textContent = text.status;
    for (const field of fields) {
      const value = String(state[field.dataset.param as QuotientField]);
      if (field.value !== value && document.activeElement !== field) field.value = value;
    }
    for (const button of buttons) {
      const action = button.dataset.action!;
      if (action !== 'reset') {
        const label = `${action[0]} ${action.endsWith('up') ? '+' : '−'} ${state.n}`;
        if (button.textContent !== label) button.textContent = label;
      }
      button.setAttribute('aria-disabled', String(!available(action)));
    }
  }

  for (const field of fields) {
    const name = field.dataset.param as QuotientField;
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
      if (action === 'reset') state = { ...QUOTIENT_PRESET };
      else {
        const [name, direction] = action.split('-') as ['a' | 'b', 'up' | 'down'];
        state = { ...state, [name]: shifted(state, name, direction === 'up' ? 1 : -1)! };
      }
      render();
    });
  }
  svg.classList.add('is-interactive');
  render();
}
