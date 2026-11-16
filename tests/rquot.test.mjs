import { test } from 'node:test';
import assert from 'node:assert/strict';
import { clampField, cls, int, LIMITS, RQUOT_PRESET, rquotReading, rquotText, remainder, shifted, zeroProductsText } from '../src/figures/rquot.ts';
import { rquotSvg } from '../src/figures/rquot-svg.ts';

const range = (min, max) => Array.from({ length: max - min + 1 }, (_, i) => min + i);
const ns = range(2, 8), values = range(-20, 20);

test('preset: n = 4, a = 1, b = 2, bounds as specified', () => {
  assert.deepEqual(RQUOT_PRESET, { n: 4, a: 1, b: 2 });
  assert.deepEqual(LIMITS, { n: [2, 8], a: [-20, 20], b: [-20, 20] });
  const r = rquotReading(RQUOT_PRESET);
  assert.deepEqual([r.ra, r.rb, r.sum, r.product, r.rs, r.rp], [1, 2, 3, 2, 3, 2]);
});

test('exhaustive: remainders in [0, n − 1]; classes of a + b and ab match the operations on remainders', () => {
  for (const n of ns) for (const a of values) for (const b of values) {
    const r = rquotReading({ n, a, b });
    for (const [x, rx] of [[a, r.ra], [b, r.rb], [a + b, r.rs], [a * b, r.rp]]) {
      assert.ok(Number.isInteger(rx) && rx >= 0 && rx <= n - 1);
      assert.ok((x - rx) % n === 0);
    }
    assert.equal(r.sum, a + b);
    assert.equal(r.product, a * b);
    assert.equal(r.rs, (r.ra + r.rb) % n);
    assert.equal(r.rp, (r.ra * r.rb) % n);
    assert.equal(r.add[r.ra][r.rb], r.rs);
    assert.equal(r.mul[r.ra][r.rb], r.rp);
  }
});

test('exhaustive: changing a representative by ±n keeps both result classes, within the bounds', () => {
  for (const n of ns) for (const a of values) for (const b of values) for (const name of ['a', 'b']) for (const dir of [1, -1]) {
    const state = { n, a, b };
    const next = shifted(state, name, dir);
    const target = state[name] + dir * n;
    if (target < -20 || target > 20) { assert.equal(next, undefined); continue; }
    assert.equal(next, target);
    const r0 = rquotReading(state), r1 = rquotReading({ ...state, [name]: next });
    assert.equal(r1.rs, r0.rs);
    assert.equal(r1.rp, r0.rp);
  }
});

test('exhaustive: both tables are n × n, with commutativity, neutral elements and absorbing 0', () => {
  for (const n of ns) {
    const { add, mul } = rquotReading({ n, a: 0, b: 0 });
    assert.equal(add.length, n);
    assert.equal(mul.length, n);
    for (let i = 0; i < n; i++) {
      assert.equal(add[i].length, n);
      assert.equal(mul[i].length, n);
      assert.equal(add[i][0], i);
      assert.equal(mul[i][1 % n], i);
      assert.equal(mul[i][0], 0);
      for (let j = 0; j < n; j++) {
        assert.equal(add[i][j], (i + j) % n);
        assert.equal(mul[i][j], (i * j) % n);
        assert.equal(add[i][j], add[j][i]);
        assert.equal(mul[i][j], mul[j][i]);
      }
    }
  }
});

test('zero products: n = 4 gives [2] × [2]; n = 5 gives none; each pair is listed once and checked', () => {
  assert.deepEqual(rquotReading({ n: 4, a: 1, b: 2 }).zeroProducts, [[2, 2]]);
  assert.deepEqual(rquotReading({ n: 5, a: 1, b: 2 }).zeroProducts, []);
  for (const n of ns) {
    const { zeroProducts } = rquotReading({ n, a: 0, b: 0 });
    let count = 0;
    for (let i = 1; i < n; i++) for (let j = i; j < n; j++) if ((i * j) % n === 0) count++;
    assert.equal(zeroProducts.length, count);
    for (const [i, j] of zeroProducts) assert.ok(i >= 1 && i <= j && j < n && (i * j) % n === 0);
  }
  assert.equal(zeroProductsText(4, [[2, 2]]), '[2] × [2] = [0] (classes non nulles, produit nul dans ℤ/4ℤ)');
  assert.match(zeroProductsText(5, []), /^aucun produit de deux classes non nulles ne donne \[0\] dans ℤ\/5ℤ$/);
});

