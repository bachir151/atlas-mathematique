import { resolveViewport } from '../experiences/p5/model.ts';
import { getExperience, loadSketch } from '../experiences/p5/registry.ts';
import { loadP5 } from '../experiences/p5/runtime.ts';
import { createInstance } from '../experiences/p5/instance.ts';
import type { ManagedInstance, P5Constructor, SketchFactory } from '../experiences/p5/types.ts';

export interface P5Dependencies {
  loadRuntime: () => Promise<P5Constructor>;
  loadSketch: (id: string) => Promise<{ createSketch: SketchFactory }>;
}

const defaults: P5Dependencies = { loadRuntime: loadP5, loadSketch };

/** Per-component state. No sketch or mathematical state is stored globally. */
export function mountP5Experience(root: HTMLElement, dependencies: P5Dependencies = defaults): () => void {
  const host = root.querySelector<HTMLElement>('[data-p5-canvas]')!;
  const status = root.querySelector<HTMLElement>('[data-p5-status]')!;
  const play = root.querySelector<HTMLButtonElement>('[data-p5-play]')!;
  const step = root.querySelector<HTMLButtonElement>('[data-p5-step]')!;
  const stop = root.querySelector<HTMLButtonElement>('[data-p5-stop]')!;
  const events = new AbortController();
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let disposed = false;
  let generation = 0;
  let requested = false;
  let loading = false;
  let removing = false;
  let ready = false;
  let userWantsMotion = false;
  let visible = !('IntersectionObserver' in window);
  let redrawNeeded = false;
  let message = '';
  let instance: ManagedInstance | undefined;
  let prepared: { Constructor: P5Constructor; factory: SketchFactory } | undefined;

  // Wait for page load so p5 starts immediately rather than retaining a load listener.
  const active = () => visible && !document.hidden && document.readyState === 'complete';
  const animated = () => active() && userWantsMotion && !motion.matches;

  /**
   * Controls stay focusable while unavailable: a natively disabled button that
   * holds focus drops it to <body>, so keyboard users would lose their place
   * during loading or after stopping. The server-rendered `disabled` state only
   * covers the no-JavaScript case and is lifted once the controller is mounted.
   */
  function setAvailable(button: HTMLButtonElement, available: boolean) {
    button.disabled = false;
    if (available) button.removeAttribute('aria-disabled');
    else button.setAttribute('aria-disabled', 'true');
  }
  const available = (button: HTMLButtonElement) => button.getAttribute('aria-disabled') !== 'true';

  function updateControls() {
    if (disposed) return;
    setAvailable(play, !(loading || removing || (requested && (!ready || motion.matches))));
    play.textContent = loading ? 'Chargement…' : !requested ? (motion.matches ? 'Charger l’image fixe' : 'Charger et démarrer') : motion.matches ? 'Image fixe' : userWantsMotion ? 'Mettre en pause' : 'Reprendre';
    play.setAttribute('aria-pressed', String(Boolean(instance && ready && animated())));
    setAvailable(step, !(!ready || !active() || animated() || removing));
    setAvailable(stop, !((!requested && !instance) || removing));
    status.textContent = message || (removing ? 'Libération des ressources…' : loading ? 'Chargement de la bibliothèque et du sketch…' : !requested ? 'Prête à être chargée.' : !instance ? 'En attente d’affichage.' : !ready ? 'Initialisation du canevas…' : !active() ? 'Pause automatique : expérience ou onglet masqué.' : motion.matches ? 'Image fixe : préférence de mouvement réduit respectée.' : animated() ? 'Animation en cours.' : 'En pause. Vous pouvez avancer image par image.');
  }

  async function release() {
    const previous = instance;
    instance = undefined;
    ready = false;
    if (!previous) return;
    removing = true;
    updateControls();
    try { await previous.destroy(); }
    catch { message = 'Le nettoyage a signalé une erreur. Le canevas a été retiré.'; }
    finally { removing = false; updateControls(); }
  }

  function fail() {
    if (disposed) return;
    generation++;
    requested = false;
    loading = false;
    prepared = undefined;
    userWantsMotion = false;
    message = 'Expérience indisponible. Le contenu de remplacement reste accessible. Vous pouvez réessayer.';
    void release();
    updateControls();
  }

  function sync() {
    if (disposed) return;
    if (requested && prepared && !instance && !removing && active()) {
      const token = generation;
      const tone = root.dataset.p5Tone === 'clay' ? 'clay' : 'sage';
      instance = createInstance(prepared.Constructor, host, prepared.factory, resolveViewport(host.clientWidth), tone,
        () => { if (disposed || generation !== token) return; ready = true; redrawNeeded = true; sync(); },
        () => { if (!disposed && generation === token) fail(); });
    }
    if (instance && ready) {
      instance.setRunning(animated());
      if (active()) {
        instance.resize(resolveViewport(host.clientWidth));
        if (redrawNeeded && !animated()) instance.redraw();
        redrawNeeded = false;
      }
    }
    updateControls();
  }

  async function start() {
    if (disposed || loading || removing) return;
    if (requested) { userWantsMotion = !userWantsMotion; message = ''; sync(); return; }
    const id = root.dataset.p5Sketch || '';
    if (!getExperience(id)) { fail(); return; }
    const token = ++generation;
    requested = true;
    loading = true;
    message = '';
    userWantsMotion = !motion.matches;
    updateControls();
    try {
      const [Constructor, sketch] = await Promise.all([dependencies.loadRuntime(), dependencies.loadSketch(id)]);
      if (disposed || token !== generation) return;
      prepared = { Constructor, factory: sketch.createSketch };
      loading = false;
      sync();
    } catch { if (!disposed && token === generation) fail(); }
  }

  function stopInstance() {
    generation++;
    requested = false;
    loading = false;
    prepared = undefined;
    userWantsMotion = false;
    message = 'Arrêtée. Vous pouvez recharger cette expérience.';
    void release();
    updateControls();
  }

  // aria-disabled does not block activation, so every handler checks availability.
  play.addEventListener('click', () => { if (available(play)) void start(); }, { signal: events.signal });
  step.addEventListener('click', () => { if (available(step) && ready && active() && !animated()) instance?.step(); }, { signal: events.signal });
  stop.addEventListener('click', () => { if (available(stop)) stopInstance(); }, { signal: events.signal });
  document.addEventListener('visibilitychange', sync, { signal: events.signal });
  window.addEventListener('load', sync, { signal: events.signal });
  const motionChanged = () => { if (motion.matches) userWantsMotion = false; sync(); };
  motion.addEventListener('change', motionChanged);

  const intersection = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    sync();
  }) : undefined;
  intersection?.observe(root);
  // Resizing the canvas changes the observed host's height. Doing it inside the
  // ResizeObserver callback triggers "ResizeObserver loop completed with
  // undelivered notifications", so only width changes are handled, one frame later.
  let observedWidth = host.clientWidth;
  let resizeFrame = 0;
  const resized = () => {
    if (disposed || host.clientWidth === observedWidth) return;
    observedWidth = host.clientWidth;
    window.cancelAnimationFrame(resizeFrame);
    resizeFrame = window.requestAnimationFrame(() => { resizeFrame = 0; redrawNeeded = true; sync(); });
  };
  const resize = 'ResizeObserver' in window ? new ResizeObserver(resized) : undefined;
  if (resize) resize.observe(host);
  else window.addEventListener('resize', resized, { signal: events.signal });

  window.addEventListener('pagehide', event => {
    stopInstance();
    if (!event.persisted) dispose();
  }, { signal: events.signal });
  window.addEventListener('pageshow', event => { if (event.persisted) sync(); }, { signal: events.signal });

  function dispose() {
    if (disposed) return;
    disposed = true;
    generation++;
    requested = false;
    prepared = undefined;
    events.abort();
    motion.removeEventListener('change', motionChanged);
    intersection?.disconnect();
    resize?.disconnect();
    window.cancelAnimationFrame(resizeFrame);
    void release();
  }
  updateControls();
  return dispose;
}

export function registerP5Experiences(): void {
  if (customElements.get('p5-experience')) return;
  class P5ExperienceElement extends HTMLElement {
    private cleanup?: () => void;
    connectedCallback() { this.cleanup ??= mountP5Experience(this); }
    disconnectedCallback() { this.cleanup?.(); this.cleanup = undefined; }
  }
  customElements.define('p5-experience', P5ExperienceElement);
}
