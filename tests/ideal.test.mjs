import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculation, clampField, IDEAL_PRESET, idealReading, idealText, int, isMultiple } from '../src/figures/ideal.ts';
import { idealSvg } from '../src/figures/ideal-svg.ts';

const NB = ' ';
const reading = (state) => idealReading({ ...IDEAL_PRESET, ...state });

test('preset a = 6, b = 4, u = 1, v = −1: 6 − 4 = 2, even, not a multiple of a or b', () => {
  const r = reading({});
  assert.equal(r.total, 2);
  assert.equal(r.onLine, true);
  assert.equal(r.currentInA, false);
  assert.equal(r.currentInB, false);
  assert.equal(r.smallestPositiveCombination, 2);
  assert.ok(r.entries.filter(e => e.combination).every(e => e.k % 2 === 0));
  assert.equal(r.entries.length, 49);
  assert.equal(r.entries[0].k, -24);
  assert.equal(r.entries[48].k, 24);
  assert.deepEqual(r.entries.filter(e => e.inBoth).map(e => e.k), [-24, -12, 0, 12, 24]);
  assert.equal(r.countA, 9);
  assert.equal(r.countB, 13);
  assert.equal(r.countBoth, 5);
  assert.equal(r.countEither, 17);
});

test('exhaustive over a, b in −12..12: memberships and combinations match a brute-force check', () => {
  for (let a = -12; a <= 12; a++) {
    for (let b = -12; b <= 12; b++) {
      const r = idealReading({ a, b, u: 0, v: 0 });
      const reachable = new Set();
      for (let i = -5; i <= 5; i++) for (let j = -5; j <= 5; j++) reachable.add(i * a + j * b);
      for (const e of r.entries) {
        const inA = a === 0 ? e.k === 0 : e.k % a === 0;
        const inB = b === 0 ? e.k === 0 : e.k % b === 0;
        assert.equal(e.inA, inA, `a=${a} k=${e.k}`);
        assert.equal(e.inB, inB, `b=${b} k=${e.k}`);
        assert.equal(e.inBoth, inA && inB);
        assert.equal(Boolean(e.combination), reachable.has(e.k), `a=${a} b=${b} k=${e.k}`);
        if (e.combination) {
          const { u, v } = e.combination;
          assert.equal(u * a + v * b + 0, e.k);
          assert.ok(Math.abs(u) <= 5 && Math.abs(v) <= 5);
        }
        // Every multiple of a is reached by u = k / a only when |k / a| <= 5; 0 is always reached.
        if (e.k === 0) assert.ok(e.combination);
      }
    }
  }
});

test('every selected result u a + v b over the whole range is computed exactly', () => {
  for (let a = -12; a <= 12; a += 3) for (let b = -12; b <= 12; b += 4) for (let u = -5; u <= 5; u++) for (let v = -5; v <= 5; v++) {
    const r = idealReading({ a, b, u, v });
    assert.equal(r.total, u * a + v * b + 0);
    assert.equal(r.ua, u * a + 0);
    assert.equal(r.vb, v * b + 0);
    assert.equal(r.onLine, Math.abs(r.total) <= 24);
    assert.equal(r.currentInA, isMultiple(r.total, a));
  }
});

test('a = 0: the multiples of 0 are {0}, no division by zero', () => {
  const r = reading({ a: 0, b: 5, u: 3, v: 1 });
  assert.deepEqual(r.entries.filter(e => e.inA).map(e => e.k), [0]);
  assert.equal(r.countA, 1);
  assert.deepEqual(r.entries.filter(e => e.inBoth).map(e => e.k), [0]);
  assert.equal(r.total, 5);
  assert.equal(r.currentInA, false);
  assert.equal(r.currentInB, true);
  assert.equal(r.entries.find(e => e.k === 10).combination.v, 2);
  assert.equal(isMultiple(0, 0), true);
  assert.equal(isMultiple(7, 0), false);
  const text = idealText({ ...IDEAL_PRESET, a: 0, b: 5, u: 3, v: 1 }, r);
  assert.match(text.status, new RegExp(`a = 0${NB}: les multiples de 0 se réduisent à 0\\.`));
});

