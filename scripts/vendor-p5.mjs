// Copies the pinned p5.js distribution from node_modules to public/vendor/,
// so the site serves it itself (no third-party CDN at runtime).
// Refuses to copy if the npm package version or the file hash differ from the
// values pinned in src/experiences/p5/runtime.ts, which the browser also
// enforces through Subresource Integrity.
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const runtime = readFileSync(resolve(root, 'src/experiences/p5/runtime.ts'), 'utf8');
const pinned = name => {
  const match = runtime.match(new RegExp(`${name}: '([^']+)'`));
  if (!match) throw new Error(`P5_RUNTIME.${name} introuvable dans runtime.ts`);
  return match[1];
};
const version = pinned('version'), url = pinned('url'), integrity = pinned('integrity');

const packageDir = resolve(root, 'node_modules/p5');
const fail = message => { console.error(`vendor-p5 : ${message}`); process.exit(1); };
if (!existsSync(packageDir)) fail('paquet p5 absent ; lancer « npm ci ».');
const installed = JSON.parse(readFileSync(resolve(packageDir, 'package.json'), 'utf8')).version;
if (installed !== version) fail(`p5 ${installed} installé, ${version} attendu par runtime.ts.`);

const source = resolve(packageDir, 'lib/p5.min.js');
const digest = file => 'sha384-' + createHash('sha384').update(readFileSync(file)).digest('base64');
const actual = digest(source);
if (actual !== integrity) fail(`empreinte inattendue pour ${source}\n  attendue : ${integrity}\n  obtenue  : ${actual}`);

const target = resolve(root, 'public', url.replace(/^\//, ''));
mkdirSync(dirname(target), { recursive: true });
if (!existsSync(target) || digest(target) !== integrity) copyFileSync(source, target);
copyFileSync(resolve(packageDir, 'license.txt'), resolve(dirname(target), 'LICENSE.txt'));
console.log(`vendor-p5 : p5.js ${version} vérifié (${integrity.slice(0, 19)}…) → public${url}`);
