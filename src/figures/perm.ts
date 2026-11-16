// Pure model of the figure of the lesson « Permutations & cycles ».
// Specification: docs/demandes/codex-lecon-08-permutations-reponse.md
// (section « Interaction proposée après validation »). Everything is an
// integer. images[x − 1] is σ(x); positions[c − 1] is the current position of
// the card that started in position c. The only way to change σ is to swap two
// images, which keeps σ a bijection.

export const N_LIMITS = [2, 6] as const;
export const N_PRESET = 4;
export const IMAGES_PRESET: readonly number[] = [3, 1, 2, 4];

export interface PermState {
  n: number;
  /** σ(1), …, σ(n). */
  images: number[];
  /** Current position of the card initially in position 1, …, n. */
  positions: number[];
  /** Number of applications of σ since the cards were last put back. */
  count: number;
}

export const identity = (n: number): number[] => Array.from({ length: n }, (_, i) => i + 1);

export function clampN(value: unknown, fallback: number = N_PRESET): number {
  const number = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(N_LIMITS[1], Math.max(N_LIMITS[0], Math.round(number)));
}

export function initialState(): PermState {
  return { n: N_PRESET, images: [...IMAGES_PRESET], positions: identity(N_PRESET), count: 0 };
}

/** A change of n resets everything to the identity. */
export function setN(value: unknown, fallback: number = N_PRESET): PermState {
  const n = clampN(value, fallback);
  return { n, images: identity(n), positions: identity(n), count: 0 };
}

export function isPermutation(images: readonly number[]): boolean {
  const n = images.length;
  return images.every(v => Number.isInteger(v) && v >= 1 && v <= n) && new Set(images).size === n;
}

/** True when u and v are two distinct images in 1..n. */
export const canSwap = (n: number, u: number, v: number) =>
  Number.isInteger(u) && Number.isInteger(v) && u !== v && u >= 1 && v >= 1 && u <= n && v <= n;

/**
 * Exchange the two images u and v: the element sent to u is now sent to v and
 * conversely. The cards go back to their initial positions and the counter to 0
 * (the rule changed). Invalid choices leave the state unchanged.
 */
export function swapImages(state: PermState, u: number, v: number): PermState {
  if (!canSwap(state.n, u, v)) return state;
  const images = state.images.map(x => (x === u ? v : x === v ? u : x));
  return { ...state, images, positions: identity(state.n), count: 0 };
}

/** Apply σ to the current positions of all cards. */
export function applyOnce(state: PermState): PermState {
  return { ...state, positions: state.positions.map(p => state.images[p - 1]), count: state.count + 1 };
}

/** Put the cards back in their initial positions; σ is unchanged. */
export function putBack(state: PermState): PermState {
  return { ...state, positions: identity(state.n), count: 0 };
}

/**
 * Cycles of σ, fixed points included (length 1). Deterministic: each cycle
 * starts at its smallest element, cycles are sorted by that element.
 */
export function cycles(images: readonly number[]): number[][] {
  const seen = new Set<number>();
  const result: number[][] = [];
  for (let start = 1; start <= images.length; start++) {
    if (seen.has(start)) continue;
    const cycle: number[] = [];
    for (let x = start; !seen.has(x); x = images[x - 1]) { seen.add(x); cycle.push(x); }
    result.push(cycle);
  }
  return result;
}

const THIN = ' '; // narrow no-break space, as the thin space of the lesson
export const nonTrivialCycles = (images: readonly number[]) => cycles(images).filter(c => c.length >= 2);
export const fixedPoints = (images: readonly number[]) => cycles(images).filter(c => c.length === 1).map(c => c[0]);

/** Lesson notation: (1 3 2)(4 5); fixed points omitted; « e » for the identity. */
export function cycleNotation(images: readonly number[]): string {
  const list = nonTrivialCycles(images);
  return list.length === 0 ? 'e' : list.map(c => `(${c.join(THIN)})`).join('');
}

/** Smallest k ≥ 1 such that applying σ k times fixes every position (found by repeating σ). */
export function returnCount(images: readonly number[]): number {
  let positions = identity(images.length);
  for (let k = 1; ; k++) {
    positions = positions.map(p => images[p - 1]);
    if (positions.every((p, i) => p === i + 1)) return k;
  }
}

export const atStart = (state: PermState) => state.positions.every((p, i) => p === i + 1);

/* Text reading (also the content of the status line and of the table). */

const plural = (k: number, one: string, many: string) => `${k} ${k <= 1 ? one : many}`;
const list = (values: number[]) => values.join(', ');

export interface PermText {
  rows: [string, string][];
  status: string;
  /** Initial position, image, current position. */
  table: [string, string, string][];
}

export type PermEvent = { kind: 'swap'; u: number; v: number } | { kind: 'apply' } | { kind: 'back' } | { kind: 'n' };

export function eventNote(event: PermEvent | undefined): string {
  if (!event) return '';
  switch (event.kind) {
    case 'swap': return `Images ${event.u} et ${event.v} échangées : cartes remises à leur position initiale, compteur à 0. `;
    case 'apply': return 'Permutation appliquée aux positions courantes. ';
    case 'back': return 'Cartes remises à leur position initiale, compteur à 0. ';
    case 'n': return 'Nombre de cartes modifié : retour à l’identité. ';
  }
}

export function permText(state: PermState, event?: PermEvent): PermText {
  const { n, images, positions, count } = state;
  const all = cycles(images);
  const fixed = fixedPoints(images);
  const home = atStart(state);
  const rows: [string, string][] = [
    ['Nombre de cartes n', `${n} (entre ${N_LIMITS[0]} et ${N_LIMITS[1]})`],
    ['Images de σ', images.map((v, i) => `${i + 1} ↦ ${v}`).join(' ; ')],
    ['Décomposition en cycles', cycleNotation(images) === 'e' ? 'e (identité, produit vide)' : cycleNotation(images)],
    ['Points fixes', fixed.length === 0 ? 'aucun' : list(fixed)],
    ['Longueurs des cycles', `${list(all.map(c => c.length))} (un point fixe compte pour 1)`],
    ['Applications effectuées', String(count)],
    ['Positions courantes', positions.map((p, i) => `carte ${i + 1} en position ${p}`).join(' ; ')],
    ['Premier retour de toutes les cartes', `après ${plural(returnCount(images), 'application', 'applications')}, calculé en répétant σ`],
  ];
  const where = home
    ? (count === 0 ? 'Les cartes sont à leur position initiale.' : `Après ${plural(count, 'application', 'applications')}, toutes les cartes sont revenues à leur position initiale.`)
    : `Après ${plural(count, 'application', 'applications')}, les cartes sont aux positions ${list(positions)}.`;
  const status = `${eventNote(event)}${where} Décomposition de σ : ${cycleNotation(images)}. n est choisi entre ${N_LIMITS[0]} et ${N_LIMITS[1]}. Ces essais montrent des exemples : ils ne constituent pas une preuve générale.`;
  const table = images.map((v, i): [string, string, string] => [String(i + 1), String(v), String(positions[i])]);
  return { rows, status, table };
}
