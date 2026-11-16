import { test } from 'node:test';
import assert from 'node:assert/strict';
import { allStates, conclusion, DEGREES, BITS, IRRED_PRESET, irredReading, irredText, parseChoice, polyName, rawValue, rootsText, rowKey, tableRows, TABLE_HEAD, valueAt } from '../src/figures/irred.ts';
import { irredSvg } from '../src/figures/irred-svg.ts';

test('preset: degree 2, b = 1, c = 1, irreducible with both values equal to 1', () => {
  assert.deepEqual(IRRED_PRESET, { degree: 2, b: 1, c: 1 });
  const r = irredReading(IRRED_PRESET);
  assert.deepEqual(r.values, [1, 1]);
  assert.deepEqual(r.raw, [1, 3]);
  assert.deepEqual(r.roots, []);
  assert.equal(r.irreducible, true);
});

test('range: exactly 8 polynomials, all distinct', () => {
  const states = allStates();
  assert.equal(states.length, 8);
  assert.equal(new Set(states.map(rowKey)).size, 8);
  assert.deepEqual(DEGREES, [2, 3]);
  assert.deepEqual(BITS, [0, 1]);
});

test('exhaustive: values modulo 2, roots, irreducibility = no root (degrees 2 and 3)', () => {
  for (const degree of DEGREES) for (const b of BITS) for (const c of BITS) {
    const s = { degree, b, c };
    const r = irredReading(s);
    // independent computation
    const p0 = c % 2, p1 = (1 + b + c) % 2;
    assert.deepEqual(r.values, [p0, p1]);
    assert.equal(valueAt(s, 0), p0);
    assert.equal(valueAt(s, 1), p1);
    assert.deepEqual(r.roots, [0, 1].filter(x => [p0, p1][x] === 0));
    assert.equal(r.irreducible, r.roots.length === 0);
    assert.equal(rawValue(s, 0), c);
    assert.equal(rawValue(s, 1), 1 + b + c);
  }
});

test('the only irreducible ones are X² + X + 1 and X³ + X + 1 (b = c = 1)', () => {
  const irreducible = allStates().filter(s => irredReading(s).irreducible).map(polyName);
  assert.deepEqual(irreducible, ['X² + X + 1', 'X³ + X + 1']);
});

test('parseChoice accepts only valid values', () => {
  assert.equal(parseChoice('degree', '3'), 3);
  assert.equal(parseChoice('degree', 2), 2);
  assert.equal(parseChoice('degree', '4'), undefined);
  assert.equal(parseChoice('b', '0'), 0);
  assert.equal(parseChoice('c', '1'), 1);
  assert.equal(parseChoice('c', '2'), undefined);
  assert.equal(parseChoice('b', ''), undefined);
  assert.equal(parseChoice('b', 'x'), undefined);
  assert.equal(parseChoice('b', 0.5), undefined);
});

test('names and roots text', () => {
  assert.equal(polyName({ degree: 2, b: 0, c: 0 }), 'X²');
  assert.equal(polyName({ degree: 3, b: 0, c: 1 }), 'X³ + 1');
  assert.equal(polyName({ degree: 3, b: 1, c: 0 }), 'X³ + X');
  assert.equal(rootsText([]), 'aucune');
  assert.equal(rootsText([1]), '1');
  assert.equal(rootsText([0, 1]), '0 et 1');
});

test('text: preset reading, conclusion by the theorem, no proof announced, true minus absent', () => {
  const t = irredText(irredReading(IRRED_PRESET));
  assert.match(t.status, /^X² \+ X \+ 1 sur ℤ\/2ℤ : P\(0\) = 1, P\(1\) = 1, racines : aucune\./);
  assert.match(t.status, /irréductible/);
  assert.match(t.status, /ne démontre rien/);
  const joined = JSON.stringify(t.rows);
  assert.ok(joined.includes('P(1) = 1² + 1 × 1 + 1 = 3, soit 1 modulo 2'));
  assert.ok(joined.includes('exactement deux éléments, 0 et 1'));
  assert.ok(joined.includes('dépend du degré'));
  assert.match(conclusion(irredReading({ degree: 2, b: 0, c: 1 })), /X² \+ 1 a la racine 1 .* réductible/);
  assert.match(conclusion(irredReading({ degree: 3, b: 1, c: 0 })), /les racines 0 et 1 .* réductible/);
  assert.match(conclusion(irredReading({ degree: 3, b: 1, c: 1 })), /degré 3.* irréductible/);
});

test('text: every state gives the same verdict in rows, status and table', () => {
  const table = new Map(tableRows().map(r => [r.key, r.cells]));
  for (const s of allStates()) {
    const r = irredReading(s);
    const t = irredText(r);
    const verdict = r.irreducible ? 'irréductible' : 'réductible';
    assert.ok(t.status.includes(r.irreducible ? 'est irréductible' : 'est donc réductible'));
    assert.equal(table.get(rowKey(s))[7], verdict);
    assert.ok(!/(^|[^\d])-\d/.test(JSON.stringify(t)), 'pas de signe moins ASCII');
    assert.equal(t.rows.length, 8);
  }
});

test('table: 8 rows with 8 cells, header of 8 columns, values consistent', () => {
  const rows = tableRows();
  assert.equal(rows.length, 8);
  assert.equal(TABLE_HEAD.length, 8);
  for (const row of rows) {
    assert.equal(row.cells.length, 8);
    const [degree, b, c, name, p0, p1, roots, verdict] = row.cells;
    const r = irredReading({ degree: Number(degree), b: Number(b), c: Number(c) });
    assert.equal(name, polyName(r.state));
    assert.equal(p0, String(r.values[0]));
    assert.equal(p1, String(r.values[1]));
    assert.equal(roots, rootsText(r.roots));
    assert.equal(verdict, r.irreducible ? 'irréductible' : 'réductible');
  }
});

test('svg: two cards for every state, root cards match, no NaN', () => {
  for (const s of allStates()) {
    const r = irredReading(s);
    const svg = irredSvg(r);
    assert.equal((svg.match(/class="irred-card /g) ?? []).length, 2);
    assert.equal((svg.match(/irred-card-root/g) ?? []).length, r.roots.length);
    assert.ok(svg.includes(r.irreducible ? 'irred-verdict-yes' : 'irred-verdict-no'));
    assert.ok(!/NaN|undefined|Infinity/.test(svg));
    assert.ok(svg.includes(polyName(s)));
  }
});
