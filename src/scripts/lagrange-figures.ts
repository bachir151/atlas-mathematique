// Controller of <LagrangeFigure>: two selects update one state; the drawing,
// the text reading and the table are re-rendered from the pure model.
import {
  CLASSES_PRESET, CONJUGATION_PRESET, ELEMENT_NAMES, SUBGROUPS, clampIndex,
  classesReading, classesText, conjugationReading, conjugationText, type FigureText,
} from '../figures/lagrange';
import { classesSvg, conjugationSvg } from '../figures/lagrange-svg';

type State = Record<string, number>;

export function initLagrangeFigure(root: HTMLElement): void {
  const classes = root.dataset.lagrKind === 'classes-gauche';
  const svg = root.querySelector<SVGSVGElement>('[data-lagr-svg]')!;
  const rows = root.querySelector<HTMLElement>('[data-lagr-rows]')!;
  const status = root.querySelector<HTMLElement>('[data-lagr-status]')!;
  const table = root.querySelector<HTMLElement>('[data-lagr-table]')!;
  const selects = Array.from(root.querySelectorAll<HTMLSelectElement>('[data-lagr-param]'));
  const reset = root.querySelector<HTMLButtonElement>('[data-lagr-action=reset]')!;
  const preset: State = classes ? { ...CLASSES_PRESET } : { ...CONJUGATION_PRESET };
  const counts: State = classes ? { sub: SUBGROUPS.length, rep: ELEMENT_NAMES.length } : { x: ELEMENT_NAMES.length, g: ELEMENT_NAMES.length };
  let state: State = { ...preset };

  const cell = (tag: 'dt' | 'dd' | 'td', value: string) => {
    const element = document.createElement(tag);
    element.textContent = value;
    return element;
  };

  function view(): { drawing: string; text: FigureText } {
    if (classes) {
      const s = { sub: state.sub, rep: state.rep };
      const reading = classesReading(s);
      return { drawing: classesSvg(s, reading), text: classesText(s, reading) };
    }
    const s = { x: state.x, g: state.g };
    const reading = conjugationReading(s);
    return { drawing: conjugationSvg(s, reading), text: conjugationText(s, reading) };
  }

  function render() {
    const { drawing, text } = view();
    svg.innerHTML = drawing;
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
    const caption = root.querySelector<HTMLElement>('[data-lagr-caption]');
    if (caption && caption.textContent !== text.caption) caption.textContent = text.caption;
    if (status.textContent !== text.status) status.textContent = text.status;
    for (const select of selects) {
      const value = String(state[select.dataset.lagrParam!]);
      if (select.value !== value) select.value = value;
    }
    reset.setAttribute('aria-disabled', String(Object.keys(preset).every(key => state[key] === preset[key])));
  }

  for (const select of selects) {
    const name = select.dataset.lagrParam!;
    if (!(name in preset)) continue;
    select.disabled = false;
    const update = () => {
      const value = clampIndex(select.value, counts[name], state[name]);
      if (value === state[name]) return;
      state = { ...state, [name]: value };
      render();
    };
    select.addEventListener('change', update);
    select.addEventListener('input', update);
  }
  reset.disabled = false;
  reset.addEventListener('click', () => {
    if (reset.getAttribute('aria-disabled') === 'true') return;
    state = { ...preset };
    render();
  });
  svg.classList.add('is-interactive');
  render();
}
