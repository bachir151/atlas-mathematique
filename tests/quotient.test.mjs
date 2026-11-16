import { test } from 'node:test';
import assert from 'node:assert/strict';
import { clampField, cls, int, LIMITS, QUOTIENT_PRESET, quotientReading, quotientText, remainder, shifted } from '../src/figures/quotient.ts';
import { quotientSvg } from '../src/figures/quotient-svg.ts';

const range = (min, max) => Array.from({ length: max - min + 1 }, (_, i) => min + i);
const ns = range(2, 8), values = range(-20, 20);

test('preset: n = 4, a = 1, b = 2, bounds as specified', () => {
  assert.deepEqual(QUOTIENT_PRESET, { n: 4, a: 1, b: 2 });
  assert.deepEqual(LIMITS, { n: [2, 8], a: [-20, 20], b: [-20, 20] });
  const r = quotientReading(QUOTIENT_PRESET);
  assert.deepEqual([r.ra, r.rb, r.sum, r.rs], [1, 2, 3, 3]);
});

test('exhaustive: remainders are in [0, n − 1], a = q·n + r, class of a + b matches the sum of remainders', () => {
  for (const n of ns) for (const a of values) for (const b of values) {
    const r = quotientReading({ n, a, b });
    for (const [x, rx] of [[a, r.ra], [b, r.rb], [a + b, r.rs]]) {
      assert.ok(Number.isInteger(rx) && rx >= 0 && rx <= n - 1);
      assert.ok((x - rx) % n === 0);
    }
    assert.equal(r.sum, a + b);
    assert.equal(r.rs, (r.ra + r.rb) % n);
  }
});

test('exhaustive: table is n × n, rows and columns are remainders of i + j, symmetric, with 0 neutral', () => {
  for (const n of ns) {
    const { table } = quotientReading({ n, a: 0, b: 0 });
    assert.equal(table.length, n);
    for (let i = 0; i < n; i++) {
      assert.equal(table[i].length, n);
      assert.equal(table[i][0], i);
      for (let j = 0; j < n; j++) {
        assert.equal(table[i][j], (i + j) % n);
        assert.equal(table[i][j], table[j][i]);
      }
    }
  }
});

test('shifting a representative by +n or −n keeps its remainder and stays within bounds', () => {
  for (const n of ns) for (const a of values) for (const name of ['a', 'b']) for (const dir of [1, -1]) {
    const state = { n, a: name === 'a' ? a : 1, b: name === 'b' ? a : 2 };
    const next = shifted(state, name, dir);
    const target = state[name] + dir * n;
    if (target < -20 || target > 20) assert.equal(next, undefined);
    else {
      assert.equal(next, target);
      assert.equal(remainder(next, n), remainder(state[name], n));
    }
  }
});

test('remainder of negative numbers', () => {
  assert.equal(remainder(-1, 4), 3);
  assert.equal(remainder(-20, 8), 4);
  assert.equal(remainder(-8, 8), 0);
  assert.equal(remainder(20, 3), 2);
});

test('clampField: integers within the limits, fallback for non-numbers', () => {
  assert.equal(clampField('n', 99, 4), 8);
  assert.equal(clampField('n', 1, 4), 2);
  assert.equal(clampField('a', -99, 1), -20);
  assert.equal(clampField('b', '7.4', 2), 7);
  assert.equal(clampField('b', 'x', 2), 2);
  assert.equal(clampField('a', Infinity, 1), 1);
});

test('text: true minus sign, preset reading, one case and no proof announced', () => {
  const t = quotientText(quotientReading(QUOTIENT_PRESET));
  assert.match(t.status, /^Cas courant dans ℤ\/4ℤ : \[1\] \+ \[2\] = \[3\], car 1 \+ 2 = 3 a pour reste 3 modulo 4\./);
  assert.match(t.status, /illustre un seul cas.*ne démontre rien/);
  const neg = quotientText(quotientReading({ n: 4, a: -5, b: 20 }));
  const text = JSON.stringify(neg);
  assert.ok(text.includes('−5 = (−2) × 4 + 3'));
  assert.ok(text.includes('[−5] = [3] = 3 + 4ℤ'));
  assert.ok(!/-\d/.test(text), 'pas de signe moins ASCII devant un nombre');
  assert.equal(int(-3), '−3');
  assert.equal(cls(-3), '[−3]');
});

test('text: table headers and current cell for every n', () => {
  for (const n of ns) for (const [a, b] of [[1, 2], [-20, 20], [20, 20], [-7, 3]]) {
    const t = quotientText(quotientReading({ n, a, b }));
    assert.equal(t.head.length, n);
    assert.equal(t.body.length, n);
    assert.deepEqual(t.head, range(0, n - 1).map(cls));
    t.body.forEach((row, i) => { assert.equal(row.header, cls(i)); assert.equal(row.cells.length, n); });
    const { row, col } = t.current;
    assert.equal(t.body[row].cells[col], cls(remainder(a + b, n)));
    assert.equal(row, remainder(a, n));
    assert.equal(col, remainder(b, n));
  }
});

test('svg: n class boxes, 81 dots, only finite numbers, no NaN', () => {
  for (const n of ns) for (const [a, b] of [[1, 2], [-20, -20], [20, 20]]) {
    const svg = quotientSvg(quotientReading({ n, a, b }));
    assert.equal((svg.match(/class="fig-class[ "]/g) ?? []).length, n);
    assert.equal((svg.match(/class="fig-dot /g) ?? []).length, 81);
    assert.ok(!/NaN|undefined|Infinity/.test(svg));
    const cxs = [...svg.matchAll(/cx="([^"]+)"/g)].map(m => Number(m[1]));
    assert.ok(cxs.every(x => x >= 0 && x <= 400));
  }
});
