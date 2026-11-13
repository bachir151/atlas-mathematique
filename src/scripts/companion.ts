const replies = {
  commands: 'Les boutons +90°, +180° et +270° se trouvent sous le carré. « Réinitialiser » remet la manipulation à zéro.',
  proof: 'La zone « Preuve intégrale » est toujours visible dans la section Démonstration. Son contenu attend une validation scientifique.',
  fallback: 'Ceci est une simulation d’interface. Je ne fournis pas de réponse mathématique. Utilisez les questions suggérées pour repérer les commandes et la zone de preuve.',
};
export function initCompanion(root: HTMLElement): void {
  root.querySelectorAll<HTMLButtonElement | HTMLInputElement>('button, input').forEach(control => { control.disabled = false; });
  const toggle = root.querySelector<HTMLButtonElement>('[data-companion-toggle]')!;
  const body = root.querySelector<HTMLElement>('[data-companion-body]')!;
  const log = root.querySelector<HTMLElement>('[data-chat]')!;
  const form = root.querySelector<HTMLFormElement>('[data-chat-form]')!;
  const input = form.querySelector<HTMLInputElement>('input')!;
  toggle.addEventListener('click', () => { body.hidden = !body.hidden; toggle.setAttribute('aria-expanded', String(!body.hidden)); toggle.textContent = body.hidden ? 'Afficher' : 'Masquer'; });
  const add = (text: string, role: 'user' | 'assistant') => {
    const message = document.createElement('p');
    message.className = `chat-message ${role}`;
    message.textContent = text;
    log.append(message);
    while (log.children.length > 20) log.firstElementChild?.remove();
    log.scrollTop = log.scrollHeight;
  };
  const send = (message: string, reply: keyof typeof replies) => { add(message, 'user'); add(replies[reply], 'assistant'); };
  root.querySelectorAll<HTMLButtonElement>('[data-prompt]').forEach(button => {
    button.addEventListener('click', () => { send(button.textContent || '', button.dataset.prompt as 'commands' | 'proof'); });
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    const message = input.value.trim().slice(0, 300);
    if (!message) return;
    send(message, 'fallback'); input.value = ''; input.focus();
  });
}
