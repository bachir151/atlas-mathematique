import { test } from 'node:test';
import assert from 'node:assert/strict';
import { clampInt, formatPoint, mediatrix, reflection, twoReflections, s, t, squareVertices } from '../src/figures/plane.ts';
import { mediatrixText, reflectionText, twoReflectionsText } from '../src/figures/plane-text.ts';
import { frame, mediatrixSvg, reflectionRange, reflectionSvg, twoReflectionsSvg } from '../src/figures/plane-svg.ts';

test('inputs are clamped integers and numbers use a true minus sign', () => {
  assert.equal(clampInt('7', -5, 5, 0), 5);
  assert.equal(clampInt(-2.6, -5, 5, 0), -3);
  assert.equal(clampInt('abc', -5, 5, 1), 1);
  assert.equal(clampInt(Infinity, -5, 5, 1), 1);
  assert.equal(formatPoint([-1, 3]), '(−1, 3)');
});

test('figure 1: squared distances and their difference 4ax decide the closer point', () => {
  const r = mediatrix({ a: 2, x: 1, y: 3 });
  assert.deepEqual([r.pa2, r.pb2, r.difference, r.closer], [18, 10, 8, 'B']);
  for (let a = 1; a <= 4; a++) for (let x = -5; x <= 5; x++) for (let y = -5; y <= 5; y++) {
    const m = mediatrix({ a, x, y });
    assert.equal(m.difference, 4 * a * x);
    assert.equal(m.closer, x === 0 ? 'equal' : x > 0 ? 'B' : 'A');
  }
  const text = mediatrixText({ a: 2, x: -3, y: -1 });
  assert.equal(text.rows[2][1], '(x + a)² + y² = (−3 + 2)² + (−1)² = 2');
  assert.equal(text.rows[4][1], '4ax = 4 × 2 × (−3) = −24');
  assert.equal(text.status, 'P est plus près de A.');
  assert.equal(mediatrixText({ a: 3, x: 0, y: 4 }).status, 'P est sur la médiatrice d : PA = PB.');
});

test('figure 2: H is the midpoint of [PP′], points of the axis are fixed, two reflections give P back', () => {
  for (let c = -4; c <= 4; c++) for (let x = -5; x <= 5; x++) {
    const r = reflection({ c, x, y: 2, count: 1 });
    assert.equal((r.P[0] + r.image[0]) / 2, r.H[0]);
    assert.equal(r.onAxis, x === c);
    assert.deepEqual(reflection({ c, x, y: 2, count: 2 }).current, r.P);
    assert.ok(reflectionRange({ c, x, y: 2, count: 1 }) >= Math.abs(r.image[0]) + 1, 'image stays in the frame');
  }
  const preset = reflectionText({ c: 2, x: 5, y: -1, count: 1 });
  assert.equal(preset.status, 'Point courant : P′ = (−1, −1). Position initiale : P = (5, −1).');
  assert.equal(reflectionText({ c: 1, x: 1, y: 3, count: 1 }).status, 'Le point est sur l’axe et reste fixe.');
});

test('figure 3: s ∘ t is the positive quarter turn, t ∘ s the negative one; the origin does not distinguish them', () => {
  for (let x = -4; x <= 4; x++) for (let y = -4; y <= 4; y++) {
    assert.deepEqual(s(t([x, y])), [-y, x]);
    assert.deepEqual(t(s([x, y])), [y, -x]);
  }
  const r = twoReflections({ x: 1, y: 0, order: 'diagonal-first', step: 2 });
  assert.deepEqual([r.middle, r.final, r.composite, r.result], [[0, 1], [-0, 1], 's ∘ t', 'r']);
  assert.equal(twoReflections({ x: 1, y: 0, order: 'vertical-first', step: 1 }).path.length, 2);
  assert.equal(twoReflectionsText({ x: 1, y: 0, order: 'vertical-first', step: 2 }).status, 'P₂ = (y, −x) : t ∘ s est le quart de tour négatif r⁻¹.');
  assert.match(twoReflectionsText({ x: 0, y: 0, order: 'diagonal-first', step: 2 }).status, /les images coïncident/);
  assert.deepEqual(squareVertices(2), { A: [-2, 2], B: [2, 2], C: [2, -2], D: [-2, -2] });
});

test('SVG markup: y axis points up, values are numbers only, coinciding points share a label', () => {
  const f = frame(5);
  assert.deepEqual(f.toSvg([0, 0]), [200, 200]);
  assert.ok(f.toSvg([0, 1])[1] < 200, 'positive y drawn upwards');
  assert.deepEqual(f.toWorld(...f.toSvg([3, -2])), [3, -2]);
  for (const markup of [mediatrixSvg({ a: 2, x: 1, y: 3 }, 'f1'), reflectionSvg({ c: 2, x: 5, y: -1, count: 1 }, 'f2')]) {
    assert.doesNotMatch(markup, /<script|on[a-z]+=|NaN|undefined/);
    assert.equal((markup.match(/data-drag-handle/g) ?? []).length, 1);
  }
  // Preset P = (1, 0): P₁ = (0, 1) lies on the axis of s, so P₂ = P₁.
  assert.match(twoReflectionsSvg({ x: 1, y: 0, order: 'diagonal-first', step: 2 }, 'f3'), /P₁ = P₂/);
});
