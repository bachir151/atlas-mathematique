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

PAGES = ['/', '/atlas/', '/bibliotheque/', '/cours/groupes-rotations/', '/experiences/p5/', '/404.html']
PLAN = [
    'atlas-3d-load', 'atlas-selection-sync', 'atlas-camera', 'atlas-modes-keyboard', 'atlas-context-loss',
    'atlas-cleanup', 'three-not-loaded-elsewhere', 'skip-link', 'keyboard-focus', 'reflow-320',
    'text-zoom-200', 'target-size', 'contrast', 'square-rotation', 'square-reset-history', 'proof-progressive',
    'companion', 'library-filters', 'security-policy', 'atlas-reduced-motion', 'square-reduced-motion', 'page-errors',
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
            for ch in 'geometrie':
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
    output = ROOT / 'test-results' / 'browser-site'
    output.mkdir(parents=True, exist_ok=True)
    (output / 'profiles').mkdir(exist_ok=True)
    report = {'startedUTC': datetime.now(timezone.utc).isoformat(), 'status': 'blocked',
              'engine': 'Firefox réel via WebDriver W3C', 'results': [], 'notRun': PLAN.copy(),
              'limitations': ['WebGL logiciel de Firefox headless : pas de validation GPU matérielle',
                              'Zoom texte simulé par la taille de police racine',
                              'Contraste calculé sur les couleurs CSS ; fonds en image ou dégradé non évalués',
                              'Ne remplace ni un lecteur d’écran ni un téléphone réel']}
    server = driver_process = driver = driver_log = None
    exit_code = 2
    try:
        if not __debug__:
            raise EnvironmentBlocked('Assertions désactivées : ne pas lancer Python avec -O')
        if not (ROOT / 'dist/atlas/index.html').exists():
            raise EnvironmentBlocked('Compilation absente : exécuter npm run build')
        try:
            server = ThreadingHTTPServer(('127.0.0.1', 0), partial(QuietHandler, directory=str(ROOT / 'dist')))
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
        checks.atlas()
        checks.site()
        checks.interactions()
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
        report['notRun'] = [name for name in PLAN if name not in executed]
        report['finishedUTC'] = datetime.now(timezone.utc).isoformat()
        (output / 'report.json').write_text(json.dumps(report, indent=2, ensure_ascii=False) + '\n')
        print('Rapport : ' + str(output / 'report.json'), flush=True)
    return exit_code


if __name__ == '__main__':
    sys.exit(main())
