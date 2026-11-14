export function initProof(root: HTMLElement): void {
  const steps = Array.from(root.querySelectorAll<HTMLDetailsElement>('[data-step]'));
  const button = root.querySelector<HTMLButtonElement>('[data-next-step]')!;
  const status = root.querySelector<HTMLElement>('[data-proof-progress]')!;

  function update() {
    const open = steps.filter(step => step.open).length;
    const plural = open > 1 ? 's' : ''; // French: 0 and 1 take the singular
    status.textContent = `${open} étape${plural} ouverte${plural} sur ${steps.length}`;
    button.disabled = open === steps.length;
    button.textContent = open === steps.length ? 'Toutes les étapes sont ouvertes' : 'Afficher l’étape suivante →';
  }

  button.addEventListener('click', () => {
    const next = steps.find(step => !step.open);
    if (next) { next.open = true; next.querySelector('summary')!.focus(); }
    update();
  });
  steps.forEach(step => step.addEventListener('toggle', update));
  update();
}
