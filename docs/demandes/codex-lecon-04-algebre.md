# Demande à Codex — rédaction de la leçon 04 (Algèbre)

- **Demandeur :** Claude (développeur), à la demande de la direction du projet (« Algèbre je choisis »), le 16 novembre 2026.
- **Destinataire :** Codex (rédacteur des contenus mathématiques).
- **Statut attendu du livrable :** brouillon (`status: "draft"`), soumis à la validation de la direction.

## Contexte

- Leçons publiées et validées :
  - 01 « Groupes & rotations du carré » (Algèbre ; `src/content/lessons/groupes-rotations.mdx`, note `docs/demandes/codex-groupes-rotations-reponse.md`) ;
  - 02 « Médiatrices & réflexions du plan » (Géométrie ; note `docs/demandes/codex-lecon-02-geometrie-reponse.md`) ;
  - 03 « Suites géométriques & sommes infinies » (Analyse ; `src/content/lessons/suites-geometriques-sommes-infinies.mdx`, note `docs/demandes/codex-lecon-03-analyse-reponse.md`). Niveau lycée pour le parcours principal, approfondissements facultatifs de niveau début de licence.
- La direction choisit le domaine **Algèbre** pour la leçon 04. La progression de référence est dans `docs/PROGRESSION.md` (sept modules, rubriques encore « À compléter par Codex ») et les principes dans `docs/CHARTE_PEDAGOGIQUE.md` : les lire d'abord. La leçon 04 doit s'inscrire dans le module 1 ou 2 ; compléter au passage les rubriques de ce module que la leçon éclaire, dans la note de réponse (sans modifier `PROGRESSION.md` sans autorisation).

## Ce qui est demandé

Rédiger la leçon 04 du domaine Algèbre. **Le choix du sujet, de la progression, du niveau, des définitions, des énoncés, des démonstrations, des exemples, des exercices et des corrections appartient à Codex**, dans l’esprit du projet (de l’intuition au niveau universitaire, voir `AGENTS.md`). Une suite de la leçon 01 (groupes, rotations du carré) est possible mais non imposée ; une continuité avec les leçons 02 et 03 est bienvenue si elle est réelle, mais non obligatoire.

Contenu attendu, comme pour les leçons précédentes :

1. le cours (définitions, énoncés, exemples, remarques ; commentaire historique facultatif et justifié) ;
2. une démonstration progressive et sa preuve intégrale ;
3. des exercices avec indices et corrections ;
4. éventuellement une section de connexions, en qualifiant chaque lien (lien mathématique démontré, application, analogie).

## Format technique (obligatoire)

- Suivre `docs/GABARIT-LECON.md` ; s’inspirer de la structure de `src/content/lessons/mediatrices-reflexions.mdx`.
- **Un seul fichier de leçon** : `src/content/lessons/<slug>.mdx`, slug en minuscules sans accents, avec `status: "draft"`, `domain: "Algèbre"`, `number: "04"`, `companion: false`.
- Ne pas utiliser `<SquareExperiment />` ni `<PlaneFigure />` (propres aux leçons 01 et 02 ; ni `<SeriesFigure />`, propre à la leçon 03). Si une figure ou une manipulation serait utile (par exemple un tableau de composition ou un objet dont on modifie un paramètre), la décrire dans la note : Claude la développera après validation. Le texte et les formules doivent suffire sans figure.
- Une seule `<Proof>` par page ; chaque `id` de `sections` doit exister dans la page.
- Formules `$…$` et `$$…$$` ; `\$` pour un dollar littéral ; pas de `\href`, `\url` ni commande HTML. Tableaux Markdown possibles.
- Laisser une ligne vide après chaque balise ouvrante de composant et avant sa balise fermante.
- Typographie française : espace insécable avant `?`, `!`, `:` et `;` (U+202F ou U+00A0).

## Ce qui ne doit pas être modifié

Aucun autre fichier du projet : ni code, ni styles, ni leçons existantes, ni `catalog.ts`, ni `atlas.ts`, ni `package.json`. Claude ajoutera l’entrée de catalogue et l’adresse publique après validation.

## Note à rendre

`docs/demandes/codex-lecon-04-algebre-reponse.md`, indiquant :

- le sujet retenu, le slug du fichier et la raison de ce choix ;
- le niveau visé et les prérequis ;
- le plan ;
- les précautions scientifiques ;
- les points à trancher par la direction ;
- les figures ou interactions souhaitées, décrites précisément (objets, paramètres manipulables, valeurs par défaut et bornes, ce que le lecteur doit observer), avec leur alternative textuelle.

## Vérification

Node 22.23.4 : `nvm use` (`.nvmrc`), puis `npm run check` et `ATELIER_DRAFTS=1 npx astro build --outDir /tmp/codex-drafts-build-04`. En cas d’erreur `EXDEV`, compiler depuis une copie temporaire. Claude met à jour des dépendances en parallèle : si une vérification échoue pour une raison étrangère à la leçon, le signaler dans la note sans modifier le code. Ne pas lancer `npm run dev` (serveur de la direction sur le port 4321), ni commit, push ou déploiement.
