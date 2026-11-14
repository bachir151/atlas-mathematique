// Controller of <PlaneFigure>: numeric fields, buttons and pointer dragging all
// update one state; the SVG and the text reading are re-rendered from it.
import {
  clampInt, MEDIATRIX_LIMITS, MEDIATRIX_PRESET, REFLECTION_LIMITS, REFLECTION_PRESET,
  TWO_REFLECTIONS_LIMITS, TWO_REFLECTIONS_PRESET,
  type MediatrixState, type ReflectionOrder, type ReflectionState, type TwoReflectionsState,
} from '../figures/plane';
import { MEDIATRIX_RANGE, TWO_REFLECTIONS_RANGE, frame, mediatrixSvg, reflectionRange, reflectionSvg, twoReflectionsSvg } from '../figures/plane-svg';
import { mediatrixText, reflectionText, twoReflectionsText, type FigureText } from '../figures/plane-text';

type Limits = Record<string, readonly [number, number]>;

interface Model<S> {
  preset: () => S;
  limits: Limits;
  svg: (state: S, id: string) => string;
  text: (state: S) => FigureText;
  range: (state: S) => number;
  /** Change of a parameter (field or drag); figures may reset their progress. */
  set: (state: S, name: string, value: number) => S;
  action: (state: S, name: string) => S;
  /** Label of the main button for the current state, if it changes. */
  label?: (state: S) => string | undefined;
}

const mediatrixModel: Model<MediatrixState> = {
  preset: () => ({ ...MEDIATRIX_PRESET }),
  limits: MEDIATRIX_LIMITS,
  svg: mediatrixSvg,
  text: mediatrixText,
  range: () => MEDIATRIX_RANGE,
  set: (state, name, value) => ({ ...state, [name]: value }),
  action: (state, name) => (name === 'on-bisector' ? { ...state, x: 0 } : { ...MEDIATRIX_PRESET }),
};

const reflectionModel: Model<ReflectionState> = {
  preset: () => ({ ...REFLECTION_PRESET, count: 0 }),
  limits: REFLECTION_LIMITS,
  svg: reflectionSvg,
  text: reflectionText,
  range: reflectionRange,
  // A new point or axis starts a new construction.
  set: (state, name, value) => ({ ...state, [name]: value, count: 0 }),
  action: (state, name) => (name === 'reflect' ? { ...state, count: state.count + 1 } : { ...REFLECTION_PRESET, count: 0 }),
  label: state => (state.count === 0 ? 'Réfléchir' : 'Réfléchir à nouveau'),
};

const twoReflectionsModel: Model<TwoReflectionsState> = {
  preset: () => ({ ...TWO_REFLECTIONS_PRESET, step: 0 }),
  limits: TWO_REFLECTIONS_LIMITS,
  svg: twoReflectionsSvg,
  text: twoReflectionsText,
  range: () => TWO_REFLECTIONS_RANGE,
  set: (state, name, value) => ({ ...state, [name]: value }),
  action: (state, name) => (name === 'next' ? { ...state, step: Math.min(2, state.step + 1) }
    : { ...state, step: 0 }),
};

const models = { 'mediatrice': mediatrixModel, 'reflexion': reflectionModel, 'deux-reflexions': twoReflectionsModel } as const;

