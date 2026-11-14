import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { advanceTime, resolveViewport, technicalBars, canEmbed, FRAME_MS } from '../src/experiences/p5/model.ts';
import { createInstance } from '../src/experiences/p5/instance.ts';
import { mountP5Experience, registerP5Experiences } from '../src/scripts/p5-experience.ts';

const flush = () => new Promise(resolve => setTimeout(resolve, 0));
// jsdom's pretendToBeVisual runs requestAnimationFrame at roughly 60 Hz.
const nextFrame = () => new Promise(resolve => setTimeout(resolve, 50));
function deferred() { let resolve; let reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; }

async function environment(run, reduced = false) {
  const dom = new JSDOM('<!doctype html><html><head></head><body></body></html>', { pretendToBeVisual: true, url: 'http://localhost/' });
  const { window } = dom;
  const intersections = [], resizes = [], instances = [], cleanups = [];
  const motion = new window.EventTarget();
  motion.matches = reduced;
  const motionListeners = new Set();
  const addMotion = motion.addEventListener.bind(motion), removeMotion = motion.removeEventListener.bind(motion);
  motion.addEventListener = (type, handler, options) => { motionListeners.add(handler); addMotion(type, handler, options); };
  motion.removeEventListener = (type, handler, options) => { motionListeners.delete(handler); removeMotion(type, handler, options); };
  window.matchMedia = () => motion;
  let hidden = false;
  Object.defineProperty(window.document, 'hidden', { configurable: true, get: () => hidden });
  class Intersection {
    constructor(callback) { this.callback = callback; this.disconnected = false; intersections.push(this); }
    observe(target) { this.target = target; }
    disconnect() { this.disconnected = true; }
    emit(value) { this.callback([{ isIntersecting: value }]); }
  }
  class Resize {
    constructor(callback) { this.callback = callback; this.disconnected = false; resizes.push(this); }
    observe(target) { this.target = target; }
    disconnect() { this.disconnected = true; }
    emit() { this.callback([]); }
  }
  window.IntersectionObserver = Intersection;
  window.ResizeObserver = Resize;
  const replacements = { window, document: window.document, HTMLElement: window.HTMLElement, customElements: window.customElements, AbortController: window.AbortController, IntersectionObserver: Intersection, ResizeObserver: Resize };
  const descriptors = new Map(Object.keys(replacements).map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  Object.entries(replacements).forEach(([key, value]) => Object.defineProperty(globalThis, key, { value, configurable: true, writable: true }));
  class FakeP5 {
    constructor(sketch, parent) {
      this.parent = parent; this.deltaTime = 40; this.loops = 0; this.pauses = 0; this.removals = 0; this.redraws = 0; this.resizes = 0; this.frames = [];
      instances.push(this); sketch(this);
      if (!this.constructor.deferSetup) { this.setup(); this.draw(); }
    }
    noLoop() { this.pauses++; this.looping = false; }
    loop() { this.loops++; this.looping = true; }
    redraw() { this.redraws++; this.draw(); }
    remove() { this.removals++; this.looping = false; this.canvas?.remove(); }
    pixelDensity(value) { this.density = value; }
    frameRate(value) { this.fps = value; }
    createCanvas(width, height) { this.canvas = window.document.createElement('canvas'); this.canvas.width = width; this.canvas.height = height; this.parent.append(this.canvas); return { elt: this.canvas }; }
    resizeCanvas(width, height, noRedraw) { this.resizes++; this.canvas.width = width; this.canvas.height = height; assert.equal(noRedraw, true); }
    background() {}
    fill() {}
    noStroke() {}
    rect() {}
  }
  const factory = surface => ({ draw(timeMs, viewport) { surface.frames.push({ timeMs, width: viewport.width }); } });
  let loads = 0;
  const dependencies = { loadRuntime: async () => { loads++; return FakeP5; }, loadSketch: async () => ({ createSketch: factory }) };
  function root() {
    const element = window.document.createElement('section');
    element.dataset.p5Sketch = 'technical-bars';
    element.innerHTML = '<div data-p5-canvas></div><button data-p5-play disabled></button><button data-p5-step disabled></button><button data-p5-stop disabled></button><p data-p5-status role="status"></p><p>Remplacement textuel permanent</p>';
    window.document.body.append(element);
    Object.defineProperty(element.querySelector('[data-p5-canvas]'), 'clientWidth', { configurable: true, value: 480 });
    return element;
  }
  function mount(element, deps = dependencies) { const cleanup = mountP5Experience(element, deps); cleanups.push(cleanup); return cleanup; }
  const context = { dom, window, root, mount, dependencies, FakeP5, factory, instances, intersections, resizes, motion, motionListeners, loads: () => loads, hide(value) { hidden = value; window.document.dispatchEvent(new window.Event('visibilitychange')); }, reduce(value) { motion.matches = value; motion.dispatchEvent(new window.Event('change')); } };
  try { await run(context); }
  finally {
    cleanups.forEach(cleanup => cleanup());
    await flush(); dom.window.close();
    for (const [key, descriptor] of descriptors) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key]; }
  }
}

