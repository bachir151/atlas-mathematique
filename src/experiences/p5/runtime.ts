import type { P5Constructor } from './types.ts';

// Self-hosted copy of node_modules/p5/lib/p5.min.js (npm package pinned in
// package.json / package-lock.json). scripts/vendor-p5.mjs copies it to
// public/vendor/ before `dev` and `build`, and refuses any file whose hash
// differs from `integrity`; the browser checks the same hash (SRI).
// To upgrade: change the npm version, then `version` and `integrity` here.
export const P5_RUNTIME = {
  version: '2.4.0',
  url: '/vendor/p5/2.4.0/p5.min.js',
  integrity: 'sha384-rcP1CPdkMPs3RfZNrF0DgxdaFM1t5rcIw5CmGbe+Y/2EVHpXRuKoaRqnjQfkg8/a',
} as const;

/** The download is still running after `timeoutMs`; a retry reuses it. */
export class P5SlowLoadError extends Error {
  constructor() { super('Chargement de p5.js plus long que prévu.'); this.name = 'P5SlowLoadError'; }
}

let pending: Promise<P5Constructor> | undefined;
// Our own <script>, kept while it downloads, so that a slow connection is never
// restarted from zero and a late load is still recognised as ours.
let element: HTMLScriptElement | undefined;

function createScript(): HTMLScriptElement {
  const script = document.createElement('script');
  script.src = P5_RUNTIME.url;
  script.async = true;
  script.integrity = P5_RUNTIME.integrity;
  script.crossOrigin = 'anonymous';
  script.referrerPolicy = 'no-referrer';
  script.dataset.atelierP5 = P5_RUNTIME.version;
  // A network or integrity error is final for this element, even after a timeout.
  script.addEventListener('error', () => { script.remove(); if (element === script) element = undefined; }, { once: true });
  document.head.append(script);
  return script;
}

/** One library load shared by all components; each sketch gets its own instance. */
export function loadP5(timeoutMs = 30000): Promise<P5Constructor> {
  if (pending) return pending;
  pending = new Promise<P5Constructor>((resolve, reject) => {
    const browser = window as Window & { p5?: P5Constructor };
    const ours = element?.isConnected ? element : undefined;
    if (browser.p5) {
      // Loaded after an earlier timeout: it is our verified copy.
      if (ours && typeof browser.p5 === 'function') { resolve(browser.p5); return; }
      reject(new Error('Une autre installation p5.js est déjà présente.'));
      return;
    }
    const script = ours ?? createScript();
    element = script;
    const clear = () => {
      window.clearTimeout(timer);
      script.removeEventListener('load', loaded);
      script.removeEventListener('error', failed);
    };
    const loaded = () => {
      clear();
      if (typeof browser.p5 === 'function') resolve(browser.p5);
      else { script.remove(); element = undefined; reject(new Error('Constructeur p5.js indisponible.')); }
    };
    const failed = () => { clear(); reject(new Error('Chargement de p5.js impossible.')); };
    // Slow is not failed: the download goes on and the next call waits for it.
    const slow = () => { clear(); reject(new P5SlowLoadError()); };
    const timer = window.setTimeout(slow, timeoutMs);
    script.addEventListener('load', loaded, { once: true });
    script.addEventListener('error', failed, { once: true });
  }).catch(error => { pending = undefined; throw error; });
  return pending;
}
