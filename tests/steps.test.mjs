import { test } from 'node:test';
import assert from 'node:assert/strict';
import { clampField, int, STEPS_PRESET, stepsReading, stepsText } from '../src/figures/steps.ts';
import { stepsSvg } from '../src/figures/steps-svg.ts';

const reading = (state) => stepsReading({ ...STEPS_PRESET, ...state });

test('preset a = 6, b = 4: 6 − 4 = 2 is reached, all positions are even', () => {
  const r = reading({ m: 1, n: -1 });
  assert.equal(r.total, 2);
  assert.equal(r.smallestPositive, 2);
  assert.ok(r.reached.every(({ value }) => value % 2 === 0));
  assert.ok(r.reached.some(({ value }) => value === 2));
});

test('every listed position is exactly m·a + n·b for its couple, couples stay within ±5, values are distinct and sorted', () => {
  for (const [a, b] of [[6, 4], [-12, 12], [7, -3], [0, 5], [0, 0], [12, 12]]) {
    const r = stepsReading({ a, b, m: 0, n: 0 });
    const values = r.reached.map(x => x.value);
    assert.deepEqual(values, [...new Set(values)].sort((x, y) => x - y), `valeurs distinctes et triées pour a=${a}, b=${b}`);
    for (const { value, m, n } of r.reached) {
      assert.equal(m * a + n * b, value);
      assert.ok(Math.abs(m) <= 5 && Math.abs(n) <= 5);
    }
    // Exhaustive: no position of the finite range is missing.
    for (let m = -5; m <= 5; m++) for (let n = -5; n <= 5; n++) assert.ok(values.includes(m * a + n * b));
  }
});

test('a = b = 0: only the position 0, no positive position', () => {
  const r = reading({ a: 0, b: 0, m: 3, n: -2 });
  assert.deepEqual(r.reached.map(x => x.value), [0]);
  assert.equal(r.smallestPositive, undefined);
  assert.match(stepsText({ ...STEPS_PRESET, a: 0, b: 0 }, r).status, /^a = b = 0 : toute combinaison m a \+ n b vaut 0/);
});

test('negative steps and coefficients: exact text with the true minus sign', () => {
  const state = { a: -6, b: 4, m: -1, n: 2 };
  const r = stepsReading(state);
  assert.equal(r.ma, 6);
  assert.equal(r.nb, 8);
  const { rows } = stepsText(state, r);
  assert.equal(rows[1][1], '(−1) × (−6) = 6');
  assert.equal(rows[3][1], '6 + 8 = 14');
  assert.equal(int(-3), '−3');
});

test('the finite range is always announced; the table matches the listed positions', () => {
  const r = reading({});
  const text = stepsText(STEPS_PRESET, r);
  assert.match(text.status, /entre −5 et 5 : ce ne sont pas nécessairement toutes les positions accessibles/);
  assert.equal(text.table.length, r.reached.length);
  assert.match(stepsSvg(r), /fig-current-ring/);
  assert.equal((stepsSvg(r).match(/fig-dot /g) || []).length, r.reached.length);
});

test('clampField: integer in the limits, fallback for a non-number', () => {
  assert.equal(clampField('a', '99', 6), 12);
  assert.equal(clampField('m', '-9', 0), -5);
  assert.equal(clampField('b', '3.6', 4), 4);
  assert.equal(clampField('n', 'abc', 2), 2);
});
