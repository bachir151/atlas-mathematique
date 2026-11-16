export interface LessonEntry {
  id: string;
  title: string;
  domain: 'Algèbre' | 'Géométrie' | 'Analyse';
  status: 'validated' | 'prototype' | 'planned';
  href?: string;
  number: string;
  visual: 'square' | 'orbit' | 'wave';
}

// Navigation metadata only. No scientific explanations or lesson text here.
export const lessons: readonly LessonEntry[] = [
  { id: 'groupes-rotations', title: 'Groupes & rotations du carré', domain: 'Algèbre', status: 'validated', href: '/cours/groupes-rotations/', number: '01', visual: 'square' },
  { id: 'mediatrices-reflexions', title: 'Médiatrices & réflexions du plan', domain: 'Géométrie', status: 'validated', href: '/cours/mediatrices-reflexions/', number: '02', visual: 'orbit' },
  { id: 'suites-geometriques-sommes-infinies', title: 'Suites géométriques & sommes infinies', domain: 'Analyse', status: 'validated', href: '/cours/suites-geometriques-sommes-infinies/', number: '03', visual: 'wave' },
  { id: 'sous-groupes-entiers', title: 'Sous-groupes & multiples entiers', domain: 'Algèbre', status: 'validated', href: '/cours/sous-groupes-entiers/', number: '04', visual: 'square' },
  { id: 'groupes-cycliques', title: 'Groupes cycliques & ordre d’un élément', domain: 'Algèbre', status: 'validated', href: '/cours/groupes-cycliques/', number: '05', visual: 'orbit' },
  { id: 'morphismes-isomorphismes', title: 'Morphismes & isomorphismes de groupes', domain: 'Algèbre', status: 'validated', href: '/cours/morphismes-isomorphismes/', number: '06', visual: 'square' },
  { id: 'groupes-quotients', title: 'Groupes quotients & classes', domain: 'Algèbre', status: 'validated', href: '/cours/groupes-quotients/', number: '07', visual: 'wave' },
  { id: 'permutations-cycles', title: 'Permutations & cycles', domain: 'Algèbre', status: 'validated', href: '/cours/permutations-cycles/', number: '08', visual: 'orbit' },
  { id: 'actions-orbites-stabilisateurs', title: 'Actions de groupes, orbites & stabilisateurs', domain: 'Algèbre', status: 'validated', href: '/cours/actions-orbites-stabilisateurs/', number: '09', visual: 'square' },
  { id: 'lagrange-conjugaison', title: 'Lagrange & conjugaison', domain: 'Algèbre', status: 'validated', href: '/cours/lagrange-conjugaison/', number: '10', visual: 'wave' },
];

export function filterLessons(query: string, domain: string): readonly LessonEntry[] {
  const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('fr');
  const needle = normalize(query.trim());
  return lessons.filter(lesson => (domain === 'all' || lesson.domain === domain) && normalize(lesson.title).includes(needle));
}
