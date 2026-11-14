import type { P5Constructor } from './types.ts';

// Official download documentation recommends this versioned CDN URL.
// Replace the URL with a locally hosted copy to run fully offline.
export const P5_RUNTIME = {
  version: '2.4.0',
  url: 'https://cdn.jsdelivr.net/npm/p5@2.4.0/lib/p5.min.js',
} as const;

let pending: Promise<P5Constructor> | undefined;

/** One library load shared by all components; each sketch gets its own instance. */
export function loadP5(): Promise<P5Constructor> {
  if (pending) return pending;
  pending = new Promise<P5Constructor>((resolve, reject) => {
    const browser = window as Window & { p5?: P5Constructor };
    if (browser.p5) { reject(new Error('Une autre installation p5.js est déjà présente.')); return; }
    const script = document.createElement('script');
    script.src = P5_RUNTIME.url;
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.referrerPolicy = 'no-referrer';
    script.dataset.atelierP5 = P5_RUNTIME.version;
    const clear = () => {
      window.clearTimeout(timer);
      script.removeEventListener('load', loaded);
      script.removeEventListener('error', failed);
    };
    const loaded = () => {
      clear();
      if (typeof browser.p5 === 'function') resolve(browser.p5);
      else { script.remove(); reject(new Error('Constructeur p5.js indisponible.')); }
    };
    const failed = () => { clear(); script.remove(); reject(new Error('Chargement de p5.js impossible.')); };
    const timer = window.setTimeout(failed, 15000);
    script.addEventListener('load', loaded, { once: true });
    script.addEventListener('error', failed, { once: true });
    document.head.append(script);
  }).catch(error => { pending = undefined; throw error; });
  return pending;
}
