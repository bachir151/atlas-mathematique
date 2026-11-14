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
  { id: 'analyse', title: 'Analyse', domain: 'Analyse', status: 'planned', number: '03', visual: 'wave' },
];

export function filterLessons(query: string, domain: string): readonly LessonEntry[] {
  const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('fr');
  const needle = normalize(query.trim());
  return lessons.filter(lesson => (domain === 'all' || lesson.domain === domain) && normalize(lesson.title).includes(needle));
}
