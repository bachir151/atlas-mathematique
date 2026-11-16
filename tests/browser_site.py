#!/usr/bin/env python3
"""Real Firefox/WebDriver checks for the Atlas (Three.js) and site-wide accessibility.

Reuses the WebDriver harness of browser_p5.py. Same exit codes: 0 all checks
pass; 1 observed application failure; 2 environment blocked the run.
Headless Firefox renders WebGL in software: GPU-specific behaviour on real
hardware is not validated here.
"""
from datetime import datetime, timezone
from functools import partial
from http.server import ThreadingHTTPServer
import json
import os
from pathlib import Path
import shutil
import signal
import subprocess
import sys
import threading
import time
import urllib.error

sys.path.insert(0, str(Path(__file__).resolve().parent))
from browser_p5 import (  # noqa: E402
    ROOT, CheckSkipped, Driver, EnvironmentBlocked, QuietHandler, WebDriverError, free_port, wait_for,
)

PAGES = ['/', '/atlas/', '/bibliotheque/', '/cours/groupes-rotations/', '/cours/mediatrices-reflexions/', '/cours/suites-geometriques-sommes-infinies/', '/cours/sous-groupes-entiers/', '/cours/groupes-cycliques/', '/cours/morphismes-isomorphismes/', '/cours/groupes-quotients/', '/cours/permutations-cycles/', '/cours/actions-orbites-stabilisateurs/', '/cours/lagrange-conjugaison/', '/cours/anneaux-corps/', '/cours/ideaux-multiples/', '/cours/anneaux-quotients-morphismes/', '/cours/polynomes-division-racines/', '/cours/irreductibilite-polynomes/', '/cours/corps-finis/', '/experiences/p5/', '/404.html']
# --drafts: serve the build that includes draft lessons (ATELIER_DRAFTS=1) and
# run the site-wide accessibility checks on every lesson, plus the figures.
DRAFTS = '--drafts' in sys.argv
DRAFTS_DIST = ROOT / 'test-results' / 'dist-drafts'
PLAN = [
    'atlas-3d-load', 'atlas-selection-sync', 'atlas-camera', 'atlas-modes-keyboard', 'atlas-context-loss',
    'atlas-cleanup', 'three-not-loaded-elsewhere', 'skip-link', 'keyboard-focus', 'reflow-320',
    'text-zoom-200', 'target-size', 'contrast', 'square-rotation', 'square-reset-history', 'proof-progressive',
    'companion', 'library-filters', 'security-policy', 'figures-static', 'figures-keyboard', 'figures-buttons', 'figures-drag',
    'series-static', 'series-keyboard', 'series-buttons', 'steps-static', 'steps-keyboard', 'steps-buttons', 'cycle-static', 'cycle-keyboard', 'cycle-buttons', 'morphism-static', 'morphism-keyboard', 'morphism-buttons', 'quotient-static', 'quotient-keyboard', 'quotient-buttons', 'perm-static', 'perm-keyboard', 'perm-buttons', 'action-static', 'action-keyboard', 'action-buttons', 'lagrange-static', 'lagrange-keyboard', 'lagrange-buttons', 'ring-static', 'ring-keyboard', 'ring-buttons', 'ideal-static', 'ideal-keyboard', 'ideal-buttons', 'rquot-static', 'rquot-keyboard', 'rquot-buttons', 'poly-static', 'poly-keyboard', 'poly-buttons', 'irred-static', 'irred-keyboard', 'irred-buttons', 'field-static', 'field-keyboard', 'field-buttons', 'atlas-reduced-motion', 'square-reduced-motion', 'page-errors',
]
DRAFT_PLAN = [
    'skip-link', 'keyboard-focus', 'reflow-320', 'text-zoom-200', 'target-size', 'contrast',
    'figures-static', 'figures-keyboard', 'figures-buttons', 'figures-drag',
    'series-static', 'series-keyboard', 'series-buttons', 'steps-static', 'steps-keyboard', 'steps-buttons', 'cycle-static', 'cycle-keyboard', 'cycle-buttons', 'morphism-static', 'morphism-keyboard', 'morphism-buttons', 'quotient-static', 'quotient-keyboard', 'quotient-buttons', 'perm-static', 'perm-keyboard', 'perm-buttons', 'action-static', 'action-keyboard', 'action-buttons', 'lagrange-static', 'lagrange-keyboard', 'lagrange-buttons', 'ring-static', 'ring-keyboard', 'ring-buttons', 'ideal-static', 'ideal-keyboard', 'ideal-buttons', 'rquot-static', 'rquot-keyboard', 'rquot-buttons', 'poly-static', 'poly-keyboard', 'poly-buttons', 'irred-static', 'irred-keyboard', 'irred-buttons', 'field-static', 'field-keyboard', 'field-buttons', 'page-errors',
]

# Screen position of vertex A (the orange marker) relative to the rotation centre, in SVG units.
VERTEX_A = r'''
const svg = document.querySelector('[data-square] svg');
const r = document.querySelector('[data-rotating-square] circle[fill="#a65b36"]').getBoundingClientRect();
// Screen centre of the marker mapped back to SVG user units (handles viewBox letterboxing).
const p = new DOMPoint(r.left + r.width / 2, r.top + r.height / 2).matrixTransform(svg.getScreenCTM().inverse());
return [Math.round(p.x - 240), Math.round(p.y - 175)];
'''

# Collect uncaught errors from the very first script of every page.
ERRORS = r'''
window.__siteQA = {errors: []};
addEventListener('error', e => { if (e.message) __siteQA.errors.push(e.message); });
addEventListener('unhandledrejection', e => __siteQA.errors.push(String(e.reason)));
return true;
'''

# WCAG 2.x relative luminance contrast, composited over the nearest backgrounds.
CONTRAST = r'''
const parse = c => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,\/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1]; };
const over = (top, bottom) => { const a = top[3]; return [0, 1, 2].map(i => top[i] * a + bottom[i] * (1 - a)).concat(1); };
const lum = c => { const [r, g, b] = c.slice(0, 3).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
function background(el) {
  const layers = [];
  for (let node = el; node; node = node.parentElement) {
    const s = getComputedStyle(node);
    if (s.backgroundImage !== 'none') return null; // gradients/images: not computable reliably
    const c = parse(s.backgroundColor); if (c && c[3] > 0) { layers.push(c); if (c[3] >= 1) break; }
  }
  let result = [255, 255, 255, 1];
  for (const layer of layers.reverse()) result = over(layer, result);
  return result;
}
const failures = []; let checked = 0, skipped = 0;
const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
const seen = new Set();
while (walker.nextNode()) {
  const el = walker.currentNode.parentElement;
  if (!el || seen.has(el) || !walker.currentNode.textContent.trim()) continue;
  seen.add(el);
  if (el.closest('[hidden],[aria-hidden=true],svg,noscript,script,style,.sr-only')) continue;
  if (el.closest('button:disabled,[aria-disabled=true],input:disabled,select:disabled')) continue; // WCAG exempts inactive controls
  const rect = el.getBoundingClientRect(); const s = getComputedStyle(el);
  if (!rect.width || !rect.height || s.visibility === 'hidden') continue;
  let opacity = 1; for (let n = el; n; n = n.parentElement) opacity *= Number(getComputedStyle(n).opacity);
  const bg = background(el); if (!bg) { skipped++; continue; }
  const fg = parse(s.color); fg[3] *= opacity;
  const value = ratio(over(fg, bg), bg);
  const size = parseFloat(s.fontSize), bold = Number(s.fontWeight) >= 700;
  const required = size >= 24 || (bold && size >= 18.66) ? 3 : 4.5;
  checked++;
  if (value + 0.005 < required) failures.push({text: walker.currentNode.textContent.trim().slice(0, 40), ratio: Math.round(value * 100) / 100, required, color: s.color, size});
}
return {checked, skipped, failures};
'''


