#!/usr/bin/env python3
"""Real Firefox/WebDriver checks. No Selenium, fake canvas or sandbox bypass.

Exit 0: completed checks pass; 1: observed application failure; 2: environment
blocked the run. A blocked run never counts as successful browser validation.
"""
import argparse
import base64
from datetime import datetime, timezone
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
import os
from pathlib import Path
import shutil
import signal
import socket
import subprocess
import sys
import threading
import time
import urllib.error
import urllib.parse
import urllib.request

ROOT = Path(__file__).resolve().parent.parent
ELEMENT = 'element-6066-11e4-a52e-4f735466cecf'
WIDGET = "document.querySelectorAll('p5-experience')"
# Unavailable controls keep focus: they use aria-disabled rather than the disabled property.
AVAILABLE = "(b=>!!b&&!b.disabled&&b.getAttribute('aria-disabled')!=='true')"
PLAN = [
    'initial-load', 'real-canvas', 'independent-instances', 'manual-pause-step',
    'destroy-restart', 'offscreen-pause', 'hidden-tab', 'keyboard',
    'narrow-layout', 'cancel-loading', 'disconnect-loading', 'network-retry',
    'reduced-motion', 'page-errors',
]


class EnvironmentBlocked(RuntimeError):
    pass


class CheckSkipped(RuntimeError):
    pass


class WebDriverError(RuntimeError):
    pass


def wait_for(predicate, message, seconds=20):
    deadline = time.monotonic() + seconds
    while time.monotonic() < deadline:
        result = predicate()
        if result:
            return result
        time.sleep(0.1)
    raise AssertionError(message)


class Driver:
    def __init__(self, url):
        self.url, self.session = url, None

    def request(self, method, path, data=None):
        raw = None if data is None else json.dumps(data).encode()
        request = urllib.request.Request(self.url + path, data=raw, method=method,
                                         headers={'Content-Type': 'application/json; charset=utf-8'})
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                payload = json.load(response)
        except urllib.error.HTTPError as error:
            detail = error.read().decode(errors='replace')
            raise WebDriverError(detail[:3000]) from error
        value = payload.get('value')
        if isinstance(value, dict) and value.get('error'):
            raise WebDriverError(value.get('message', str(value)))
        return value

    def command(self, method, path, data=None):
        return self.request(method, f'/session/{self.session}' + path, data)

    def start(self, reduced, binary=None):
        options = {'args': ['-headless'], 'prefs': {'ui.prefersReducedMotion': 1 if reduced else 0}}
        if binary:
            options['binary'] = binary
        value = self.request('POST', '/session', {'capabilities': {'alwaysMatch': {
            'browserName': 'firefox', 'acceptInsecureCerts': False, 'moz:firefoxOptions': options,
        }}})
        self.session = value['sessionId']
        self.command('POST', '/timeouts', {'pageLoad': 20000, 'script': 10000, 'implicit': 0})
        return value['capabilities']

    def close(self):
        if self.session:
            try:
                self.command('DELETE', '')
            finally:
                self.session = None

    def js(self, script, *args):
        return self.command('POST', '/execute/sync', {'script': script, 'args': list(args)})

    def navigate(self, url):
        self.command('POST', '/url', {'url': url})

    def viewport(self, width, height):
        self.command('POST', '/window/rect', {'width': width, 'height': height})
        return self.js('return {width:innerWidth,height:innerHeight};')

    def click(self, index, control):
        element = self.js(f"return {WIDGET}[arguments[0]].querySelector('[data-p5-'+arguments[1]+']');", index, control)
        self.command('POST', '/element/' + element[ELEMENT] + '/click', {})

    def key(self, value):
        self.command('POST', '/actions', {'actions': [{'type': 'key', 'id': 'qa-keyboard', 'actions': [
            {'type': 'keyDown', 'value': value}, {'type': 'keyUp', 'value': value},
        ]}]})

    def screenshot(self, path):
        path.write_bytes(base64.b64decode(self.command('GET', '/screenshot')))


