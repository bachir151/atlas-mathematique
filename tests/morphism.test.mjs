import { test } from 'node:test';
import assert from 'node:assert/strict';
import { clampField, compose, euclid, int, MORPHISM_PRESET, morphismReading, morphismText, rotation, rotationName } from '../src/figures/morphism.ts';
import { morphismSvg } from '../src/figures/morphism-svg.ts';

const range = Array.from({ length: 25 }, (_, i) => i - 12);

test('preset m = 1, n = 5: same rotation r, n − m = 4 with remainder 0, sum 6 gives r²', () => {
  assert.deepEqual(MORPHISM_PRESET, { m: 1, n: 5 });
  const r = morphismReading(MORPHISM_PRESET);
  assert.equal(r.difference, 4);
  assert.equal(r.remainder, 0);
  assert.equal(r.sameRotation, true);
  assert.equal(rotationName(r.pm), 'r');
  assert.equal(r.sum, 6);
  assert.equal(rotationName(r.pSum), 'r²');
  assert.equal(rotationName(r.composed), 'r²');
});

test('euclidean division is exact with 0 ≤ s < 4, also for negatives', () => {
  for (let k = -30; k <= 30; k++) {
    const { q, s } = euclid(k);
    assert.equal(4 * q + s, k);
    assert.ok(s >= 0 && s < 4);
  }
  assert.deepEqual(euclid(-3), { q: -1, s: 1 });
  assert.equal(rotation(-12), 0);
});

test('exhaustive on 25 × 25 selectors: p(m+n) = p(m) ∘ p(n), sums reach −24..24, collisions iff difference ≡ 0 mod 4', () => {
  let min = Infinity, max = -Infinity;
  for (const m of range) for (const n of range) {
    const r = morphismReading({ m, n });
    assert.equal(r.sum, m + n);
    min = Math.min(min, r.sum); max = Math.max(max, r.sum);
    assert.equal(r.sumsAgree, true);
    assert.equal(r.pSum, compose(rotation(m), rotation(n)));
    assert.equal(r.difference, n - m);
    assert.equal(r.sameRotation, r.remainder === 0);
    assert.equal(4 * r.quotient + r.remainder, n - m);
  }
  assert.equal(min, -24);
  assert.equal(max, 24);
});

test('text: true minus sign, range and experimental nature announced, one table row per integer', () => {
  const state = { m: -3, n: 5 };
  const r = morphismReading(state);
  const t = morphismText(r);
  assert.equal(int(-3), '−3');
  assert.deepEqual(t.rows[3], ['Différence n − m', '5 − (−3) = 8']);
  assert.equal(t.rows[1][1], 'p(−3) = r');
  assert.match(t.status, /m et n entre −12 et 12, somme calculée exactement entre −24 et 24/);
  assert.match(t.status, /ne prouvent pas la propriété générale/);
  assert.equal(t.table.length, 25);
  assert.deepEqual(t.table[0], ['−12', '−12 = 4 × (−3) + 0', 'e']);
  assert.deepEqual(t.table[24], ['12', '12 = 4 × 3 + 0', 'e']);
  for (const [k, , name] of t.table) assert.equal(name, rotationName(rotation(Number(k.replace('−', '-')))));
});

test('svg: 25 dots, two markers, no NaN', () => {
  const svg = morphismSvg({ m: 1, n: 5 });
  assert.equal((svg.match(/fig-dot /g) || []).length, 25);
  assert.match(svg, /fig-current-ring/);
  assert.doesNotMatch(svg, /NaN|undefined/);
});

test('clampField: integer in the range, fallback for a non-number', () => {
  assert.equal(clampField('99', 1), 12);
  assert.equal(clampField('-99', 1), -12);
  assert.equal(clampField('3.6', 1), 4);
  assert.equal(clampField('abc', 5), 5);
});
