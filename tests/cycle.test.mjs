import { test } from 'node:test';
import assert from 'node:assert/strict';
import { clampField, cycleText, gesture, GESTURES_MAX, HISTORY_MAX, int, mod, position, startState, total, truncated } from '../src/figures/cycle.ts';
import { cycleSvg } from '../src/figures/cycle-svg.ts';

const run = (state, directions) => directions.reduce((s, d) => gesture(s, d), state);

test('defaults n = 12, k = 4: starts at 0, positions 4, 8, 0 after three steps', () => {
  let s = startState();
  assert.equal(s.n, 12);
  assert.equal(s.k, 4);
  assert.equal(position(s), 0);
  const seen = [];
  for (let i = 0; i < 3; i++) { s = gesture(s, 1); seen.push(position(s)); }
  assert.deepEqual(seen, [4, 8, 0]);
  assert.equal(s.steps, 3);
  assert.equal(total(s), 12);
});

test('step 2 on 12 positions and step 0 and negative step', () => {
  assert.equal(position(run(startState(12, 2), [1, 1, 1])), 6);
  const zero = run(startState(12, 0), [1, 1, -1]);
  assert.equal(position(zero), 0);
  assert.equal(zero.steps, 1);
  assert.equal(position(run(startState(12, -5), [1])), 7);
});

test('exhaustive on the whole range: position = exact remainder of steps × k, history consistent', () => {
  for (let n = 2; n <= 24; n++) {
    for (let k = -24; k <= 24; k++) {
      let s = startState(n, k);
      assert.equal(position(s), 0);
      for (let i = 1; i <= 60; i++) {
        s = gesture(s, 1);
        const p = position(s);
        assert.ok(Number.isInteger(p) && p >= 0 && p < n);
        assert.equal(s.steps * k - p === 0 || (s.steps * k - p) % n === 0, true);
        assert.equal(p, ((i * k) % n + n) % n);
        if (i <= HISTORY_MAX) assert.equal(s.history[i - 1].position, p);
      }
      assert.equal(s.history.length, HISTORY_MAX);
      assert.equal(truncated(s), true);
      // going back undoes going forward
      for (let i = 0; i < 60; i++) s = gesture(s, -1);
      assert.equal(position(s), 0);
      assert.equal(s.steps, 0);
    }
  }
});

test('visited positions are exactly the positions reached, start included', () => {
  const s = run(startState(12, 4), [1, 1, 1, 1]);
  assert.deepEqual(s.visited.map((v, i) => v ? i : -1).filter(i => i >= 0), [0, 4, 8]);
  const back = run(startState(12, 5), [-1]);
  assert.equal(back.visited[7], true);
});

test('history limited to 48 gestes with an explicit truncation note', () => {
  let s = run(startState(), Array(HISTORY_MAX).fill(1));
  let text = cycleText(s);
  assert.equal(truncated(s), false);
  assert.match(text.historyNote, /^Historique complet : 48 gestes sur 48 au plus\.$/);
  assert.equal(text.table.length, HISTORY_MAX + 1);
  s = gesture(s, 1);
  text = cycleText(s);
  assert.equal(truncated(s), true);
  assert.equal(s.gestures, 49);
  assert.equal(text.historyNote, 'Historique tronqué : seuls les 48 premiers gestes sur 49 sont listés.');
  assert.equal(text.table.length, HISTORY_MAX + 1);
  assert.deepEqual(text.table[0], ['0', 'Départ', '0']);
  assert.deepEqual(text.table[1], ['1', 'Avancer', '4']);
  assert.match(cycleText(startState()).historyNote, /^Historique complet : 0 geste sur 48 au plus\.$/);
});

test('text: true minus sign, calculation, finite range and non-proof announced', () => {
  const s = run(startState(12, 5), [-1, -1]);
  const text = cycleText(s);
  assert.equal(int(-3), '−3');
  assert.equal(text.rows[2][1], '−2');
  assert.equal(text.rows[3][1], '(−2) × 5 = −10 = (−1) × 12 + 2');
  assert.equal(position(s), 2);
  assert.match(text.status, /^Nombre signé de pas : −2 ; position : 2 /);
  assert.match(text.status, /Plage finie : n entre 2 et 24, pas k entre −24 et 24, 48 gestes listés au plus\. La figure explore des exemples : elle ne prouve rien\.$/);
  assert.match(cycleText(startState()).status, /^Nombre signé de pas : 0 ; position : 0 \(0 × 4 = 0 = 0 × 12 \+ 0\)\./);
});

test('gesture cap and no mutation of the previous state', () => {
  const s = startState(5, 3);
  const t = gesture(s, 1);
  assert.equal(s.gestures, 0);
  assert.equal(s.visited[3], false);
  assert.equal(t.gestures, 1);
  let big = { ...s, gestures: GESTURES_MAX };
  assert.equal(gesture(big, 1), big);
  assert.match(cycleText(big).status, /Nombre maximal de gestes \(10000\) atteint/);
});

test('svg: one dot and one label per position, one ring, aria-hidden', () => {
  for (let n = 2; n <= 24; n++) {
    const svg = cycleSvg(run(startState(n, 3), [1, 1]));
    assert.equal((svg.match(/fig-dot /g) || []).length, n);
    assert.equal((svg.match(/cycle-label/g) || []).length, n);
    assert.equal((svg.match(/fig-current-ring/g) || []).length, 1);
    assert.match(svg, /^<g aria-hidden="true">/);
  }
});

test('clampField and mod', () => {
  assert.equal(clampField('n', '99', 12), 24);
  assert.equal(clampField('n', '1', 12), 2);
  assert.equal(clampField('k', '-30', 4), -24);
  assert.equal(clampField('k', '2.6', 4), 3);
  assert.equal(clampField('k', 'abc', 4), 4);
  assert.equal(mod(-1, 12), 11);
  assert.equal(mod(-0, 12), 0);
});