const button = (root, name) => root.querySelector(`[data-p5-${name}]`);
const click = (root, name) => button(root, name).click();
// Unavailable controls use aria-disabled so they keep keyboard focus.
const unavailable = (root, name) => button(root, name).getAttribute('aria-disabled') === 'true';

test('pure timing, bounded viewport and technical layout work without p5 or a browser', () => {
  assert.equal(advanceTime(20, 5000), 120);
  assert.equal(advanceTime(20, -10), 20);
  assert.throws(() => advanceTime(0, NaN), RangeError);
  assert.throws(() => advanceTime(-1, 10), RangeError);
  assert.deepEqual(resolveViewport(Infinity), { width: 320, height: 240 });
  assert.equal(resolveViewport(5000).width, 960);
  for (const width of [0, 160, 480, 5000]) for (const time of [0, 20, 1600, 80000]) {
    const viewport = resolveViewport(width), bars = technicalBars(time, viewport);
    assert.equal(bars.length, 12);
    assert.ok(bars.every(bar => bar.width > 0 && bar.height > 0 && bar.x >= 0 && bar.y >= 0 && bar.x + bar.width <= viewport.width));
  }
});

test('publication requires a mathematical validation reference; technical fixtures stay explicit', () => {
  assert.equal(canEmbed({ kind: 'mathematical', status: 'pending' }, false), false);
  assert.equal(canEmbed({ kind: 'mathematical', status: 'pending' }, true), true);
  assert.equal(canEmbed({ kind: 'mathematical', status: 'validated', reference: '  ' }, false), false);
  assert.equal(canEmbed({ kind: 'mathematical', status: 'validated', reference: 'fixture:approved' }, false), true);
  assert.equal(canEmbed({ kind: 'technical', status: 'prototype' }, false), true);
});

test('no library load before user action; multiple instances have independent clocks and cleanup', async () => environment(async e => {
  const a = e.root(), b = e.root(); const disposeA = e.mount(a); e.mount(b);
  e.intersections.forEach(observer => observer.emit(true));
  assert.equal(e.loads(), 0);
  assert.equal(e.window.document.querySelector('script'), null);
  click(a, 'play'); await flush();
  const first = e.instances[0];
  assert.equal(first.looping, true); assert.equal(first.fps, 30); assert.ok(first.density <= 1.5);
  assert.equal(first.canvas.getAttribute('aria-hidden'), 'true');
  first.draw(); first.draw();
  click(a, 'play');
  assert.equal(first.looping, false);
  const previous = first.frames.at(-1).timeMs;
  click(a, 'step'); assert.ok(Math.abs(first.frames.at(-1).timeMs - previous - FRAME_MS) < 0.0001);
  click(b, 'play'); await flush();
  assert.equal(e.instances[1].frames[0].timeMs, 0);
  assert.equal(e.instances[1].looping, true);
  click(a, 'stop'); await flush(); disposeA();
  assert.equal(first.removals, 1);
  assert.equal(a.querySelector('canvas'), null);
  assert.equal(e.instances[1].removals, 0);
  assert.equal(e.instances[1].looping, true);
}));

test('controls stay focusable while unavailable and ignore activation', async () => environment(async e => {
  const delayed = deferred(), root = e.root();
  e.mount(root, { ...e.dependencies, loadRuntime: () => delayed.promise });
  e.intersections[0].emit(true);
  for (const name of ['play', 'step', 'stop']) assert.equal(button(root, name).disabled, false, name);
  assert.equal(unavailable(root, 'step'), true); assert.equal(unavailable(root, 'stop'), true);
  button(root, 'play').focus(); click(root, 'play');
  assert.equal(unavailable(root, 'play'), true);
  assert.equal(e.window.document.activeElement, button(root, 'play'), 'focus kept during loading');
  click(root, 'play'); click(root, 'step');
  delayed.resolve(e.FakeP5); await flush();
  assert.equal(e.instances.length, 1);
  assert.equal(e.instances[0].looping, true, 'a click while loading must not toggle the pause');
  assert.equal(unavailable(root, 'play'), false);
  assert.equal(e.window.document.activeElement, button(root, 'play'));
  button(root, 'stop').focus(); click(root, 'stop'); await flush();
  assert.equal(e.instances[0].removals, 1);
  assert.equal(unavailable(root, 'stop'), true);
  assert.equal(e.window.document.activeElement, button(root, 'stop'), 'focus kept after stopping');
  click(root, 'stop'); click(root, 'step'); await flush();
  assert.equal(e.instances[0].removals, 1);
}));

