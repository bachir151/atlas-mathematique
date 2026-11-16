// Controller of <RingFigure>: three numeric fields (n, a, b) and the n − 1 /
// n + 1 buttons update one state; drawing, text reading and table are
// re-rendered. A change of n brings a and b back modulo the new n.
import { RING_PRESET, boundsOf, clampField, ringReading, ringText, steppedModulus, withModulus, type RingField, type RingState } from '../figures/ring';
import { ringSvg } from '../figures/ring-svg';

const NAMES: readonly RingField[] = ['n', 'a', 'b'];

export function initRingFigure(root: HTMLElement): void {
  const svg = root.querySelector<SVGSVGElement>('[data-ring-svg]')!;
  const summary = root.querySelector<HTMLElement>('[data-ring-summary]')!;
  const rows = root.querySelector<HTMLElement>('[data-ring-rows]')!;
  const status = root.querySelector<HTMLElement>('[data-ring-status]')!;
  const head = root.querySelector<HTMLElement>('[data-ring-head]')!;
  const table = root.querySelector<HTMLElement>('[data-ring-table]')!;
  const caption = root.querySelector<HTMLElement>('[data-ring-caption]')!;
  const fields = Array.from(root.querySelectorAll<HTMLInputElement>('[data-ring-param]'));
  const buttons = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-ring-action]'));
  let state: RingState = { ...RING_PRESET };

  const cell = (tag: 'dt' | 'dd' | 'td' | 'th', value: string, scope?: 'col' | 'row') => {
    const element = document.createElement(tag);
    element.textContent = value;
    if (scope) element.setAttribute('scope', scope);
    return element;
  };

  function available(action: string): boolean {
    if (action === 'reset') return NAMES.some(name => state[name] !== RING_PRESET[name]);
    return steppedModulus(state, action === 'n-up' ? 1 : -1) !== undefined;
  }

  function render() {
    const reading = ringReading(state);
    const text = ringText(reading);
    svg.innerHTML = ringSvg(reading);
    rows.replaceChildren(...text.rows.map(([term, value]) => {
      const row = document.createElement('div');
      row.append(cell('dt', term), cell('dd', value));
      return row;
    }));
    const headRow = document.createElement('tr');
    headRow.append(cell('th', '×', 'col'), ...text.head.map(label => cell('th', label, 'col')));
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
    const hint = `${text.summary} Cases orange : produit nul de deux restes non nuls ; cases vertes : produit égal à 1. Ligne de a et colonne de b légèrement teintées. La figure couvre seulement n de 2 à 12.`;
    if (summary.textContent !== hint) summary.textContent = hint;
    if (caption.textContent !== text.caption) caption.textContent = text.caption;
    if (status.textContent !== text.status) status.textContent = text.status;
    for (const field of fields) {
      const name = field.dataset.ringParam as RingField;
      const [min, max] = boundsOf(name, state.n);
      field.min = String(min);
      field.max = String(max);
      const value = String(state[name]);
      if (field.value !== value && document.activeElement !== field) field.value = value;
    }
    for (const label of root.querySelectorAll<HTMLElement>('[data-ring-label]')) {
      if (label.dataset.ringLabel === 'n') continue;
      const name = label.dataset.ringLabel!;
      const wanted = `Reste ${name} (de 0 à ${state.n - 1})`;
      if (label.textContent !== wanted) label.textContent = wanted;
    }
    for (const button of buttons) button.setAttribute('aria-disabled', String(!available(button.dataset.ringAction!)));
  }

  for (const field of fields) {
    const name = field.dataset.ringParam as RingField;
    if (!NAMES.includes(name)) continue;
    field.disabled = false;
    field.addEventListener('input', () => {
      if (field.value === '') return;
      const value = clampField(name, field.value, state[name], state.n);
      if (value === state[name]) return;
      state = name === 'n' ? withModulus(state, value) : { ...state, [name]: value };
      render();
    });
    // On leaving the field, show the value actually used (clamped, rounded).
    field.addEventListener('change', () => { field.value = String(state[name]); });
  }
  for (const button of buttons) {
    button.disabled = false;
    button.addEventListener('click', () => {
      const action = button.dataset.ringAction!;
      if (!available(action)) return;
      if (action === 'reset') state = { ...RING_PRESET };
      else state = withModulus(state, steppedModulus(state, action === 'n-up' ? 1 : -1)!);
      render();
    });
  }
  svg.classList.add('is-interactive');
  render();
}
