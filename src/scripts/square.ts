import { rotate } from '../lib/rotation';

export function initSquare(root: HTMLElement): void {
  let angle = 0;
  let cumulativeAngle = 0;
  const history: number[] = [];
  const square = root.querySelector<SVGGElement>('[data-rotating-square]')!;
  const output = root.querySelector<HTMLOutputElement>('[data-angle]')!;
  const list = root.querySelector<HTMLOListElement>('[data-history]')!;
  const render = () => {
    // SVG coordinates point down: negate to show positive angles counterclockwise.
    square.style.transform = `rotate(${-cumulativeAngle}deg)`;
    output.value = `${angle}°`;
    list.replaceChildren();
    if (history.length === 0) { const item = document.createElement('li'); item.textContent = 'Aucune rotation appliquée.'; list.append(item); }
    history.forEach(delta => { const item = document.createElement('li'); item.textContent = `+${delta}°`; list.append(item); });
  };
  root.querySelectorAll<HTMLButtonElement>('[data-rotation]').forEach(button => {
    button.disabled = false;
    button.addEventListener('click', () => {
      const delta = Number(button.dataset.rotation);
      angle = rotate(angle, delta);
      cumulativeAngle += delta;
      history.push(delta);
      if (history.length > 8) history.shift();
      render();
    });
  });
  const reset = root.querySelector<HTMLButtonElement>('[data-square-reset]')!;
  reset.disabled = false;
  reset.addEventListener('click', () => {
    // A reset must not animate backwards through the whole rotation history.
    const transition = square.style.transition;
    square.style.transition = 'none';
    angle = 0; cumulativeAngle = 0; history.length = 0; render();
    square.getBoundingClientRect();
    square.style.transition = transition;
  });
}