test('viewport and hidden tab pause automatically; manual pause survives visibility changes', async () => environment(async e => {
  const root = e.root(); e.mount(root); e.intersections[0].emit(true);
  click(root, 'play'); await flush(); const instance = e.instances[0];
  e.intersections[0].emit(false); assert.equal(instance.looping, false);
  e.intersections[0].emit(true); assert.equal(instance.looping, true);
  e.hide(true); assert.equal(instance.looping, false);
  e.hide(false); assert.equal(instance.looping, true);
  click(root, 'play'); assert.equal(instance.looping, false);
  e.hide(true); e.hide(false); assert.equal(instance.looping, false);
}));

test('reduced motion starts with a static frame and allows explicit single steps', async () => environment(async e => {
  const root = e.root(); e.mount(root); e.intersections[0].emit(true);
  assert.match(button(root, 'play').textContent, /image fixe/);
  click(root, 'play'); await flush(); const instance = e.instances[0];
  assert.equal(instance.loops, 0); assert.equal(unavailable(root, 'play'), true);
  const time = instance.frames.at(-1).timeMs;
  click(root, 'step'); assert.ok(instance.frames.at(-1).timeMs > time);
  assert.equal(instance.looping, false);
}, true));

test('enabling reduced motion pauses; disabling it does not silently restart animation', async () => environment(async e => {
  const root = e.root(); e.mount(root); e.intersections[0].emit(true);
  click(root, 'play'); await flush();
  e.reduce(true); assert.equal(e.instances[0].looping, false);
  e.reduce(false); assert.equal(e.instances[0].looping, false);
  click(root, 'play'); assert.equal(e.instances[0].looping, true);
}));

test('cancelled imports never create a sketch; stopping a load permits a clean restart', async () => environment(async e => {
  const delayed = deferred(), root = e.root();
  e.mount(root, { ...e.dependencies, loadRuntime: () => delayed.promise });
  e.intersections[0].emit(true); click(root, 'play'); click(root, 'stop');
  delayed.resolve(e.FakeP5); await flush(); assert.equal(e.instances.length, 0);
  click(root, 'play'); await flush(); assert.equal(e.instances.length, 1);
}));

test('unmount during import disconnects all observers/listeners and prevents resurrection', async () => environment(async e => {
  const delayed = deferred(), root = e.root();
  const cleanup = e.mount(root, { ...e.dependencies, loadRuntime: () => delayed.promise });
  e.intersections[0].emit(true); click(root, 'play'); cleanup();
  delayed.resolve(e.FakeP5); await flush();
  assert.equal(e.instances.length, 0);
  assert.ok(e.intersections.every(observer => observer.disconnected));
  assert.ok(e.resizes.every(observer => observer.disconnected));
  assert.equal(e.motionListeners.size, 0);
  click(root, 'play'); await flush(); assert.equal(e.instances.length, 0);
}));

test('a prepared offscreen experience waits before allocating its p5 canvas', async () => environment(async e => {
  const root = e.root(); e.mount(root); click(root, 'play'); await flush();
  assert.equal(e.instances.length, 0);
  e.intersections[0].emit(true); await flush(); assert.equal(e.instances.length, 1);
}));

test('resize avoids offscreen rendering and redraws once when a paused sketch is visible again', async () => environment(async e => {
  const root = e.root(); e.mount(root); e.intersections[0].emit(true);
  click(root, 'play'); await flush(); click(root, 'play'); const instance = e.instances[0];
  e.intersections[0].emit(false);
  Object.defineProperty(root.querySelector('[data-p5-canvas]'), 'clientWidth', { configurable: true, value: 600 });
  const redraws = instance.redraws;
  e.resizes[0].emit(); assert.equal(instance.resizes, 0, 'resize is deferred out of the observer callback');
  await nextFrame(); assert.equal(instance.resizes, 0); assert.equal(instance.redraws, redraws);
  e.intersections[0].emit(true); assert.equal(instance.resizes, 1); assert.equal(instance.redraws, redraws + 1);
  e.resizes[0].emit(); await nextFrame(); assert.equal(instance.resizes, 1);
}));

