import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { JSDOM } from 'jsdom';

const output = resolve('dist');
const pages = ['index.html', 'atlas/index.html', 'bibliotheque/index.html', 'cours/groupes-rotations/index.html', 'experiences/p5/index.html', '404.html'];
let references = 0;

for (const page of pages) {
  const dom = new JSDOM(readFileSync(resolve(output, page), 'utf8'));
  const doc = dom.window.document;
  assert.equal(doc.documentElement.lang, 'fr', `${page}: langue française`);
  assert.equal(doc.querySelectorAll('main').length, 1, `${page}: région principale unique`);
  assert.ok(doc.querySelector('title')?.textContent.trim(), `${page}: titre présent`);
  assert.ok(doc.querySelector('a.skip-link[href="#main"]'), `${page}: lien d’évitement`);
  const ids = [...doc.querySelectorAll('[id]')].map(element => element.id);
  assert.equal(new Set(ids).size, ids.length, `${page}: identifiants uniques`);

  for (const element of doc.querySelectorAll('a[href], link[href], script[src]')) {
    const value = element.getAttribute('href') ?? element.getAttribute('src');
    if (value.startsWith('#')) {
      assert.ok(doc.getElementById(decodeURIComponent(value.slice(1))), `${page}: ancre ${value}`);
      references++;
    } else if (value.startsWith('/') && !value.startsWith('//')) {
      const url = new URL(value, 'http://localhost');
      const local = url.pathname.endsWith('/') ? `${url.pathname}index.html` : url.pathname;
      assert.ok(existsSync(resolve(output, `.${local}`)), `${page}: ressource locale ${value}`);
      references++;
    }
  }

  if (page.startsWith('cours/')) {
    const proof = doc.getElementById('preuve-integrale');
    assert.ok(proof && !proof.hidden && !proof.closest('details'), 'Preuve intégrale indépendante des panneaux progressifs');
    assert.ok(doc.querySelector('.lesson-section-nav a[href="#preuve-integrale"]'), 'Accès à la preuve dans la navigation persistante');
    assert.equal(doc.querySelectorAll('[data-step]').length, 3);
    assert.ok(doc.querySelector('.pending-content'), 'Emplacement MDX compilé et stylable');
    assert.match(proof.textContent, /Aucune démonstration validée/);
    assert.equal(doc.querySelectorAll('[data-rotation]').length, 3);
  }
  if (page.startsWith('bibliotheque/')) {
    assert.equal(doc.querySelectorAll('[data-lesson-id]').length, 3);
    assert.deepEqual([...doc.querySelectorAll('select option')].map(option => option.textContent), ['Tous les domaines', 'Algèbre', 'Géométrie', 'Analyse']);
  }
  if (page.startsWith('atlas/')) {
    assert.equal(doc.querySelectorAll('[data-map] [data-node]').length, 5);
    assert.equal(doc.querySelectorAll('.atlas-node-list [data-node]').length, 5);
  }
  if (page.startsWith('experiences/p5/')) {
    assert.equal(doc.querySelectorAll('p5-experience').length, 2, 'Deux instances intégrées depuis MDX');
    assert.equal(doc.querySelectorAll('[data-p5-play]').length, 2);
    assert.equal(doc.querySelectorAll('.p5-fallback').length, 2);
    assert.ok(doc.querySelector('.p5-fallback svg'), 'Alternative statique transmise par le slot MDX');
    assert.match(doc.querySelectorAll('.p5-fallback')[1].textContent, /propre horloge/);
    assert.ok([...doc.querySelectorAll('.p5-controls button')].every(button => button.disabled), 'Commandes désactivées avant initialisation JavaScript');
    assert.equal(doc.querySelector('script[src*="p5"], script[data-atelier-p5]'), null, 'Bibliothèque absente du chargement HTML initial');
  } else {
    assert.equal(doc.querySelector('p5-experience'), null);
    assert.ok(![...doc.querySelectorAll('script[src]')].some(script => /P5Experience/i.test(script.src)), 'Contrôleur p5 absent des autres pages');
  }
  console.log(`OK ${page}`);
  dom.window.close();
}
// Self-hosted p5.js: present in the build, byte-identical to the pinned hash, with its licence.
const runtime = readFileSync(resolve('src/experiences/p5/runtime.ts'), 'utf8');
const p5Url = runtime.match(/url: '([^']+)'/)[1], p5Integrity = runtime.match(/integrity: '([^']+)'/)[1];
assert.match(p5Url, /^\/vendor\/p5\//, 'p5.js servi depuis le site');
const p5File = resolve(output, p5Url.slice(1));
assert.ok(existsSync(p5File), `p5.js absent de la compilation : ${p5Url}`);
assert.equal('sha384-' + createHash('sha384').update(readFileSync(p5File)).digest('base64'), p5Integrity, 'Empreinte de p5.js compilé différente de la valeur SRI');
assert.ok(existsSync(resolve(p5File, '../LICENSE.txt')), 'Licence LGPL de p5.js absente');
console.log(`OK ${p5Url} (empreinte SRI vérifiée, licence présente)`);
console.log(`${pages.length} pages compilées vérifiées ; ${references} références locales résolues. Aucun navigateur ni serveur HTTP utilisé.`);
