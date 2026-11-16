// Controller of <FieldFigure>: two selects for the operands and one for the
// operation update one state; drawing, text reading and the highlighted cell
// of the permanent tables are re-rendered.
import { FIELD_PRESET, code, fieldText, parseElt, parseOp, ELEMENTS, eltIndex, type FieldState } from '../figures/field';
import { fieldSvg } from '../figures/field-svg';

export function initFieldFigure(root: HTMLElement): void {
  const svg = root.querySelector<SVGSVGElement>('[data-field-svg]')!;
  const rows = root.querySelector<HTMLElement>('[data-field-rows]')!;
  const status = root.querySelector<HTMLElement>('[data-field-status]')!;
  const reset = root.querySelector<HTMLButtonElement>('[data-field-reset]')!;
  const selects = Array.from(root.querySelectorAll<HTMLSelectElement>('[data-field-select]'));
  const cells = Array.from(root.querySelectorAll<HTMLElement>('[data-field-cell]'));
  let state: FieldState = { ...FIELD_PRESET };

  const isPreset = () => code(state.x) === code(FIELD_PRESET.x) && code(state.y) === code(FIELD_PRESET.y) && state.op === FIELD_PRESET.op;
  const valueOf = (which: string) => (which === 'op' ? state.op : code(state[which as 'x' | 'y']));

  function render() {
    const text = fieldText(state);
    svg.innerHTML = fieldSvg(state);
    rows.replaceChildren(...text.rows.map(([term, value]) => {
      const row = document.createElement('div');
      const dt = document.createElement('dt'), dd = document.createElement('dd');
      dt.textContent = term; dd.textContent = value;
      row.append(dt, dd);
      return row;
    }));
    if (status.textContent !== text.status) status.textContent = text.status;
    const here = `${eltIndex(state.x)}${eltIndex(state.y)}`;
    for (const cell of cells) {
      if (cell.dataset.fieldCell === here) cell.setAttribute('aria-current', 'true');
      else cell.removeAttribute('aria-current');
    }
    for (const select of selects) {
      const value = valueOf(select.dataset.fieldSelect!);
      if (select.value !== value) select.value = value;
    }
    reset.setAttribute('aria-disabled', String(isPreset()));
  }

  for (const select of selects) {
    select.disabled = false;
    select.addEventListener('change', () => {
      const which = select.dataset.fieldSelect!;
      if (which === 'op') {
        const op = parseOp(select.value);
        if (op) state = { ...state, op };
      } else {
        const elt = parseElt(select.value);
        if (elt) state = { ...state, [which]: ELEMENTS[eltIndex(elt)] };
      }
      render();
    });
  }
  reset.disabled = false;
  reset.addEventListener('click', () => {
    if (isPreset()) return;
    state = { ...FIELD_PRESET };
    render();
  });
  svg.classList.add('is-interactive');
  render();
}
