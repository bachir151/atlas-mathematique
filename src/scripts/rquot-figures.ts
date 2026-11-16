// Controller of <RingQuotientFigure>: three numeric fields (n, a, b) and the
// +n / −n buttons update one state; drawing, text reading and the two tables
// are re-rendered.
import { FIELDS, RQUOT_PRESET, clampField, rquotReading, rquotText, shifted, type RQuotField, type RQuotState, type RQuotTable } from '../figures/rquot';
import { rquotSvg } from '../figures/rquot-svg';

export function initRingQuotientFigure(root: HTMLElement): void {
  const svg = root.querySelector<SVGSVGElement>('[data-rquot-svg]')!;
  const rows = root.querySelector<HTMLElement>('[data-rquot-rows]')!;
  const status = root.querySelector<HTMLElement>('[data-rquot-status]')!;
  const fields = Array.from(root.querySelectorAll<HTMLInputElement>('[data-rquot-param]'));
  const buttons = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-rquot-action]'));
  let state: RQuotState = { ...RQUOT_PRESET };

  const cell = (tag: 'dt' | 'dd' | 'td' | 'th', value: string, scope?: 'col' | 'row') => {
    const element = document.createElement(tag);
    element.textContent = value;
    if (scope) element.setAttribute('scope', scope);
    return element;
  };

  /** Availability of an action in the current state. */
  function available(action: string): boolean {
    if (action === 'reset') return FIELDS.some(name => state[name] !== RQUOT_PRESET[name]);
    const [name, direction] = action.split('-') as ['a' | 'b', 'up' | 'down'];
    return shifted(state, name, direction === 'up' ? 1 : -1) !== undefined;
  }

  function renderTable(key: 'add' | 'mul', data: RQuotTable) {
    const head = root.querySelector<HTMLElement>(`[data-rquot-head="${key}"]`)!;
    const body = root.querySelector<HTMLElement>(`[data-rquot-table="${key}"]`)!;
    const caption = root.querySelector<HTMLElement>(`[data-rquot-caption="${key}"]`)!;
    const headRow = document.createElement('tr');
    headRow.append(cell('th', data.corner, 'col'), ...data.head.map(label => cell('th', label, 'col')));
    head.replaceChildren(headRow);
    body.replaceChildren(...data.body.map(({ header, cells }, i) => {
      const row = document.createElement('tr');
      row.append(cell('th', header, 'row'), ...cells.map((value, j) => {
        const td = cell('td', value);
        if (i === data.current.row && j === data.current.col) td.setAttribute('aria-current', 'true');
        return td;
      }));
      return row;
    }));
    if (caption.textContent !== data.caption) caption.textContent = data.caption;
  }

  function render() {
    const reading = rquotReading(state);
    const text = rquotText(reading);
    svg.innerHTML = rquotSvg(reading);
    rows.replaceChildren(...text.rows.map(([term, value]) => {
      const row = document.createElement('div');
      row.append(cell('dt', term), cell('dd', value));
      return row;
    }));
    renderTable('add', text.add);
    renderTable('mul', text.mul);
    if (status.textContent !== text.status) status.textContent = text.status;
    for (const field of fields) {
      const value = String(state[field.dataset.rquotParam as RQuotField]);
      if (field.value !== value && document.activeElement !== field) field.value = value;
    }
    for (const button of buttons) {
      const action = button.dataset.rquotAction!;
      if (action !== 'reset') {
        const label = `${action[0]} ${action.endsWith('up') ? '+' : '−'} ${state.n}`;
        if (button.textContent !== label) button.textContent = label;
      }
      button.setAttribute('aria-disabled', String(!available(action)));
    }
  }

  for (const field of fields) {
    const name = field.dataset.rquotParam as RQuotField;
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
      const action = button.dataset.rquotAction!;
      if (!available(action)) return;
      if (action === 'reset') state = { ...RQUOT_PRESET };
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