class SiteChecks:
    def __init__(self, driver, base, output, results):
        self.d, self.base, self.output, self.results = driver, base.rstrip('/'), output, results
        self.page_errors = []
        self.failed = False

    def case(self, name, function):
        started = time.monotonic()
        result = {'name': name}
        try:
            result.update(status='passed', details=function())
        except CheckSkipped as error:
            result.update(status='skipped', reason=str(error))
        except EnvironmentBlocked as error:
            result.update(status='blocked', reason=str(error))
            raise
        except Exception as error:
            result.update(status='failed', reason=str(error) or type(error).__name__)
            try:
                self.d.screenshot(self.output / (name + '-failure.png'))
            except Exception:
                pass
            # Checks are independent: record the failure and keep going.
            self.failed = True
        finally:
            result['seconds'] = round(time.monotonic() - started, 2)
            self.results.append(result)
            print(name + ': ' + result['status'], flush=True)

    def collect_errors(self):
        try:
            errors = self.d.js('const q=window.__siteQA;const e=q?q.errors:[];if(q)q.errors=[];return e;')
        except WebDriverError:
            errors = []
        self.page_errors.extend(errors)

    def open(self, path, width=1280, height=1000):
        self.collect_errors()
        self.d.viewport(width, height)
        self.d.navigate(self.base + path)
        wait_for(lambda: self.d.js('return document.readyState==="complete";'), 'Page non chargée : ' + path)
        self.d.js(ERRORS)

    def atlas_state(self):
        return self.d.js('''const r=document.querySelector('[data-atlas]');const c=r.querySelector('[data-canvas] canvas');
          return {mode:r.querySelector('[data-mode="3d"]').getAttribute('aria-pressed')==='true'?'3d':'2d',
          canvas:!!c,canvasHidden:r.querySelector('[data-canvas]').hidden,mapHidden:r.querySelector('[data-map]').hidden,
          threeAvailable:(b=>!b.disabled&&b.getAttribute('aria-disabled')!=='true')(r.querySelector('[data-mode="3d"]')),
          labels:r.querySelectorAll('.atlas-3d-label').length,status:r.querySelector('[data-atlas-status]').textContent};''')

    def wait_3d(self):
        wait_for(lambda: self.atlas_state()['mode'] == '3d', 'La vue 3D ne s’est pas activée : ' + json.dumps(self.atlas_state(), ensure_ascii=False))

    # ---------- Atlas ----------
    def atlas(self):
        d = self.d
        self.open('/atlas/')

        def load():
            self.wait_3d()
            state = self.atlas_state()
            assert state['canvas'] and not state['canvasHidden'] and state['mapHidden'], state
            gl = d.js("const c=document.querySelector('[data-canvas] canvas');const g=c.getContext('webgl2')||c.getContext('webgl');return g?{version:g.getParameter(g.VERSION),lost:g.isContextLost(),w:c.width,h:c.height}:null;")
            assert gl and not gl['lost'] and gl['w'] > 0 and gl['h'] > 0, f'Contexte WebGL absent ou vide : {gl}'
            chunks = d.js("return performance.getEntriesByType('resource').map(e=>e.name.split('/').pop()).filter(n=>/three|OrbitControls/i.test(n));")
            assert chunks, 'Modules Three.js non chargés séparément'
            labels = d.js('''const s=document.querySelector('[data-atlas-stage]').getBoundingClientRect();
              return [...document.querySelectorAll('.atlas-3d-label')].filter(l=>!l.hidden).map(l=>{const r=l.getBoundingClientRect();
              return r.left>=s.left-1&&r.right<=s.right+1&&r.top>=s.top-1&&r.bottom<=s.bottom+1;});''')
            assert labels and all(labels), f'Étiquettes 3D hors de la scène : {labels}'
            d.screenshot(self.output / 'atlas-3d.png')
            return {'webgl': gl['version'], 'canvas': [gl['w'], gl['h']], 'chunks': chunks, 'visibleLabels': len(labels)}
        self.case('atlas-3d-load', load)

        def selection():
            d.js("document.querySelector('.atlas-node-list [data-node]').click();")
            state = d.js('''const id=document.querySelector('.atlas-node-list [data-node]').dataset.node;
              const all=[...document.querySelectorAll(`[data-node="${id}"]`)];
              return {id,count:all.length,pressed:all.every(b=>b.getAttribute('aria-pressed')==='true'),
              others:[...document.querySelectorAll('[data-node]')].filter(b=>b.dataset.node!==id&&b.getAttribute('aria-pressed')==='true').length,
              title:document.querySelector('[data-node-title]').textContent,label:all[0].textContent.replace('↗','').trim()};''')
            assert state['count'] >= 3, f'Le thème devrait exister en 2D, en liste et en 3D : {state}'
            assert state['pressed'] and state['others'] == 0, f'Sélection non synchronisée : {state}'
            assert state['title'] == state['label'], f'Détail non mis à jour : {state}'
            # Selecting from a 3D label must keep the 3D view.
            d.js("const l=[...document.querySelectorAll('.atlas-3d-label')].find(b=>!b.hidden&&b.getAttribute('aria-pressed')!=='true');l.click();")
            assert self.atlas_state()['mode'] == '3d', 'Un clic sur une étiquette 3D a quitté la vue 3D'
            return state
        self.case('atlas-selection-sync', selection)

        def camera():
            before = d.js("return document.querySelector('.atlas-3d-label:not([hidden])').style.left;")
            for control in ('[data-zoom="in"]', '[data-zoom="in"]'):
                d.js(f"document.querySelector('{control}').click();")
            time.sleep(0.3)
            zoomed = d.js("return document.querySelector('.atlas-3d-label:not([hidden])').style.left;")
            assert zoomed != before, 'Le zoom ne modifie pas la projection'
            d.js("document.querySelector('[data-reset]').click();"); time.sleep(0.3)
            reset = d.js("return document.querySelector('.atlas-3d-label:not([hidden])').style.left;")
            assert reset == before, f'La réinitialisation ne restaure pas la vue : {before} / {reset}'
            return {'before': before, 'zoomed': zoomed, 'reset': reset}
        self.case('atlas-camera', camera)

        def modes_keyboard():
            d.js("document.querySelector('[data-mode=\"2d\"]').focus();")
            d.key(''); time.sleep(0.2)
            s2 = self.atlas_state()
            assert s2['mode'] == '2d' and s2['canvasHidden'] and not s2['mapHidden'], f'Entrée sur « Vue 2D » : {s2}'
            assert d.js("return document.activeElement.dataset.mode;") == '2d', 'Focus perdu après le changement de vue'
            d.key('')  # Tab -> first 2D map node (3D labels are hidden with their container)
            focused = d.js("const a=document.activeElement;return {node:a.dataset.node||null,inMap:!!a.closest('[data-map]'),outline:getComputedStyle(a).outlineStyle};")
            assert focused['inMap'] and focused['outline'] != 'none', f'Navigation vers la carte 2D : {focused}'
            d.key(' '); time.sleep(0.1)
            assert d.js("return document.activeElement.getAttribute('aria-pressed');") == 'true', 'Espace ne sélectionne pas le thème'
            d.js("document.querySelector('[data-mode=\"3d\"]').focus();"); d.key(' ')
            self.wait_3d()
            return {'twoD': True, 'focusedNode': focused['node'], 'backTo3d': True}
        self.case('atlas-modes-keyboard', modes_keyboard)

        def context_loss():
            d.js("document.querySelector('[data-mode=\"3d\"]').focus();")
            supported = d.js("const c=document.querySelector('[data-canvas] canvas');const g=c.getContext('webgl2')||c.getContext('webgl');const x=g.getExtension('WEBGL_lose_context');if(!x)return false;window.__lost=x;x.loseContext();return true;")
            if not supported:
                raise CheckSkipped('Extension WEBGL_lose_context indisponible')
            wait_for(lambda: self.atlas_state()['mode'] == '2d', 'Pas de retour en 2D après perte du contexte')
            state = self.atlas_state()
            assert not state['canvas'] and state['labels'] == 0, f'Scène non libérée après perte du contexte : {state}'
            assert not state['threeAvailable'], f'La vue 3D reste proposée après perte du contexte : {state}'
            assert 'perdu' in state['status'], state
            active = d.js("return document.activeElement===document.body?'body':(document.activeElement.dataset.mode||document.activeElement.tagName);")
            assert active != 'body', 'Focus clavier perdu lors de la perte du contexte WebGL'
            d.key(''); time.sleep(0.2)
            assert self.atlas_state()['mode'] == '2d', 'La vue 3D indisponible a pu être activée'
            assert 'perdu' in self.atlas_state()['status'], 'Le message de perte du contexte a été remplacé'
            # Second case: focus on a 3D label, which disappears with the scene.
            self.open('/atlas/')
            self.wait_3d()
            d.js("const l=[...document.querySelectorAll('.atlas-3d-label')].find(b=>!b.hidden);l.click();l.focus();")
            d.js("const c=document.querySelector('[data-canvas] canvas');(c.getContext('webgl2')||c.getContext('webgl')).getExtension('WEBGL_lose_context').loseContext();")
            wait_for(lambda: self.atlas_state()['mode'] == '2d', 'Pas de retour en 2D (second cas)')
            moved = d.js("const a=document.activeElement;return {inMap:!!a.closest('[data-map]'),pressed:a.getAttribute('aria-pressed')};")
            assert moved['inMap'] and moved['pressed'] == 'true', f'Focus non transféré vers le thème sélectionné de la carte 2D : {moved}'
            return {'fallback': '2d', 'focus': active, 'labelFocusMovedToMap': True, 'status': state['status']}
        self.case('atlas-context-loss', context_loss)

        def cleanup():
            self.open('/atlas/')
            self.wait_3d()
            d.js("dispatchEvent(new PageTransitionEvent('pagehide',{persisted:false}));")
            time.sleep(0.2)
            state = self.atlas_state()
            assert not state['canvas'] and state['labels'] == 0, f'Scène non libérée à la sortie de page : {state}'
            return {'canvasRemoved': True}
        self.case('atlas-cleanup', cleanup)

        def elsewhere():
            found = {}
            for path in ('/', '/bibliotheque/', '/cours/groupes-rotations/', '/experiences/p5/'):
                self.open(path); time.sleep(0.5)
                found[path] = d.js("return performance.getEntriesByType('resource').map(e=>e.name).filter(n=>/three|OrbitControls/i.test(n)).length;")
            assert not any(found.values()), f'Three.js chargé hors de l’Atlas : {found}'
            return found
        self.case('three-not-loaded-elsewhere', elsewhere)

    # ---------- Site-wide ----------
    def site(self):
        d = self.d

        def skip_link():
            self.open('/bibliotheque/')
            d.js("document.activeElement?.blur();window.scrollTo({top:0,behavior:'instant'});")
            d.key('')
            first = d.js("const a=document.activeElement;const r=a.getBoundingClientRect();return {cls:a.className,visible:r.top>=0&&r.bottom<=innerHeight&&r.width>1&&r.height>1};")
            assert first['cls'] == 'skip-link' and first['visible'], f'Premier arrêt Tab : {first}'
            d.key(''); time.sleep(0.2)
            assert d.js("return document.activeElement.id;") == 'main', 'Le lien d’évitement ne place pas le focus sur le contenu'
            return first
        self.case('skip-link', skip_link)

        def keyboard_focus():
            report = {}
            for path in PAGES:
                self.open(path)
                d.js("document.activeElement?.blur();window.scrollTo({top:0,behavior:'instant'});")
                stops, problems = 0, []
                for _ in range(80):
                    d.key('')
                    s = d.js('''const a=document.activeElement;if(!a||a===document.body)return {end:true,doc:document.hasFocus()};
                      const st=getComputedStyle(a);const r=a.getBoundingClientRect();
                      return {end:false,doc:document.hasFocus(),label:(a.getAttribute('aria-label')||a.textContent||a.tagName).trim().slice(0,30),
                      outline:st.outlineStyle!=='none'&&parseFloat(st.outlineWidth)>0,shadow:st.boxShadow!=='none',
                      visible:r.width>0&&r.height>0&&st.visibility!=='hidden',
                      first:a.classList.contains('skip-link')&&window.__seenSkip===true};''')
                    if s['end'] or not s['doc']:
                        break
                    if s['first']:
                        break  # wrapped around to the start
                    d.js("if(document.activeElement.classList.contains('skip-link'))window.__seenSkip=true;")
                    stops += 1
                    if not s['visible'] or not (s['outline'] or s['shadow']):
                        problems.append(s['label'])
                assert not problems, f'{path} : focus invisible sur {problems}'
                assert stops > 1, f'{path} : navigation clavier impossible'
                report[path] = stops
            return report
        self.case('keyboard-focus', keyboard_focus)

        def overflow(width, label, zoom=None):
            report = {}
            for path in PAGES:
                if width < 500:
                    self.collect_errors(); d.viewport(1280, 1000)
                    d.framed(self.base, path, width, 900)  # Firefox windows stop at ~500 px
                else:
                    self.open(path, width, 900)
                    assert d.js('return innerWidth;') == width, f'Largeur non obtenue : {d.js("return innerWidth;")}'
                if zoom:
                    d.js(f"document.documentElement.style.fontSize='{zoom}';")
                    time.sleep(0.2)
                state = d.js('''const w=document.documentElement.clientWidth;const over=[];
                  for(const el of document.querySelectorAll('body *')){const r=el.getBoundingClientRect();
                  if(r.width&&r.right>w+1&&getComputedStyle(el).position!=='fixed'&&!el.closest('[hidden],.sr-only,.skip-link,canvas'))
                  over.push((el.className||el.tagName).toString().slice(0,40)+':'+Math.round(r.right));}
                  return {scroll:document.documentElement.scrollWidth,width:w,over:over.slice(0,5)};''')
                assert state['scroll'] <= state['width'] + 1, f'{label} {path} : défilement horizontal {state}'
                report[path] = {'viewport': state['width'], 'scrollWidth': state['scroll']}
                d.top()
                if path == '/cours/groupes-rotations/':
                    d.screenshot(self.output / f'{label}-cours.png')
            return report
        self.case('reflow-320', lambda: overflow(320, 'reflow-320'))
        self.case('text-zoom-200', lambda: overflow(1280 // 2, 'text-zoom-200', zoom='200%'))

        def target_size():
            small = {}
            for path in PAGES:
                self.collect_errors(); d.viewport(1280, 1000)
                d.framed(self.base, path, 390, 844)
                found = d.js('''return [...document.querySelectorAll('a[href],button,input,select,summary,[tabindex="0"]')].filter(el=>{
                  const r=el.getBoundingClientRect();if(!r.width||!r.height||el.closest('[hidden]'))return false;
                  if(el.matches('.skip-link'))return false;
                  // WCAG 2.5.8 exception: links inside a sentence or paragraph.
                  if(el.tagName==='A'&&getComputedStyle(el).display==='inline'&&el.parentElement.closest('p,li'))return false;
                  return r.width<24||r.height<24;}).map(el=>{const r=el.getBoundingClientRect();
                  return (el.getAttribute('aria-label')||el.textContent||el.tagName).trim().slice(0,25)+` ${Math.round(r.width)}×${Math.round(r.height)}`;});''')
                d.top()
                if found:
                    small[path] = found
            assert not small, f'Cibles inférieures à 24×24 px (WCAG 2.5.8) : {small}'
            return {'minimum': '24×24'}
        self.case('target-size', target_size)

        def contrast():
            report, failures = {}, {}
            for path in PAGES:
                self.open(path)
                time.sleep(0.3)
                state = d.js(CONTRAST)
                report[path] = {'checked': state['checked'], 'skipped': state['skipped']}
                if state['failures']:
                    failures[path] = state['failures']
            assert not failures, 'Contrastes insuffisants : ' + json.dumps(failures, ensure_ascii=False)
            return report
        self.case('contrast', contrast)

    # ---------- Lesson page and library ----------
    def interactions(self):
        d = self.d
        self.open('/cours/groupes-rotations/')
        settle = lambda: time.sleep(0.8)  # CSS transition of the square: 0.6 s

        def square_rotation():
            start = d.js(VERTEX_A)
            assert start == [-80, -80], f'Position initiale de A inattendue : {start}'
            d.js("document.querySelector('[data-rotation=\"90\"]').focus();")
            d.key('\ue007'); settle()
            after90 = d.js(VERTEX_A)
            # Positive angle shown counter-clockwise on screen (y axis points down): (-80,-80) -> (-80, 80).
            assert after90 == [-80, 80], f'Après +90°, A devrait être en bas à gauche à l’écran : {after90}'
            assert d.js("return document.querySelector('[data-angle]').value;") == '90°'
            d.key('\ue004'); d.key(' '); settle()  # Tab to +180°, Space
            after270 = d.js(VERTEX_A)
            assert after270 == [80, -80], f'Après +90° puis +180°, A devrait être en haut à droite : {after270}'
            assert d.js("return document.querySelector('[data-angle]').value;") == '270°'
            return {'start': start, 'after90': after90, 'after270': after270, 'keyboard': True}
        self.case('square-rotation', square_rotation)

        def square_reset_history():
            for _ in range(10):
                d.js("document.querySelector('[data-rotation=\"90\"]').click();")
            items = d.js("return [...document.querySelectorAll('[data-history] li')].map(li=>li.textContent);")
            assert len(items) == 8, f'Historique non borné à 8 : {items}'
            d.js("document.querySelector('[data-square-reset]').click();")
            # No backwards animation through the history: the square is back immediately.
            immediate = d.js(VERTEX_A)
            assert immediate == [-80, -80], f'La remise à zéro anime ou n’est pas immédiate : {immediate}'
            state = d.js("return {angle:document.querySelector('[data-angle]').value,history:[...document.querySelectorAll('[data-history] li')].map(li=>li.textContent)};")
            assert state['angle'] == '0°' and len(state['history']) == 1, state
            return {'boundedHistory': 8, 'resetImmediate': True}
        self.case('square-reset-history', square_reset_history)

        def proof():
            full = d.js("const f=document.querySelector('#preuve-integrale');const r=f.getBoundingClientRect();return {inDetails:!!f.closest('details'),hidden:f.hidden||getComputedStyle(f).display==='none',height:r.height};")
            assert not full['inDetails'] and not full['hidden'] and full['height'] > 0, f'Preuve intégrale non accessible en permanence : {full}'
            steps = d.js("return document.querySelectorAll('[data-step]').length;")
            for index in range(1, steps):
                d.js("document.querySelector('[data-next-step]').focus();")
                d.key('\ue007'); time.sleep(0.15)
                state = d.js("const s=[...document.querySelectorAll('[data-step]')];return {open:s.filter(x=>x.open).length,focusOnSummary:document.activeElement===s[arguments[0]].querySelector('summary')};", index)
                assert state['open'] == index + 1 and state['focusOnSummary'], f'Étape {index + 1} : {state}'
            done = d.js("const b=document.querySelector('[data-next-step]');return {disabled:b.disabled,text:b.textContent,body:document.activeElement===document.body};")
            assert done['disabled'] and not done['body'], f'Fin de progression : {done}'
            # The sticky section link reaches the full proof at any time.
            d.js("document.querySelector('.lesson-nav a[href=\"#preuve-integrale\"]').focus();"); d.key('\ue007'); time.sleep(0.4)
            target = d.js("const f=document.querySelector('#preuve-integrale');const r=f.getBoundingClientRect();return {focused:document.activeElement===f,visible:r.top<innerHeight&&r.bottom>0};")
            assert target['visible'], f'Le lien « Preuve intégrale » n’amène pas la preuve à l’écran : {target}'
            return {'steps': steps, 'fullProofAlwaysVisible': True, 'link': target}
        self.case('proof-progressive', proof)

        def companion():
            d.js("document.querySelector('[data-companion-toggle]').click();")
            hidden = d.js("const t=document.querySelector('[data-companion-toggle]');return {body:document.querySelector('[data-companion-body]').hidden,expanded:t.getAttribute('aria-expanded'),text:t.textContent};")
            assert hidden == {'body': True, 'expanded': 'false', 'text': 'Afficher'}, hidden
            d.js("document.querySelector('[data-companion-toggle]').click();")
            d.js("document.querySelector('#companion-input').focus();")
            for i in range(12):
                d.command('POST', '/actions', {'actions': [{'type': 'key', 'id': 'typing', 'actions':
                    [a for ch in f'm{i}' for a in ({'type': 'keyDown', 'value': ch}, {'type': 'keyUp', 'value': ch})]}]})
                d.key('\ue007')
            state = d.js("const l=document.querySelector('[data-chat]');return {count:l.children.length,last:l.lastElementChild.className,input:document.querySelector('#companion-input').value,focus:document.activeElement.id,maxlength:document.querySelector('#companion-input').maxLength};")
            assert state['count'] == 20, f'Historique du compagnon non borné à 20 : {state}'
            assert state['last'].endswith('assistant') and state['input'] == '' and state['focus'] == 'companion-input', state
            assert state['maxlength'] == 300, state
            return state
        self.case('companion', companion)

        def library():
            self.open('/bibliotheque/')
            def count():
                return d.js("return {visible:[...document.querySelectorAll('[data-lesson-id]')].filter(c=>!c.hidden).length,status:document.querySelector('[data-result-count]').textContent,empty:!document.querySelector('[data-empty]').hidden};")
            total = count()['visible']
            d.js("document.querySelector('[data-search]').focus();")
            for ch in 'reflexions':
                d.key(ch)
            accent = count()
            assert accent['visible'] == 1 and not accent['empty'] and accent['status'] == '1 résultat', f'Recherche sans accents : {accent}'
            d.js("const s=document.querySelector('[data-search]');s.value='';s.dispatchEvent(new Event('input'));const sel=document.querySelector('[data-domain]');sel.value='Analyse';sel.dispatchEvent(new Event('change'));")
            domain = count()
            assert domain['visible'] == 1, f'Filtre par domaine : {domain}'
            d.js("const s=document.querySelector('[data-search]');s.value='zzz';s.dispatchEvent(new Event('input'));")
            empty = count()
            assert empty['visible'] == 0 and empty['empty'], f'État vide : {empty}'
            d.js("document.querySelector('[data-clear]').focus();"); d.key('\ue007'); time.sleep(0.1)
            cleared = count()
            assert cleared['visible'] == total and not cleared['empty'], f'Effacement des filtres : {cleared}'
            assert d.js("return document.activeElement===document.querySelector('[data-search]');"), 'Le focus ne revient pas sur la recherche'
            return {'total': total, 'accentInsensitive': True, 'domain': True, 'emptyState': True, 'clearFocus': True}
        self.case('library-filters', library)

        def security():
            # The local server sends the netlify.toml headers; Astro writes the page policy.
            self.open('/experiences/p5/')
            d.js("""window.__csp={violations:[],headers:null,external:null};
              document.addEventListener('securitypolicyviolation',e=>window.__csp.violations.push({directive:e.effectiveDirective,blocked:e.blockedURI}));
              fetch(location.href).then(r=>{window.__csp.headers=Object.fromEntries(['content-security-policy','x-frame-options','x-content-type-options','referrer-policy','permissions-policy'].map(n=>[n,r.headers.get(n)]));});
              fetch('https://cdn.jsdelivr.net/npm/p5@2.4.0/translations/en-US/extracted.json').then(()=>{window.__csp.external='allowed';},()=>{window.__csp.external='blocked';});""")
            wait_for(lambda: d.js("return !!(window.__csp.headers&&window.__csp.external&&window.__csp.violations.length);"), 'Politique de sécurité non observée')
            state = d.js("return window.__csp;")
            headers = state['headers']
            assert "frame-ancestors 'self'" in (headers['content-security-policy'] or ''), headers
            assert headers['x-content-type-options'] == 'nosniff' and headers['x-frame-options'] == 'SAMEORIGIN', headers
            assert state['external'] == 'blocked', f'Connexion tierce non bloquée : {state}'
            assert any(v['directive'] == 'connect-src' and 'jsdelivr' in v['blocked'] for v in state['violations']), state
            meta = d.js("return document.querySelector('meta[http-equiv=\"content-security-policy\" i]')?.content||'';")
            assert "script-src 'self'" in meta and 'unsafe-inline' not in meta.split('script-src')[1].split(';')[0], meta
            return {'headers': headers, 'externalFetch': state['external'], 'violation': state['violations'][0]}
        self.case('security-policy', security)

    # ---------- Plane figures (lesson « Médiatrices & réflexions », draft) ----------
    def figures(self):
        d = self.d
        page = '/cours/mediatrices-reflexions/'
        status = lambda kind: d.js(f"return document.querySelector('#figure-{kind} [data-plane-status]').textContent;")
        rows = lambda kind: d.js(f"return Object.fromEntries([...document.querySelectorAll('#figure-{kind} [data-plane-rows] > div')].map(r=>[r.children[0].textContent,r.children[1].textContent]));")

        def static():
            html = (self.root / page.strip('/') / 'index.html').read_text(encoding='utf-8')
            # Rendered at build time: readable without JavaScript.
            for expected in ('P est plus près de B.', 'Point courant : P = (5, −1), avant réflexion.', 'Étape 0 sur 2.'):
                assert expected in html, f'Texte initial absent du HTML compilé : {expected}'
            assert html.count('data-plane-svg') == 3 and html.count('<circle') >= 7  # 3 + 3 + 1 points initially
            self.open(page)
            state = d.js('''return [...document.querySelectorAll('[data-plane-figure]')].map(f=>({id:f.id,
              enabled:[...f.querySelectorAll('input,button')].every(e=>!e.disabled),
              label:f.querySelector('svg').getAttribute('aria-labelledby'),hint:!f.querySelector('[data-plane-hint]').hidden}));''')
            assert len(state) == 3 and all(f['enabled'] and f['hint'] for f in state), state
            for f in state:
                assert all(d.js('return !!document.getElementById(arguments[0]);', ref) for ref in f['label'].split()), f
            return {'figures': [f['id'] for f in state]}
        self.case('figures-static', static)

        def keyboard():
            self.open(page)
            d.js("document.querySelector('#figure-mediatrice [data-param=x]').focus();")
            d.key('\ue015')  # Arrow down on a number field: 1 → 0
            time.sleep(0.1)
            on = status('mediatrice')
            assert on == 'P est sur la médiatrice d : PA = PB.', on
            d.key('\ue015'); time.sleep(0.1)
            assert status('mediatrice') == 'P est plus près de A.', status('mediatrice')
            assert rows('mediatrice')['PA² − PB²'] == '4ax = 4 × 2 × (−1) = −8', rows('mediatrice')
            # Typed values are clamped to the allowed range when the field is left.
            d.js("const f=document.querySelector('#figure-mediatrice [data-param=y]');f.focus();f.select();")
            for ch in '99':
                d.key(ch)
            d.key('\ue004')  # Tab
            time.sleep(0.1)
            y = d.js("return document.querySelector('#figure-mediatrice [data-param=y]').value;")
            assert y == '5' and rows('mediatrice')['P'] == '(−1, 5)', (y, rows('mediatrice'))
            # Radio group of figure 3 with the arrow keys.
            d.js("document.querySelector('#figure-deux-reflexions [data-order][value=diagonal-first]').focus();")
            d.key('\ue015'); time.sleep(0.1)  # Arrow down selects the next radio
            order = rows('deux-reflexions')['Ordre appliqué']
            assert order.startswith('d’abord s'), order
            return {'arrowKeys': True, 'clamped': y, 'radio': order}
        self.case('figures-keyboard', keyboard)

        def buttons():
            self.open(page)
            reflect = "document.querySelector('#figure-reflexion [data-action=reflect]')"
            d.js(reflect + ".focus();"); d.key('\ue007'); time.sleep(0.1)
            first = (status('reflexion'), d.js('return ' + reflect + '.textContent;'))
            assert first == ('Point courant : P′ = (−1, −1). Position initiale : P = (5, −1).', 'Réfléchir à nouveau'), first
            assert d.js('return document.activeElement===' + reflect + ';'), 'Focus perdu après « Réfléchir »'
            d.key('\ue007'); time.sleep(0.1)
            assert status('reflexion').startswith('Point courant : (5, −1), la position initiale P'), status('reflexion')
            d.js("const c=document.querySelector('#figure-reflexion [data-param=x]');c.value='2';c.dispatchEvent(new Event('input'));")
            assert status('reflexion') == 'Le point est sur l’axe et reste fixe.', status('reflexion')
            nxt = "document.querySelector('#figure-deux-reflexions [data-action=next]')"
            d.js(nxt + ".click();" + nxt + ".click();")
            final = (status('deux-reflexions'), d.js('return ' + nxt + ".getAttribute('aria-disabled');"))
            assert final == ('P₂ = (−y, x) : s ∘ t est le quart de tour positif r.', 'true'), final
            d.js("document.querySelector('#figure-deux-reflexions [data-order][value=vertical-first]').click();")
            d.js(nxt + ".click();" + nxt + ".click();")
            assert rows('deux-reflexions')['P₂ = t(P₁)'] == '(y, −x) = (0, −1)', rows('deux-reflexions')
            d.js("for(const f of ['x','y']){const e=document.querySelector('#figure-deux-reflexions [data-param='+f+']');e.value='0';e.dispatchEvent(new Event('input'));}")
            assert status('deux-reflexions').startswith('Pour l’origine, les images coïncident'), status('deux-reflexions')
            return {'reflect': first[0], 'quarterTurn': final[0]}
        self.case('figures-buttons', buttons)

        def drag():
            self.open(page)
            d.js("document.querySelector('#figure-mediatrice').scrollIntoView({block:'center',behavior:'instant'});")
            time.sleep(0.3)
            # Screen position of P and of the world point (−3, −2), from the SVG transform.
            pos = d.js('''const svg=document.querySelector('#figure-mediatrice svg');const m=svg.getScreenCTM();
              const c=svg.querySelector('[data-drag-handle] circle');const at=(x,y)=>{const p=new DOMPoint(x,y).matrixTransform(m);return [Math.round(p.x),Math.round(p.y)];};
              const u=(400-60)/12;return {from:at(+c.getAttribute('cx'),+c.getAttribute('cy')),to:at(200-3*u,200+2*u)};''')
            d.command('POST', '/actions', {'actions': [{'type': 'pointer', 'id': 'mouse', 'parameters': {'pointerType': 'mouse'}, 'actions': [
                {'type': 'pointerMove', 'x': pos['from'][0], 'y': pos['from'][1], 'origin': 'viewport'},
                {'type': 'pointerDown', 'button': 0},
                {'type': 'pointerMove', 'x': pos['to'][0], 'y': pos['to'][1], 'origin': 'viewport', 'duration': 250},
                {'type': 'pointerUp', 'button': 0}]}]})
            d.command('DELETE', '/actions')
            time.sleep(0.2)
            state = (rows('mediatrice')['P'], d.js("return ['x','y'].map(n=>document.querySelector('#figure-mediatrice [data-param='+n+']').value);"))
            assert state == ('(−3, −2)', ['-3', '-2']), f'Glisser-déposer de P : {state} ({pos})'
            assert status('mediatrice') == 'P est plus près de A.', status('mediatrice')
            return {'draggedTo': state[0]}
        self.case('figures-drag', drag)

    # ---------- Series figures (lesson « Suites géométriques & sommes infinies ») ----------
    def series(self):
        d = self.d
        page = '/cours/suites-geometriques-sommes-infinies/'
        status = lambda kind: d.js(f"return document.querySelector('#figure-{kind} [data-series-status]').textContent;")
        rows = lambda kind: d.js(f"return Object.fromEntries([...document.querySelectorAll('#figure-{kind} [data-series-rows] > div')].map(r=>[r.children[0].textContent,r.children[1].textContent]));")
        set_field = lambda kind, name, value: d.js(f"const f=document.querySelector('#figure-{kind} [data-param={name}]');f.value='{value}';f.dispatchEvent(new Event('input'));")

        def static():
            html = (self.root / page.strip('/') / 'index.html').read_text(encoding='utf-8')
            for expected in ('S₃ = 15/16, sous la limite L = 1', 'Rang 0 : x₀ = 0, au-dessous de p = 6', '4 morceaux du segment [0, 1]'):
                assert expected in html, f'Texte initial absent du HTML compilé : {expected}'
            self.open(page)
            state = d.js('''return [...document.querySelectorAll('[data-series-figure]')].map(f=>({id:f.id,
              enabled:[...f.querySelectorAll('input,button')].every(e=>!e.disabled),
              label:f.querySelector('svg').getAttribute('aria-labelledby'),
              dots:f.querySelectorAll('svg .fig-dot').length}));''')
            assert len(state) == 2 and all(f['enabled'] for f in state), state
            assert [f['dots'] for f in state] == [4, 1], state
            for f in state:
                assert all(d.js('return !!document.getElementById(arguments[0]);', ref) for ref in f['label'].split()), f
            return {'figures': [f['id'] for f in state]}
        self.case('series-static', static)

        def keyboard():
            self.open(page)
            d.js("document.querySelector('#figure-somme-geometrique [data-param=N]').focus();")
            for _ in range(3):
                d.key('\ue013')  # Arrow up: N = 3 → 6
            time.sleep(0.1)
            st = status('somme-geometrique')
            assert st.startswith('S₆ = 127/128') and '< ε = 1/100' in st, st
            dots = d.js("return [...document.querySelectorAll('#figure-somme-geometrique svg .fig-dot')].map(c=>c.classList.contains('fig-dot-in'));")
            assert dots == [False] * 6 + [True], dots
            # Precision radios with the arrow keys: 1/100 → 1/1000.
            d.js("document.querySelector('#figure-somme-geometrique [data-choice][value=\"100\"]').focus();")
            d.key('\ue015'); time.sleep(0.1)
            r = rows('somme-geometrique')
            assert r['Premier rang où |Rₙ| < ε'] == 'N = 9 (10 termes)' and r['|R₆| < ε ?'].startswith('non'), r
            # Decimal typed values are rounded to the step and clamped when the field is left.
            d.js("const f=document.querySelector('#figure-somme-geometrique [data-param=q]');f.focus();f.select();")
            for ch in '3':
                d.key(ch)
            d.key('\ue004'); time.sleep(0.1)
            q = d.js("return document.querySelector('#figure-somme-geometrique [data-param=q]').value;")
            assert q == '0.9' and rows('somme-geometrique')['Paramètres'].startswith('a = 0,5 ; q = 0,9'), (q, rows('somme-geometrique'))
            return {'arrowKeys': True, 'radio': '1/1000', 'clamped': q}
        self.case('series-keyboard', keyboard)

        def buttons():
            self.open(page)
            first = "document.querySelector('#figure-somme-geometrique [data-action=first-rank]')"
            d.js(first + ".focus();"); d.key('\ue007'); time.sleep(0.1)
            assert rows('somme-geometrique')['|R₆| < ε ?'] == 'oui (comparaison exacte)', rows('somme-geometrique')
            assert d.js('return ' + first + ".getAttribute('aria-disabled');") == 'true'
            d.js("document.querySelector('#figure-somme-geometrique [data-action=preset-alternating]').click();")
            assert status('somme-geometrique').startswith('S₃ = 5/8, sous la limite L = 2/3 ; erreur |R₃| = 1/24'), status('somme-geometrique')
            set_field('somme-geometrique', 'a', '2'); set_field('somme-geometrique', 'q', '0.9')
            d.js("document.querySelector('#figure-somme-geometrique [data-choice][value=\"1000\"]').click();")
            assert status('somme-geometrique').endswith('Précision non atteinte dans les 81 sommes affichées.'), status('somme-geometrique')
            nxt = "document.querySelector('#figure-iteration-affine [data-action=next]')"
            d.js(nxt + ".focus();")
            for _ in range(3):
                d.key('\ue007')
            time.sleep(0.1)
            it = status('iteration-affine')
            assert it.startswith('Rang 3 : x₃ = 5,25, au-dessous de p = 6 ; |e₃| = 0,75'), it
            assert d.js("return document.querySelectorAll('#figure-iteration-affine [data-series-table] tr').length;") == 4
            d.js("document.querySelector('#figure-iteration-affine [data-action=preset-alternating]').click();" + (nxt + ".click();") * 3)
            table = d.js("return [...document.querySelectorAll('#figure-iteration-affine [data-series-table] tr')].map(r=>r.children[1].textContent);")
            assert table == ['7', '1', '4', '2,5'], table
            set_field('iteration-affine', 'b', '1')
            assert status('iteration-affine').startswith('Rang 0'), status('iteration-affine')
            return {'firstRank': 6, 'iteration': it}
        self.case('series-buttons', buttons)

    # ---------- Steps figure (lesson « Sous-groupes & multiples entiers ») ----------
    def steps(self):
        d = self.d
        page = '/cours/sous-groupes-entiers/'
        fig = '#figure-pas-entiers'
        status = lambda: d.js(f"return document.querySelector('{fig} [data-steps-status]').textContent;")
        rows = lambda: d.js(f"return Object.fromEntries([...document.querySelectorAll('{fig} [data-steps-rows] > div')].map(r=>[r.children[0].textContent,r.children[1].textContent]));")
        set_field = lambda name, value: d.js(f"const f=document.querySelector('{fig} [data-param={name}]');f.value='{value}';f.dispatchEvent(new Event('input'));")
        action = lambda name: d.js(f"document.querySelector('{fig} [data-action={name}]').click();")

        def static():
            html = (self.root / page.strip('/') / 'index.html').read_text(encoding='utf-8')
            for expected in ('Position courante : 0 + 0 = 0.', 'Positions calculées seulement pour m et n entre −5 et 5'):
                assert expected in html, f'Texte initial absent du HTML compilé : {expected}'
            self.open(page)
            state = d.js(f"""const f=document.querySelector('{fig}');return {{
              enabled:[...f.querySelectorAll('input,button')].every(e=>!e.disabled),
              label:f.querySelector('svg').getAttribute('aria-labelledby'),
              dots:f.querySelectorAll('svg .fig-dot').length,
              table:f.querySelectorAll('[data-steps-table] tr').length}};""")
            assert state['enabled'], state
            # One dot and one table row per listed position.
            assert state['dots'] == state['table'] and state['dots'] > 10, state
            assert all(d.js('return !!document.getElementById(arguments[0]);', ref) for ref in state['label'].split()), state
            return {'positions': state['dots']}
        self.case('steps-static', static)

        def keyboard():
            self.open(page)
            d.js(f"document.querySelector('{fig} [data-param=m]').focus();")
            d.key('\ue013'); time.sleep(0.1)  # Arrow up: m = 1
            d.js(f"document.querySelector('{fig} [data-param=n]').focus();")
            d.key('\ue015'); time.sleep(0.1)  # Arrow down: n = −1
            r = rows()
            assert r['Position m a + n b'] == '6 + (−4) = 2', r
            assert r['Plus petite position strictement positive affichée'] == '2', r
            # Out-of-range values are clamped when the field is left.
            d.js(f"const f=document.querySelector('{fig} [data-param=a]');f.focus();f.select();")
            for ch in '99':
                d.key(ch)
            d.key('\ue004'); time.sleep(0.1)
            a = d.js(f"return document.querySelector('{fig} [data-param=a]').value;")
            assert a == '12' and rows()['Pas et coefficients'].startswith('a = 12 ;'), (a, rows())
            return {'arrowKeys': True, 'clamped': a}
        self.case('steps-keyboard', keyboard)

        def buttons():
            self.open(page)
            up = f"document.querySelector('{fig} [data-action=m-up]')"
            d.js(up + ".focus();")
            for _ in range(7):
                d.key('\ue007')  # Enter: stops at the bound m = 5
            time.sleep(0.1)
            assert rows()['m × a'] == '5 × 6 = 30', rows()
            assert d.js('return ' + up + ".getAttribute('aria-disabled');") == 'true'
            assert d.js(f"return document.activeElement === {up};"), 'Le focus doit rester sur le bouton indisponible'
            action('n-down'); action('n-down')
            assert rows()['Position m a + n b'] == '30 + (−8) = 22', rows()
            action('reset')
            assert rows()['Position m a + n b'] == '0 + 0 = 0', rows()
            set_field('a', '0'); set_field('b', '0')
            st = status()
            assert st.startswith('a = b = 0 : toute combinaison m a + n b vaut 0'), st
            assert rows()['Plus petite position strictement positive affichée'] == 'aucune', rows()
            set_field('a', '-6'); set_field('b', '4'); action('m-down')
            assert rows()['m × a'] == '(−1) × (−6) = 6', rows()
            return {'bound': True, 'zero': True}
        self.case('steps-buttons', buttons)

    # ---------- Cycle figure (lesson « Groupes cycliques ») ----------
    def cycle(self):
        d = self.d
        page = '/cours/groupes-cycliques/'
        fig = '#figure-cadran'
        status = lambda: d.js(f"return document.querySelector('{fig} [data-cycle-status]').textContent;")
        rows = lambda: d.js(f"return Object.fromEntries([...document.querySelectorAll('{fig} [data-cycle-rows] > div')].map(r=>[r.children[0].textContent,r.children[1].textContent]));")
        set_field = lambda name, value: d.js(f"const f=document.querySelector('{fig} [data-param={name}]');f.value='{value}';f.dispatchEvent(new Event('input'));")
        action = lambda name: d.js(f"document.querySelector('{fig} [data-action={name}]').click();")
        note = lambda: d.js(f"return document.querySelector('{fig} [data-cycle-note]').textContent;")

        def static():
            html = (self.root / page.strip('/') / 'index.html').read_text(encoding='utf-8')
            for expected in ('Nombre signé de pas : 0 ; position : 0', 'Plage finie : n entre 2 et 24', 'elle ne prouve rien', 'Historique complet : 0 geste sur 48 au plus.'):
                assert expected in html, f'Texte initial absent du HTML compilé : {expected}'
            self.open(page)
            state = d.js(f"""const f=document.querySelector('{fig}');return {{
              enabled:[...f.querySelectorAll('input,button')].every(e=>!e.disabled),
              label:f.querySelector('svg').getAttribute('aria-labelledby'),
              dots:f.querySelectorAll('svg .fig-dot').length,
              table:f.querySelectorAll('[data-cycle-table] tr').length}};""")
            assert state['enabled'], state
            assert state['dots'] == 12 and state['table'] == 1, state
            assert all(d.js('return !!document.getElementById(arguments[0]);', ref) for ref in state['label'].split()), state
            return {'dots': state['dots']}
        self.case('cycle-static', static)

        def keyboard():
            self.open(page)
            d.js(f"document.querySelector('{fig} [data-param=k]').focus();")
            d.key('\ue013'); time.sleep(0.1)  # Arrow up: k = 5
            assert rows()['Dispositif'] == '12 positions numérotées de 0 à 11 ; pas k = 5', rows()
            d.js(f"document.querySelector('{fig} [data-param=n]').focus();")
            d.key('\ue015'); time.sleep(0.1)  # Arrow down: n = 11
            assert rows()['Dispositif'] == '11 positions numérotées de 0 à 10 ; pas k = 5', rows()
            # Out-of-range values are clamped when the field is left.
            d.js(f"const f=document.querySelector('{fig} [data-param=k]');f.focus();f.select();")
            for ch in '99':
                d.key(ch)
            d.key('\ue004'); time.sleep(0.1)
            k = d.js(f"return document.querySelector('{fig} [data-param=k]').value;")
            assert k == '24' and rows()['Dispositif'].endswith('pas k = 24'), (k, rows())
            return {'arrowKeys': True, 'clamped': k}
        self.case('cycle-keyboard', keyboard)

        def buttons():
            self.open(page)
            fwd = f"document.querySelector('{fig} [data-action=forward]')"
            d.js(fwd + ".focus();")
            for _ in range(3):
                d.key('\ue007')  # Enter: three gestures forward
            time.sleep(0.1)
            r = rows()
            assert r['Nombre signé de pas'] == '3' and r['Calcul'] == '3 × 4 = 12 = 1 × 12 + 0', r
            assert r['Position (reste entre 0 et 11)'] == '0', r
            assert d.js(f"return document.querySelectorAll('{fig} [data-cycle-table] tr').length;") == 4
            action('backward'); action('backward'); action('backward'); action('backward')
            r = rows()
            assert r['Nombre signé de pas'] == '−1' and r['Calcul'] == '(−1) × 4 = −4 = (−1) × 12 + 8', r
            assert d.js(f"return document.activeElement === {fwd};"), 'Le focus doit rester sur le bouton'
            action('reset')
            assert rows()['Nombre signé de pas'] == '0'
            assert d.js(f"return document.querySelector('{fig} [data-action=reset]').getAttribute('aria-disabled');") == 'true'
            set_field('k', '0'); action('forward')
            assert rows()['Position (reste entre 0 et 11)'] == '0', rows()
            action('reset'); set_field('k', '2')
            for _ in range(49):
                action('forward')
            assert note() == 'Historique tronqué : seuls les 48 premiers gestes sur 49 sont listés.', note()
            assert d.js(f"return document.querySelectorAll('{fig} [data-cycle-table] tr').length;") == 49
            assert 'elle ne prouve rien' in status(), status()
            return {'history': 48, 'truncated': True}
        self.case('cycle-buttons', buttons)

    # ---------- Morphism figure (lesson « Morphismes & isomorphismes ») ----------
    def morphism(self):
        d = self.d
        page = '/cours/morphismes-isomorphismes/'
        fig = '#figure-morphisme'
        status = lambda: d.js(f"return document.querySelector('{fig} [data-morphism-status]').textContent;")
        rows = lambda: d.js(f"return Object.fromEntries([...document.querySelectorAll('{fig} [data-morphism-rows] > div')].map(r=>[r.children[0].textContent,r.children[1].textContent]));")
        set_field = lambda name, value: d.js(f"const f=document.querySelector('{fig} [data-param={name}]');f.value='{value}';f.dispatchEvent(new Event('input'));")
        action = lambda name: d.js(f"document.querySelector('{fig} [data-action={name}]').click();")

        def static():
            html = (self.root / page.strip('/') / 'index.html').read_text(encoding='utf-8')
            for expected in ('Essai avec m = 1 et n = 5 : p(m) = r, p(n) = r', 'ne prouvent pas la propriété générale', 'entre −24 et 24'):
                assert expected in html, f'Texte initial absent du HTML compilé : {expected}'
            self.open(page)
            state = d.js(f"""const f=document.querySelector('{fig}');return {{
              enabled:[...f.querySelectorAll('input,button')].every(e=>!e.disabled),
              label:f.querySelector('svg').getAttribute('aria-labelledby'),
              dots:f.querySelectorAll('svg .fig-dot').length,
              table:f.querySelectorAll('[data-morphism-table] tr').length}};""")
            assert state['enabled'], state
            assert state['dots'] == 25 and state['table'] == 25, state
            assert all(d.js('return !!document.getElementById(arguments[0]);', ref) for ref in state['label'].split()), state
            r = rows()
            assert r['p(m + n)'] == 'p(6) = r²' and r['p(m) ∘ p(n)'] == 'r ∘ r = r²', r
            return {'integers': state['table']}
        self.case('morphism-static', static)

        def keyboard():
            self.open(page)
            d.js(f"document.querySelector('{fig} [data-param=m]').focus();")
            d.key('\ue013'); time.sleep(0.1)  # Arrow up: m = 2
            d.js(f"document.querySelector('{fig} [data-param=n]').focus();")
            d.key('\ue015'); time.sleep(0.1)  # Arrow down: n = 4
            r = rows()
            assert r['p(m)'] == 'p(2) = r²' and r['p(n)'] == 'p(4) = e', r
            assert r['Différence n − m'] == '4 − 2 = 2', r
            assert r['p(m) et p(n)'] == 'rotations différentes', r
            # Out-of-range values are clamped when the field is left.
            d.js(f"const f=document.querySelector('{fig} [data-param=m]');f.focus();f.select();")
            for ch in '99':
                d.key(ch)
            d.key('\ue004'); time.sleep(0.1)
            m = d.js(f"return document.querySelector('{fig} [data-param=m]').value;")
            assert m == '12' and rows()['Entiers choisis'] == 'm = 12 ; n = 4', (m, rows())
            return {'arrowKeys': True, 'clamped': m}
        self.case('morphism-keyboard', keyboard)

        def buttons():
            self.open(page)
            down = f"document.querySelector('{fig} [data-action=m-down]')"
            d.js(down + ".focus();")
            for _ in range(14):
                d.key('\ue007')  # Enter: stops at the bound m = −12
            time.sleep(0.1)
            assert rows()['p(m)'] == 'p(−12) = e', rows()
            assert d.js('return ' + down + ".getAttribute('aria-disabled');") == 'true'
            assert d.js(f"return document.activeElement === {down};"), 'Le focus doit rester sur le bouton indisponible'
            set_field('m', '-12'); set_field('n', '-12')
            r = rows()
            assert r['Somme m + n'] == '−12 + (−12) = −24' and r['p(m + n)'] == 'p(−24) = e', r
            set_field('m', '12'); set_field('n', '12')
            assert rows()['Somme m + n'] == '12 + 12 = 24', rows()
            set_field('m', '-3'); set_field('n', '5')
            r = rows()
            assert r['Différence n − m'] == '5 − (−3) = 8' and r['p(m) et p(n)'] == 'même rotation', r
            action('reset')
            assert rows()['Entiers choisis'] == 'm = 1 ; n = 5', rows()
            assert d.js(f"return document.querySelector('{fig} [data-action=reset]').getAttribute('aria-disabled');") == 'true'
            return {'bounds': True, 'negatives': True}
        self.case('morphism-buttons', buttons)

    # ---------- Quotient figure (lesson « Groupes quotients & classes ») ----------
    def quotient(self):
        d = self.d
        page = '/cours/groupes-quotients/'
        fig = '#figure-quotient'
        status = lambda: d.js(f"return document.querySelector('{fig} [data-quotient-status]').textContent;")
        rows = lambda: d.js(f"return Object.fromEntries([...document.querySelectorAll('{fig} [data-quotient-rows] > div')].map(r=>[r.children[0].textContent,r.children[1].textContent]));")
        set_field = lambda name, value: d.js(f"const f=document.querySelector('{fig} [data-param={name}]');f.value='{value}';f.dispatchEvent(new Event('input'));")
        action = lambda name: d.js(f"document.querySelector('{fig} [data-action={name}]').click();")

        def static():
            html = (self.root / page.strip('/') / 'index.html').read_text(encoding='utf-8')
            for expected in ('Cas courant dans ℤ/4ℤ : [1] + [2] = [3]', 'elle ne démontre rien'):
                assert expected in html, f'Texte initial absent du HTML compilé : {expected}'
            self.open(page)
            state = d.js(f"""const f=document.querySelector('{fig}');return {{
              enabled:[...f.querySelectorAll('input,button')].every(e=>!e.disabled),
              label:f.querySelector('svg').getAttribute('aria-labelledby'),
              classes:f.querySelectorAll('svg .fig-class').length,
              rowHeads:f.querySelectorAll('[data-quotient-table] th[scope=row]').length,
              colHeads:f.querySelectorAll('[data-quotient-head] th[scope=col]').length,
              current:f.querySelector('[data-quotient-table] td[aria-current=true]').textContent}};""")
            assert state['enabled'], state
            assert state['classes'] == 4 and state['rowHeads'] == 4 and state['colHeads'] == 5, state
            assert state['current'] == '[3]', state
            assert all(d.js('return !!document.getElementById(arguments[0]);', ref) for ref in state['label'].split()), state
            return {'classes': state['classes']}
        self.case('quotient-static', static)

        def keyboard():
            self.open(page)
            d.js(f"document.querySelector('{fig} [data-param=n]').focus();")
            d.key('\ue013'); time.sleep(0.1)  # Arrow up: n = 5
            r = rows()
            assert r['Modulo n'].startswith('n = 5 : 5 classes'), r
            assert r['Somme des classes'].startswith('[1] + [2] = [3]'), r
            # Out-of-range values are clamped when the field is left.
            d.js(f"const f=document.querySelector('{fig} [data-param=a]');f.focus();f.select();")
            for ch in '99':
                d.key(ch)
            d.key('\ue004'); time.sleep(0.1)
            a = d.js(f"return document.querySelector('{fig} [data-param=a]').value;")
            assert a == '20' and rows()['Représentants'] == 'a = 20 ; b = 2', (a, rows())
            return {'arrowKeys': True, 'clamped': a}
        self.case('quotient-keyboard', keyboard)

        def buttons():
            self.open(page)
            up = f"document.querySelector('{fig} [data-action=a-up]')"
            d.js(up + ".focus();")
            for _ in range(7):
                d.key('\ue007')  # Enter: 1 + 4k, stops at 17 (21 is out of bounds)
            time.sleep(0.1)
            assert rows()['Représentants'] == 'a = 17 ; b = 2', rows()
            assert d.js('return ' + up + ".getAttribute('aria-disabled');") == 'true'
            assert d.js(f"return document.activeElement === {up};"), 'Le focus doit rester sur le bouton indisponible'
            assert rows()['Classe de a'] == '[17] = [1] = 1 + 4ℤ', rows()
            action('b-down'); action('b-down'); action('b-down')
            assert rows()['Représentants'] == 'a = 17 ; b = −10', rows()
            assert rows()['Reste de b'] == '−10 = (−3) × 4 + 2', rows()
            assert rows()['Somme des classes'].startswith('[1] + [2] = [3]'), rows()
            action('reset')
            assert rows()['Représentants'] == 'a = 1 ; b = 2', rows()
            set_field('n', '8'); set_field('a', '-20'); set_field('b', '-20')
            assert rows()['Reste de a + b'] == '−40 = (−5) × 8 + 0', rows()
            assert d.js(f"return document.querySelector('{fig} [data-action=a-down]').getAttribute('aria-disabled');") == 'true'
            return {'bound': True, 'reset': True}
        self.case('quotient-buttons', buttons)

    # ---------- Permutation figure (lesson « Permutations & cycles ») ----------
    def perm(self):
        d = self.d
        page = '/cours/permutations-cycles/'
        fig = '#figure-permutation'
        status = lambda: d.js(f"return document.querySelector('{fig} [data-perm-status]').textContent;")
        rows = lambda: d.js(f"return Object.fromEntries([...document.querySelectorAll('{fig} [data-perm-rows] > div')].map(r=>[r.children[0].textContent,r.children[1].textContent]));")
        choose = lambda which, value: d.js(f"const s=document.querySelector('{fig} [data-perm-image={which}]');s.value='{value}';s.dispatchEvent(new Event('change'));")
        action = lambda name: d.js(f"document.querySelector('{fig} [data-action={name}]').click();")

        def static():
            html = (self.root / page.strip('/') / 'index.html').read_text(encoding='utf-8')
            for expected in ('Les cartes sont à leur position initiale.', 'Décomposition de σ : (1 3 2).', 'ne constituent pas une preuve générale.'):
                assert expected in html, f'Texte initial absent du HTML compilé : {expected}'
            self.open(page)
            state = d.js(f"""const f=document.querySelector('{fig}');return {{
              enabled:[...f.querySelectorAll('select,button')].every(e=>!e.disabled),
              label:f.querySelector('svg').getAttribute('aria-labelledby'),
              cards:f.querySelectorAll('svg .perm-card').length,
              table:f.querySelectorAll('[data-perm-table] tr').length}};""")
            assert state['enabled'], state
            assert state['cards'] == 4 and state['table'] == 4, state
            assert all(d.js('return !!document.getElementById(arguments[0]);', ref) for ref in state['label'].split()), state
            r = rows()
            assert r['Points fixes'] == '4' and r['Applications effectuées'] == '0', r
            return {'cards': 4}
        self.case('perm-static', static)

        def keyboard():
            self.open(page)
            d.js(f"document.querySelector('{fig} [data-perm-image=b]').focus();")
            d.key('\ue015'); time.sleep(0.1)  # Arrow down: seconde image = 3
            assert d.js(f"return document.querySelector('{fig} [data-perm-image=b]').value;") == '3'
            d.js(f"document.querySelector('{fig} [data-action=swap]').focus();")
            d.key('\ue007'); time.sleep(0.1)  # Enter: échange les images 1 et 3
            r = rows()
            assert r['Images de σ'] == '1 ↦ 1 ; 2 ↦ 3 ; 3 ↦ 2 ; 4 ↦ 4', r
            assert r['Décomposition en cycles'] == '(2 3)', r
            assert status().startswith('Images 1 et 3 échangées'), status()
            return {'swapByKeyboard': True}
        self.case('perm-keyboard', keyboard)

        def buttons():
            self.open(page)
            back = f"document.querySelector('{fig} [data-action=back]')"
            assert d.js('return ' + back + ".getAttribute('aria-disabled');") == 'true'
            for _ in range(2):
                action('apply')
            r = rows()
            assert r['Applications effectuées'] == '2' and r['Positions courantes'].startswith('carte 1 en position 2 ;'), r
            action('apply')
            assert status().startswith('Permutation appliquée aux positions courantes. Après 3 applications, toutes les cartes sont revenues à leur position initiale.'), status()
            d.js(back + ".focus();"); d.key('\ue007'); time.sleep(0.1)
            assert rows()['Applications effectuées'] == '0'
            assert d.js('return ' + back + ".getAttribute('aria-disabled');") == 'true'
            assert d.js(f"return document.activeElement === {back};"), 'Le focus doit rester sur le bouton indisponible'
            choose('b', '1')
            swap = f"document.querySelector('{fig} [data-action=swap]')"
            assert d.js('return ' + swap + ".getAttribute('aria-disabled');") == 'true'
            choose('b', '2')
            d.js(f"const n=document.querySelector('{fig} [data-perm-n]');n.value='6';n.dispatchEvent(new Event('change'));")
            r = rows()
            assert r['Décomposition en cycles'].startswith('e ') and r['Points fixes'] == '1, 2, 3, 4, 5, 6', r
            assert d.js(f"return document.querySelectorAll('{fig} [data-perm-table] tr').length;") == 6
            return {'identity': True, 'bound': 6}
        self.case('perm-buttons', buttons)

    # ---------- Action figure (lesson « Actions de groupes, orbites & stabilisateurs ») ----------
    def action(self):
        d = self.d
        page = '/cours/actions-orbites-stabilisateurs/'   # à confirmer d'après le slug du catalogue
        fig = '#figure-action'
        status = lambda: d.js(f"return document.querySelector('{fig} [data-act-status]').textContent;")
        rows = lambda: d.js(f"return Object.fromEntries([...document.querySelectorAll('{fig} [data-act-rows] > div')].map(r=>[r.children[0].textContent,r.children[1].textContent]));")
        pick = lambda kind, value: d.js(f"document.querySelector('{fig} [data-act-{kind}][value=\"{value}\"]').click();")

        def static():
            html = (self.root / page.strip('/') / 'index.html').read_text(encoding='utf-8')
            assert 'e envoie A sur A. Orbite de A : {A, B, C, D}. Stabilisateur de A : {e}.' in html
            self.open(page)
            state = d.js(f"""const f=document.querySelector('{fig}');return {{
              enabled:[...f.querySelectorAll('input,button')].every(e=>!e.disabled),
              label:f.querySelector('svg').getAttribute('aria-labelledby'),
              hidden:[...f.querySelectorAll('[data-act-transform-label][hidden]')].length,
              images:f.querySelectorAll('[data-act-table] tr').length,
              groups:f.querySelectorAll('[data-act-groups] tr').length}};""")
            assert state['enabled'] and state['images'] == 4 and state['groups'] == 4 and state['hidden'] == 4, state
            assert all(d.js('return !!document.getElementById(arguments[0]);', ref) for ref in state['label'].split()), state
            return state
        self.case('action-static', static)

        def keyboard():
            self.open(page)
            # Flèche droite dans le groupe de sommets : A -> B.
            d.js(f"document.querySelector('{fig} [data-act-vertex][value=\"0\"]').focus();")
            d.key('\ue014'); time.sleep(0.1)
            assert status() == 'e envoie B sur B. Orbite de B : {A, B, C, D}. Stabilisateur de B : {e}.', status()
            d.js(f"document.querySelector('{fig} [data-act-transform][value=\"e\"]').focus();")
            d.key('\ue014'); time.sleep(0.1)  # e -> r
            assert status().startswith('r envoie B sur C.'), status()
            return {'arrowKeys': True}
        self.case('action-keyboard', keyboard)

        def buttons():
            self.open(page)
            pick('group', 'symmetries'); pick('transform', 'r2s')
            assert status() == 'r²s envoie A sur C. Orbite de A : {A, B, C, D}. Stabilisateur de A : {e, s}.', status()
            assert d.js(f"return document.querySelectorAll('{fig} [data-act-table] tr').length;") == 8
            assert d.js(f"return [...document.querySelectorAll('{fig} [data-act-groups] tr')][2].textContent;") == 'C{r², r²s}'
            # Retour aux rotations : r²s n'en fait pas partie, retour à e.
            pick('group', 'rotations')
            assert status().startswith('e envoie A sur A.') and d.js(f"return document.querySelectorAll('{fig} [data-act-table] tr').length;") == 4
            pick('vertex', '2'); pick('transform', 'r')
            assert rows()['Image'] == 'r(C) = D', rows()
            reset = f"document.querySelector('{fig} [data-act-reset]')"
            d.js(reset + '.focus();')
            d.key('\ue007'); time.sleep(0.1)
            assert status() == 'e envoie A sur A. Orbite de A : {A, B, C, D}. Stabilisateur de A : {e}.', status()
            assert d.js('return ' + reset + ".getAttribute('aria-disabled');") == 'true'
            assert d.js(f"return document.activeElement === {reset};"), 'Le focus doit rester sur le bouton indisponible'
            return {'reset': True}
        self.case('action-buttons', buttons)

    # ---------- Lagrange figures (lesson « Lagrange & conjugaison ») ----------
    def lagrange(self):
        d = self.d
        page = '/cours/lagrange-conjugaison/'
        cls, conj = '#figure-lagrange-classes', '#figure-lagrange-conjugaison'
        status = lambda fig: d.js(f"return document.querySelector('{fig} [data-lagr-status]').textContent;")
        rows = lambda fig: d.js(f"return Object.fromEntries([...document.querySelectorAll('{fig} [data-lagr-rows] > div')].map(r=>[r.children[0].textContent,r.children[1].textContent]));")
        choose = lambda fig, name, value: d.js(f"const f=document.querySelector('{fig} [data-lagr-param={name}]');f.value='{value}';f.dispatchEvent(new Event('change'));")

        def static():
            html = (self.root / page.strip('/') / 'index.html').read_text(encoding='utf-8')
            for expected in ('aH = {r, r³} : 2 éléments, ne contient pas e.', 'L’axe vertical devient l’axe horizontal.'):
                assert expected in html, f'Texte initial absent du HTML compilé : {expected}'
            self.open(page)
            state = d.js(f"""const q=s=>document.querySelector(s);return {{
              enabled:[...document.querySelectorAll('{cls} select,{conj} select')].every(e=>!e.disabled),
              nodes:q('{cls} svg').querySelectorAll('.lagr-node').length,
              classes:q('{cls}').querySelectorAll('[data-lagr-table] tr').length,
              conjRows:q('{conj}').querySelectorAll('[data-lagr-table] tr').length,
              labels:[q('{cls} svg').getAttribute('aria-labelledby'),q('{conj} svg').getAttribute('aria-labelledby')].join(' ')}};""")
            assert state['enabled'] and state['nodes'] == 8 and state['classes'] == 4 and state['conjRows'] == 8, state
            assert all(d.js('return !!document.getElementById(arguments[0]);', ref) for ref in state['labels'].split()), state
            return state
        self.case('lagrange-static', static)

        def keyboard():
            self.open(page)
            d.js(f"document.querySelector('{cls} [data-lagr-param=sub]').focus();")
            d.key('\ue015'); time.sleep(0.1)  # Arrow down: next subgroup {e, r, r², r³}
            r = rows(cls)
            assert r['Sous-groupe H'].startswith('{e, r, r², r³}, 4 éléments'), r
            assert r['Indice [D₄ : H]'].startswith('2,'), r
            d.js(f"document.querySelector('{conj} [data-lagr-param=g]').focus();")
            d.key('\ue015'); time.sleep(0.1)  # Arrow down: g = r²
            r = rows(conj)
            assert r['Conjugué g x g⁻¹'] == 'r² s r² = s', r
            assert r['Axe obtenu'] == 'l’axe vertical', r
            return {'arrowKeys': True}
        self.case('lagrange-keyboard', keyboard)

        def buttons():
            self.open(page)
            choose(cls, 'sub', '0'); choose(cls, 'rep', '5')
            r = rows(cls)
            assert r['Classe aH'].startswith('{rs} (rs·e = rs)') and r['Classes à gauche distinctes'].startswith('8 :'), r
            choose(conj, 'x', '1'); choose(conj, 'g', '4')
            st = status(conj)
            assert st.startswith('g x g⁻¹ = s r s = r³.') and 'x = r est une rotation, sans axe' in st, st
            reset = f"document.querySelector('{conj} [data-lagr-action=reset]')"
            assert d.js('return ' + reset + ".getAttribute('aria-disabled');") == 'false'
            d.js(reset + ".focus();"); d.key('\ue007'); time.sleep(0.1)
            assert d.js('return ' + reset + ".getAttribute('aria-disabled');") == 'true'
            assert d.js(f"return document.activeElement === {reset};"), 'Le focus doit rester sur le bouton indisponible'
            assert rows(conj)['Conjugué g x g⁻¹'] == 'r s r³ = r²s', rows(conj)
            return {'reset': True}
        self.case('lagrange-buttons', buttons)

    # ---------- Ring figure (lesson « Anneaux & corps ») ----------
    def ring(self):
        d = self.d
        page = '/cours/anneaux-corps/'
        fig = '#figure-anneau'
        rows = lambda: d.js(f"return Object.fromEntries([...document.querySelectorAll('{fig} [data-ring-rows] > div')].map(r=>[r.children[0].textContent,r.children[1].textContent]));")
        set_field = lambda name, value: d.js(f"const f=document.querySelector('{fig} [data-ring-param={name}]');f.value='{value}';f.dispatchEvent(new Event('input'));")
        action = lambda name: d.js(f"document.querySelector('{fig} [data-ring-action={name}]').click();")

        def static():
            html = (self.root / page.strip('/') / 'index.html').read_text(encoding='utf-8')
            for expected in ('Cas courant dans ℤ/6ℤ : [2] × [3] = [0]', 'ne démontre aucun critère général'):
                assert expected in html, f'Texte initial absent du HTML compilé : {expected}'
            self.open(page)
            state = d.js(f"""const f=document.querySelector('{fig}');return {{
              enabled:[...f.querySelectorAll('input,button')].every(e=>!e.disabled),
              label:f.querySelector('svg').getAttribute('aria-labelledby'),
              cells:f.querySelectorAll('svg .ring-cell').length,
              rowHeads:f.querySelectorAll('[data-ring-table] th[scope=row]').length,
              colHeads:f.querySelectorAll('[data-ring-head] th[scope=col]').length,
              current:f.querySelector('[data-ring-table] td[aria-current=true]').textContent}};""")
            assert state['enabled'], state
            assert state['cells'] == 36 and state['rowHeads'] == 6 and state['colHeads'] == 7, state
            assert state['current'] == '[0]', state
            assert all(d.js('return !!document.getElementById(arguments[0]);', ref) for ref in state['label'].split()), state
            return {'cells': state['cells']}
        self.case('ring-static', static)

        def keyboard():
            self.open(page)
            d.js(f"document.querySelector('{fig} [data-ring-param=a]').focus();")
            d.key('\ue013'); time.sleep(0.1)  # Arrow up: a = 3
            r = rows()
            assert r['Produit des classes'] == '[3] × [3] = [3]', r
            d.js(f"document.querySelector('{fig} [data-ring-param=n]').focus();")
            for _ in range(3):
                d.key('\ue015'); time.sleep(0.1)  # Arrow down: n = 5, 4, 3
            r = rows()
            assert r['Modulo n'].startswith('n = 3 : 3 classes'), r
            assert r['Restes choisis'] == 'a = 0 ; b = 0', r  # 3 mod 3 = 0
            # Out-of-range values are clamped when the field is left.
            d.js(f"const f=document.querySelector('{fig} [data-ring-param=a]');f.focus();f.select();")
            for ch in '99':
                d.key(ch)
            d.key('\ue004'); time.sleep(0.1)
            a = d.js(f"return document.querySelector('{fig} [data-ring-param=a]').value;")
            assert a == '2' and rows()['Restes choisis'] == 'a = 2 ; b = 0', (a, rows())
            return {'arrowKeys': True, 'clamped': a}
        self.case('ring-keyboard', keyboard)

        def buttons():
            self.open(page)
            up = f"document.querySelector('{fig} [data-ring-action=n-up]')"
            d.js(up + ".focus();")
            for _ in range(7):
                d.key('\ue007')  # Enter: n = 7 … 12, stops at 12
            time.sleep(0.1)
            assert rows()['Modulo n'].startswith('n = 12 : 12 classes'), rows()
            assert d.js('return ' + up + ".getAttribute('aria-disabled');") == 'true'
            assert d.js(f"return document.activeElement === {up};"), 'Le focus doit rester sur le bouton indisponible'
            set_field('a', '11'); set_field('b', '8')
            assert rows()['Produit des classes'] == '[11] × [8] = [4]', rows()
            action('n-down')
            assert rows()['Restes choisis'] == 'a = 0 ; b = 8', rows()  # 11 mod 11 = 0
            action('reset')
            assert rows()['Restes choisis'] == 'a = 2 ; b = 3', rows()
            assert rows()['Modulo n'].startswith('n = 6 : 6 classes'), rows()
            set_field('n', '5')
            assert rows()['Produits nuls de facteurs non nuls'] == 'aucun couple de restes non nuls de produit nul modulo 5', rows()
            assert rows()['Inverse de a'].startswith('[2] a pour inverse [3]'), rows()
            return {'bound': True, 'reset': True}
        self.case('ring-buttons', buttons)

    # ---------- Ideal figure (lesson « Idéaux & multiples ») ----------
    def ideal(self):
        d = self.d
        page = '/cours/ideaux-multiples/'
        fig = '#figure-ideal'
        status = lambda: d.js(f"return document.querySelector('{fig} [data-ideal-status]').textContent;")
        rows = lambda: d.js(f"return Object.fromEntries([...document.querySelectorAll('{fig} [data-ideal-rows] > div')].map(r=>[r.children[0].textContent,r.children[1].textContent]));")
        set_field = lambda name, value: d.js(f"const f=document.querySelector('{fig} [data-ideal-param={name}]');f.value='{value}';f.dispatchEvent(new Event('input'));")

        def static():
            html = (self.root / page.strip('/') / 'index.html').read_text(encoding='utf-8')
            for expected in ('Calcul sélectionné : 1 × 6 + (−1) × 4 = 2.', 'combinaisons calculées seulement pour u et v entre −5 et 5'):
                assert expected in html, f'Texte initial absent du HTML compilé : {expected}'
            self.open(page)
            state = d.js(f"""const f=document.querySelector('{fig}');return {{
              enabled:[...f.querySelectorAll('input,button')].every(e=>!e.disabled),
              label:f.querySelector('svg').getAttribute('aria-labelledby'),
              multiplesA:f.querySelectorAll('svg .ideal-mark-a').length,
              table:f.querySelectorAll('[data-ideal-table] tr').length}};""")
            assert state['enabled'], state
            assert state['table'] == 49 and state['multiplesA'] == 9, state
            assert all(d.js('return !!document.getElementById(arguments[0]);', ref) for ref in state['label'].split()), state
            return {'integers': state['table']}
        self.case('ideal-static', static)

        def keyboard():
            self.open(page)
            d.js(f"document.querySelector('{fig} [data-ideal-param=u]').focus();")
            d.key('\ue013'); time.sleep(0.1)  # Arrow up: u = 2
            d.js(f"document.querySelector('{fig} [data-ideal-param=v]').focus();")
            d.key('\ue015'); time.sleep(0.1)  # Arrow down: v = −2
            r = rows()
            assert r['Calcul sélectionné u a + v b'] == '2 × 6 + (−2) × 4 = 4', r
            assert r['Multiple de a'] == 'non' and r['Multiple de b'] == 'oui', r
            # Out-of-range values are clamped when the field is left.
            d.js(f"const f=document.querySelector('{fig} [data-ideal-param=a]');f.focus();f.select();")
            for ch in '99':
                d.key(ch)
            d.key('\ue004'); time.sleep(0.1)
            a = d.js(f"return document.querySelector('{fig} [data-ideal-param=a]').value;")
            assert a == '12' and rows()['Générateurs et coefficients'].startswith('a = 12 ;'), (a, rows())
            return {'arrowKeys': True, 'clamped': a}
        self.case('ideal-keyboard', keyboard)

        def buttons():
            self.open(page)
            set_field('a', '0')
            st = status()
            assert 'a = 0 : les multiples de 0 se réduisent à 0.' in st, st
            assert rows()['Multiples de a affichés'] == '1 (seulement 0)', rows()
            set_field('b', '0')
            assert 'a = b = 0 : les multiples de 0 se réduisent à 0 et toute combinaison' in status(), status()
            assert rows()['Plus petit entier strictement positif affiché comme combinaison'] == 'aucun', rows()
            reset = f"document.querySelector('{fig} [data-ideal-action=reset]')"
            assert d.js('return ' + reset + ".getAttribute('aria-disabled');") == 'false'
            d.js(reset + ".focus();"); d.key('\ue007'); time.sleep(0.1)
            assert d.js('return ' + reset + ".getAttribute('aria-disabled');") == 'true'
            assert d.js(f"return document.activeElement === {reset};"), 'Le focus doit rester sur le bouton indisponible'
            assert rows()['Calcul sélectionné u a + v b'] == '1 × 6 + (−1) × 4 = 2', rows()
            return {'reset': True}
        self.case('ideal-buttons', buttons)

    def rquot(self):
        d = self.d
        page = '/cours/anneaux-quotients-morphismes/'
        fig = '#figure-anneau-quotient'
        rows = lambda: d.js(f"return Object.fromEntries([...document.querySelectorAll('{fig} [data-rquot-rows] > div')].map(r=>[r.children[0].textContent,r.children[1].textContent]));")
        set_field = lambda name, value: d.js(f"const f=document.querySelector('{fig} [data-rquot-param={name}]');f.value='{value}';f.dispatchEvent(new Event('input'));")
        action = lambda name: d.js(f"document.querySelector('{fig} [data-rquot-action={name}]').click();")

        def static():
            html = (self.root / page.strip('/') / 'index.html').read_text(encoding='utf-8')
            for expected in ('Cas courant dans ℤ/4ℤ : [1] + [2] = [3] et [1] × [2] = [2]', 'elle ne démontre rien'):
                assert expected in html, f'Texte initial absent du HTML compilé : {expected}'
            self.open(page)
            state = d.js(f"""const f=document.querySelector('{fig}');return {{
              enabled:[...f.querySelectorAll('input,button')].every(e=>!e.disabled),
              label:f.querySelector('svg').getAttribute('aria-labelledby'),
              classes:f.querySelectorAll('svg .rquot-class').length,
              addRows:f.querySelectorAll('[data-rquot-table=add] th[scope=row]').length,
              mulRows:f.querySelectorAll('[data-rquot-table=mul] th[scope=row]').length,
              addCurrent:f.querySelector('[data-rquot-table=add] td[aria-current=true]').textContent,
              mulCurrent:f.querySelector('[data-rquot-table=mul] td[aria-current=true]').textContent}};""")
            assert state['enabled'], state
            assert state['classes'] == 4 and state['addRows'] == 4 and state['mulRows'] == 4, state
            assert state['addCurrent'] == '[3]' and state['mulCurrent'] == '[2]', state
            assert all(d.js('return !!document.getElementById(arguments[0]);', ref) for ref in state['label'].split()), state
            return {'classes': state['classes']}
        self.case('rquot-static', static)

        def keyboard():
            self.open(page)
            d.js(f"document.querySelector('{fig} [data-rquot-param=n]').focus();")
            d.key('\ue013'); time.sleep(0.1)  # Arrow up: n = 5
            r = rows()
            assert r['Modulo n'].startswith('n = 5 : 5 classes'), r
            assert r['Produit des classes'].startswith('[1] × [2] = [2]'), r
            assert r['Produits nuls'].startswith('aucun produit'), r
            # Out-of-range values are clamped when the field is left.
            d.js(f"const f=document.querySelector('{fig} [data-rquot-param=a]');f.focus();f.select();")
            for ch in '99':
                d.key(ch)
            d.key('\ue004'); time.sleep(0.1)
            a = d.js(f"return document.querySelector('{fig} [data-rquot-param=a]').value;")
            assert a == '20' and rows()['Représentants'] == 'a = 20 ; b = 2', (a, rows())
            return {'arrowKeys': True, 'clamped': a}
        self.case('rquot-keyboard', keyboard)

        def buttons():
            self.open(page)
            up = f"document.querySelector('{fig} [data-rquot-action=a-up]')"
            d.js(up + ".focus();")
            for _ in range(7):
                d.key('\ue007')  # Enter: 1 + 4k, stops at 17 (21 is out of bounds)
            time.sleep(0.1)
            assert rows()['Représentants'] == 'a = 17 ; b = 2', rows()
            assert d.js('return ' + up + ".getAttribute('aria-disabled');") == 'true'
            assert d.js(f"return document.activeElement === {up};"), 'Le focus doit rester sur le bouton indisponible'
            action('b-down'); action('b-down'); action('b-down')
            assert rows()['Représentants'] == 'a = 17 ; b = −10', rows()
            assert rows()['Produit avant réduction'] == 'a × b = 17 × (−10) = −170', rows()
            assert rows()['Reste de ab'] == '−170 = (−43) × 4 + 2', rows()
            assert rows()['Produit des classes'].startswith('[1] × [2] = [2]'), rows()
            assert rows()['Produits nuls'].startswith('[2] × [2] = [0]'), rows()
            action('reset')
            assert rows()['Représentants'] == 'a = 1 ; b = 2', rows()
            set_field('n', '8'); set_field('a', '-20'); set_field('b', '-20')
            assert rows()['Reste de ab'] == '400 = 50 × 8 + 0', rows()
            assert d.js(f"return document.querySelector('{fig} [data-rquot-action=a-down]').getAttribute('aria-disabled');") == 'true'
            return {'bound': True, 'reset': True}
        self.case('rquot-buttons', buttons)

    # ---------- Polynomial figure (lesson « Polynômes, division & racines ») ----------
    def poly(self):
        d = self.d
        page = '/cours/polynomes-division-racines/'
        fig = '#figure-polynome'
        status = lambda: d.js(f"return document.querySelector('{fig} [data-poly-status]').textContent;")
        rows = lambda: d.js(f"return Object.fromEntries([...document.querySelectorAll('{fig} [data-poly-rows] > div')].map(r=>[r.children[0].textContent,r.children[1].textContent]));")
        set_field = lambda name, value: d.js(f"const f=document.querySelector('{fig} [data-poly-param={name}]');f.value='{value}';f.dispatchEvent(new Event('input'));")
        action = lambda name: d.js(f"document.querySelector('{fig} [data-poly-action={name}]').click();")

        def static():
            html = (self.root / page.strip('/') / 'index.html').read_text(encoding='utf-8')
            for expected in ('X³ − 1 = (X − 1) × (X² + X + 1) + 0', 'ces essais ne démontrent rien'):
                assert expected in html, f'Texte initial absent du HTML compilé : {expected}'
            self.open(page)
            state = d.js(f"""const f=document.querySelector('{fig}');return {{
              enabled:[...f.querySelectorAll('input,button')].every(e=>!e.disabled),
              label:f.querySelector('svg').getAttribute('aria-labelledby'),
              dots:f.querySelectorAll('svg .fig-dot').length,
              table:f.querySelectorAll('[data-poly-table] tr').length}};""")
            assert state['enabled'], state
            assert state['dots'] == 9 and state['table'] == 9, state
            assert all(d.js('return !!document.getElementById(arguments[0]);', ref) for ref in state['label'].split()), state
            return {'dots': state['dots']}
        self.case('poly-static', static)

        def keyboard():
            self.open(page)
            d.js(f"document.querySelector('{fig} [data-poly-param=c2]').focus();")
            d.key('\ue013'); time.sleep(0.1)  # Arrow up: c2 = 1, P = X³ + X² − 1
            r = rows()
            assert r['Reste R'] == '1' and r['Valeur P(1)'] == '1', r
            d.js(f"document.querySelector('{fig} [data-poly-param=a]').focus();")
            d.key('\ue015'); time.sleep(0.1)  # Arrow down: a = 0
            r = rows()
            assert r['Quotient Q'] == 'X² + X' and r['Reste R'] == '−1' and r['Valeur P(0)'] == '−1', r
            # Out-of-range values are clamped when the field is left.
            d.js(f"const f=document.querySelector('{fig} [data-poly-param=a]');f.focus();f.select();")
            for ch in '99':
                d.key(ch)
            d.key('\ue004'); time.sleep(0.1)
            a = d.js(f"return document.querySelector('{fig} [data-poly-param=a]').value;")
            assert a == '3' and rows()['Paramètres'].endswith('a = 3'), (a, rows())
            return {'arrowKeys': True, 'clamped': a}
        self.case('poly-keyboard', keyboard)

        def buttons():
            self.open(page)
            up = f"document.querySelector('{fig} [data-poly-action=c0-up]')"
            d.js(up + ".focus();")
            for _ in range(7):
                d.key('\ue007')  # Enter: stops at the bound c0 = 3
            time.sleep(0.1)
            assert rows()['Polynôme P'] == 'X³ + 3', rows()
            assert d.js('return ' + up + ".getAttribute('aria-disabled');") == 'true'
            assert d.js(f"return document.activeElement === {up};"), 'Le focus doit rester sur le bouton indisponible'
            action('a-down'); action('a-down')  # a = −1: P(−1) = 2
            assert rows()['Reste R'] == '2', rows()
            action('reset')
            assert rows()['Reste R'] == '0' and rows()['Polynôme P'] == 'X³ − 1', rows()
            set_field('c0', '2'); set_field('a', '-1')
            assert 'ne démontrent rien' in status(), status()
            return {'reset': True}
        self.case('poly-buttons', buttons)

    # ---------- Irreducible figure (lesson « Polynômes irréductibles & racines ») ----------
    def irred(self):
        d = self.d
        page = '/cours/irreductibilite-polynomes/'
        fig = '#figure-irreductible'
        status = lambda: d.js(f"return document.querySelector('{fig} [data-irred-status]').textContent;")
        rows = lambda: d.js(f"return Object.fromEntries([...document.querySelectorAll('{fig} [data-irred-rows] > div')].map(r=>[r.children[0].textContent,r.children[1].textContent]));")
        pick = lambda name, value: d.js(f"document.querySelector('{fig} [data-irred-choice={name}][value=\"{value}\"]').click();")

        def static():
            html = (self.root / page.strip('/') / 'index.html').read_text(encoding='utf-8')
            for expected in ('X² + X + 1 sur ℤ/2ℤ : P(0) = 1, P(1) = 1', 'ne démontre rien'):
                assert expected in html, f'Texte initial absent du HTML compilé : {expected}'
            self.open(page)
            state = d.js(f"""const f=document.querySelector('{fig}');return {{
              enabled:[...f.querySelectorAll('input,button')].every(e=>!e.disabled),
              label:f.querySelector('svg').getAttribute('aria-labelledby'),
              radios:f.querySelectorAll('input[type=radio]').length,
              rowHeads:f.querySelectorAll('[data-irred-table] th[scope=row]').length,
              current:f.querySelector('[data-irred-table] tr[aria-current=true]').getAttribute('data-irred-row')}};""")
            assert state['enabled'], state
            assert state['radios'] == 6 and state['rowHeads'] == 8, state
            assert state['current'] == '2-1-1', state
            assert all(d.js('return !!document.getElementById(arguments[0]);', ref) for ref in state['label'].split()), state
            return {'radios': state['radios']}
        self.case('irred-static', static)

        def keyboard():
            self.open(page)
            d.js(f"document.querySelector('{fig} [data-irred-choice=degree][value=\"2\"]').focus();")
            d.key('\ue014'); time.sleep(0.1)  # Arrow right: degree 3
            r = rows()
            assert r['Degré'] == '3', r
            assert 'X³ + X + 1' in r['Polynôme'], r
            d.js(f"document.querySelector('{fig} [data-irred-choice=c][value=\"1\"]').focus();")
            d.key('\ue012'); time.sleep(0.1)  # Arrow left: c = 0
            r = rows()
            # X³ + X sur ℤ/2ℤ : P(0) = 0 et P(1) = 1 + 1 = 0 (les deux éléments sont racines).
            assert r['Racines dans ℤ/2ℤ'] == '0 et 1', r
            assert 'réductible' in status(), status()
            return {'arrowKeys': True}
        self.case('irred-keyboard', keyboard)

        def buttons():
            self.open(page)
            reset = f"document.querySelector('{fig} [data-irred-reset]')"
            assert d.js('return ' + reset + ".getAttribute('aria-disabled');") == 'true'
            pick('b', 0)
            assert rows()['Évaluation en 1'].endswith('= 2, soit 0 modulo 2'), rows()
            assert rows()['Racines dans ℤ/2ℤ'] == '1', rows()
            assert d.js('return ' + reset + ".getAttribute('aria-disabled');") == 'false'
            pick('c', 0)
            # X² sur ℤ/2ℤ : P(0) = 0 et P(1) = 1 (0 seul est racine).
            assert rows()['Racines dans ℤ/2ℤ'] == '0', rows()
            d.js(reset + '.click();')
            assert 'est irréductible' in status(), status()
            assert d.js('return ' + reset + ".getAttribute('aria-disabled');") == 'true'
            return {'reset': True}
        self.case('irred-buttons', buttons)

    # ---------- Field figure (lesson « Corps finis & polynômes irréductibles ») ----------
    def field(self):
        d = self.d
        page = '/cours/corps-finis/'
        fig = '#figure-corps-fini'
        status = lambda: d.js(f"return document.querySelector('{fig} [data-field-status]').textContent;")
        rows = lambda: d.js(f"return Object.fromEntries([...document.querySelectorAll('{fig} [data-field-rows] > div')].map(r=>[r.children[0].textContent,r.children[1].textContent]));")
        choose = lambda name, value: d.js(f"const s=document.querySelector('{fig} [data-field-select={name}]');s.value='{value}';s.dispatchEvent(new Event('change'));")

        def static():
            html = (self.root / page.strip('/') / 'index.html').read_text(encoding='utf-8')
            for expected in ('α × (α + 1) = 1', 'elle ne démontre rien'):
                assert expected in html, f'Texte initial absent du HTML compilé : {expected}'
            self.open(page)
            state = d.js(f"""const f=document.querySelector('{fig}');return {{
              enabled:[...f.querySelectorAll('select,button')].every(e=>!e.disabled),
              label:f.querySelector('svg').getAttribute('aria-labelledby'),
              boxes:f.querySelectorAll('svg .fig-class').length,
              tables:f.querySelectorAll('[data-field-table]').length,
              rowHeads:f.querySelectorAll('[data-field-table] th[scope=row]').length,
              current:[...f.querySelectorAll('td[aria-current=true]')].map(c=>c.textContent)}};""")
            assert state['enabled'], state
            assert state['boxes'] == 4 and state['tables'] == 2 and state['rowHeads'] == 8, state
            assert state['current'] == ['1', '1'], state
            assert all(d.js('return !!document.getElementById(arguments[0]);', ref) for ref in state['label'].split()), state
            return {'boxes': state['boxes']}
        self.case('field-static', static)

        def keyboard():
            self.open(page)
            d.js(f"document.querySelector('{fig} [data-field-select=op]').focus();")
            d.key('\ue015'); time.sleep(0.1)  # Arrow down: multiplication -> addition
            r = rows()
            assert r['Résultat'] == 'α + (α + 1) = 1', r
            d.js(f"document.querySelector('{fig} [data-field-select=x]').focus();")
            d.key('\ue013'); time.sleep(0.1)  # Arrow up: x = α -> 1
            assert rows()['Opérandes'] == 'x = 1 ; y = α + 1', rows()
            return {'arrowKeys': True}
        self.case('field-keyboard', keyboard)

        def buttons():
            self.open(page)
            reset = f"document.querySelector('{fig} [data-field-reset]')"
            assert d.js('return ' + reset + ".getAttribute('aria-disabled');") == 'true'
            choose('op', 'mul'); choose('x', '11'); choose('y', '11')
            r = rows()
            assert r['Résultat'] == '(α + 1) × (α + 1) = α', r
            assert r['Réduction par α² = α + 1'] == 'α² est remplacé par α + 1 : α² + 2α + 1 = 3α + 2', r
            assert d.js('return ' + reset + ".getAttribute('aria-disabled');") == 'false'
            d.js(reset + ".focus();"); d.key('\ue007'); time.sleep(0.1)  # Enter
            assert rows()['Opérandes'] == 'x = α ; y = α + 1', rows()
            assert d.js('return ' + reset + ".getAttribute('aria-disabled');") == 'true'
            assert d.js(f"return document.activeElement === {reset};"), 'Le focus doit rester sur le bouton'
            return {'reset': True}
        self.case('field-buttons', buttons)

    def reduced(self):
        d = self.d
        self.open('/atlas/')

        def check():
            assert d.js("return matchMedia('(prefers-reduced-motion: reduce)').matches;"), 'Préférence Firefox non appliquée'
            wait_for(lambda: self.atlas_state()['threeAvailable'], 'La vue 3D ne devient pas disponible')
            time.sleep(0.3)
            state = self.atlas_state()
            assert state['mode'] == '2d', f'Mouvement réduit : la vue 3D ne doit pas s’ouvrir seule : {state}'
            d.js("document.querySelector('[data-mode=\"3d\"]').click();")
            self.wait_3d()
            return {'startsIn2d': True, 'threeOnRequest': True}
        self.case('atlas-reduced-motion', check)

        def square_reduced():
            self.open('/cours/groupes-rotations/')
            duration = d.js("return getComputedStyle(document.querySelector('[data-rotating-square]')).transitionDuration;")
            d.js("document.querySelector('[data-rotation=\"90\"]').click();")
            immediate = d.js(VERTEX_A)
            assert immediate == [-80, 80], f'Mouvement réduit : la rotation devrait être immédiate : {immediate} ({duration})'
            return {'transitionDuration': duration, 'immediate': True}
        self.case('square-reduced-motion', square_reduced)


def assert_no_errors(errors):
    assert not errors, errors
    return {'unhandledPageErrors': 0}


def main():
    global PAGES
    output = ROOT / 'test-results' / ('browser-site-drafts' if DRAFTS else 'browser-site')
    served = DRAFTS_DIST if DRAFTS else ROOT / 'dist'
    plan = DRAFT_PLAN if DRAFTS else PLAN
    if DRAFTS and (served / 'cours').exists():
        PAGES = sorted(f'/cours/{entry.name}/' for entry in (served / 'cours').iterdir() if (entry / 'index.html').exists())
    output.mkdir(parents=True, exist_ok=True)
    (output / 'profiles').mkdir(exist_ok=True)
    report = {'startedUTC': datetime.now(timezone.utc).isoformat(), 'status': 'blocked',
              'engine': 'Firefox réel via WebDriver W3C', 'results': [], 'notRun': plan.copy(),
              'limitations': ['WebGL logiciel de Firefox headless : pas de validation GPU matérielle',
                              'Zoom texte simulé par la taille de police racine',
                              'Contraste calculé sur les couleurs CSS ; fonds en image ou dégradé non évalués',
                              'Ne remplace ni un lecteur d’écran ni un téléphone réel']}
    server = driver_process = driver = driver_log = None
    exit_code = 2
    try:
        if not __debug__:
            raise EnvironmentBlocked('Assertions désactivées : ne pas lancer Python avec -O')
        if not (served / 'atlas/index.html').exists():
            raise EnvironmentBlocked('Compilation absente : exécuter ' + ('npm run build:drafts' if DRAFTS else 'npm run build'))
        try:
            server = ThreadingHTTPServer(('127.0.0.1', 0), partial(QuietHandler, directory=str(served)))
        except OSError as error:
            raise EnvironmentBlocked('Serveur local refusé : ' + str(error)) from error
        threading.Thread(target=server.serve_forever, daemon=True).start()
        base = f'http://127.0.0.1:{server.server_port}'
        executable = shutil.which('geckodriver')
        if not executable:
            raise EnvironmentBlocked('geckodriver introuvable')
        port = free_port()
        driver_log = (output / 'geckodriver.log').open('w')
        driver_process = subprocess.Popen([executable, '--host', '127.0.0.1', '--port', str(port), '--profile-root', str(output / 'profiles')],
                                          stdout=driver_log, stderr=subprocess.STDOUT, start_new_session=True)
        driver = Driver(f'http://127.0.0.1:{port}')

        def available():
            if driver_process.poll() is not None:
                raise EnvironmentBlocked('geckodriver arrêté ; consulter geckodriver.log')
            try:
                return driver.request('GET', '/status')
            except (OSError, WebDriverError, urllib.error.URLError):
                return False
        try:
            wait_for(available, 'WebDriver ne répond pas', 10)
            report['browser'] = driver.start(False)
        except (OSError, AssertionError, WebDriverError) as error:
            raise EnvironmentBlocked('Session Firefox impossible : ' + str(error)) from error
        checks = SiteChecks(driver, base, output, report['results'])
        checks.root = served
        if DRAFTS:
            checks.site()
            checks.figures()
            checks.series()
            checks.steps()
            checks.cycle()
            checks.morphism()
            checks.quotient()
            checks.perm()
            checks.action()
            checks.lagrange()
            checks.ring()
            checks.ideal()
            checks.rquot()
            checks.poly()
            checks.irred()
            checks.field()
            checks.collect_errors()
        else:
            checks.atlas()
            checks.site()
            checks.interactions()
            checks.figures()
            checks.series()
            checks.steps()
            checks.cycle()
            checks.morphism()
            checks.quotient()
            checks.perm()
            checks.action()
            checks.lagrange()
            checks.ring()
            checks.ideal()
            checks.rquot()
            checks.poly()
            checks.irred()
            checks.field()
            checks.collect_errors()
            driver.close()
            driver.start(True)
            checks.reduced()
            checks.collect_errors()
        checks.case('page-errors', lambda: assert_no_errors(checks.page_errors))
        if checks.failed:
            report['status'], exit_code = 'failed', 1
        else:
            report['status'] = 'passed' if not any(r['status'] == 'skipped' for r in report['results']) else 'partial'
            exit_code = 0 if report['status'] == 'passed' else 2
    except EnvironmentBlocked as error:
        report.update(status='blocked', reason=str(error))
        print('BLOQUÉ : ' + str(error), flush=True)
    except KeyboardInterrupt:
        report.update(status='interrupted', reason='Arrêt demandé')
    except Exception as error:
        report.update(status='failed', reason=str(error) or type(error).__name__)
        exit_code = 1
        print('ÉCHEC : ' + (str(error) or type(error).__name__), flush=True)
    finally:
        if driver:
            try:
                driver.close()
            except Exception:
                pass
        if driver_process and driver_process.poll() is None:
            try:
                os.killpg(driver_process.pid, signal.SIGTERM)
                driver_process.wait(timeout=5)
            except (OSError, subprocess.TimeoutExpired):
                os.killpg(driver_process.pid, signal.SIGKILL)
        if driver_log:
            driver_log.close()
        if server:
            server.shutdown()
            server.server_close()
        executed = {item['name'] for item in report['results']}
        report['notRun'] = [name for name in plan if name not in executed]
        report['finishedUTC'] = datetime.now(timezone.utc).isoformat()
        (output / 'report.json').write_text(json.dumps(report, indent=2, ensure_ascii=False) + '\n')
        print('Rapport : ' + str(output / 'report.json'), flush=True)
    return exit_code


if __name__ == '__main__':
    sys.exit(main())
