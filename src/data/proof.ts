export interface PendingProofStep { id: string; title: string; placeholder: string }

// Interface slots, not an invented outline of a mathematical argument.
export const proofSteps: readonly PendingProofStep[] = [
  { id: 'step-1', title: 'Emplacement 01', placeholder: 'Première étape : contenu en attente de validation.' },
  { id: 'step-2', title: 'Emplacement 02', placeholder: 'Deuxième étape : contenu en attente de validation.' },
  { id: 'step-3', title: 'Emplacement 03', placeholder: 'Troisième étape : contenu en attente de validation.' },
];
export const fullProofPlaceholder = 'Aucune démonstration validée n’a encore été fournie. La preuve intégrale sera affichée ici, indépendamment de la progression et sans déverrouillage.';
