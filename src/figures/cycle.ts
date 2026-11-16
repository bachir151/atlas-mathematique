// Pure model of the figure of the lesson « Groupes cycliques » (the dial).
// Specification: docs/demandes/codex-lecon-05-groupes-cycliques-reponse.md
// (section « Interaction proposée après validation »). Everything is an
// integer: no rounding. The figure shows discrete positions of a dial; it
// explores examples and proves nothing.

export interface CycleState {
  /** Number of positions of the dial, 2 ≤ n ≤ 24. */
  n: number;
  /** Integer step of one gesture, −24 ≤ k ≤ 24. */
  k: number;
  /** Signed count of steps done: +1 for each « avancer », −1 for each « reculer ». */
  steps: number;
  /** Number of gestures done (forward and backward). */
  gestures: number;
  /** The first HISTORY_MAX gestures, in order. */
  history: Gesture[];
  /** visited[p] is true when the position p has been reached (start included). */
  visited: boolean[];
}

export interface Gesture { direction: 1 | -1; position: number }

export const LIMITS = { n: [2, 24], k: [-24, 24] } as const;
export const CYCLE_PRESET = { n: 12, k: 4 } as const;
export const HISTORY_MAX = 48;
/** Safety bound on the number of gestures, so that every product stays exact. */
export const GESTURES_MAX = 10000;

export type CycleField = 'n' | 'k';
export const FIELDS: readonly CycleField[] = ['n', 'k'];

/** Integer in the limits of the field; the fallback replaces a non-number. */
export function clampField(name: CycleField, value: unknown, fallback: number): number {
  const number = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(number)) return fallback;
  const [min, max] = LIMITS[name];
  return Math.min(max, Math.max(min, Math.round(number)));
}

/** Remainder in 0..n−1 (Euclidean division, also for negative values). */
export const mod = (value: number, n: number) => ((value % n) + n) % n;

/** Start at position 0, nothing done. */
export function startState(n: number = CYCLE_PRESET.n, k: number = CYCLE_PRESET.k): CycleState {
  const visited = Array.from({ length: n }, () => false);
  visited[0] = true;
  return { n, k, steps: 0, gestures: 0, history: [], visited };
}

export const total = (state: CycleState) => state.steps * state.k;
export const position = (state: CycleState) => mod(total(state), state.n);
export const canGesture = (state: CycleState) => state.gestures < GESTURES_MAX;

/** One gesture: +1 « avancer d'un pas », −1 « reculer d'un pas ». */
export function gesture(state: CycleState, direction: 1 | -1): CycleState {
  if (!canGesture(state)) return state;
  const steps = state.steps + direction;
  const next = mod(steps * state.k, state.n);
  const visited = state.visited.slice();
  visited[next] = true;
  const history = state.history.length < HISTORY_MAX
    ? [...state.history, { direction, position: next }]
    : state.history;
  return { ...state, steps, gestures: state.gestures + 1, history, visited };
}

export const truncated = (state: CycleState) => state.gestures > HISTORY_MAX;

/* Text reading (also the content of the status line and of the table). */

const MINUS = '−';
/** French display of an integer, with the true minus sign. */
export const int = (x: number) => (x < 0 ? `${MINUS}${-x}` : String(x));
/** Same, parenthesised when negative: « 2 × (−3) ». */
const factor = (x: number) => (x < 0 ? `(${int(x)})` : String(x));

export interface CycleText {
  rows: [string, string][];
  status: string;
  historyNote: string;
  table: [string, string, string][];
}

export function cycleText(state: CycleState): CycleText {
  const { n, k, steps, gestures, history } = state;
  const value = total(state);
  const quotient = Math.floor(value / n);
  const place = position(state);
  const calculation = `${factor(steps)} × ${factor(k)} = ${int(value)} = ${factor(quotient)} × ${n} + ${place}`;
  const visitedCount = state.visited.filter(Boolean).length;
  const rows: [string, string][] = [
    ['Dispositif', `${n} positions numérotées de 0 à ${n - 1} ; pas k = ${int(k)}`],
    ['Gestes effectués', String(gestures)],
    ['Nombre signé de pas', int(steps)],
    ['Calcul', calculation],
    ['Position (reste entre 0 et ' + (n - 1) + ')', String(place)],
    ['Positions déjà atteintes', `${visitedCount} sur ${n}`],
  ];
  const range = `Plage finie : n entre 2 et 24, pas k entre ${int(-24)} et 24, ${HISTORY_MAX} gestes listés au plus. La figure explore des exemples : elle ne prouve rien.`;
  const limit = canGesture(state) ? '' : ` Nombre maximal de gestes (${GESTURES_MAX}) atteint : recommencez.`;
  const status = `Nombre signé de pas : ${int(steps)} ; position : ${place} (${calculation}).${limit} ${range}`;
  const historyNote = truncated(state)
    ? `Historique tronqué : seuls les ${HISTORY_MAX} premiers gestes sur ${gestures} sont listés.`
    : `Historique complet : ${gestures} geste${gestures > 1 ? 's' : ''} sur ${HISTORY_MAX} au plus.`;
  const table: [string, string, string][] = [['0', 'Départ', '0']];
  history.forEach(({ direction, position: p }, index) => {
    table.push([String(index + 1), direction === 1 ? 'Avancer' : 'Reculer', String(p)]);
  });
  return { rows, status, historyNote, table };
}
