import { test } from 'node:test';
import assert from 'node:assert/strict';
import { approxNumber, display, rat, relation } from '../src/figures/rational.ts';
import { affineIteration, clampScaled, closedError, geometricSum, ITERATION_PRESETS, SUM_PRESETS } from '../src/figures/series.ts';
import { iterationText, sumText } from '../src/figures/series-text.ts';
import { seriesModels } from '../src/figures/series-figure.ts';
import { sumSvg } from '../src/figures/series-svg.ts';

const text = (r) => display(r).text;

test('exact display: fractions as in the lesson, short decimals, approximations marked ≈', () => {
  assert.equal(text(rat(15, 16)), '15/16');
  assert.equal(text(rat(-1, 24)), '−1/24');
  assert.equal(text(rat(21, 4)), '5,25');
  assert.equal(text(rat(-363, 200)), '−1,815');
  assert.equal(relation(rat(2, 3)), '= 2/3 ≈ 0,666667');
  assert.deepEqual(display(rat(1n, 10n ** 30n)), { text: '≈ 1,00 × 10⁻³⁰', exact: false });
  assert.equal(approxNumber(19.96769), '19,9677');
  assert.equal(clampScaled('0.55', 10, -9, 9, 0), 6);
  assert.equal(clampScaled('3', 10, -9, 9, 0), 9);
  assert.equal(clampScaled('abc', 2, -10, 10, 4), 4);
});

test('figure 1, halves preset: S₃ = 15/16, L = 1, R₃ = 1/16, first rank N = 6 for ε = 1/100', () => {
  const r = geometricSum(SUM_PRESETS.halves);
  assert.deepEqual([text(r.sums[3]), text(r.limit), text(r.remainder)], ['15/16', '1', '1/16']);
  assert.equal(r.within, false);
  assert.equal(r.firstRank, 6);
  assert.ok(r.halves);
  assert.match(sumSvg(r), /4 morceaux du segment/);
});

test('figure 1, alternating preset: S₃ = 5/8, L = 2/3, R₃ = 1/24; the side alternates with the parity of N', () => {
  const r = geometricSum(SUM_PRESETS.alternating);
  assert.deepEqual([text(r.sums[3]), text(r.limit), text(r.remainder)], ['5/8', '2/3', '1/24']);
  for (let N = 0; N <= 8; N++) {
    const t = sumText({ ...SUM_PRESETS.alternating, N }, geometricSum({ ...SUM_PRESETS.alternating, N }));
    assert.equal(t.rows[6][1], N % 2 === 0 ? `S${'₀₁₂₃₄₅₆₇₈'[N]} > L (reste négatif)` : `S${'₀₁₂₃₄₅₆₇₈'[N]} < L (reste positif)`);
  }
  assert.equal(geometricSum({ ...SUM_PRESETS.alternating, eps: 100 }).firstRank, 6); // exercise 2
});

test('figure 1: exact remainder formula, monotone error, edge cases a = 0, q = 0 and unreachable precision', () => {
  for (const q of [-9, -5, 3, 9]) for (const N of [0, 1, 7, 30]) {
    const r = geometricSum({ a: 13, q, N, eps: 1000 });
    // R_N = a q^(N+1)/(1 − q), compared exactly.
    const expected = rat(13n * BigInt(q) ** BigInt(N + 1) * 10n, 10n * 10n ** BigInt(N + 1) * BigInt(10 - q));
    assert.deepEqual(r.remainder, expected);
    if (r.firstRank !== undefined) assert.ok(r.inBand.every((inside, n) => inside === n >= r.firstRank));
  }
  const zero = sumText({ a: 0, q: 7, N: 4, eps: 10 }, geometricSum({ a: 0, q: 7, N: 4, eps: 10 }));
  assert.match(zero.status, /^a = 0/);
  assert.equal(geometricSum({ a: -7, q: 0, N: 0, eps: 1000 }).firstRank, 0);
  const far = geometricSum({ a: 20, q: 9, N: 80, eps: 1000 });
  assert.equal(far.firstRank, undefined);
  assert.match(sumText({ a: 20, q: 9, N: 80, eps: 1000 }, far).status, /Précision non atteinte dans les 81 sommes affichées/);
  // Never announce that the limit is reached when the remainder is not zero.
  for (const N of [40, 80]) assert.doesNotMatch(sumText({ ...SUM_PRESETS.halves, N }, geometricSum({ ...SUM_PRESETS.halves, N })).status, /= L|S.* = 1,/);
});

test('figure 2: presets of the note, closed formula e_n = qⁿ(x₀ − p), q = 0 and x₀ = p', () => {
  const average = affineIteration({ ...ITERATION_PRESETS.average, n: 3 });
  assert.equal(text(average.fixedPoint), '6');
  assert.deepEqual(average.positions.map(text), ['0', '3', '4,5', '5,25']);
  const alternating = affineIteration({ ...ITERATION_PRESETS.alternating, n: 3 });
  assert.equal(text(alternating.fixedPoint), '3');
  assert.deepEqual(alternating.positions.map(text), ['7', '1', '4', '2,5']);
  for (let k = 0; k <= 40; k++) {
    const r = affineIteration({ q: -7, b: 5, x0: -13, n: k });
    assert.deepEqual(r.errors[k], closedError(r, k));
  }
  assert.match(iterationText({ q: 0, b: 4, x0: 1, n: 2 }, affineIteration({ q: 0, b: 4, x0: 1, n: 2 })).status, /dès le rang 1/);
  assert.match(iterationText({ q: 5, b: 6, x0: 12, n: 0 }, affineIteration({ q: 5, b: 6, x0: 12, n: 0 })).status, /point fixe et ne change pas/);
  assert.equal(iterationText({ ...ITERATION_PRESETS.average, n: 5 }, affineIteration({ ...ITERATION_PRESETS.average, n: 5 })).table.length, 6);
});

test('controller models: a new parameter restarts the iteration; buttons are disabled at the right moments', () => {
  const it = seriesModels['iteration-affine'];
  let state = it.action(it.action(it.preset(), 'next'), 'next');
  assert.equal(state.n, 2);
  assert.equal(it.set(state, 'b', 4).n, 0);
  assert.deepEqual(it.view(it.preset()).disabled, ['reset']);
  for (let k = 0; k < 45; k++) state = it.action(state, 'next');
  assert.equal(state.n, 40);
  assert.ok(it.view(state).disabled.includes('next'));
  const sum = seriesModels['somme-geometrique'];
  assert.equal(sum.action(sum.preset(), 'first-rank').N, 6);
  assert.ok(sum.view({ a: 20, q: 9, N: 3, eps: 1000 }).disabled.includes('first-rank'));
});