test('remainder of negative numbers, clampField', () => {
  assert.equal(remainder(-1, 4), 3);
  assert.equal(remainder(-20, 8), 4);
  assert.equal(remainder(-8, 8), 0);
  assert.equal(clampField('n', 99, 4), 8);
  assert.equal(clampField('n', 1, 4), 2);
  assert.equal(clampField('a', -99, 1), -20);
  assert.equal(clampField('b', '7.4', 2), 7);
  assert.equal(clampField('b', 'x', 2), 2);
  assert.equal(clampField('a', Infinity, 1), 1);
});

test('text: lesson example 5 × (−2) = −10 ≡ 2 (mod 4), true minus sign, one case and no proof announced', () => {
  const t = rquotText(rquotReading(RQUOT_PRESET));
  assert.match(t.status, /^Cas courant dans ℤ\/4ℤ : \[1\] \+ \[2\] = \[3\] et \[1\] × \[2\] = \[2\], car 1 \+ 2 = 3 a pour reste 3 et 1 × 2 = 2 a pour reste 2 modulo 4\./);
  assert.match(t.status, /illustre un seul cas.*ne démontre rien/);
  const lesson = rquotText(rquotReading({ n: 4, a: 5, b: -2 }));
  const rows = Object.fromEntries(lesson.rows);
  assert.equal(rows['Produit avant réduction'], 'a × b = 5 × (−2) = −10');
  assert.equal(rows['Reste de ab'], '−10 = (−3) × 4 + 2');
  assert.equal(rows['Produit des classes'].slice(0, 15), '[1] × [2] = [2]');
  assert.match(lesson.status, /\[5\] × \[−2\] = \[−10\] = \[2\]/);
  const text = JSON.stringify(rquotText(rquotReading({ n: 4, a: -5, b: 20 })));
  assert.ok(!/-\d/.test(text), 'pas de signe moins ASCII devant un nombre');
  assert.equal(int(-3), '−3');
  assert.equal(cls(-3), '[−3]');
});

test('text: both tables have n headers, n rows and the current cell for every n', () => {
  for (const n of ns) for (const [a, b] of [[1, 2], [-20, 20], [20, 20], [-7, 3]]) {
    const t = rquotText(rquotReading({ n, a, b }));
    const r = rquotReading({ n, a, b });
    assert.equal(t.add.corner, '+');
    assert.equal(t.mul.corner, '×');
    for (const [table, result] of [[t.add, r.rs], [t.mul, r.rp]]) {
      assert.equal(table.head.length, n);
      assert.equal(table.body.length, n);
      assert.deepEqual(table.head, range(0, n - 1).map(cls));
      table.body.forEach((row, i) => { assert.equal(row.header, cls(i)); assert.equal(row.cells.length, n); });
      assert.equal(table.body[table.current.row].cells[table.current.col], cls(result));
      assert.equal(table.current.row, remainder(a, n));
      assert.equal(table.current.col, remainder(b, n));
    }
  }
});

test('svg: n class boxes, only finite numbers, no NaN', () => {
  for (const n of ns) for (const [a, b] of [[1, 2], [-20, -20], [20, 20]]) {
    const svg = rquotSvg(rquotReading({ n, a, b }));
    assert.equal((svg.match(/class="rquot-class[ "]/g) ?? []).length, n);
    assert.ok(!/NaN|undefined|Infinity/.test(svg));
    const xs = [...svg.matchAll(/ x="([^"]+)"/g)].map(m => Number(m[1]));
    assert.ok(xs.every(x => x >= 0 && x <= 400));
  }
});
