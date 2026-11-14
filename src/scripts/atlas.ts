import { atlasNodes, atlasLinks, approvedLinks } from '../data/atlas';
import { setAvailable } from '../lib/availability';

/** The graph data has no dependency on Three.js. The DOM map is the default. */
export function initAtlas(root: HTMLElement): void {
  const stage = root.querySelector<HTMLElement>('[data-atlas-stage]')!;
  const host = root.querySelector<HTMLElement>('[data-canvas]')!;
  const map = root.querySelector<HTMLElement>('[data-map]')!;
  const status = root.querySelector<HTMLElement>('[data-atlas-status]')!;
  const cameraBar = root.querySelector<HTMLElement>('[data-camera]')!;
  const threeButton = root.querySelector<HTMLButtonElement>('[data-mode="3d"]')!;
  const controller = new AbortController();
  const { signal } = controller;
  let cleanupScene: (() => void) | undefined;
  let sceneAvailable = false;
  let disposed = false;
  let selectedId = '';
  let activeMode: '2d' | '3d' = '2d';
  let modeChosenByUser = false;
  let onSelection: ((id: string) => void) | undefined;
  let requestRender: (() => void) | undefined;

  function setMode(mode: '2d' | '3d') {
    activeMode = mode === '3d' && sceneAvailable ? '3d' : '2d';
    host.hidden = activeMode !== '3d';
    map.hidden = activeMode !== '2d';
    cameraBar.hidden = activeMode !== '3d';
    root.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.mode === activeMode)));
    if (activeMode === '3d') { status.textContent = 'Vue 3D · faites glisser pour orienter la carte.'; requestRender?.(); }
    else status.textContent = 'Vue 2D · sélectionnez un thème sur la carte ou dans la liste.';
  }
  function select(id: string) {
    const node = atlasNodes.find(item => item.id === id);
    if (!node) return;
    selectedId = id;
    root.querySelectorAll<HTMLButtonElement>('[data-node]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.node === id)));
    root.querySelector<HTMLElement>('[data-node-title]')!.textContent = node.label;
    root.querySelector<HTMLElement>('[data-node-description]')!.textContent = node.href ? 'Une manipulation technique est disponible. Le cours et la preuve attendent leur validation.' : 'Emplacement provisoire. Aucun cours validé n’est disponible pour ce thème.';
    const link = root.querySelector<HTMLAnchorElement>('[data-node-link]')!;
    link.hidden = !node.href;
    if (node.href) link.href = node.href;
    onSelection?.(id);
  }
  root.addEventListener('click', event => {
    if (!(event.target instanceof Element)) return;
    const node = event.target.closest<HTMLButtonElement>('[data-node]');
    if (node) { modeChosenByUser = true; select(node.dataset.node!); }
    const mode = event.target.closest<HTMLButtonElement>('[data-mode]')?.dataset.mode;
    // An unavailable 3D button stays focusable but does nothing (and keeps its explanatory status).
    if (mode === '2d' || (mode === '3d' && sceneAvailable)) { modeChosenByUser = true; setMode(mode); }
  }, { signal });
  map.addEventListener('focusin', () => { modeChosenByUser = true; }, { signal });

  async function loadScene() {
    try {
      const [THREE, { OrbitControls }] = await Promise.all([import('../lib/three-primitives'), import('three/examples/jsm/controls/OrbitControls.js')]);
      if (disposed) return;
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
      // Install cleanup immediately so a later setup error cannot leak the GPU context.
      const cleanups: (() => void)[] = [];
      let sceneDisposed = false;
      cleanupScene = () => {
        if (sceneDisposed) return;
        sceneDisposed = true;
        cleanups.reverse().forEach(dispose => dispose());
        renderer.dispose(); host.replaceChildren();
        requestRender = undefined; onSelection = undefined;
      };
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.domElement.setAttribute('aria-hidden', 'true');
      host.append(renderer.domElement);
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 50);
      camera.position.set(0, 0, 7.5);
      const controls = new OrbitControls(camera, renderer.domElement);
      cleanups.push(() => controls.dispose());
      controls.enableDamping = false;
      controls.enablePan = false;
      controls.enableZoom = false;
      controls.minPolarAngle = Math.PI * 0.2;
      controls.maxPolarAngle = Math.PI * 0.8;
      const sceneController = new AbortController();
      cleanups.push(() => sceneController.abort());
      const sphere = new THREE.SphereGeometry(0.105, 20, 12);
      const materials: InstanceType<typeof THREE.Material>[] = [];
      const lines: InstanceType<typeof THREE.BufferGeometry>[] = [];
      const meshes = new Map<string, InstanceType<typeof THREE.Mesh>>();
      const labels = new Map<string, HTMLButtonElement>();
      cleanups.push(() => { sphere.dispose(); lines.forEach(geometry => geometry.dispose()); materials.forEach(material => material.dispose()); });
      atlasNodes.forEach(node => {
        const material = new THREE.MeshBasicMaterial({ color: node.color }); materials.push(material);
        const mesh = new THREE.Mesh(sphere, material);
        mesh.position.set(...node.position); scene.add(mesh); meshes.set(node.id, mesh);
        const label = document.createElement('button');
        label.type = 'button'; label.className = 'atlas-3d-label'; label.dataset.node = node.id;
        label.textContent = node.label; label.setAttribute('aria-pressed', String(node.id === selectedId));
        host.append(label); labels.set(node.id, label);
      });
      // A light wireframe sphere gives depth without suggesting scientific links.
      const globeGeometry = new THREE.SphereGeometry(2.25, 16, 10); lines.push(globeGeometry);
      const globeMaterial = new THREE.MeshBasicMaterial({ color: '#33594b', wireframe: true, transparent: true, opacity: 0.055 }); materials.push(globeMaterial);
      scene.add(new THREE.Mesh(globeGeometry, globeMaterial));
      for (const link of approvedLinks(atlasLinks)) {
        const source = atlasNodes.find(node => node.id === link.source);
        const target = atlasNodes.find(node => node.id === link.target);
        if (!source || !target) continue;
        const geometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...source.position), new THREE.Vector3(...target.position)]); lines.push(geometry);
        const material = new THREE.LineBasicMaterial({ color: '#33594b', transparent: true, opacity: 0.3 }); materials.push(material);
        scene.add(new THREE.Line(geometry, material));
      }
      let frame = 0;
      let inViewport = true;
      let lastWidth = 0;
      let lastHeight = 0;
      cleanups.push(() => cancelAnimationFrame(frame));
      const point = new THREE.Vector3();
      function render() {
        frame = 0;
        if (sceneDisposed || document.hidden || !inViewport || activeMode !== '3d') return;
        const width = stage.clientWidth;
        const height = stage.clientHeight;
        if (!width || !height) return;
        if (width !== lastWidth || height !== lastHeight) {
          camera.aspect = width / height;
          renderer.setSize(width, height, false);
          lastWidth = width; lastHeight = height;
        }
        camera.updateProjectionMatrix();
        renderer.render(scene, camera);
        atlasNodes.forEach(node => {
          point.copy(meshes.get(node.id)!.position).project(camera);
          const label = labels.get(node.id)!;
          label.style.left = `${(point.x * 0.5 + 0.5) * width}px`;
          label.style.top = `${(-point.y * 0.5 + 0.5) * height + 18}px`;
          label.hidden = point.z > 1 || point.z < -1;
        });
      }
      requestRender = () => { if (!sceneDisposed && !frame) frame = requestAnimationFrame(render); };
      onSelection = id => { meshes.forEach((mesh, key) => mesh.scale.setScalar(id === key ? 1.6 : 1)); requestRender?.(); };
      if (selectedId) onSelection(selectedId);
      controls.addEventListener('change', requestRender);
      const resize = new ResizeObserver(() => requestRender?.()); resize.observe(stage);
      cleanups.push(() => resize.disconnect());
      const visibility = new IntersectionObserver(entries => { inViewport = entries[0].isIntersecting; if (inViewport) requestRender?.(); }); visibility.observe(stage);
      cleanups.push(() => visibility.disconnect());
      document.addEventListener('visibilitychange', () => { if (!document.hidden) requestRender?.(); }, { signal: sceneController.signal });
      cameraBar.addEventListener('click', event => {
        if (!(event.target instanceof Element)) return;
        const zoom = event.target.closest<HTMLElement>('[data-zoom]')?.dataset.zoom;
        if (zoom) camera.zoom = THREE.MathUtils.clamp(camera.zoom * (zoom === 'in' ? 1.2 : 1 / 1.2), 0.65, 2.4);
        if (event.target.closest('[data-reset]')) { controls.reset(); camera.zoom = 1; }
        requestRender?.();
      }, { signal: sceneController.signal });
      renderer.domElement.addEventListener('webglcontextlost', event => {
        event.preventDefault(); sceneAvailable = false; setAvailable(threeButton, false);
        // Removing the scene would drop focus held by a 3D label: move it to the 2D map first.
        const focusInScene = host.contains(document.activeElement);
        setMode('2d');
        if (focusInScene) (map.querySelector<HTMLButtonElement>(`[data-node="${selectedId}"]`) ?? map.querySelector<HTMLButtonElement>('[data-node]'))?.focus();
        status.textContent = 'Le contexte WebGL a été perdu. La carte 2D et la liste restent disponibles.';
        cleanupScene?.();
      }, { signal: sceneController.signal });
      sceneAvailable = true; setAvailable(threeButton, true);
      // No automatic movement; reduced-motion users start in the DOM map.
      if (!modeChosenByUser && !matchMedia('(prefers-reduced-motion: reduce)').matches) setMode('3d');
      else setMode('2d');
    } catch {
      cleanupScene?.(); sceneAvailable = false; setAvailable(threeButton, false); host.replaceChildren(); setMode('2d');
      status.textContent = 'La vue 3D est indisponible. La carte 2D et la liste restent utilisables.';
    }
  }
  const lazy = new IntersectionObserver(entries => {
    if (!entries.some(entry => entry.isIntersecting)) return;
    lazy.disconnect(); void loadScene();
  }, { rootMargin: '160px' });
  lazy.observe(stage);
  window.addEventListener('pagehide', event => {
    if (event.persisted) return;
    disposed = true; lazy.disconnect(); cleanupScene?.(); controller.abort();
  }, { signal });
}
