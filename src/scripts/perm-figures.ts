// Controller of <PermutationFigure>: selects for n and for the two images,
// three buttons. Unavailable buttons stay focusable (aria-disabled).
import { applyOnce, atStart, canSwap, initialState, permText, putBack, setN, swapImages, type PermEvent, type PermState } from '../figures/perm';
import { permSvg } from '../figures/perm-svg';

export function initPermFigure(root: HTMLElement): void {
  const svg = root.querySelector<SVGSVGElement>('[data-perm-svg]')!;
  const rows = root.querySelector<HTMLElement>('[data-perm-rows]')!;
  const status = root.querySelector<HTMLElement>('[data-perm-status]')!;
  const table = root.querySelector<HTMLElement>('[data-perm-table]')!;
  const nSelect = root.querySelector<HTMLSelectElement>('[data-perm-n]')!;
  const aSelect = root.querySelector<HTMLSelectElement>('[data-perm-image=a]')!;
  const bSelect = root.querySelector<HTMLSelectElement>('[data-perm-image=b]')!;
  const buttons = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-action]'));
  let state: PermState = initialState();
  let u = 1, v = 2;

  const cell = (tag: 'dt' | 'dd' | 'td', value: string) => {
    const element = document.createElement(tag);
    element.textContent = value;
    return element;
  };

  function fillImages() {
    for (const select of [aSelect, bSelect]) {
      select.replaceChildren(...Array.from({ length: state.n }, (_, i) => {
        const option = document.createElement('option');
        option.value = option.textContent = String(i + 1);
        return option;
      }));
    }
    aSelect.value = String(u);
    bSelect.value = String(v);
  }

  const available = (action: string) =>
    action === 'swap' ? canSwap(state.n, u, v) : action === 'back' ? state.count > 0 || !atStart(state) : true;

  function render(event?: PermEvent) {
    const text = permText(state, event);
    svg.innerHTML = permSvg(state);
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
    status.textContent = text.status;
    for (const button of buttons) button.setAttribute('aria-disabled', String(!available(button.dataset.action!)));
  }

  nSelect.disabled = aSelect.disabled = bSelect.disabled = false;
  nSelect.addEventListener('change', () => {
    state = setN(nSelect.value, state.n);
    nSelect.value = String(state.n);
    u = 1; v = 2;
    fillImages();
    render({ kind: 'n' });
  });
  const choose = () => {
    u = Number(aSelect.value); v = Number(bSelect.value);
    for (const button of buttons) button.setAttribute('aria-disabled', String(!available(button.dataset.action!)));
    if (!canSwap(state.n, u, v)) status.textContent = 'Choisissez deux images distinctes pour pouvoir les échanger. ' + permText(state).status;
  };
  aSelect.addEventListener('change', choose);
  bSelect.addEventListener('change', choose);

  for (const button of buttons) {
    button.disabled = false;
    button.addEventListener('click', () => {
      const action = button.dataset.action!;
      if (!available(action)) {
        if (action === 'swap') status.textContent = 'Choisissez deux images distinctes pour pouvoir les échanger. ' + permText(state).status;
        return;
      }
      if (action === 'swap') { state = swapImages(state, u, v); render({ kind: 'swap', u, v }); }
      else if (action === 'apply') { state = applyOnce(state); render({ kind: 'apply' }); }
      else { state = putBack(state); render({ kind: 'back' }); }
    });
  }
  svg.classList.add('is-interactive');
  render();
}