test('height-only observer notifications are ignored and a pending resize frame is cancelled on unmount', async () => environment(async e => {
  const root = e.root(); const cleanup = e.mount(root); e.intersections[0].emit(true);
  click(root, 'play'); await flush(); click(root, 'play'); const instance = e.instances[0];
  const redraws = instance.redraws;
  e.resizes[0].emit(); await nextFrame();
  assert.equal(instance.resizes, 0); assert.equal(instance.redraws, redraws);
  Object.defineProperty(root.querySelector('[data-p5-canvas]'), 'clientWidth', { configurable: true, value: 600 });
  e.resizes[0].emit(); e.resizes[0].emit(); await nextFrame();
  assert.equal(instance.resizes, 1); assert.equal(instance.redraws, redraws + 1);
  Object.defineProperty(root.querySelector('[data-p5-canvas]'), 'clientWidth', { configurable: true, value: 320 });
  e.resizes[0].emit(); cleanup(); await nextFrame();
  assert.equal(instance.resizes, 1);
}));

test('load and drawing failures keep fallback text available and release the canvas', async () => environment(async e => {
  const root = e.root();
  e.mount(root, { ...e.dependencies, loadRuntime: async () => { throw new Error('network fixture'); } });
  e.intersections[0].emit(true); click(root, 'play'); await flush();
  assert.match(root.querySelector('[data-p5-status]').textContent, /indisponible/);
  assert.equal(unavailable(root, 'play'), false);
  assert.match(root.textContent, /Remplacement textuel permanent/);
  const second = e.root();
  e.mount(second, { ...e.dependencies, loadSketch: async () => ({ createSketch: () => ({ draw() { throw new Error('renderer fixture'); } }) }) });
  e.intersections[1].emit(true); click(second, 'play'); await flush();
  assert.equal(e.instances[0].removals, 1);
  assert.equal(second.querySelector('canvas'), null);
  assert.match(second.querySelector('[data-p5-status]').textContent, /indisponible/);
}));

test('instance removal still runs when renderer cleanup throws', async () => environment(async e => {
  const parent = e.window.document.createElement('div'); e.window.document.body.append(parent);
  const instance = createInstance(e.FakeP5, parent, () => ({ draw() {}, dispose() { throw new Error('cleanup fixture'); } }), resolveViewport(400), 'sage', () => {}, () => {});
  await flush(); await assert.rejects(instance.destroy(), /cleanup fixture/);
  assert.equal(e.instances[0].removals, 1); assert.equal(parent.children.length, 0);
  await instance.destroy(); assert.equal(e.instances[0].removals, 1);
}));

test('late p5 setup cannot recreate a canvas after the component was removed', async () => environment(async e => {
  class DeferredP5 extends e.FakeP5 { static deferSetup = true; }
  const root = e.root();
  const cleanup = e.mount(root, { ...e.dependencies, loadRuntime: async () => DeferredP5 });
  e.intersections[0].emit(true); click(root, 'play'); await flush();
  assert.equal(e.instances.length, 1); assert.equal(root.querySelector('canvas'), null);
  cleanup(); await flush();
  assert.equal(e.instances[0].removals, 0, 'Cleanup waits for asynchronous p5 setup');
  e.instances[0].createCanvas(100, 100); // p5 creates this default before calling user setup.
  e.instances[0].setup(); e.instances[0].draw(); await flush();
  assert.equal(root.querySelector('canvas'), null);
  assert.equal(e.instances[0].removals, 1);
  assert.equal(e.instances[0].canvas.parentElement, null);
}));

test('p5 removal is attempted even when noLoop throws during cleanup', async () => environment(async e => {
  const parent = e.window.document.createElement('div');
  const instance = createInstance(e.FakeP5, parent, e.factory, resolveViewport(400), 'sage', () => {}, () => {});
  await flush();
  e.instances[0].noLoop = () => { throw new Error('pause cleanup fixture'); };
  await assert.rejects(instance.destroy(), /pause cleanup fixture/);
  assert.equal(e.instances[0].removals, 1); assert.equal(parent.children.length, 0);
}));

