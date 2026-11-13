import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes, createRequire } from 'node:module';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const { JSDOM } = createRequire(resolve(root, 'package.json'))('jsdom');
const { rotate } = await import(pathToFileURL(resolve(root, 'src/lib/rotation.ts')));
const { filterLessons, lessons } = await import(pathToFileURL(resolve(root, 'src/data/catalog.ts')));
const { atlasNodes, atlasLinks, approvedLinks } = await import(pathToFileURL(resolve(root, 'src/data/atlas.ts')));
const { proofSteps, fullProofPlaceholder } = await import(pathToFileURL(resolve(root, 'src/data/proof.ts')));
const read = path => readFileSync(resolve(root, path), 'utf8');
const component = path => read(path).replace(/^---[\s\S]*?---/, '').replace(/<script>[\s\S]*?<\/script>/g, '');
const domFor = html => new JSDOM(html, { runScripts: 'outside-only', pretendToBeVisual: true, url: 'http://localhost/' });
function evaluate(dom, source, globals = {}) {
  Object.assign(dom.window, globals);
  const code = stripTypeScriptTypes(source.replace(/^\s*import[^\n]+\n/gm, '').replace(/\bexport /g, ''));
  dom.window.eval(code);
}
const astroScript = path => read(path).match(/<script>([\s\S]*?)<\/script>/)[1];

test('square controls update SVG, announce the angle, bound history and reset state', () => {
  const dom = domFor(component('src/components/SquareExperiment.astro'));
  evaluate(dom, read('src/scripts/square.ts'), { rotate });
  dom.window.initSquare(dom.window.document.querySelector('[data-square]'));
  const doc = dom.window.document;
  assert.equal(doc.querySelector('[data-rotation="90"]').disabled, false);
  doc.querySelector('[data-rotation="90"]').click();
  assert.equal(doc.querySelector('[data-angle]').value, '90°');
  assert.equal(doc.querySelector('[data-rotating-square]').style.transform, 'rotate(-90deg)');
  doc.querySelector('[data-rotation="270"]').click();
  assert.equal(doc.querySelector('[data-angle]').value, '0°');
  for (let i = 0; i < 15; i++) doc.querySelector('[data-rotation="180"]').click();
  assert.equal(doc.querySelectorAll('[data-history] li').length, 8);
  doc.querySelector('[data-square-reset]').click();
  assert.equal(doc.querySelector('[data-angle]').value, '0°');
  assert.equal(doc.querySelector('[data-rotating-square]').style.transform, 'rotate(0deg)');
  assert.match(doc.querySelector('[data-history]').textContent, /Aucune rotation/);
  dom.window.close();
});

test('companion displays user text literally, keeps bounded history and can be hidden', () => {
  const dom = domFor(component('src/components/Companion.astro'));
  evaluate(dom, read('src/scripts/companion.ts'));
  const doc = dom.window.document;
  dom.window.initCompanion(doc.querySelector('[data-companion]'));
  const input = doc.querySelector('input');
  const form = doc.querySelector('form');
  const payload = '<img src=x onerror="window.compromised=true">';
  input.value = payload;
  form.dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
  assert.equal(doc.querySelector('.chat-message.user').textContent, payload);
  assert.equal(doc.querySelector('[data-chat] img'), null);
  assert.equal(dom.window.compromised, undefined);
  for (let i = 0; i < 15; i++) doc.querySelector('[data-prompt="commands"]').click();
  assert.equal(doc.querySelector('[data-chat]').children.length, 20);
  doc.querySelector('[data-companion-toggle]').click();
  assert.equal(doc.querySelector('[data-companion-body]').hidden, true);
  assert.equal(doc.querySelector('[data-companion-toggle]').getAttribute('aria-expanded'), 'false');
  doc.querySelector('[data-companion-toggle]').click();
  assert.equal(doc.querySelector('[data-companion-body]').hidden, false);
  dom.window.close();
});

