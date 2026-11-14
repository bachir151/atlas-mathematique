import { advanceTime, FRAME_MS } from './model.ts';
import type { ManagedInstance, P5Constructor, P5Surface, SketchFactory, SketchRenderer, Viewport } from './types.ts';

/** Owns precisely one p5 instance and one DOM mount, including partial failures. */
export function createInstance(
  Constructor: P5Constructor,
  parent: HTMLElement,
  factory: SketchFactory,
  initialViewport: Viewport,
  tone: 'sage' | 'clay',
  onReady: () => void,
  onError: (error: unknown) => void,
): ManagedInstance {
  const mount = document.createElement('div');
  parent.append(mount);
  let surface: P5Surface | undefined;
  let renderer: SketchRenderer | undefined;
  let viewport = { ...initialViewport };
  let ready = false;
  let destroyed = false;
  let running = false;
  let ignoreDelta = true;
  let timeMs = 0;
  let failed = false;
  let finishSetup: () => void = () => {};
  const setupFinished = new Promise<void>(resolve => { finishSetup = resolve; });

  function fail(error: unknown) {
    if (failed || destroyed) return;
    failed = true;
    running = false;
    surface?.noLoop();
    queueMicrotask(() => onError(error));
  }
  function guarded(action: () => void) {
    if (destroyed || failed) return;
    try { action(); } catch (error) { fail(error); }
  }
  function redraw() {
    if (!ready || destroyed || failed || running) return;
    try { Promise.resolve(surface!.redraw()).catch(fail); } catch (error) { fail(error); }
  }
  async function destroy() {
    if (destroyed) return;
    destroyed = true;
    running = false;
    mount.remove();
    // Always release the DOM mount, even if a renderer's cleanup fails.
    try {
      try { surface?.noLoop(); }
      finally {
        // p5 2.4 creates a default canvas asynchronously before calling setup.
        // Its public remove() releases listeners only once that canvas exists.
        await setupFinished;
        try { renderer?.dispose?.(); } finally { await surface?.remove(); }
      }
    } finally { mount.remove(); }
  }

  try {
    new Constructor(p => {
      surface = p;
      p.noLoop();
      p.setup = () => {
        try {
          guarded(() => {
            p.pixelDensity(Math.min(window.devicePixelRatio || 1, 1.5));
            p.frameRate(30);
            const canvas = p.createCanvas(viewport.width, viewport.height).elt;
            canvas.setAttribute('aria-hidden', 'true');
            canvas.tabIndex = -1;
            renderer = factory(p, tone);
            ready = true;
            // p5 may call setup before its constructor returns.
            queueMicrotask(() => { if (!destroyed && !failed) onReady(); });
          });
        } finally { finishSetup(); }
      };
      p.draw = () => guarded(() => {
        if (!ready) return;
        if (running && !ignoreDelta) timeMs = advanceTime(timeMs, p.deltaTime);
        ignoreDelta = false;
        renderer!.draw(timeMs, viewport);
      });
    }, mount);
  } catch (error) { finishSetup(); fail(error); }

  return {
    setRunning(value) {
      if (!ready || destroyed || failed || value === running) return;
      running = value;
      guarded(() => { if (value) { ignoreDelta = true; surface!.loop(); } else surface!.noLoop(); });
    },
    resize(next) {
      if (!ready || destroyed || failed || (next.width === viewport.width && next.height === viewport.height)) return;
      viewport = { ...next };
      guarded(() => surface!.resizeCanvas(viewport.width, viewport.height, true));
    },
    step() {
      if (!ready || destroyed || failed || running) return;
      timeMs = advanceTime(timeMs, FRAME_MS);
      redraw();
    },
    redraw,
    destroy,
  };
}
