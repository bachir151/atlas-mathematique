import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ELEMENT_NAMES, ORDER, SUBGROUPS, CLASSES_PRESET, CONJUGATION_PRESET, MATRICES,
  product, inverse, conjugate, axisOf, elementOrder, clampIndex,
  classesReading, classesText, conjugationReading, conjugationText,
} from '../src/figures/lagrange.ts';
import { classesSvg, conjugationSvg } from '../src/figures/lagrange-svg.ts';

const idx = Object.fromEntries(ELEMENT_NAMES.map((n, i) => [n, i]));
const all = [...Array(ORDER).keys()];

test('D₄ is a group of 8 distinct elements: closure, identity, inverses, associativity', () => {
  assert.equal(new Set(MATRICES.map(m => m.join())).size, 8);
  for (const a of all) {
    assert.equal(product(0, a), a); assert.equal(product(a, 0), a);
    assert.equal(product(a, inverse(a)), 0); assert.equal(product(inverse(a), a), 0);
    for (const b of all) for (const c of all) assert.equal(product(product(a, b), c), product(a, product(b, c)));
  }
});

test('names follow the lesson: r⁴ = e, s² = e, rⁱs = r∘…, rsr⁻¹ = r²s (horizontal reflection)', () => {
  assert.equal(product(idx.r, idx['r³']), 0);
  assert.equal(product(idx.s, idx.s), 0);
  assert.equal(product(idx.r, idx.s), idx.rs);
  assert.equal(product(idx['r²'], idx.s), idx['r²s']);
  assert.equal(product(idx['r³'], idx.s), idx['r³s']);
  // Composition from right to left: s r ≠ r s, s r = r³ s.
  assert.equal(product(idx.s, idx.r), idx['r³s']);
  assert.equal(conjugate(idx.r, idx.s), idx['r²s']);
  assert.equal(conjugate(idx['r²'], idx.s), idx.s); // exercise: r²sr⁻² = s
  // Matrices: r(x,y) = (−y,x), s(x,y) = (−x,y), r²s(x,y) = (x,−y)
  assert.deepEqual([...MATRICES[idx.r]], [0, -1, 1, 0]);
  assert.deepEqual([...MATRICES[idx.s]], [-1, 0, 0, 1]);
  assert.deepEqual([...MATRICES[idx['r²s']]], [1, 0, 0, -1]);
});

test('axes: s vertical, conjugation by r gives the horizontal axis, rotations have none', () => {
  assert.equal(axisOf(idx.s).name, 'l’axe vertical');
  assert.equal(axisOf(idx['r²s']).name, 'l’axe horizontal');
  assert.equal(axisOf(idx.rs).name, 'la diagonale y = −x');
  assert.equal(axisOf(idx['r³s']).name, 'la diagonale y = x');
  for (const x of [0, 1, 2, 3]) assert.equal(axisOf(x), undefined);
  for (const x of [4, 5, 6, 7]) assert.ok(axisOf(x));
  // The conjugate's axis is the image of the axis of x under g.
  for (const x of [4, 5, 6, 7]) for (const g of all) {
    const [u, v] = axisOf(x).dir, m = MATRICES[g];
    const image = [m[0] * u + m[1] * v, m[2] * u + m[3] * v];
    const target = axisOf(conjugate(g, x)).dir;
    assert.ok(image[0] * target[1] - image[1] * target[0] === 0, 'directions parallèles');
  }
});

test('element orders: e 1, r² and the four reflections 2, r and r³ 4', () => {
  assert.deepEqual(all.map(elementOrder), [1, 4, 2, 4, 2, 2, 2, 2]);
});

test('the five subgroups are subgroups of the right order', () => {
  assert.deepEqual(SUBGROUPS.map(s => s.members.length), [1, 2, 4, 2, 8]);
  for (const { members } of SUBGROUPS) {
    assert.ok(members.includes(0));
    for (const a of members) { assert.ok(members.includes(inverse(a))); for (const b of members) assert.ok(members.includes(product(a, b))); }
  }
});

test('left cosets: exhaustively, a partition of D₄ into |H|-element classes, index × order = 8', () => {
  for (let sub = 0; sub < SUBGROUPS.length; sub++) for (const rep of all) {
    const r = classesReading({ sub, rep });
    const size = SUBGROUPS[sub].members.length;
    assert.ok(r.classes.every(c => c.length === size));
    assert.equal(r.index * size, ORDER);
    assert.deepEqual(r.classes.flat().sort(), all);
    assert.equal(new Set(r.classes.flat()).size, ORDER);
    assert.deepEqual([...r.aH].sort(), r.classes[r.selected]);
    assert.ok(r.aH.includes(rep));
    assert.equal(r.aHContainsE, rep ? r.classes[r.selected].includes(0) : true);
    assert.equal(r.aHContainsE, SUBGROUPS[sub].members.includes(rep));
    for (const x of all) assert.ok(r.classes[r.classOf[x]].includes(x));
  }
});