test('library controller combines filters and restores all cards when cleared', () => {
  const dom = domFor(`<section data-library><input data-search disabled><select data-domain disabled><option value="all">Tous</option><option>Algèbre</option><option>Géométrie</option><option>Analyse</option></select><p data-result-count></p>${lessons.map(lesson => `<article data-lesson-id="${lesson.id}"></article>`).join('')}<div data-empty hidden></div><button data-clear></button></section>`);
  evaluate(dom, astroScript('src/pages/bibliotheque.astro'), { filterLessons });
  const doc = dom.window.document;
  const search = doc.querySelector('[data-search]');
  const domain = doc.querySelector('[data-domain]');
  assert.equal(search.disabled, false);
  search.value = 'GEOMETRIE'; search.dispatchEvent(new dom.window.Event('input'));
  assert.equal(doc.querySelector('[data-lesson-id="geometrie"]').hidden, false);
  assert.equal(doc.querySelector('[data-lesson-id="groupes-rotations"]').hidden, true);
  domain.value = 'Algèbre'; domain.dispatchEvent(new dom.window.Event('change'));
  assert.equal(doc.querySelector('[data-empty]').hidden, false);
  assert.equal(doc.querySelector('[data-result-count]').textContent, '0 résultats');
  doc.querySelector('[data-clear]').click();
  assert.equal(doc.querySelector('[data-result-count]').textContent, '3 résultats');
  assert.equal(doc.querySelector('[data-empty]').hidden, true);
  assert.ok([...doc.querySelectorAll('[data-lesson-id]')].every(card => !card.hidden));
  assert.equal(doc.activeElement, search);
  dom.window.close();
});

test('progressive proof never hides the independent full-proof panel', async () => {
  const dom = domFor(`<section data-proof><p data-proof-progress></p>${proofSteps.map((step, index) => `<details data-step ${index === 0 ? 'open' : ''}><summary>${step.title}</summary><p>${step.placeholder}</p></details>`).join('')}<button data-next-step disabled>Suivant</button><aside id="preuve-integrale">${fullProofPlaceholder}</aside></section>`);
  evaluate(dom, read('src/scripts/proof.ts'));
  dom.window.initProof(dom.window.document.querySelector('[data-proof]'));
  const doc = dom.window.document;
  const full = doc.querySelector('#preuve-integrale');
  const button = doc.querySelector('[data-next-step]');
  assert.equal(button.disabled, false);
  assert.equal(full.hidden, false);
  assert.equal(full.closest('details'), null);
  button.click();
  assert.equal(doc.querySelectorAll('[data-step]')[1].open, true);
  assert.equal(doc.activeElement, doc.querySelectorAll('summary')[1]);
  button.click();
  assert.equal(button.disabled, true);
  assert.match(doc.querySelector('[data-proof-progress]').textContent, /3 emplacements ouverts sur 3/);
  for (const step of doc.querySelectorAll('[data-step]')) step.open = false;
  await new Promise(resolve => setTimeout(resolve, 10));
  assert.equal(button.disabled, false);
  assert.match(doc.querySelector('[data-proof-progress]').textContent, /0 emplacements ouverts sur 3/);
  assert.equal(full.hidden, false);
  assert.match(full.textContent, /Aucune démonstration validée/);
  dom.window.close();
});

test('Atlas keeps the DOM map and selection usable when the 3D module is unavailable', async () => {
  const dom = domFor(`<section data-atlas><button data-mode="3d" disabled></button><button data-mode="2d" aria-pressed="true"></button><div data-atlas-stage><div data-canvas hidden></div><div data-map>${atlasNodes.map(node => `<button data-node="${node.id}" aria-pressed="false">${node.label}</button>`).join('')}</div><p data-atlas-status></p><div data-camera hidden></div></div><h3 data-node-title></h3><p data-node-description></p><a data-node-link hidden></a></section>`);
  const observers = [];
  dom.window.IntersectionObserver = class {
    constructor(callback) { this.callback = callback; this.disconnected = false; observers.push(this); }
    observe() {}
    disconnect() { this.disconnected = true; }
  };
  evaluate(dom, read('src/scripts/atlas.ts'), { atlasNodes, atlasLinks, approvedLinks });
  const doc = dom.window.document;
  dom.window.initAtlas(doc.querySelector('[data-atlas]'));
  doc.querySelector('[data-node="groupes"]').click();
  assert.equal(doc.querySelector('[data-node-title]').textContent, 'Groupes');
  assert.equal(doc.querySelector('[data-node-link]').hidden, false);
  assert.equal(doc.querySelector('[data-node-link]').getAttribute('href'), '/cours/groupes-rotations/');
  observers[0].callback([{ isIntersecting: true }]);
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(doc.querySelector('[data-map]').hidden, false);
  assert.equal(doc.querySelector('[data-canvas]').hidden, true);
  assert.equal(doc.querySelector('[data-mode="3d"]').disabled, true);
  assert.match(doc.querySelector('[data-atlas-status]').textContent, /indisponible/);
  doc.querySelector('[data-node="topologie"]').click();
  assert.equal(doc.querySelector('[data-node-title]').textContent, 'Topologie');
  assert.equal(doc.querySelector('[data-node-link]').hidden, true);
  dom.window.dispatchEvent(new dom.window.PageTransitionEvent('pagehide', { persisted: false }));
  assert.equal(observers[0].disconnected, true);
  dom.window.close();
});