test('a back-forward cache departure destroys the instance and does not auto-start on return', async () => environment(async e => {
  const root = e.root(); e.mount(root); e.intersections[0].emit(true);
  click(root, 'play'); await flush();
  e.window.dispatchEvent(new e.window.PageTransitionEvent('pagehide', { persisted: true })); await flush();
  assert.equal(e.instances[0].removals, 1);
  e.window.dispatchEvent(new e.window.PageTransitionEvent('pageshow', { persisted: true })); await flush();
  assert.equal(e.instances.length, 1);
  click(root, 'play'); await flush(); assert.equal(e.instances.length, 2);
}));

test('custom element registration is idempotent and disconnection triggers lifecycle cleanup', async () => environment(async e => {
  const root = e.root(); root.outerHTML = root.outerHTML.replaceAll('section', 'p5-experience');
  registerP5Experiences(); registerP5Experiences();
  const element = e.window.document.querySelector('p5-experience');
  assert.equal(e.intersections.length, 1); assert.equal(e.motionListeners.size, 1);
  element.remove(); await flush();
  assert.equal(e.intersections[0].disconnected, true); assert.equal(e.motionListeners.size, 0);
  e.window.document.body.append(element); assert.equal(e.intersections.length, 2);
  element.remove(); assert.equal(e.motionListeners.size, 0);
  assert.equal(e.window.document.querySelector('script'), null);
}));

test('a slow p5 download is not restarted: a retry reuses it, even after it completes', async () => environment(async e => {
  const { loadP5, P5SlowLoadError } = await import('../src/experiences/p5/runtime.ts?test=slow');
  const first = loadP5(5);
  const script = e.window.document.querySelector('script');
  await assert.rejects(first, error => error instanceof P5SlowLoadError);
  assert.equal(e.window.document.querySelectorAll('script').length, 1, 'download kept after the timeout');
  e.window.p5 = e.FakeP5; // the download finishes later
  script.dispatchEvent(new e.window.Event('load'));
  assert.equal(await loadP5(5), e.FakeP5, 'retry recognises our late-loaded copy');
  assert.equal(e.window.document.querySelectorAll('script').length, 1);
}));

test('a retry after a slow download waits for the same script, and a later error allows a fresh one', async () => environment(async e => {
  const { loadP5, P5SlowLoadError } = await import('../src/experiences/p5/runtime.ts?test=slow-error');
  await assert.rejects(loadP5(5), P5SlowLoadError);
  const script = e.window.document.querySelector('script');
  const waiting = loadP5(1000);
  assert.equal(e.window.document.querySelector('script'), script, 'same element, no second download');
  script.dispatchEvent(new e.window.Event('error'));
  await assert.rejects(waiting, /impossible/);
  assert.equal(e.window.document.querySelector('script'), null);
  const fresh = loadP5(1000);
  const next = e.window.document.querySelector('script');
  assert.notEqual(next, script);
  e.window.p5 = e.FakeP5; next.dispatchEvent(new e.window.Event('load'));
  assert.equal(await fresh, e.FakeP5);
}));

test('the runtime loader shares one versioned script and supports retry after a network error', async () => environment(async e => {
  const { loadP5, P5_RUNTIME } = await import('../src/experiences/p5/runtime.ts?test=loader');
  assert.equal(e.window.document.querySelectorAll('script').length, 0);
  const first = loadP5(), same = loadP5(); assert.equal(first, same);
  let script = e.window.document.querySelector('script');
  assert.equal(new URL(script.src).pathname, P5_RUNTIME.url);
  assert.equal(new URL(script.src).origin, e.window.location.origin, 'self-hosted, same origin');
  assert.match(P5_RUNTIME.integrity, /^sha384-[A-Za-z0-9+/]{64}$/);
  assert.equal(script.integrity, P5_RUNTIME.integrity);
  assert.equal(script.referrerPolicy, 'no-referrer');
  script.dispatchEvent(new e.window.Event('error'));
  await assert.rejects(first, /Chargement/);
  assert.equal(e.window.document.querySelector('script'), null);
  const retry = loadP5(); script = e.window.document.querySelector('script');
  e.window.p5 = e.FakeP5;
  script.dispatchEvent(new e.window.Event('load'));
  assert.equal(await retry, e.FakeP5);
  assert.equal(await loadP5(), e.FakeP5);
  assert.equal(e.window.document.querySelectorAll('script').length, 1);
  assert.equal(e.window.setup, undefined); assert.equal(e.window.draw, undefined);
}));
