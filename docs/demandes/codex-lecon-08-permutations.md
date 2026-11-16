# Demande à Codex — rédaction de la leçon 08 (Algèbre)

- **Demandeur :** Claude (développeur), à la demande de la direction du projet (« lancer les leçons 5 à 10 en parallèle »), le 16 novembre 2026.
- **Destinataire :** Codex (rédacteur des contenus mathématiques).
- **Statut attendu du livrable :** brouillon (`status: "draft"`), soumis à la validation de la direction.

## Contexte

- Leçons publiées et validées : 01 « Groupes & rotations du carré » (`src/content/lessons/groupes-rotations.mdx`), 02 « Médiatrices & réflexions du plan », 03 « Suites géométriques & sommes infinies », 04 « Sous-groupes & multiples entiers » (`src/content/lessons/sous-groupes-entiers.mdx`, note `docs/demandes/codex-lecon-04-algebre-reponse.md`). Les lire pour le ton, le niveau, la structure et les notations déjà fixées.
- **Lire d'abord** `docs/PROGRESSION.md` et `docs/CHARTE_PEDAGOGIQUE.md`.
- **Travail en parallèle :** les leçons 05 à 10 sont rédigées simultanément par six instances de Codex. Sujets assignés dans l'ordre de `docs/PROGRESSION.md` :
  - 05 groupes cycliques ; 06 morphismes et isomorphismes ; 07 groupes quotients (module 1) ;
  - 08 permutations ; 09 actions de groupes, orbites et stabilisateurs ; 10 théorème de Lagrange et conjugaison (module 2).
- **Votre leçon : 08, thème assigné : permutations (groupe symétrique, cycles, décomposition, signature si pertinent)** (module 2). Vous restez libre du contenu, du niveau, du plan, des énoncés et des preuves, et pouvez justifier dans la note un écart de périmètre.
- **Cohérence entre leçons parallèles :** chaque leçon doit être lisible seule. Ne pas redémontrer ce que traite une autre leçon assignée ; pouvez la citer par son thème (« voir la leçon sur … ») sans numéro de théorème d'un texte non encore validé, et signaler dans la note les prérequis et les résultats que vous admettez d'une leçon voisine. Notations : celles des leçons 01 et 04 déjà publiées (groupe noté multiplicativement ou additivement selon l'exemple, `\mathbb Z`, `d\mathbb Z`).

## Ce qui est demandé

Rédiger la leçon 08 du domaine Algèbre sur le thème assigné ci-dessus. **Le choix de la progression, du niveau, des définitions, des énoncés, des démonstrations, des exemples, des exercices et des corrections appartient à Codex**, dans l’esprit du projet (de l’intuition au niveau universitaire, voir `AGENTS.md`). Une continuité avec les leçons 01 à 04 est bienvenue si elle est réelle.

Contenu attendu, comme pour les leçons précédentes :

1. le cours (définitions, énoncés, exemples, remarques ; commentaire historique facultatif et justifié) ;
2. une démonstration progressive et sa preuve intégrale ;
3. des exercices avec indices et corrections ;
4. éventuellement une section de connexions, en qualifiant chaque lien (lien mathématique démontré, application, analogie).

## Format technique (obligatoire)

- Suivre `docs/GABARIT-LECON.md` ; s’inspirer de la structure de `src/content/lessons/mediatrices-reflexions.mdx`.
- **Un seul fichier de leçon** : `src/content/lessons/<slug>.mdx`, slug en minuscules sans accents, avec `status: "draft"`, `domain: "Algèbre"`, `number: "08"`, `companion: false`.
- Ne pas utiliser `<SquareExperiment />` ni `<PlaneFigure />` (propres aux leçons 01 et 02 ; ni `<SeriesFigure />` (leçon 03), ni `<StepsFigure />` (leçon 04)). Si une figure ou une manipulation serait utile (par exemple un tableau de composition ou un objet dont on modifie un paramètre), la décrire dans la note : Claude la développera après validation. Le texte et les formules doivent suffire sans figure.
- Une seule `<Proof>` par page ; chaque `id` de `sections` doit exister dans la page.
- Formules `$…$` et `$$…$$` ; `\$` pour un dollar littéral ; pas de `\href`, `\url` ni commande HTML. Tableaux Markdown possibles.
- Laisser une ligne vide après chaque balise ouvrante de composant et avant sa balise fermante.
- Typographie française : espace insécable avant `?`, `!`, `:` et `;` (U+202F ou U+00A0).

## Ce qui ne doit pas être modifié

Aucun autre fichier du projet : ni code, ni styles, ni leçons existantes, ni `catalog.ts`, ni `atlas.ts`, ni `package.json`. Claude ajoutera l’entrée de catalogue et l’adresse publique après validation.

## Note à rendre

`docs/demandes/codex-lecon-08-permutations-reponse.md`, indiquant :

- le sujet retenu, le slug du fichier et la raison de ce choix ;
- le niveau visé et les prérequis ;
- le plan ;
- les précautions scientifiques ;
- les points à trancher par la direction ;
- les figures ou interactions souhaitées, décrites précisément (objets, paramètres manipulables, valeurs par défaut et bornes, ce que le lecteur doit observer), avec leur alternative textuelle.

## Vérification (parallèle : ne pas toucher au projet)

Six instances travaillent dans le même dossier : **ne lancer ni `npm`, ni `astro`, ni compilation, ni `npm ci`, ne rien installer, ne créer aucun dossier temporaire dans le projet.** Faire seulement des contrôles de structure à la main (une seule `<Proof>`, `id` de `sections` existants, ponctuation française, formules `$…$` équilibrées). Claude compile et teste après la remise et signale toute erreur. Ne pas lancer `npm run dev`, ni commit, push ou déploiement.

## Fichiers à créer, et seulement ceux-là

- `src/content/lessons/<slug>.mdx` (slug de votre choix, propre au thème, sans accents) ;
- `docs/demandes/codex-lecon-08-permutations-reponse.md`.

Ne modifier **aucun** autre fichier, en particulier ni `docs/PROGRESSION.md` (consigner vos propositions pour le module dans la note), ni `JURNAL.md`, ni le fichier de demande, ni les fichiers des autres leçons.
