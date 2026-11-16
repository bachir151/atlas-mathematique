// Controller of <IrreducibleFigure>: three radio groups (degree, b, c) update
// one state; drawing, text reading and the current row of the table follow.
import { IRRED_PRESET, irredReading, irredText, parseChoice, rowKey, type IrredState } from '../figures/irred';
import { irredSvg } from '../figures/irred-svg';

export function initIrredFigure(root: HTMLElement): void {
  const svg = root.querySelector<SVGSVGElement>('[data-irred-svg]')!;
  const rows = root.querySelector<HTMLElement>('[data-irred-rows]')!;
  const status = root.querySelector<HTMLElement>('[data-irred-status]')!;
  const tableRows = Array.from(root.querySelectorAll<HTMLElement>('[data-irred-row]'));
  const radios = Array.from(root.querySelectorAll<HTMLInputElement>('[data-irred-choice]'));
  const reset = root.querySelector<HTMLButtonElement>('[data-irred-reset]')!;
  let state: IrredState = { ...IRRED_PRESET };

  const isPreset = () => (Object.keys(IRRED_PRESET) as (keyof IrredState)[]).every(name => state[name] === IRRED_PRESET[name]);

  function render() {
    const reading = irredReading(state);
    const text = irredText(reading);
    svg.innerHTML = irredSvg(reading);
    rows.replaceChildren(...text.rows.map(([term, value]) => {
      const row = document.createElement('div');
      const dt = document.createElement('dt');
      const dd = document.createElement('dd');
      dt.textContent = term;
      dd.textContent = value;
      row.append(dt, dd);
      return row;
    }));
    const key = rowKey(state);
    for (const row of tableRows) {
      if (row.dataset.irredRow === key) row.setAttribute('aria-current', 'true');
      else row.removeAttribute('aria-current');
    }
    if (status.textContent !== text.status) status.textContent = text.status;
    for (const radio of radios) {
      const checked = String(state[radio.dataset.irredChoice as keyof IrredState]) === radio.value;
      if (radio.checked !== checked) radio.checked = checked;
    }
    reset.setAttribute('aria-disabled', String(isPreset()));
  }

  for (const radio of radios) {
    radio.disabled = false;
    radio.addEventListener('change', () => {
      if (!radio.checked) return;
      const name = radio.dataset.irredChoice as keyof IrredState;
      const value = parseChoice(name, radio.value);
      if (value === undefined || value === state[name]) return;
      state = { ...state, [name]: value } as IrredState;
      render();
    });
  }
  reset.disabled = false;
  reset.addEventListener('click', () => {
    if (isPreset()) return;
    state = { ...IRRED_PRESET };
    render();
  });
  svg.classList.add('is-interactive');
  render();
}
