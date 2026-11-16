// Controller of <IdealFigure>: two number fields (a, b), two sliders (u, v) and
// a reset button update one state; the line, the text reading and the table are
// re-rendered.
import { FIELDS, IDEAL_PRESET, clampField, idealReading, idealText, int, type IdealField, type IdealState } from '../figures/ideal';
import { idealSvg } from '../figures/ideal-svg';

export function initIdealFigure(root: HTMLElement): void {
  const svg = root.querySelector<SVGSVGElement>('[data-ideal-svg]')!;
  const rows = root.querySelector<HTMLElement>('[data-ideal-rows]')!;
  const status = root.querySelector<HTMLElement>('[data-ideal-status]')!;
  const table = root.querySelector<HTMLElement>('[data-ideal-table]')!;
  const fields = Array.from(root.querySelectorAll<HTMLInputElement>('[data-ideal-param]'));
  const outputs = Array.from(root.querySelectorAll<HTMLElement>('[data-ideal-value]'));
  const reset = root.querySelector<HTMLButtonElement>('[data-ideal-action="reset"]')!;
  let state: IdealState = { ...IDEAL_PRESET };

  const cell = (tag: 'dt' | 'dd' | 'td', value: string) => {
    const element = document.createElement(tag);
    element.textContent = value;
    return element;
  };
  const atPreset = () => FIELDS.every(name => state[name] === IDEAL_PRESET[name]);

  function render() {
    const reading = idealReading(state);
    const text = idealText(state, reading);
    svg.innerHTML = idealSvg(reading);
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
      const name = field.dataset.idealParam as IdealField;
      const value = String(state[name]);
      if (field.value !== value && (field.type === 'range' || document.activeElement !== field)) field.value = value;
      if (field.type === 'range') field.setAttribute('aria-valuetext', int(state[name]));
    }
    for (const output of outputs) output.textContent = int(state[output.dataset.idealValue as IdealField]);
    reset.setAttribute('aria-disabled', String(atPreset()));
  }

  for (const field of fields) {
    const name = field.dataset.idealParam as IdealField;
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
  reset.disabled = false;
  reset.addEventListener('click', () => {
    if (atPreset()) return;
    state = { ...IDEAL_PRESET };
    render();
  });
  svg.classList.add('is-interactive');
  render();
}
