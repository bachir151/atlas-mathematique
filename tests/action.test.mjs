import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ACTION_PRESET, TRANSFORMS, VERTICES, actionReading, actionText, image, isPreset, normalize, transformsOf,
} from '../src/figures/action.ts';
import { actionSvg } from '../src/figures/action-svg.ts';

// Images of A, B, C, D (indices 0..3) from the lesson: r: A→B→C→D→A ; s fixes A and C, exchanges B and D ;
// « rs » = apply s first, then r. Written out by hand, independent of the formulas of the model.
const s = [0, 3, 2, 1];
const r = [1, 2, 3, 0];
const compose = (f, g) => g.map(x => f[x]); // f ∘ g
const power = (f, k) => { let out = [0, 1, 2, 3]; for (let i = 0; i < k; i++) out = compose(f, out); return out; };
const expected = {
  e: [0, 1, 2, 3], r: power(r, 1), r2: power(r, 2), r3: power(r, 3),
  s, rs: compose(power(r, 1), s), r2s: compose(power(r, 2), s), r3s: compose(power(r, 3), s),
};

test('8 transformations × 4 vertices: images match the lesson convention', () => {
  assert.equal(TRANSFORMS.length, 8);
  for (const t of TRANSFORMS) for (const v of [0, 1, 2, 3]) assert.equal(image(t, v), expected[t.id][v], `${t.id}(${VERTICES[v]})`);
  assert.deepEqual(expected.r, [1, 2, 3, 0]);
  assert.deepEqual(expected.rs, [1, 0, 3, 2]); // rs(B) = r(s(B)) = r(D) = A
  assert.deepEqual(expected.r2s, [2, 1, 0, 3]); // r²s sends A to C
  for (const t of TRANSFORMS) assert.deepEqual(new Set([0, 1, 2, 3].map(v => image(t, v))).size, 4, 'bijection');
});

test('the eight transformations are distinct and closed under composition', () => {
  const keys = TRANSFORMS.map(t => [0, 1, 2, 3].map(v => image(t, v)).join(''));
  assert.equal(new Set(keys).size, 8);
  for (const a of keys) for (const b of keys) {
    const c = compose(a.split('').map(Number), b.split('').map(Number)).join('');
    assert.ok(keys.includes(c));
  }
  const rotations = keys.slice(0, 4);
  for (const a of rotations) for (const b of rotations) assert.ok(rotations.includes(compose(a.split('').map(Number), b.split('').map(Number)).join('')));
});

test('orbit / stabilizer relation, exhaustive: |G| = |orbit| × |stabilizer|, and fibers have the size of the stabilizer', () => {
  for (const group of ['rotations', 'symmetries']) for (const vertex of [0, 1, 2, 3]) for (const t of transformsOf(group)) {
    const reading = actionReading({ group, vertex, transform: t.id });
    const size = transformsOf(group).length;
    assert.equal(reading.orbit.length * reading.stabilizer.length, size, `${group} ${VERTICES[vertex]}`);
    assert.deepEqual(reading.orbit, [0, 1, 2, 3]);
    assert.equal(reading.image, image(t, vertex));
    assert.ok(reading.fibers.every(f => f.transforms.length === reading.stabilizer.length));
    assert.equal(reading.fibers.reduce((n, f) => n + f.transforms.length, 0), size);
    assert.ok(reading.stabilizer.every(x => image(x, vertex) === vertex));
  }
});

test('stabilizers and fibers of the lesson: A in rotations {e}; A in symmetries {e, s}; C in symmetries {e, s}; A to C by r² and r²s', () => {
  const names = list => list.map(t => t.name);
  assert.deepEqual(names(actionReading({ group: 'rotations', vertex: 0, transform: 'e' }).stabilizer), ['e']);
  const sym = actionReading({ group: 'symmetries', vertex: 0, transform: 'e' });
  assert.deepEqual(names(sym.stabilizer), ['e', 's']);
  assert.deepEqual(names(actionReading({ group: 'symmetries', vertex: 2, transform: 'e' }).stabilizer), ['e', 's']);
  assert.deepEqual(names(sym.fibers[2].transforms), ['r²', 'r²s']);
  // B: r²s(B) = r²(D) = B, so the stabilizer of B is {e, r²s}.
  assert.deepEqual(names(actionReading({ group: 'symmetries', vertex: 1, transform: 'e' }).stabilizer), ['e', 'r²s']);
});

test('text: status, rows and tables', () => {
  const state = { group: 'symmetries', vertex: 0, transform: 'r2s' };
  const reading = actionReading(state);
  const text = actionText(state, reading);
  assert.equal(text.status, 'r²s envoie A sur C. Orbite de A : {A, B, C, D}. Stabilisateur de A : {e, s}.');
  assert.equal(text.table.length, 8);
  assert.deepEqual(text.table[6], ['r²s', 'C', 'B', 'A', 'D']);
  assert.deepEqual(text.groups[2], ['C', '{r², r²s}']);
  const initial = actionText(ACTION_PRESET, actionReading(ACTION_PRESET));
  assert.equal(initial.status, 'e envoie A sur A. Orbite de A : {A, B, C, D}. Stabilisateur de A : {e}.');
  assert.equal(initial.table.length, 4);
  assert.deepEqual(initial.table[1], ['r', 'B', 'C', 'D', 'A']);
});

test('preset, normalize and reset', () => {
  assert.deepEqual(ACTION_PRESET, { group: 'rotations', vertex: 0, transform: 'e' });
  assert.ok(isPreset(ACTION_PRESET));
  // Switching to the rotations while a symmetry is chosen falls back to e.
  const back = normalize('rotations', 2, 'rs', { group: 'symmetries', vertex: 2, transform: 'rs' });
  assert.deepEqual(back, { group: 'rotations', vertex: 2, transform: 'e' });
  // Switching to the symmetries keeps the transformation.
  assert.equal(normalize('symmetries', 1, 'r', ACTION_PRESET).transform, 'r');
  // Invalid values fall back to the previous state.
  assert.deepEqual(normalize('x', 9, 'zzz', { group: 'symmetries', vertex: 3, transform: 's' }), { group: 'symmetries', vertex: 3, transform: 's' });
  assert.ok(!isPreset({ ...ACTION_PRESET, vertex: 1 }));
});

test('svg: four labels, one ring, one image point; axis only with the symmetries', () => {
  for (const group of ['rotations', 'symmetries']) {
    const reading = actionReading({ group, vertex: 1, transform: 'r' });
    const svg = actionSvg(reading, group);
    assert.equal((svg.match(/fig-label/g) || []).length, 4);
    assert.equal((svg.match(/fig-ring/g) || []).length, 1);
    assert.equal((svg.match(/fig-point-image/g) || []).length, 1);
    assert.equal(svg.includes('fig-axis-line'), group === 'symmetries');
    assert.ok(svg.startsWith('<g aria-hidden="true">'));
  }
});
