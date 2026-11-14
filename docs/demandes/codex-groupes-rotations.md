# Demande à Codex — rédaction de la leçon « Groupes & rotations du carré »

- **Demandeur :** Claude (développeur), à la demande de la direction du projet, le 14 novembre 2026.
- **Destinataire :** Codex (rédacteur des contenus mathématiques).
- **Statut attendu du livrable :** brouillon (`status: "draft"`), soumis à la validation de la direction.

## Ce qui est demandé

Rédiger le contenu complet de la première leçon du site, dont l’interface existe déjà :
`/cours/groupes-rotations/` (prototype d’emplacements : `src/content/lessons/groupes-rotations.mdx`).

Le choix de la progression, du niveau, des définitions, des énoncés, des démonstrations, des exemples, des exercices et de leurs corrections appartient à Codex. Le projet vise un parcours allant de l’intuition jusqu’au niveau universitaire (voir `AGENTS.md`).

La leçon doit pouvoir accompagner la manipulation interactive déjà en place : le carré de sommets A, B, C, D que le lecteur tourne de +90°, +180° ou +270°, avec historique des actions et remise à zéro.

Il faut fournir :

1. **Le cours** : définitions, énoncés, exemples, remarques, et éventuellement un commentaire historique.
2. **Une démonstration progressive** : une suite d’étapes, plus la preuve intégrale du même résultat (elle reste toujours visible pour le lecteur).
3. **Des exercices** avec indices et corrections.
4. **Les métadonnées** de l’en-tête : titre, résumé, sections de navigation.

## Format technique (obligatoire)

- Suivre `docs/GABARIT-LECON.md`. L’exemple `src/content/lessons/exemple-gabarit.mdx` montre chaque composant.
- Écrire **un seul fichier** : `src/content/lessons/groupes-rotations-redaction.mdx`, avec `status: "draft"`. Il sera visible avec `npm run dev` à `/cours/groupes-rotations-redaction/` et exclu de la production.
- Conserver en tête de page la manipulation : `<div id="manipulation"><SquareExperiment /></div>`, avec une section `{ id: "manipulation", label: "Manipulation" }`.
- Garder `domain: "Algèbre"`, `number: "01"`, `companion: true`.
- Une seule `<Proof>` par page. Les `id` de `sections` doivent exister dans la page (`manipulation`, ceux des `<CourseSection>`, `demonstration`, `preuve-integrale`).
- Formules : `$…$` et `$$…$$` (KaTeX). `\$` pour un dollar littéral. Pas de `\href`, `\url` ni commandes HTML.
- Laisser une ligne vide après chaque balise ouvrante de composant et avant sa balise fermante.

## Ce qui ne doit pas être modifié

Aucun autre fichier du projet : pas de code, pas de styles, pas de `groupes-rotations.mdx` existant, pas de `catalog.ts`. Claude remplacera la page d’emplacements après validation par la direction.

## Ce qu’il faut rendre en plus du fichier

Une note `docs/demandes/codex-groupes-rotations-reponse.md` qui indique :

- le niveau visé et les prérequis supposés ;
- le plan de la leçon ;
- les points scientifiques ou pédagogiques que la direction doit trancher ;
- les besoins éventuels d’interactions ou de figures supplémentaires pour Claude.

## Vérification

`npm run check` puis `npm run dev` (Node 22.23.4 : `export PATH=/home/elbash/.nvm/versions/node/v22.23.4/bin:$PATH`). Une formule invalide fait échouer la compilation avec le fichier et la formule en cause.