export function initPlaneFigure(root: HTMLElement): void {
  const kind = root.dataset.planeFigure as keyof typeof models;
  const model = models[kind] as unknown as Model<Record<string, number | string>> | undefined;
  if (!model) return;
  const id = root.id;
  const svg = root.querySelector<SVGSVGElement>('[data-plane-svg]')!;
  const rows = root.querySelector<HTMLElement>('[data-plane-rows]')!;
  const status = root.querySelector<HTMLElement>('[data-plane-status]')!;
  const fields = Array.from(root.querySelectorAll<HTMLInputElement>('[data-param]'));
  const orders = Array.from(root.querySelectorAll<HTMLInputElement>('[data-order]'));
  const buttons = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-action]'));
  let state = model.preset();

  function render() {
    svg.innerHTML = model!.svg(state as never, id);
    const text = model!.text(state as never);
    rows.replaceChildren(...text.rows.map(([term, value]) => {
      const row = document.createElement('div');
      const dt = document.createElement('dt'); dt.textContent = term;
      const dd = document.createElement('dd'); dd.textContent = value;
      row.append(dt, dd);
      return row;
    }));
    if (status.textContent !== text.status) status.textContent = text.status;
    for (const field of fields) {
      const value = String(state[field.dataset.param!]);
      if (field.value !== value && document.activeElement !== field) field.value = value;
    }
    for (const radio of orders) radio.checked = radio.value === state.order;
    const label = model!.label?.(state as never);
    const main = buttons.find(button => button.dataset.action !== 'reset' && button.dataset.action !== 'on-bisector');
    if (label && main) main.textContent = label;
    const next = buttons.find(button => button.dataset.action === 'next');
    if (next) next.setAttribute('aria-disabled', String(state.step === 2));
  }

  function setParam(name: string, raw: unknown) {
    const [min, max] = model!.limits[name];
    const value = clampInt(raw, min, max, Number(state[name]));
    if (value === state[name]) return;
    state = model!.set(state as never, name, value) as typeof state;
    render();
  }

  for (const field of fields) {
    field.disabled = false;
    field.addEventListener('input', () => { if (field.value !== '') setParam(field.dataset.param!, field.value); });
    // On leaving the field, show the value actually used (clamped, rounded).
    field.addEventListener('change', () => { field.value = String(state[field.dataset.param!]); });
  }
  for (const radio of orders) {
    radio.disabled = false;
    radio.addEventListener('change', () => {
      if (!radio.checked) return;
      state = { ...state, order: radio.value as ReflectionOrder, step: 0 };
      render();
    });
  }
  for (const button of buttons) {
    button.disabled = false;
    button.addEventListener('click', () => {
      if (button.getAttribute('aria-disabled') === 'true') return;
      state = model!.action(state as never, button.dataset.action!) as typeof state;
      render();
    });
  }

  // Pointer dragging of P, snapped to integer coordinates. The grab zone is a
  // disc around P (not the circle element), large enough for a finger.
  const GRAB_RADIUS = 26; // SVG units
  let dragging: number | undefined;
  const local = (event: PointerEvent) => {
    const matrix = svg.getScreenCTM();
    return matrix ? new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse()) : undefined;
  };
  const toWorld = (event: PointerEvent) => {
    const point = local(event);
    return point ? frame(model!.range(state as never)).toWorld(point.x, point.y) : undefined;
  };
  svg.addEventListener('pointerdown', event => {
    const point = local(event);
    if (!point || (event.pointerType === 'mouse' && event.button !== 0)) return;
    const [px, py] = frame(model!.range(state as never)).toSvg([Number(state.x), Number(state.y)]);
    if (Math.hypot(point.x - px, point.y - py) > GRAB_RADIUS) return;
    dragging = event.pointerId;
    svg.setPointerCapture(event.pointerId);
    event.preventDefault();
  });
  svg.addEventListener('pointermove', event => {
    if (event.pointerId !== dragging) return;
    const world = toWorld(event);
    if (!world) return;
    const [x, y] = world;
    const [xMin, xMax] = model!.limits.x, [yMin, yMax] = model!.limits.y;
    const nx = clampInt(x, xMin, xMax, Number(state.x)), ny = clampInt(y, yMin, yMax, Number(state.y));
    if (nx === state.x && ny === state.y) return;
    // Dragging always moves the initial point P.
    state = model!.set(model!.set(state as never, 'x', nx) as never, 'y', ny) as typeof state;
    render();
  });
  const stop = (event: PointerEvent) => { if (event.pointerId === dragging) dragging = undefined; };
  svg.addEventListener('pointerup', stop);
  svg.addEventListener('pointercancel', stop);
  svg.classList.add('is-interactive');
  root.querySelector<HTMLElement>('[data-plane-hint]')?.removeAttribute('hidden');
  render();
}
