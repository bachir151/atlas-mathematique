# Demande à Codex — rédaction de la leçon 15 (Algèbre)

- **Demandeur :** Claude (développeur), à la demande de la direction du projet (« lance codex sur les leçons 11 à 16 »), le 16 novembre 2026.
- **Destinataire :** Codex (rédacteur des contenus mathématiques).
- **Statut attendu du livrable :** brouillon (`status: "draft"`), soumis à la validation de la direction.

## Contexte

- Leçons publiées et validées : 01 « Groupes & rotations du carré », 02 « Médiatrices & réflexions du plan », 03 « Suites géométriques & sommes infinies », 04 « Sous-groupes & multiples entiers », 05 « Groupes cycliques & ordre d’un élément », 06 « Morphismes & isomorphismes de groupes », 07 « Groupes quotients & classes », 08 « Permutations & cycles », 09 « Actions de groupes, orbites & stabilisateurs », 10 « Lagrange & conjugaison » (fichiers dans `src/content/lessons/`, notes `docs/demandes/codex-lecon-NN-*-reponse.md`). Les lire pour le ton, le niveau, la structure, les notations déjà fixées et les résultats que vous pouvez citer comme acquis.
- **Lire d'abord** `docs/PROGRESSION.md` et `docs/CHARTE_PEDAGOGIQUE.md`. Les modules 1 et 2 de la progression sont couverts par les leçons 04 à 10 ; les leçons 11 à 16 ouvrent le **module 3 « Anneaux, corps et polynômes »**.
- **Travail en parallèle :** les leçons 11 à 16 sont rédigées simultanément par six instances de Codex. Sujets assignés, dans l'ordre de dépendance logique (découpage proposé par Claude d'après les thèmes du module 3 ; vous pouvez justifier un écart dans la note) :
  - 11 anneaux et corps ; 12 idéaux ; 13 anneaux quotients et morphismes d'anneaux ;
  - 14 polynômes à une indéterminée ; 15 irréductibilité ; 16 corps finis.
- **Votre leçon : 15, thème assigné : irréductibilité des polynômes (définition, premiers critères sur un corps, lien avec les racines)** (module 3). Vous restez libre du contenu, du niveau, du plan, des énoncés et des preuves.
- **Cohérence entre leçons parallèles :** chaque leçon doit être lisible seule. Ne pas redémontrer ce que traite une autre leçon assignée ; la citer par son thème (« voir la leçon sur … ») sans numéro de théorème d'un texte non validé, et signaler dans la note les prérequis et les résultats que vous admettez d'une leçon voisine. Notations : celles des leçons déjà publiées (`\mathbb Z`, `d\mathbb Z`, `\mathbb Z/n\mathbb Z`).

## Ce qui est demandé

Rédiger la leçon 15 du domaine Algèbre sur le thème assigné ci-dessus. **Le choix de la progression, du niveau, des définitions, des énoncés, des démonstrations, des exemples, des exercices et des corrections appartient à Codex**, dans l’esprit du projet (de l’intuition au niveau universitaire, voir `AGENTS.md`). Une continuité avec les leçons 01 à 04 est bienvenue si elle est réelle.

Contenu attendu, comme pour les leçons précédentes :

1. le cours (définitions, énoncés, exemples, remarques ; commentaire historique facultatif et justifié) ;
2. une démonstration progressive et sa preuve intégrale ;
3. des exercices avec indices et corrections ;
4. éventuellement une section de connexions, en qualifiant chaque lien (lien mathématique démontré, application, analogie).

## Format technique (obligatoire)

- Suivre `docs/GABARIT-LECON.md` ; s’inspirer de la structure de `src/content/lessons/mediatrices-reflexions.mdx`.
- **Un seul fichier de leçon** : `src/content/lessons/<slug>.mdx`, slug en minuscules sans accents, avec `status: "draft"`, `domain: "Algèbre"`, `number: "15"`, `companion: false`.
- Ne pas utiliser `<SquareExperiment />` ni `<PlaneFigure />` (propres aux leçons 01 et 02 ; ni `<SeriesFigure />` (leçon 03), ni `<StepsFigure />` (leçon 04), ni les figures des leçons 05 à 10). Si une figure ou une manipulation serait utile (par exemple un tableau de composition ou un objet dont on modifie un paramètre), la décrire dans la note : Claude la développera après validation. Le texte et les formules doivent suffire sans figure.
- Une seule `<Proof>` par page ; chaque `id` de `sections` doit exister dans la page.
- Formules `$…$` et `$$…$$` ; `\$` pour un dollar littéral ; pas de `\href`, `\url` ni commande HTML. Tableaux Markdown possibles.
- Laisser une ligne vide après chaque balise ouvrante de composant et avant sa balise fermante.
- **Formules : éviter le motif `\{ … ^{…} … \}`** (accolades littérales encadrant une accolade de puissance dans une même formule), qui fait échouer l'analyseur MDX ; écrire `\lbrace … \rbrace` à la place.
- Typographie française : espace insécable avant `?`, `!`, `:` et `;` (U+202F ou U+00A0).

## Ce qui ne doit pas être modifié

Aucun autre fichier du projet : ni code, ni styles, ni leçons existantes, ni `catalog.ts`, ni `atlas.ts`, ni `package.json`. Claude ajoutera l’entrée de catalogue et l’adresse publique après validation.

## Note à rendre

`docs/demandes/codex-lecon-15-irreductibilite-reponse.md`, indiquant :

- le sujet retenu, le slug du fichier et la raison de ce choix ;
- le niveau visé et les prérequis ;
- le plan ;
- les précautions scientifiques ;
- les points à trancher par la direction ;
- les figures ou interactions souhaitées, décrites précisément (objets, paramètres manipulables, valeurs par défaut et bornes, ce que le lecteur doit observer), avec leur alternative textuelle, **et l'emplacement exact proposé dans la leçon (phrase après laquelle insérer la balise)**.

## Vérification (parallèle : ne pas toucher au projet)

Six instances travaillent dans le même dossier : **ne lancer ni `npm`, ni `astro`, ni compilation, ni `npm ci`, ne rien installer, ne créer aucun dossier temporaire dans le projet.** Faire seulement des contrôles de structure à la main (une seule `<Proof>`, `id` de `sections` existants, ponctuation française, formules `$…$` équilibrées). Claude compile et teste après la remise et signale toute erreur. Ne pas lancer `npm run dev`, ni commit, push ou déploiement.

## Fichiers à créer, et seulement ceux-là

- `src/content/lessons/<slug>.mdx` (slug de votre choix, propre au thème, sans accents) ;
- `docs/demandes/codex-lecon-15-irreductibilite-reponse.md`.

Ne modifier **aucun** autre fichier, en particulier ni `docs/PROGRESSION.md` (consigner vos propositions pour le module dans la note), ni `JURNAL.md`, ni le fichier de demande, ni les fichiers des autres leçons.