test('a = b = 0: only 0 is a multiple and a combination, no positive combination', () => {
  const r = reading({ a: 0, b: 0, u: 4, v: -2 });
  assert.equal(r.total, 0);
  assert.deepEqual(r.entries.filter(e => e.inA || e.inB || e.inBoth || e.combination).map(e => e.k), [0]);
  assert.equal(r.smallestPositiveCombination, undefined);
  const text = idealText({ a: 0, b: 0, u: 4, v: -2 }, r);
  assert.match(text.status, new RegExp(`^Calcul sélectionné${NB}: 4 × 0 \\+ \\(−2\\) × 0 = 0\\.`));
  assert.match(text.status, new RegExp(`a = b = 0${NB}: les multiples de 0 se réduisent à 0 et toute combinaison u a \\+ v b vaut 0`));
  assert.equal(text.rows.find(([t]) => t.startsWith('Plus petit'))[1], 'aucun');
});

test('negative generators and coefficients: exact text with the true minus sign', () => {
  const state = { a: -6, b: 4, u: -1, v: 2 };
  const r = idealReading(state);
  assert.equal(r.total, 14);
  assert.equal(calculation(-1, -6, 2, 4), '(−1) × (−6) + 2 × 4 = 14');
  assert.equal(idealText(state, r).rows[1][1], '(−1) × (−6) + 2 × 4 = 14');
  assert.equal(int(-3), '−3');
});

test('a result outside the line is announced, not drawn on it', () => {
  const state = { a: 12, b: 12, u: 5, v: 5 };
  const r = idealReading(state);
  assert.equal(r.total, 120);
  assert.equal(r.onLine, false);
  const text = idealText(state, r);
  assert.match(text.status, /hors de la droite affichée/);
  assert.match(idealSvg(r), /120 hors de la droite/);
  assert.doesNotMatch(idealSvg(r), /fig-current-ring/);
});

test('finite range and exploratory nature always announced; table and drawing match the entries', () => {
  const r = reading({});
  const text = idealText(IDEAL_PRESET, r);
  assert.match(text.status, new RegExp(`^Calcul sélectionné${NB}: 1 × 6 \\+ \\(−1\\) × 4 = 2\\.`));
  assert.match(text.status, /de −24 à 24, combinaisons calculées seulement pour u et v entre −5 et 5/);
  assert.match(text.status, /peut omettre des éléments de l’idéal et ne prouve rien/);
  assert.equal(text.table.length, 49);
  assert.deepEqual(text.table[0].slice(0, 4), ['−24', 'oui', 'oui', 'oui']);
  assert.equal(text.table[24][0], '0');
  assert.equal(text.table.find(row => row[0] === '1')[4], 'aucune dans les bornes');
  assert.equal(text.table.find(row => row[0] === '2')[4], `(1, −1)${NB}: 1 × 6 + (−1) × 4 = 2`);
  const svg = idealSvg(r);
  assert.equal((svg.match(/ideal-mark-a/g) || []).length, r.countA);
  assert.equal((svg.match(/ideal-mark-b"/g) || []).length, r.countB);
  assert.equal((svg.match(/ideal-mark-both/g) || []).length, r.countBoth);
  assert.equal((svg.match(/ideal-mark-combo/g) || []).length, r.countCombination);
  assert.match(svg, /fig-current-ring/);
});

test('clampField: integer in the limits, fallback for a non-number', () => {
  assert.equal(clampField('a', '99', 6), 12);
  assert.equal(clampField('b', '-99', 4), -12);
  assert.equal(clampField('u', '-9', 0), -5);
  assert.equal(clampField('v', '3.6', 4), 4);
  assert.equal(clampField('v', 'abc', 2), 2);
});
