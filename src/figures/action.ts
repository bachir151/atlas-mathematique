// Pure model of the figure of the lesson « Actions de groupes, orbites &
// stabilisateurs ». Specification: docs/demandes/codex-lecon-09-actions-orbites-
// stabilisateurs-reponse.md (section « Interaction proposée après validation »).
// Square with vertices A, B, C, D in this order. r sends A to B, B to C, C to D,
// D to A. s fixes A and C and exchanges B and D. « r^k s » applies s first, then
// r^k (lesson convention). Vertices are the integers 0..3; images are computed
// from the formulas below, never read from a table.

export const VERTICES = ['A', 'B', 'C', 'D'] as const;
export type Vertex = 0 | 1 | 2 | 3;

export type GroupId = 'rotations' | 'symmetries';
export const GROUPS: readonly GroupId[] = ['rotations', 'symmetries'];
export const GROUP_LABELS: Record<GroupId, string> = {
  rotations: 'Les quatre rotations',
  symmetries: 'Les huit symétries',
};

export type TransformId = 'e' | 'r' | 'r2' | 'r3' | 's' | 'rs' | 'r2s' | 'r3s';

export interface Transform {
  id: TransformId;
  /** Display name with the true superscripts. */
  name: string;
  /** Power of r. */
  k: number;
  /** True for r^k s (s applied first). */
  flip: boolean;
}

/** The eight symmetries, in the order of the lesson; the first four are the rotations. */
export const TRANSFORMS: readonly Transform[] = [
  { id: 'e', name: 'e', k: 0, flip: false },
  { id: 'r', name: 'r', k: 1, flip: false },
  { id: 'r2', name: 'r²', k: 2, flip: false },
  { id: 'r3', name: 'r³', k: 3, flip: false },
  { id: 's', name: 's', k: 0, flip: true },
  { id: 'rs', name: 'rs', k: 1, flip: true },
  { id: 'r2s', name: 'r²s', k: 2, flip: true },
  { id: 'r3s', name: 'r³s', k: 3, flip: true },
];

export const transformsOf = (group: GroupId): readonly Transform[] =>
  group === 'rotations' ? TRANSFORMS.slice(0, 4) : TRANSFORMS;

export const transformById = (id: TransformId): Transform => TRANSFORMS.find(t => t.id === id)!;

/** Image of a vertex: r^k(v) = v + k ; r^k s (v) = r^k(s(v)) = k − v (mod 4). */
export function image(t: Transform, v: Vertex): Vertex {
  return ((((t.flip ? t.k - v : v + t.k) % 4) + 4) % 4) as Vertex;
}

export interface ActionState { group: GroupId; vertex: Vertex; transform: TransformId }

export const ACTION_PRESET: ActionState = { group: 'rotations', vertex: 0, transform: 'e' };

export const isPreset = (s: ActionState) =>
  s.group === ACTION_PRESET.group && s.vertex === ACTION_PRESET.vertex && s.transform === ACTION_PRESET.transform;

/** Valid state from loose values; the transformation must belong to the group (else e). */
export function normalize(group: unknown, vertex: unknown, transform: unknown, fallback: ActionState = ACTION_PRESET): ActionState {
  const g = GROUPS.includes(group as GroupId) ? (group as GroupId) : fallback.group;
  const v = typeof vertex === 'number' && Number.isInteger(vertex) && vertex >= 0 && vertex <= 3 ? (vertex as Vertex) : fallback.vertex;
  let t = transformsOf(g).find(x => x.id === transform)?.id;
  if (t === undefined) t = transformsOf(g).find(x => x.id === fallback.transform)?.id ?? 'e';
  return { group: g, vertex: v, transform: t };
}

export interface Fiber { target: Vertex; transforms: Transform[] }

export interface ActionReading {
  group: readonly Transform[];
  transform: Transform;
  vertex: Vertex;
  image: Vertex;
  /** Distinct images of the selected vertex, in the order A, B, C, D. */
  orbit: Vertex[];
  /** Transformations of the group fixing the selected vertex, in the group order. */
  stabilizer: Transform[];
  /** For each vertex, the transformations of the group sending the selected vertex there. */
  fibers: Fiber[];
}

export function actionReading(state: ActionState): ActionReading {
  const group = transformsOf(state.group);
  const transform = group.find(t => t.id === state.transform) ?? group[0];
  const vertex = state.vertex;
  const fibers: Fiber[] = ([0, 1, 2, 3] as Vertex[]).map(target => ({
    target, transforms: group.filter(t => image(t, vertex) === target),
  }));
  return {
    group, transform, vertex,
    image: image(transform, vertex),
    orbit: fibers.filter(f => f.transforms.length > 0).map(f => f.target),
    stabilizer: group.filter(t => image(t, vertex) === vertex),
    fibers,
  };
}

/* Text reading (also the content of the status line and of the tables). */

const names = (list: readonly Transform[]) => (list.length ? `{${list.map(t => t.name).join(', ')}}` : 'aucune');
const points = (list: readonly Vertex[]) => `{${list.map(v => VERTICES[v]).join(', ')}}`;

export interface ActionText {
  rows: [string, string][];
  status: string;
  /** One row per transformation: name, then the images of A, B, C, D. */
  table: string[][];
  /** One row per vertex: the target, then the transformations sending the selected vertex there. */
  groups: [string, string][];
}

export function actionText(state: ActionState, reading: ActionReading): ActionText {
  const { group, transform, vertex, orbit, stabilizer, fibers } = reading;
  const v = VERTICES[vertex];
  const sentence = `${transform.name} envoie ${v} sur ${VERTICES[reading.image]}`;
  const rows: [string, string][] = [
    ['Groupe', `${GROUP_LABELS[state.group]} (${group.length} transformations)`],
    ['Sommet choisi', v],
    ['Transformation choisie', transform.name],
    ['Image', `${transform.name}(${v}) = ${VERTICES[reading.image]}`],
    [`Orbite de ${v}`, points(orbit)],
    [`Stabilisateur de ${v}`, names(stabilizer)],
  ];
  const status = `${sentence}. Orbite de ${v} : ${points(orbit)}. Stabilisateur de ${v} : ${names(stabilizer)}.`;
  const table = group.map(t => [t.name, ...([0, 1, 2, 3] as Vertex[]).map(x => VERTICES[image(t, x)])]);
  const groups: [string, string][] = fibers.map(f => [VERTICES[f.target], names(f.transforms)]);
  return { rows, status, table, groups };
}