test('preset: H = {e, r²}, a = r gives aH = {r, r³}, four classes, e not in aH', () => {
  const r = classesReading(CLASSES_PRESET);
  assert.deepEqual(r.aH, [idx.r, idx['r³']]);
  assert.equal(r.index, 4);
  assert.equal(r.aHContainsE, false);
  const t = classesText(CLASSES_PRESET, r);
  assert.match(t.status, /^aH = \{r, r³\} : 2 éléments, ne contient pas e\./);
  assert.equal(t.table.length, 4);
  assert.deepEqual(t.rows.find(x => x[0] === 'Classe aH')[1].slice(0, 9), '{r, r³} (');
  assert.equal(t.rows.find(x => x[0] === 'Indice [D₄ : H]')[1].slice(0, 2), '4,');
  assert.equal((classesSvg(CLASSES_PRESET, r).match(/lagr-node /g) || []).length, 8);
  assert.equal((classesSvg(CLASSES_PRESET, r).match(/lagr-coset-ring/g) || []).length, 2);
});

test('left cosets of {e, s} are not right cosets: r{e,s} = {r, rs} but {e,s}r = {r, r³s}', () => {
  const left = classesReading({ sub: 3, rep: idx.r }).aH.sort((a, b) => a - b);
  assert.deepEqual(left, [idx.r, idx.rs]);
  assert.deepEqual([product(0, idx.r), product(idx.s, idx.r)].sort((a, b) => a - b), [idx.r, idx['r³s']]);
});

test('conjugation: exhaustive, g x g⁻¹ = g x g⁻¹, class size = index of centralizer', () => {
  for (const x of all) for (const g of all) {
    const r = conjugationReading({ x, g });
    assert.equal(r.result, product(product(g, x), inverse(g)));
    assert.equal(r.perG[g], r.result);
    assert.equal(elementOrder(r.result), elementOrder(x));
    assert.equal(r.conjugates.length, r.centralizerIndex);
    assert.equal(r.conjugates.length * r.centralizer.length, ORDER);
    assert.ok(r.centralizer.includes(0) && r.centralizer.includes(x));
    for (const c of r.centralizer) assert.equal(product(c, x), product(x, c));
    assert.equal(r.centralizer.length, all.filter(c => product(c, x) === product(x, c)).length);
    // two elements g, h give the same conjugate iff h⁻¹g is in C(x)
    for (const h of all) assert.equal(r.perG[g] === r.perG[h], r.centralizer.includes(product(inverse(h), g)));
  }
  // class sizes: {e} 1, {r²} 1, {r, r³} 2, {s, r²s} 2, {rs, r³s} 2
  assert.deepEqual(all.map(x => conjugationReading({ x, g: 0 }).conjugates.length), [1, 2, 1, 2, 2, 2, 2, 2]);
});

test('preset x = s, g = r: rsr⁻¹ = r²s, axis vertical → horizontal, 2 conjugates, centralizer {e, r², s, r²s}', () => {
  const r = conjugationReading(CONJUGATION_PRESET);
  assert.equal(r.result, idx['r²s']);
  assert.deepEqual(r.conjugates, [idx.s, idx['r²s']]);
  assert.deepEqual(r.centralizer, [0, idx['r²'], idx.s, idx['r²s']]);
  assert.equal(r.centralizerIndex, 2);
  const t = conjugationText(CONJUGATION_PRESET, r);
  assert.equal(t.rows[2][1], 'r s r³ = r²s');
  assert.equal(t.rows[3][1], 'l’axe vertical');
  assert.equal(t.rows[4][1], 'l’axe horizontal');
  assert.match(t.status, /^g x g⁻¹ = r s r³ = r²s\. L’axe vertical devient l’axe horizontal\./);
  assert.equal(t.table.length, 8);
  assert.match(conjugationSvg(CONJUGATION_PRESET, r), /lagr-axis-after/);
});

test('rotation x: no axis, the text says so', () => {
  const state = { x: idx.r, g: idx.s };
  const r = conjugationReading(state);
  assert.equal(r.result, idx['r³']);
  assert.equal(r.axisBefore, undefined);
  const t = conjugationText(state, r);
  assert.match(t.status, /x = r est une rotation, sans axe/);
  assert.doesNotMatch(conjugationSvg(state, r), /lagr-axis-after/);
});

test('texts use no ASCII hyphen as minus; clampIndex', () => {
  for (const x of all) for (const g of all) {
    const t = conjugationText({ x, g }, conjugationReading({ x, g }));
    assert.doesNotMatch([t.status, ...t.rows.flat()].join(' '), /y = -x/);
  }
  assert.equal(clampIndex('9', 8, 1), 7);
  assert.equal(clampIndex('-3', 8, 1), 0);
  assert.equal(clampIndex('abc', 8, 1), 1);
  assert.equal(clampIndex('', 8, 1), 1);
  assert.equal(clampIndex('2.4', 5, 1), 2);
});
