import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  FIELDS, GRAPH_MAX, GRAPH_MIN, POLY_PRESET, clampField, degree, divide, evaluate, formatDivisor, formatPoly,
  int, polyAdd, polyEqual, polyFromInts, polyMul, polyReading, polyText,
} from '../src/figures/poly.ts';
import { polySvg } from '../src/figures/poly-svg.ts';
import { rat } from '../src/figures/rational.ts';

const range = [-3, -2, -1, 0, 1, 2, 3];

test('preset X³ − 1 divided by X − 1: quotient X² + X + 1, remainder 0, P(1) = 0', () => {
  const state = { ...POLY_PRESET };
  const r = polyReading(state);
  assert.equal(formatPoly(r.p), 'X³ − 1');
  assert.equal(formatPoly(r.quotient), 'X² + X + 1');
  assert.equal(formatPoly(r.remainder), '0');
  assert.equal(formatDivisor(1), 'X − 1');
  const t = polyText(state, r);
  assert.equal(t.rows.find(([k]) => k === 'Identité de division')[1], 'X³ − 1 = (X − 1) × (X² + X + 1) + 0');
  assert.match(t.status, /Le reste est nul : 1 est une racine de P/);
  assert.match(t.status, /ces essais ne démontrent rien/);
});

test('exhaustive on the 7⁴ values: P = (X − a)Q + R, deg R < 1, R = P(a), exact integers', () => {
  let count = 0;
  for (const c2 of range) for (const c1 of range) for (const c0 of range) for (const a of range) {
    const state = { c2, c1, c0, a };
    const r = polyReading(state);
    const sum = polyAdd(polyMul(r.divisor, r.quotient), r.remainder);
    assert.ok(polyEqual(sum, r.p), `identité pour ${JSON.stringify(state)}`);
    assert.ok(degree(r.remainder) < 1);
    assert.equal(degree(r.quotient), 2);
    assert.ok(r.quotient.every(c => c.d === 1n) && r.remainder.every(c => c.d === 1n));
    const rem = r.remainder.length ? r.remainder[0] : rat(0);
    assert.deepEqual(rem, r.value, `reste = P(a) pour ${JSON.stringify(state)}`);
    assert.deepEqual(r.value, rat(a ** 3 + c2 * a * a + c1 * a + c0));
    assert.equal(r.remainder.length === 0, r.value.n === 0n);
    assert.equal(r.graph.length, GRAPH_MAX - GRAPH_MIN + 1);
    for (const { x, y } of r.graph) assert.equal(y, x ** 3 + c2 * x * x + c1 * x + c0);
    const t = polyText(state, r);
    assert.equal(t.table.length, 9);
    assert.ok(t.status.length > 0 && !/NaN|undefined/.test(t.status + t.rows.flat().join('')));
    assert.match(polySvg(state, r), /poly-dot-current/);
    count++;
  }
  assert.equal(count, 2401);
});

test('generic exact division in ℚ[X] with fractional coefficients', () => {
  const p = [rat(1, 2), rat(-1, 3), rat(0), rat(2, 5), rat(1)]; // X⁴ + 2/5 X³ − 1/3 X + 1/2
  const d = [rat(3, 4), rat(-5, 2), rat(1, 3)]; // 1/3 X² − 5/2 X + 3/4
  const { quotient, remainder } = divide(p, d);
  assert.ok(degree(remainder) < degree(d));
  assert.ok(polyEqual(polyAdd(polyMul(d, quotient), remainder), p));
  assert.equal(formatPoly([rat(-1, 2), rat(0), rat(3, 2), rat(1)]), 'X³ + (3/2)X² − 1/2');
  assert.deepEqual(divide(polyFromInts([1, 1]), polyFromInts([1, 1, 1])).quotient, []);
  assert.throws(() => divide(p, []), RangeError);
  // 16 + 16/5 − 2/3 + 1/2 = 571/30 at X = 2
  assert.deepEqual(evaluate(p, rat(2)), rat(571, 30));
});

test('formatting: omitted zero terms, unit coefficients, true minus signs', () => {
  assert.equal(formatPoly(polyFromInts([0, 0, 0, 1])), 'X³');
  assert.equal(formatPoly(polyFromInts([-3, 1, -1, 1])), 'X³ − X² + X − 3');
  assert.equal(formatPoly(polyFromInts([0, -2, 3, 0])), '3X² − 2X');
  assert.equal(formatPoly(polyFromInts([-1])), '−1');
  assert.equal(formatPoly(polyFromInts([0, -1])), '−X');
  assert.equal(formatPoly([]), '0');
  assert.equal(formatDivisor(0), 'X');
  assert.equal(formatDivisor(-2), 'X + 2');
  assert.equal(int(-3), '−3');
  const r = polyReading({ c2: -3, c1: 0, c0: 2, a: -2 });
  assert.equal(formatPoly(r.p), 'X³ − 3X² + 2');
  assert.match(polyText({ c2: -3, c1: 0, c0: 2, a: -2 }, r).rows[6][1], /^X³ − 3X² \+ 2 = \(X \+ 2\) × \(X² − 5X \+ 10\) − 18$/);
});

test('non-zero remainder: reading says P(a) equals the remainder and a is not a root', () => {
  const state = { c2: 1, c1: 0, c0: 1, a: 2 }; // X³ + X² + 1, P(2) = 13
  const r = polyReading(state);
  assert.equal(formatPoly(r.remainder), '13');
  const t = polyText(state, r);
  assert.match(t.rows.find(([k]) => k === 'Comparaison')[1], /^Le reste 13 et P\(2\) = 13 coïncident\.$/);
  assert.match(t.status, /Le reste n’est pas nul : 2 n’est pas une racine de P \(calcul exact\)/);
});

test('graph: SVG has one dot per integer and the highlighted point carries (a, P(a))', () => {
  const state = { c2: 3, c1: 3, c0: 3, a: -3 };
  const r = polyReading(state);
  const svg = polySvg(state, r);
  assert.equal((svg.match(/poly-dot"/g) || []).length, 8);
  assert.equal((svg.match(/poly-dot-current/g) || []).length, 1);
  assert.match(svg, /\(−3, −6\)/); // −27 + 27 − 9 + 3 = −6
  assert.ok(!/NaN/.test(svg));
});

test('clampField: integer in the limits, fallback for a non-number', () => {
  assert.equal(clampField('a', '99', 1), 3);
  assert.equal(clampField('c2', '-9', 0), -3);
  assert.equal(clampField('c0', '1.6', 0), 2);
  assert.equal(clampField('c1', 'abc', 2), 2);
  assert.deepEqual([...FIELDS], ['c2', 'c1', 'c0', 'a']);
});
