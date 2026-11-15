// Controller of <SeriesFigure>: numeric fields, radio buttons and buttons all
// update one state; the graph, the text reading and the table are re-rendered.
import { clampScaled } from '../figures/series';
import { seriesModels, type SeriesKind, type SeriesState } from '../figures/series-figure';

export function initSeriesFigure(root: HTMLElement): void {
  const model = seriesModels[root.dataset.seriesFigure as SeriesKind];
  if (!model) return;
  const svg = root.querySelector<SVGSVGElement>('[data-series-svg]')!;
  const rows = root.querySelector<HTMLElement>('[data-series-rows]')!;
  const status = root.querySelector<HTMLElement>('[data-series-status]')!;
  const table = root.querySelector<HTMLElement>('[data-series-table]');
  const fields = Array.from(root.querySelectorAll<HTMLInputElement>('[data-param]'));
  const choices = Array.from(root.querySelectorAll<HTMLInputElement>('[data-choice]'));
  const buttons = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-action]'));
  let state: SeriesState = model.preset();

  const cells = (values: string[], tag: 'dt' | 'td') => values.map(value => {
    const cell = document.createElement(tag === 'dt' ? 'dd' : 'td');
    cell.textContent = value;
    return cell;
  });

  function render() {
    const view = model.view(state);
    svg.innerHTML = view.svg;
    rows.replaceChildren(...view.rows.map(([term, value]) => {
      const row = document.createElement('div');
      const dt = document.createElement('dt'); dt.textContent = term;
      row.append(dt, ...cells([value], 'dt'));
      return row;
    }));
    if (table && view.table) {
      table.replaceChildren(...view.table.map(values => {
        const row = document.createElement('tr');
        row.append(...cells(values, 'td'));
        return row;
      }));
    }
    if (status.textContent !== view.status) status.textContent = view.status;
    for (const field of fields) {
      const value = String(state[field.dataset.param!] / Number(field.dataset.scale));
      if (field.value !== value && document.activeElement !== field) field.value = value;
    }
    for (const radio of choices) radio.checked = Number(radio.value) === state[radio.dataset.choice!];
    for (const button of buttons) button.setAttribute('aria-disabled', String(view.disabled.includes(button.dataset.action!)));
  }

  for (const field of fields) {
    const spec = model.fields.find(f => f.name === field.dataset.param)!;
    field.disabled = false;
    field.addEventListener('input', () => {
      if (field.value === '') return;
      const value = clampScaled(field.value, spec.scale, spec.min, spec.max, state[spec.name]);
      if (value === state[spec.name]) return;
      state = model.set(state, spec.name, value);
      render();
    });
    // On leaving the field, show the value actually used (clamped, rounded).
    field.addEventListener('change', () => { field.value = String(state[spec.name] / spec.scale); });
  }
  for (const radio of choices) {
    radio.disabled = false;
    radio.addEventListener('change', () => {
      if (!radio.checked) return;
      state = model.set(state, radio.dataset.choice!, Number(radio.value));
      render();
    });
  }
  for (const button of buttons) {
    button.disabled = false;
    button.addEventListener('click', () => {
      if (button.getAttribute('aria-disabled') === 'true') return;
      state = model.action(state, button.dataset.action!);
      render();
    });
  }
  svg.classList.add('is-interactive');
  render();
}
