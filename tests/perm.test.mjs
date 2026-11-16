import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  applyOnce, canSwap, clampN, cycleNotation, cycles, fixedPoints, identity, initialState, isPermutation,
  nonTrivialCycles, permText, putBack, returnCount, setN, swapImages,
} from '../src/figures/perm.ts';
import { permSvg } from '../src/figures/perm-svg.ts';

const THIN = ' ';

function* permutations(n) {
  const rec = function* (prefix, rest) {
    if (rest.length === 0) { yield prefix; return; }
    for (let i = 0; i < rest.length; i++) yield* rec([...prefix, rest[i]], [...rest.slice(0, i), ...rest.slice(i + 1)]);
  };
  yield* rec([], identity(n));
}
const factorial = n => (n <= 1 ? 1 : n * factorial(n - 1));
const compose = (s, t) => t.map(x => s[x - 1]);
const power = (s, k) => { let r = identity(s.length); for (let i = 0; i < k; i++) r = compose(s, r); return r; };

/** Rebuild a permutation from its notation « (1 3 2)(4 5) » or « e ». */
function parse(notation, n) {
  const images = identity(n);
  if (notation === 'e') return images;
  for (const group of notation.match(/\([^)]*\)/g)) {
    const items = group.slice(1, -1).split(THIN).map(Number);
    items.forEach((x, i) => { images[x - 1] = items[(i + 1) % items.length]; });
  }
  return images;
}

test('initial state: n = 4, 1↦3, 2↦1, 3↦2, 4↦4, cycle (1 3 2), fixed point 4', () => {
  const s = initialState();
  assert.equal(s.n, 4);
  assert.deepEqual(s.images, [3, 1, 2, 4]);
  assert.deepEqual(s.positions, [1, 2, 3, 4]);
  assert.equal(s.count, 0);
  assert.equal(cycleNotation(s.images), `(1${THIN}3${THIN}2)`);
  assert.deepEqual(fixedPoints(s.images), [4]);
  assert.equal(returnCount(s.images), 3);
});

test('cycle decomposition, exhaustive for all permutations with n ≤ 6', () => {
  for (let n = 1; n <= 6; n++) {
    let count = 0;
    for (const images of permutations(n)) {
      count++;
      const list = cycles(images);
      // Partition of 1..n.
      assert.deepEqual(list.flat().sort((a, b) => a - b), identity(n));
      list.forEach((cycle, index) => {
        assert.equal(cycle[0], Math.min(...cycle), 'starts at its minimum');
        if (index > 0) assert.ok(list[index - 1][0] < cycle[0], 'sorted by minimum');
        cycle.forEach((x, i) => assert.equal(images[x - 1], cycle[(i + 1) % cycle.length], 'follows the images'));
      });
      assert.deepEqual(fixedPoints(images), images.map((v, i) => (v === i + 1 ? i + 1 : 0)).filter(Boolean));
      assert.equal(list.reduce((sum, c) => sum + c.length, 0), n);
      // The notation describes exactly σ (round trip); the identity is « e ».
      const notation = cycleNotation(images);
      assert.deepEqual(parse(notation, n), images, notation);
      assert.equal(notation === 'e', images.every((v, i) => v === i + 1));
      assert.ok(nonTrivialCycles(images).every(c => c.length >= 2));
      // Return count: σ^k = e, and no smaller positive power is e.
      const k = returnCount(images);
      assert.deepEqual(power(images, k), identity(n));
      for (let j = 1; j < k; j++) assert.notDeepEqual(power(images, j), identity(n));
      // Text never fails and mentions the notation.
      assert.ok(permText({ n, images, positions: identity(n), count: 0 }).status.includes(notation));
    }
    assert.equal(count, factorial(n));
  }
});

test('swapping two images keeps a bijection, is an involution, resets cards and counter (all permutations n ≤ 5, all pairs)', () => {
  for (let n = 2; n <= 5; n++) for (const images of permutations(n)) {
    const state = applyOnce({ n, images, positions: identity(n), count: 0 });
    for (let u = 1; u <= n; u++) for (let v = 1; v <= n; v++) {
      const next = swapImages(state, u, v);
      if (u === v) { assert.equal(next, state); continue; }
      assert.ok(isPermutation(next.images));
      assert.equal(next.count, 0);
      assert.deepEqual(next.positions, identity(n));
      // The two elements sent to u and v now have exchanged images; others unchanged.
      images.forEach((value, i) => {
        const expected = value === u ? v : value === v ? u : value;
        assert.equal(next.images[i], expected);
      });
      assert.deepEqual(swapImages(next, u, v).images, images);
    }
  }
});