# Observe the real constructor and public methods; rendering is never replaced.
INSTRUMENT = r'''
const qa = window.__p5BrowserQA = {instances:[], events:[], errors:[], visibility:[], hiddenSamples:[]};
window.addEventListener('error', e => {if(e.message) qa.errors.push(e.message);});
window.addEventListener('unhandledrejection', e => qa.errors.push(String(e.reason)));
let library;
Object.defineProperty(window, 'p5', {configurable:true, get(){return library;}, set(Constructor){
  library = new Proxy(Constructor, {construct(Target,args,newTarget){
    const instance = Reflect.construct(Target,args,newTarget);
    const id = qa.instances.length;
    qa.instances.push(instance);
    for(const name of ['loop','noLoop','remove']){
      const method = instance[name];
      instance[name] = function(...parameters){
        qa.events.push({id,name,at:performance.now()});
        return method.apply(this,parameters);
      };
    }
    return instance;
  }});
}});
document.addEventListener('visibilitychange', () => {
  const frames = qa.instances.map(p => p.frameCount);
  qa.visibility.push({hidden:document.hidden,frames});
  if(document.hidden) setTimeout(() => qa.hiddenSamples.push({before:frames,after:qa.instances.map(p=>p.frameCount)}),350);
});
return true;
'''


class BrowserChecks:
    def __init__(self, driver, base, output, results):
        self.driver, self.base, self.output, self.results = driver, base.rstrip('/'), output, results
        self.page_errors = []

    def collect_errors(self):
        errors = self.driver.js('const q=window.__p5BrowserQA;const errors=q?.errors||[];if(q)q.errors=[];return errors;')
        self.page_errors.extend(errors)
        return self.page_errors

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
            result.update(status='failed', reason=str(error))
            try:
                self.driver.screenshot(self.output / (name + '-failure.png'))
            except Exception:
                pass
            raise
        finally:
            result['seconds'] = round(time.monotonic() - started, 2)
            self.results.append(result)
            print(name + ': ' + result['status'], flush=True)

    def fresh(self, label, width=1280, height=2000):
        d = self.driver
        self.collect_errors()
        d.viewport(width, height)
        d.navigate(self.base + '/experiences/p5/?qa=' + label)
        wait_for(lambda: d.js(f"return {WIDGET}.length===2 && {AVAILABLE}({WIDGET}[0].querySelector('[data-p5-play]'));"), 'Contrôleurs non initialisés')
        assert d.js('return typeof window.p5 === "undefined";'), 'p5 chargé avant action'
        d.js(INSTRUMENT)

    def frames(self, index):
        return self.driver.js('return window.__p5BrowserQA.instances[arguments[0]].frameCount;', index)

    def wait_for_layout(self, condition, message):
        try:
            wait_for(lambda: self.driver.js(condition), message)
        except AssertionError as error:
            geometry = self.driver.js(f"const rect={WIDGET}[0].getBoundingClientRect();return {{scrollY,scrollHeight:document.documentElement.scrollHeight,innerHeight,innerWidth,firstTop:rect.top,firstBottom:rect.bottom}};")
            raise AssertionError(message + ' : ' + json.dumps(geometry, ensure_ascii=False)) from error

    def canvas_digest(self, index):
        return self.driver.js('const c=window.__p5BrowserQA.instances[arguments[0]].canvas;const data=c.getContext("2d").getImageData(0,0,c.width,c.height).data;let hash=2166136261;for(let i=0;i<data.length;i+=97)hash=Math.imul(hash^data[i],16777619);return hash>>>0;', index)

    def start(self, index):
        d = self.driver
        d.click(index, 'play')
        try:
            wait_for(lambda: d.js(f"return !!{WIDGET}[arguments[0]].querySelector('canvas');", index), 'Aucun canevas p5 créé')
        except AssertionError as error:
            state = d.js(f"return {{constructor:typeof window.p5,status:{WIDGET}[arguments[0]].querySelector('[data-p5-status]').textContent}};", index)
            if state['constructor'] == 'undefined':
                raise EnvironmentBlocked('p5 non chargé : vérifier CDN, réseau et CSP. ' + json.dumps(state)) from error
            raise
        wait_for(lambda: d.js('return !!window.__p5BrowserQA.instances[arguments[0]]?.canvas;', index), 'Instance p5 non initialisée')
        wait_for(lambda: self.frames(index) > 0, 'Première image p5 non dessinée')
        time.sleep(0.15)

    def desktop(self):
        d = self.driver
        self.fresh('desktop')

        def initial():
            state = d.js("return {scripts:document.querySelectorAll('script[data-atelier-p5]').length,canvases:document.querySelectorAll('p5-experience canvas').length,resources:performance.getEntriesByType('resource').filter(e=>e.name.includes('/p5@')).length,fallbacks:document.querySelectorAll('.p5-fallback').length};")
            assert state == {'scripts': 0, 'canvases': 0, 'resources': 0, 'fallbacks': 2}, state
            return state
        self.case('initial-load', initial)

        def real_canvas():
            self.start(0)
            state = d.js("const p=window.__p5BrowserQA.instances[0];const c=p.canvas;return {context:!!c.getContext('2d'),width:c.width,height:c.height,version:window.p5.VERSION||window.p5.prototype.VERSION||null,pixels:Array.from(c.getContext('2d').getImageData(0,0,1,1).data)};")
            assert state['context'] and state['width'] > 0 and state['height'] > 0
            assert state['pixels'][3] > 0, 'Canevas non peint'
            before = self.frames(0); image = self.canvas_digest(0)
            time.sleep(0.3); assert self.frames(0) > before, 'Animation immobile'
            assert self.canvas_digest(0) != image, 'Le canevas ne change pas malgré les frames'
            return state
        self.case('real-canvas', real_canvas)

        def independent():
            self.start(1)
            assert d.js("return document.querySelectorAll('script[data-atelier-p5]').length;") == 1
            d.click(0, 'play'); time.sleep(0.15)
            a, b = self.frames(0), self.frames(1); time.sleep(0.3)
            assert self.frames(0) == a, 'La pause A n’est pas effective'
            assert self.frames(1) > b, 'B s’arrête avec A'
            return {'sharedLibraryScripts': 1, 'independentPause': True}
        self.case('independent-instances', independent)

        def manual_step():
            before = self.frames(0); d.click(0, 'step')
            wait_for(lambda: self.frames(0) > before, 'Pas-à-pas sans effet')
            assert self.frames(0) == before + 1
            return {'framesAdvanced': 1}
        self.case('manual-pause-step', manual_step)

        def destroy_restart():
            other = self.frames(1); d.click(0, 'stop')
            wait_for(lambda: d.js(f"return !{WIDGET}[0].querySelector('canvas') && {AVAILABLE}({WIDGET}[0].querySelector('[data-p5-play]'));"), 'Instance non libérée')
            assert d.js("return !window.__p5BrowserQA.instances[0].isLooping() && !window.__p5BrowserQA.instances[0].canvas.isConnected;")
            assert d.js("return window.__p5BrowserQA.events.filter(e=>e.id===0&&e.name==='remove').length;") == 1
            assert self.frames(1) > other
            d.click(0, 'play')
            wait_for(lambda: d.js('return window.__p5BrowserQA.instances.length===3;'), 'Redémarrage sans nouvelle instance')
            assert d.js("return document.querySelectorAll('script[data-atelier-p5]').length;") == 1
            return {'removedInstance': 0, 'newInstance': 2}
        self.case('destroy-restart', destroy_restart)
        d.screenshot(self.output / 'desktop.png')

        def offscreen():
            d.viewport(1000, 450)
            # Retry after resizing; never inherit the site's smooth scrolling.
            self.wait_for_layout(
                f"const first={WIDGET}[0];window.scrollTo({{top:first.getBoundingClientRect().bottom+scrollY+4,behavior:'instant'}});return innerWidth<=1000 && innerHeight<=450 && first.getBoundingClientRect().bottom<=0;",
                'Le composant A n’est pas entièrement hors écran après redimensionnement')
            wait_for(lambda: d.js("return !window.__p5BrowserQA.instances[2].isLooping();"), 'Animation A toujours active hors écran')
            # An animation frame already scheduled before noLoop() may still run once.
            settling = self.frames(2); time.sleep(0.15)
            before = self.frames(2); time.sleep(0.3); after = self.frames(2)
            assert after == before, f'Images dessinées hors écran : {settling} → {before} → {after}'
            return {'offscreenFramesStable': True, 'framesDuringSettle': before - settling}
        self.case('offscreen-pause', offscreen)

        def hidden_tab():
            original = d.command('GET', '/window')
            new = d.command('POST', '/window/new', {'type': 'tab'})
            try:
                d.command('POST', '/window', {'handle': new['handle']})
                d.navigate('about:blank'); time.sleep(1.5)
            finally:
                d.command('DELETE', '/window')
                d.command('POST', '/window', {'handle': original})
            data = d.js('return {events:window.__p5BrowserQA.visibility,samples:window.__p5BrowserQA.hiddenSamples};')
            if not any(item['hidden'] for item in data['events']):
                raise CheckSkipped('Firefox n’a pas signalé d’onglet masqué dans cette configuration')
            assert data['samples'], 'Échantillon d’onglet masqué absent'
            for sample in data['samples']:
                assert all(after <= before + 1 for before, after in zip(sample['before'], sample['after'])), sample
            return data
        self.case('hidden-tab', hidden_tab)

    def narrow_and_keyboard(self):
        d = self.driver
        self.fresh('keyboard', 390, 844)

        def keyboard():
            # Native WebDriver Tab/Enter, not JavaScript-generated key events.
            d.js("document.activeElement?.blur();window.scrollTo({top:0,behavior:'instant'});")
            self.wait_for_layout('return scrollY===0;', 'Le retour en haut avant le test clavier n’est pas terminé')
            def tab_to_play():
                for _ in range(35):
                    state = d.js(f"return {{onPlay:document.activeElement==={WIDGET}[0].querySelector('[data-p5-play]'),documentFocus:document.hasFocus()}};")
                    # Tabbing past the end of the page moves focus into the browser UI;
                    # Firefox then no longer activates page buttons with Enter.
                    assert state['documentFocus'], 'Le focus a quitté le document pendant la navigation au clavier'
                    if state['onPlay']:
                        return
                    d.key('\ue004')
                raise AssertionError('Commande de chargement inatteignable par Tab')
            tab_to_play()
            outline = d.js('return getComputedStyle(document.activeElement).outlineStyle;')
            assert outline != 'none', 'Focus clavier invisible'
            d.key('\ue007')
            wait_for(lambda: d.js(f"return !!{WIDGET}[0].querySelector('canvas');"), 'Entrée n’a pas démarré le canevas')
            wait_for(lambda: d.js(f"return {AVAILABLE}({WIDGET}[0].querySelector('[data-p5-play]'));"), 'Commande toujours indisponible après chargement')
            retained = d.js(f"return document.activeElement==={WIDGET}[0].querySelector('[data-p5-play]');")
            assert retained, 'Focus clavier perdu pendant le chargement : ' + d.js('return document.activeElement.tagName;')
            d.key('\ue007')
            wait_for(lambda: d.js("return !window.__p5BrowserQA.instances[0].isLooping();"), 'Entrée n’a pas mis l’animation en pause')
            time.sleep(0.2)
            before = self.frames(0); time.sleep(0.2)
            assert self.frames(0) == before, f'Animation encore active après la pause clavier : {before} → {self.frames(0)}'
            step_button = f"{WIDGET}[0].querySelector('[data-p5-step]')"
            wait_for(lambda: d.js(f"return {AVAILABLE}({step_button});"), 'Pas-à-pas indisponible après la pause')
            d.key('\ue004'); d.key(' ')
            wait_for(lambda: self.frames(0) > before, 'Espace n’a pas déclenché le pas-à-pas')
            return {'nativeKeyboard': True, 'focusOutline': outline, 'focusRetainedDuringLoad': retained}
        self.case('keyboard', keyboard)

        def narrow():
            data = d.js("return {width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth+1,controls:Array.from(document.querySelectorAll('.p5-controls button')).map(b=>({width:b.getBoundingClientRect().width,height:b.getBoundingClientRect().height})),touch:getComputedStyle(document.querySelector('p5-experience canvas')).touchAction};")
            assert data['width'] <= 500, 'Viewport étroit non obtenu'
            assert not data['overflow'], 'Débordement horizontal'
            assert all(item['height'] >= 44 for item in data['controls']), 'Cible de commande trop petite'
            assert 'pan-y' in data['touch'], 'Défilement vertical non autorisé sur le canevas'
            d.screenshot(self.output / 'narrow.png')
            return data
        self.case('narrow-layout', narrow)

    def loading_failures(self):
        d = self.driver
        for name, disconnect in [('cancel-loading', False), ('disconnect-loading', True)]:
            self.fresh(name)
            def cancellation(disconnect=disconnect):
                d.js("const append=document.head.append.bind(document.head);document.head.append=(...nodes)=>{if(nodes.some(n=>n?.dataset?.atelierP5))setTimeout(()=>append(...nodes),750);else append(...nodes);};")
                d.click(0, 'play')
                if disconnect:
                    d.js(f'{WIDGET}[0].remove();')
                else:
                    d.click(0, 'stop')
                wait_for(lambda: d.js('return typeof window.p5==="function";'), 'La bibliothèque différée n’a pas terminé son chargement')
                time.sleep(0.3)
                assert d.js('return window.__p5BrowserQA.instances.length;') == 0, 'Instance créée après annulation'
                assert d.js("return document.querySelectorAll('p5-experience canvas').length;") == 0
                return {'realLibraryLoadedAfterCancellation': True, 'instances': 0}
            self.case(name, cancellation)

        self.fresh('network-retry')
        def retry():
            d.js("const append=document.head.append.bind(document.head);let fail=true;document.head.append=(...nodes)=>{for(const n of nodes)if(n?.dataset?.atelierP5&&fail){fail=false;n.src=new URL('/__qa__/missing-p5.js',location.href).href;}return append(...nodes);};")
            d.click(0, 'play')
            wait_for(lambda: d.js(f"return {WIDGET}[0].querySelector('[data-p5-status]').textContent.includes('indisponible');"), 'Erreur réseau sans retour accessible')
            assert d.js("return document.querySelectorAll('.p5-fallback').length;") == 2
            self.start(0)
            return {'realHttp404': True, 'successfulRetry': True}
        self.case('network-retry', retry)

    def reduced(self):
        d = self.driver
        self.fresh('reduced')
        def check():
            assert d.js("return matchMedia('(prefers-reduced-motion: reduce)').matches;"), 'Préférence Firefox non appliquée'
            self.start(0)
            time.sleep(0.2); before = self.frames(0); time.sleep(0.3)
            assert self.frames(0) == before, 'Animation automatique avec mouvement réduit'
            assert d.js("return !window.__p5BrowserQA.instances[0].isLooping();")
            d.click(0, 'step'); wait_for(lambda: self.frames(0) > before, 'Pas-à-pas inaccessible en mouvement réduit')
            assert self.frames(0) == before + 1
            d.screenshot(self.output / 'reduced.png')
            return {'realFirefoxPreference': True, 'framesAdvancedManually': 1}
        self.case('reduced-motion', check)


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *_args):
        pass


