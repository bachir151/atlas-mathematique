import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ELEMENTS, EXAMPLE, FIELD_PRESET, calculate, code, eltIndex, fieldTable, fieldText, headers, name, parseElt, parseOp, poly } from '../src/figures/field.ts';
import { fieldSvg } from '../src/figures/field-svg.ts';

const states = ['mul', 'add'].flatMap(op => ELEMENTS.flatMap(x => ELEMENTS.map(y => ({ x, y, op }))));
const run = (op, x, y) => calculate({ x, y, op }).result;
const E = (a, b) => ELEMENTS[eltIndex({ a, b })];
const ZERO = E(0, 0), ONE = E(1, 0), ALPHA = E(0, 1), ALPHA1 = E(1, 1);

test('preset: α × (α + 1), multiplication; four elements named 0, 1, α, α + 1', () => {
  assert.equal(code(FIELD_PRESET.x), '01');
  assert.equal(code(FIELD_PRESET.y), '11');
  assert.equal(FIELD_PRESET.op, 'mul');
  assert.deepEqual(headers, ['0', '1', 'α', 'α + 1']);
  assert.equal(states.length, 32);
});

test('exhaustive: 16 couples × 2 operations match the direct computation with α² = α + 1', () => {
  for (const { x, y, op } of states) {
    const c = calculate({ x, y, op });
    // Direct: (a1 + b1 α)(a2 + b2 α) with α² = α + 1, coefficients mod 2.
    const expected = op === 'add'
      ? { a: (x.a + y.a) % 2, b: (x.b + y.b) % 2 }
      : { a: (x.a * y.a + x.b * y.b) % 2, b: (x.a * y.b + x.b * y.a + x.b * y.b) % 2 };
    assert.deepEqual(c.result, expected);
    assert.ok(c.result.a <= 1 && c.result.b <= 1, 'closure');
    assert.equal(c.raw[2] === 0, op === 'add' || x.b * y.b === 0);
    assert.deepEqual(c.reduced, [c.raw[0] + c.raw[2], c.raw[1] + c.raw[2]]);
  }
});

test('lesson values: α(α + 1) = 1, (α + 1)² = α, α² = α + 1, α³ = 1', () => {
  assert.deepEqual(run('mul', ALPHA, ALPHA1), ONE);
  assert.deepEqual(run('mul', ALPHA1, ALPHA1), ALPHA);
  assert.deepEqual(run('mul', ALPHA, ALPHA), ALPHA1);
  assert.deepEqual(run('mul', run('mul', ALPHA, ALPHA), ALPHA), ONE);
  assert.deepEqual(run('add', ALPHA, ALPHA1), ONE);
  assert.deepEqual(run('add', ONE, ONE), ZERO);
});

test('field axioms (checked by test only)', () => {
  const add = (x, y) => run('add', x, y), mul = (x, y) => run('mul', x, y);
  const eq = (x, y) => code(x) === code(y);
  for (const x of ELEMENTS) {
    assert.ok(eq(add(x, ZERO), x) && eq(mul(x, ONE), x) && eq(mul(x, ZERO), ZERO));
    assert.ok(ELEMENTS.some(y => eq(add(x, y), ZERO)), 'opposite');
    if (!eq(x, ZERO)) assert.ok(ELEMENTS.some(y => eq(mul(x, y), ONE)), 'inverse');
    for (const y of ELEMENTS) {
      assert.ok(eq(add(x, y), add(y, x)) && eq(mul(x, y), mul(y, x)));
      assert.ok(ELEMENTS.some(z => eq(z, mul(x, y))), 'closure');
      if (!eq(x, ZERO) && !eq(y, ZERO)) assert.ok(!eq(mul(x, y), ZERO), 'no zero divisors');
      for (const z of ELEMENTS) {
        assert.ok(eq(add(add(x, y), z), add(x, add(y, z))));
        assert.ok(eq(mul(mul(x, y), z), mul(x, mul(y, z))));
        assert.ok(eq(mul(x, add(y, z)), add(mul(x, y), mul(x, z))));
      }
    }
  }
});

test('tables are 4 × 4, consistent with the calculation, and cells are indices', () => {
  for (const op of ['add', 'mul']) {
    const t = fieldTable(op);
    assert.equal(t.length, 4);
    t.forEach((line, i) => {
      assert.equal(line.length, 4);
      line.forEach((v, j) => {
        assert.ok(Number.isInteger(v) && v >= 0 && v <= 3);
        assert.deepEqual(ELEMENTS[v], run(op, ELEMENTS[i], ELEMENTS[j]));
      });
    });
  }
  assert.deepEqual(fieldTable('mul')[2], [0, 2, 3, 1]);
  assert.deepEqual(fieldTable('add')[3], [3, 2, 1, 0]);
});

test('parsing of form values', () => {
  assert.deepEqual(parseElt('01'), ALPHA);
  assert.equal(parseElt('22'), undefined);
  assert.equal(parseOp('mul'), 'mul');
  assert.equal(parseOp('div'), undefined);
});

test('poly and names', () => {
  assert.equal(poly(0, 0), '0');
  assert.equal(poly(1, 2, 1), 'α² + 2α + 1');
  assert.equal(name(ALPHA1), 'α + 1');
  assert.equal(name(ZERO), '0');
});

test('text: preset reading, no proof announced, no ASCII minus, exact example', () => {
  const t = fieldText(FIELD_PRESET);
  assert.match(t.status, /^Cas courant dans F = 𝔽₂\[X\]\/\(X² \+ X \+ 1\) : α × \(α \+ 1\) = 1\./);
  assert.match(t.status, /ne démontre rien/);
  const rows = Object.fromEntries(t.rows);
  assert.equal(rows['Opérandes'], 'x = α ; y = α + 1');
  assert.equal(rows['Développement'].startsWith('α × (α + 1) = α² + α'), true);
  assert.equal(rows['Réduction par α² = α + 1'], 'α² est remplacé par α + 1 : α² + α = 2α + 1');
  assert.equal(rows['Résultat'], 'α × (α + 1) = 1');
  assert.ok(EXAMPLE.startsWith('α(α + 1) = α² + α'));
  for (const s of states) assert.ok(!/-/.test(JSON.stringify(fieldText(s))));
});

test('svg: four boxes, three markers, only finite coordinates', () => {
  for (const s of states) {
    const svg = fieldSvg(s);
    assert.equal((svg.match(/class="fig-class[ "]/g) ?? []).length, 4);
    assert.equal((svg.match(/class="fig-axis-title"/g) ?? []).length, 3);
    assert.ok(!/NaN|undefined|Infinity/.test(svg));
  }
});
