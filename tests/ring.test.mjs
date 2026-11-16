import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LIMITS, RING_PRESET, boundsOf, clampField, cls, ringReading, ringText, steppedModulus, withModulus } from '../src/figures/ring.ts';
import { ringSvg } from '../src/figures/ring-svg.ts';

const range = (min, max) => Array.from({ length: max - min + 1 }, (_, i) => min + i);
const ns = range(2, 12);
const gcd = (x, y) => (y === 0 ? x : gcd(y, x % y));

test('preset: n = 6, a = 2, b = 3, bounds as specified', () => {
  assert.deepEqual(RING_PRESET, { n: 6, a: 2, b: 3 });
  assert.deepEqual(LIMITS, { n: [2, 12] });
  const r = ringReading(RING_PRESET);
  assert.deepEqual([r.product, r.rp], [6, 0]);
  assert.deepEqual(r.units, [{ value: 1, inverse: 1 }, { value: 5, inverse: 5 }]);
  assert.deepEqual(r.zeroPairs, [[2, 3], [3, 4]]);
});

test('exhaustive: table is n × n, remainders of i × j, symmetric, 0 absorbing, 1 neutral', () => {
  for (const n of ns) {
    const { table } = ringReading({ n, a: 0, b: 0 });
    assert.equal(table.length, n);
    for (let i = 0; i < n; i++) {
      assert.equal(table[i].length, n);
      assert.equal(table[i][0], 0);
      assert.equal(table[i][1], i % n);
      for (let j = 0; j < n; j++) {
        assert.equal(table[i][j], (i * j) % n);
        assert.equal(table[i][j], table[j][i]);
      }
    }
  }
});

test('exhaustive: selected product, remainder and text for every n, a, b', () => {
  for (const n of ns) for (const a of range(0, n - 1)) for (const b of range(0, n - 1)) {
    const r = ringReading({ n, a, b });
    assert.equal(r.product, a * b);
    assert.equal(r.rp, (a * b) % n);
    assert.ok((r.product - r.rp) % n === 0);
    const t = ringText(r);
    assert.deepEqual(t.current, { row: a, col: b });
    assert.equal(t.body[a].cells[b], cls(r.rp));
    assert.equal(t.body.length, n);
    assert.equal(t.head.length, n);
    assert.match(t.status, new RegExp(`\\[${a}\\] × \\[${b}\\] = \\[${r.rp}\\]`));
    assert.match(t.status, /ne démontre aucun critère général/);
  }
});

test('exhaustive: inverses are exactly the remainders prime to n, and unique', () => {
  for (const n of ns) {
    const r = ringReading({ n, a: 0, b: 0 });
    for (let x = 0; x < n; x++) {
      const y = r.inverse[x];
      if (gcd(x, n) === 1) {
        assert.ok(y !== undefined && (x * y) % n === 1, `${x} mod ${n}`);
        assert.equal(range(0, n - 1).filter(z => (x * z) % n === 1).length, 1);
      } else assert.equal(y, undefined, `${x} mod ${n}`);
    }
    assert.deepEqual(r.units.map(u => u.value), range(0, n - 1).filter(x => gcd(x, n) === 1));
  }
});

test('exhaustive: zero-product pairs are the non-zero pairs i ≤ j with i × j ≡ 0', () => {
  for (const n of ns) {
    const { zeroPairs } = ringReading({ n, a: 0, b: 0 });
    const expected = [];
    for (let i = 1; i < n; i++) for (let j = i; j < n; j++) if ((i * j) % n === 0) expected.push([i, j]);
    assert.deepEqual(zeroPairs, expected);
    for (const [i, j] of zeroPairs) assert.ok(i !== 0 && j !== 0);
  }
  // Illustrated cases: none modulo 5, several modulo 6.
  assert.equal(ringReading({ n: 5, a: 0, b: 0 }).zeroPairs.length, 0);
  assert.equal(ringReading({ n: 5, a: 0, b: 0 }).units.length, 4);
  assert.equal(ringReading({ n: 6, a: 0, b: 0 }).zeroPairs.length, 2);
});

test('change of n brings a and b back modulo the new n; bounds follow n', () => {
  for (const n of ns) for (const m of ns) for (const a of range(0, n - 1)) {
    const next = withModulus({ n, a, b: n - 1 }, m);
    assert.equal(next.n, m);
    assert.equal(next.a, a % m);
    assert.equal(next.b, (n - 1) % m);
    assert.ok(next.a >= 0 && next.a <= m - 1 && next.b <= m - 1);
  }
  assert.deepEqual(withModulus({ n: 6, a: 5, b: 4 }, 5), { n: 5, a: 0, b: 4 });
  for (const n of ns) {
    assert.deepEqual(boundsOf('a', n), [0, n - 1]);
    assert.deepEqual(boundsOf('n', n), [2, 12]);
  }
});

test('clampField and steppedModulus', () => {
  assert.equal(clampField('n', '99', 6, 6), 12);
  assert.equal(clampField('n', '-3', 6, 6), 2);
  assert.equal(clampField('a', '99', 2, 6), 5);
  assert.equal(clampField('b', '-1', 2, 6), 0);
  assert.equal(clampField('a', 'abc', 2, 6), 2);
  assert.equal(clampField('a', 2.6, 0, 6), 3);
  assert.equal(steppedModulus({ n: 12, a: 0, b: 0 }, 1), undefined);
  assert.equal(steppedModulus({ n: 2, a: 0, b: 0 }, -1), undefined);
  assert.equal(steppedModulus({ n: 6, a: 0, b: 0 }, 1), 7);
});

test('text: initial state and French typography', () => {
  const t = ringText(ringReading(RING_PRESET));
  assert.match(t.status, /Cas courant dans ℤ\/6ℤ : \[2\] × \[3\] = \[0\]/);
  const rows = Object.fromEntries(t.rows);
  assert.match(rows['Inverse de a'], /\[2\] n’a pas d’inverse modulo 6/);
  assert.match(rows['Classes inversibles'], /\[1\] \(inverse \[1\]\), \[5\] \(inverse \[5\]\)/);
  assert.match(rows['Produits nuls de facteurs non nuls'], /\[2\] × \[3\] = \[0\]/);
  const five = Object.fromEntries(ringText(ringReading({ n: 5, a: 2, b: 3 })).rows);
  assert.match(five['Inverse de a'], /\[2\] a pour inverse \[3\]/);
  assert.match(five['Produits nuls de facteurs non nuls'], /aucun couple/);
});

test('svg: n × n cells, one selected ring, no stray values', () => {
  for (const n of ns) {
    const svg = ringSvg(ringReading({ n, a: n - 1, b: 1 }));
    assert.equal((svg.match(/class="ring-cell[ "]/g) ?? []).length, n * n);
    assert.equal((svg.match(/ring-selected/g) ?? []).length, 1);
    assert.ok(!/NaN|undefined/.test(svg));
  }
});