def free_port():
    with socket.socket() as listener:
        listener.bind(('127.0.0.1', 0))
        return listener.getsockname()[1]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--base-url', help='Serveur local déjà lancé ; sinon sert dist/ sur loopback')
    parser.add_argument('--driver', help='Chemin de geckodriver ; sinon recherche dans PATH')
    parser.add_argument('--firefox-binary', help='Binaire Firefox personnalisé ; sinon sélection par geckodriver')
    args = parser.parse_args()
    if args.base_url:
        url = urllib.parse.urlparse(args.base_url)
        if url.scheme not in ('http', 'https') or url.hostname not in ('127.0.0.1', 'localhost', '::1'):
            parser.error('--base-url doit désigner un serveur local')
    output = ROOT / 'test-results' / 'browser'
    output.mkdir(parents=True, exist_ok=True)
    (output / 'profiles').mkdir(exist_ok=True)
    report = {'startedUTC': datetime.now(timezone.utc).isoformat(), 'status': 'blocked', 'engine': 'Firefox réel via WebDriver W3C',
              'results': [], 'notRun': PLAN.copy(), 'limitations': ['Viewport étroit simulé : ne remplace pas un téléphone réel', 'Ne valide pas un lecteur d’écran ni la collecte mémoire du navigateur']}
    server = driver_process = driver = driver_log = None
    exit_code = 2
    try:
        if not __debug__:
            raise EnvironmentBlocked('Les assertions sont désactivées : ne pas lancer Python avec -O ou PYTHONOPTIMIZE')
        if not (ROOT / 'dist/experiences/p5/index.html').exists():
            raise EnvironmentBlocked('Compilation absente : exécuter npm run build')
        if args.base_url:
            base = args.base_url.rstrip('/')
        else:
            try:
                server = ThreadingHTTPServer(('127.0.0.1', 0), partial(QuietHandler, directory=str(ROOT / 'dist')))
            except OSError as error:
                raise EnvironmentBlocked('Serveur local refusé : ' + str(error)) from error
            threading.Thread(target=server.serve_forever, daemon=True).start()
            base = f'http://127.0.0.1:{server.server_port}'
        executable = args.driver or shutil.which('geckodriver')
        if not executable:
            raise EnvironmentBlocked('geckodriver introuvable ; fournir --driver ou l’installer dans un environnement autorisé')
        try:
            port = free_port()
            driver_log = (output / 'geckodriver.log').open('w')
            command = [executable, '--host', '127.0.0.1', '--port', str(port), '--profile-root', str(output / 'profiles')]
            driver_process = subprocess.Popen(command, stdout=driver_log, stderr=subprocess.STDOUT, start_new_session=True)
        except OSError as error:
            raise EnvironmentBlocked('Lancement WebDriver refusé : ' + str(error)) from error
        driver = Driver(f'http://127.0.0.1:{port}')
        def available():
            if driver_process.poll() is not None:
                raise EnvironmentBlocked('geckodriver arrêté ; consulter geckodriver.log')
            try:
                return driver.request('GET', '/status')
            except (OSError, WebDriverError):
                return False
        try:
            wait_for(available, 'WebDriver ne répond pas', 10)
            report['browser'] = driver.start(False, args.firefox_binary)
        except (OSError, AssertionError, WebDriverError) as error:
            raise EnvironmentBlocked('Session Firefox impossible : ' + str(error)) from error
        checks = BrowserChecks(driver, base, output, report['results'])
        checks.desktop()
        checks.narrow_and_keyboard()
        checks.loading_failures()
        checks.collect_errors()
        driver.close()
        report['reducedBrowser'] = driver.start(True, args.firefox_binary)
        checks.reduced()
        checks.case('page-errors', lambda: assert_no_errors(checks.collect_errors()))
        report['status'] = 'passed' if not any(item['status'] == 'skipped' for item in report['results']) else 'partial'
        exit_code = 0 if report['status'] == 'passed' else 2
    except EnvironmentBlocked as error:
        report.update(status='blocked', reason=str(error))
        print('BLOQUÉ : ' + str(error), flush=True)
    except KeyboardInterrupt:
        report.update(status='interrupted', reason='Arrêt demandé')
    except Exception as error:
        report.update(status='failed', reason=str(error))
        exit_code = 1
        print('ÉCHEC : ' + str(error), flush=True)
    finally:
        if driver:
            try:
                driver.close()
            except Exception:
                pass
        if driver_process and driver_process.poll() is None:
            try:
                if os.name == 'posix':
                    os.killpg(driver_process.pid, signal.SIGTERM)
                else:
                    driver_process.terminate()
                driver_process.wait(timeout=5)
            except (OSError, subprocess.TimeoutExpired):
                if os.name == 'posix':
                    os.killpg(driver_process.pid, signal.SIGKILL)
                else:
                    driver_process.kill()
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


def assert_no_errors(errors):
    assert not errors, errors
    return {'unhandledPageErrors': 0}


if __name__ == '__main__':
    sys.exit(main())
