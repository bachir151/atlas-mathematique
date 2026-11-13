export function initProof(root: HTMLElement): void {
  const steps = Array.from(root.querySelectorAll<HTMLDetailsElement>('[data-step]'));
  const button = root.querySelector<HTMLButtonElement>('[data-next-step]')!;
  const status = root.querySelector<HTMLElement>('[data-proof-progress]')!;

  function update() {
    const open = steps.filter(step => step.open).length;
    status.textContent = `${open} emplacement${open === 1 ? '' : 's'} ouvert${open === 1 ? '' : 's'} sur ${steps.length}`;
    button.disabled = open === steps.length;
    button.textContent = open === steps.length ? 'Tous les emplacements sont ouverts' : 'Afficher l’emplacement suivant →';
  }

  button.addEventListener('click', () => {
    const next = steps.find(step => !step.open);
    if (next) { next.open = true; next.querySelector('summary')!.focus(); }
    update();
  });
  steps.forEach(step => step.addEventListener('toggle', update));
  update();
}
