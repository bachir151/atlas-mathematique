// Controller of <ActionFigure>: three radio groups (group, vertex, transformation)
// and a reset button update one state; the drawing, the text reading and both
// tables are re-rendered. Radios are never disabled once active.
import { ACTION_PRESET, actionReading, actionText, isPreset, normalize, transformsOf, type ActionState } from '../figures/action';
import { actionSvg } from '../figures/action-svg';

export function initActionFigure(root: HTMLElement): void {
  const svg = root.querySelector<SVGSVGElement>('[data-act-svg]')!;
  const rows = root.querySelector<HTMLElement>('[data-act-rows]')!;
  const status = root.querySelector<HTMLElement>('[data-act-status]')!;
  const table = root.querySelector<HTMLElement>('[data-act-table]')!;
  const groups = root.querySelector<HTMLElement>('[data-act-groups]')!;
  const reset = root.querySelector<HTMLButtonElement>('[data-act-reset]')!;
  const radios = (name: string) => Array.from(root.querySelectorAll<HTMLInputElement>(`[data-act-${name}]`));
  const groupRadios = radios('group'), vertexRadios = radios('vertex'), transformRadios = radios('transform');
  let state: ActionState = { ...ACTION_PRESET };

  const cell = (tag: 'dt' | 'dd' | 'td' | 'th', value: string, scope?: string) => {
    const element = document.createElement(tag);
    element.textContent = value;
    if (scope) element.setAttribute('scope', scope);
    return element;
  };
  const line = (values: string[]) => {
    const row = document.createElement('tr');
    row.append(...values.map((value, i) => (i === 0 ? cell('th', value, 'row') : cell('td', value))));
    return row;
  };

  function render() {
    const reading = actionReading(state);
    const text = actionText(state, reading);
    svg.innerHTML = actionSvg(reading, state.group);
    rows.replaceChildren(...text.rows.map(([term, value]) => {
      const row = document.createElement('div');
      row.append(cell('dt', term), cell('dd', value));
      return row;
    }));
    table.replaceChildren(...text.table.map(line));
    groups.replaceChildren(...text.groups.map(values => line(values)));
    if (status.textContent !== text.status) status.textContent = text.status;
    const allowed = transformsOf(state.group).map(t => t.id);
    for (const radio of groupRadios) radio.checked = radio.value === state.group;
    for (const radio of vertexRadios) radio.checked = radio.value === String(state.vertex);
    for (const radio of transformRadios) {
      radio.checked = radio.value === state.transform;
      const label = radio.closest('label');
      if (label) label.hidden = !allowed.includes(radio.value as never);
    }
    reset.setAttribute('aria-disabled', String(isPreset(state)));
  }

  for (const radio of groupRadios) radio.addEventListener('change', () => {
    if (!radio.checked) return;
    state = normalize(radio.value, state.vertex, state.transform, state);
    render();
  });
  for (const radio of vertexRadios) radio.addEventListener('change', () => {
    if (!radio.checked) return;
    state = normalize(state.group, Number(radio.value), state.transform, state);
    render();
  });
  for (const radio of transformRadios) radio.addEventListener('change', () => {
    if (!radio.checked) return;
    state = normalize(state.group, state.vertex, radio.value, state);
    render();
  });
  reset.addEventListener('click', () => {
    if (isPreset(state)) return;
    state = { ...ACTION_PRESET };
    render();
  });
  for (const element of [...groupRadios, ...vertexRadios, ...transformRadios, reset]) element.disabled = false;
  svg.classList.add('is-interactive');
  render();
}
