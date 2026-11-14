import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeAngle, rotate } from '../src/lib/rotation.ts';
import { filterLessons, lessons } from '../src/data/catalog.ts';
import { atlasNodes, atlasLinks, approvedLinks } from '../src/data/atlas.ts';
import { readFileSync } from 'node:fs';

test('rotation state supports wraparound, negative input, and rejects invalid angles', () => {
  assert.equal(normalizeAngle(-90), 270);
  assert.equal(normalizeAngle(1080), 0);
  assert.equal(rotate(270, 90), 0);
  assert.equal(rotate(90, 180), 270);
  assert.equal(rotate(0, -90), 270);
  assert.throws(() => normalizeAngle(NaN), RangeError);
  assert.throws(() => rotate(0, Infinity), RangeError);
});

test('library search tolerates accents, case and whitespace; filters combine', () => {
  assert.deepEqual(filterLessons('  GEOMETRIE ', 'all').map(item => item.id), ['geometrie']);
  assert.deepEqual(filterLessons('carré', 'Algèbre').map(item => item.id), ['groupes-rotations']);
  assert.deepEqual(filterLessons('carré', 'Analyse'), []);
  assert.equal(filterLessons('', 'all').length, lessons.length);
  assert.deepEqual(filterLessons('<script>', 'all'), []);
});

test('unvalidated and unjustified Atlas links never reach the renderer', () => {
  const fixture = [
    { source: 'a', target: 'b', kind: 'analogy', justification: 'fixture', validated: false },
    { source: 'a', target: 'b', kind: 'model', justification: '  ', validated: true },
    { source: 'a', target: 'b', kind: 'demonstrated', justification: 'fixture', validated: true },
  ];
  assert.deepEqual(approvedLinks(fixture), [fixture[2]]);
  assert.equal(atlasLinks.length, 0, 'No scientific links have been supplied for this prototype');
});

test('Atlas data identifiers and positions are usable independently of Three.js', () => {
  assert.equal(new Set(atlasNodes.map(node => node.id)).size, atlasNodes.length);
  for (const node of atlasNodes) {
    assert.equal(node.position.length, 3);
    assert.ok(node.position.every(Number.isFinite));
    if (node.href) assert.ok(node.href.startsWith('/cours/'));
  }
});

test('the validated lesson records its validation and keeps an independent full proof', () => {
  const mdx = readFileSync(new URL('../src/content/lessons/groupes-rotations.mdx', import.meta.url), 'utf8');
  assert.match(mdx, /^status: "validated"$/m);
  assert.match(mdx, /^validation: ".+"$/m, 'A validated lesson references the director\'s decision');
  assert.doesNotMatch(mdx, /brouillon/i);
  const steps = [...mdx.matchAll(/<ProofStep[^>]*>([\s\S]*?)<\/ProofStep>/g)];
  assert.ok(steps.length >= 2);
  const full = mdx.match(/<FullProof slot="full">([\s\S]*?)<\/FullProof>/)?.[1] ?? '';
  assert.ok(full.trim().length > 0, 'Full proof present');
  assert.equal(lessons.find(lesson => lesson.id === 'groupes-rotations')?.status, 'validated');
});

