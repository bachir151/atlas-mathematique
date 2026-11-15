export type LinkKind = 'demonstrated' | 'model' | 'analogy';
export interface AtlasNode {
  id: string;
  label: string;
  position: readonly [number, number, number];
  color: string;
  href?: string;
}
export interface AtlasLink {
  source: string;
  target: string;
  kind: LinkKind;
  justification: string;
  validated: boolean;
}

export const linkKinds: Record<LinkKind, string> = {
  demonstrated: 'Lien mathématique démontré',
  model: 'Application / modèle scientifique',
  analogy: 'Analogie / interprétation',
};

// These positions and colors are visual layout choices, not scientific claims.
export const atlasNodes: readonly AtlasNode[] = [
  { id: 'groupes', label: 'Groupes', position: [-1.65, 0.55, 0.3], color: '#33594b', href: '/cours/groupes-rotations/' },
  { id: 'rotations', label: 'Rotations du carré', position: [0.15, 1.4, 0], color: '#a65b36', href: '/cours/groupes-rotations/' },
  { id: 'geometrie', label: 'Géométrie', position: [1.7, 0.3, -0.4], color: '#33594b', href: '/cours/mediatrices-reflexions/' },
  { id: 'analyse', label: 'Analyse', position: [0.8, -1.3, 0.6], color: '#77634b', href: '/cours/suites-geometriques-sommes-infinies/' },
  { id: 'topologie', label: 'Topologie', position: [-1.1, -1.25, -0.5], color: '#586879' },
];

// No scientific links are invented for this prototype. Validated entries can be
// provided by ChatGPT and the director later, independently of the renderer.
export const atlasLinks: readonly AtlasLink[] = [];

export function approvedLinks(links: readonly AtlasLink[]): readonly AtlasLink[] {
  return links.filter(link => link.validated && link.justification.trim().length > 0);
}