test('invalid swaps are refused', () => {
  const s = initialState();
  assert.equal(canSwap(4, 2, 2), false);
  assert.equal(canSwap(4, 0, 2), false);
  assert.equal(canSwap(4, 1, 5), false);
  assert.equal(canSwap(4, 1, 2), true);
  assert.equal(swapImages(s, 3, 3), s);
  assert.equal(swapImages(s, 1, 9), s);
});

test('applying σ k times puts card c at σ^k(c); the counter counts; putBack resets', () => {
  for (let n = 2; n <= 6; n++) for (const images of permutations(n)) {
    let s = { n, images, positions: identity(n), count: 0 };
    for (let k = 1; k <= 7; k++) {
      s = applyOnce(s);
      assert.equal(s.count, k);
      assert.deepEqual(s.positions, power(images, k));
      assert.ok(isPermutation(s.positions));
    }
    const back = putBack(s);
    assert.deepEqual(back.positions, identity(n));
    assert.equal(back.count, 0);
    assert.deepEqual(back.images, images);
  }
  // Initial rule: back at the start exactly after 3 applications.
  let s = initialState();
  const seen = [];
  for (let k = 0; k < 3; k++) { s = applyOnce(s); seen.push(s.positions.join('')); }
  assert.deepEqual(seen, ['3124', '2314', '1234']);
});

test('n: bounds 2..6, a change resets to the identity (empty product, « e »)', () => {
  assert.equal(clampN(1), 2);
  assert.equal(clampN(99), 6);
  assert.equal(clampN('abc', 4), 4);
  assert.equal(clampN(3.6), 4);
  for (let n = 2; n <= 6; n++) {
    const s = setN(n);
    assert.deepEqual(s.images, identity(n));
    assert.equal(s.count, 0);
    assert.equal(cycleNotation(s.images), 'e');
    assert.equal(returnCount(s.images), 1);
    assert.equal(fixedPoints(s.images).length, n);
    assert.match(permText(s).rows[2][1], /^e \(identité/);
  }
});

test('text: initial reading, table, honest wording', () => {
  const s = initialState();
  const t = permText(s);
  assert.deepEqual(t.rows.find(r => r[0] === 'Points fixes'), ['Points fixes', '4']);
  assert.deepEqual(t.rows.find(r => r[0] === 'Longueurs des cycles'), ['Longueurs des cycles', '3, 1 (un point fixe compte pour 1)']);
  assert.deepEqual(t.rows.find(r => r[0] === 'Images de σ'), ['Images de σ', '1 ↦ 3 ; 2 ↦ 1 ; 3 ↦ 2 ; 4 ↦ 4']);
  assert.deepEqual(t.table, [['1', '3', '1'], ['2', '1', '2'], ['3', '2', '3'], ['4', '4', '4']]);
  assert.match(t.status, /^Les cartes sont à leur position initiale\. Décomposition de σ : \(1.3.2\)\./);
  assert.match(t.status, /n est choisi entre 2 et 6\./);
  assert.match(t.status, /ne constituent pas une preuve générale\.$/);
  const after = permText(applyOnce(s), { kind: 'apply' });
  assert.match(after.status, /^Permutation appliquée aux positions courantes\. Après 1 application, les cartes sont aux positions 3, 1, 2, 4\./);
  assert.deepEqual(after.table[0], ['1', '3', '3']);
  let s3 = s; for (let i = 0; i < 3; i++) s3 = applyOnce(s3);
  assert.match(permText(s3).status, /Après 3 applications, toutes les cartes sont revenues à leur position initiale\./);
  assert.match(permText(swapImages(s, 1, 2), { kind: 'swap', u: 1, v: 2 }).status, /^Images 1 et 2 échangées : cartes remises/);
});

test('svg: n cards, one arrow per image, deterministic, integers only', () => {
  for (let n = 2; n <= 6; n++) for (const images of permutations(n)) {
    const svg = permSvg({ n, images, positions: identity(n), count: 0 });
    assert.equal((svg.match(/class="perm-card /g) || []).length, n);
    assert.equal((svg.match(/class="perm-arrow /g) || []).length, n);
    assert.equal((svg.match(/class="perm-head /g) || []).length, n);
    assert.ok(!/NaN|undefined|Infinity/.test(svg));
    if (n === 6 && images.join('') === '654321') assert.equal(svg, permSvg({ n, images, positions: identity(n), count: 0 }));
  }
});
