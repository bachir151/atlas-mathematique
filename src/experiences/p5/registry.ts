import type { ExperienceDefinition } from './types.ts';

export const experiences = {
  'technical-bars': {
    title: 'Banc de rendu 2D',
    approval: { kind: 'technical', status: 'prototype' },
  },
} satisfies Record<string, ExperienceDefinition>;

export type ExperienceId = keyof typeof experiences;

export function getExperience(id: string): ExperienceDefinition | undefined {
  return Object.hasOwn(experiences, id) ? experiences[id as ExperienceId] : undefined;
}

export function loadSketch(id: string) {
  if (id === 'technical-bars') return import('./sketches/technical-bars.ts');
  return Promise.reject(new Error('Expérience inconnue'));
}
