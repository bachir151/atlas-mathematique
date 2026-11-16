# Demande à Codex — rédaction de la leçon 17 (Algèbre)

- **Demandeur :** Claude (développeur), à la demande de la direction du projet (« lance codex sur les leçons 17 à 22 »), le 16 novembre 2026.
- **Destinataire :** Codex (rédacteur des contenus mathématiques).
- **Statut attendu du livrable :** brouillon (`status: "draft"`), soumis à la validation de la direction.

## Contexte

- Leçons publiées et validées : 01 « Groupes & rotations du carré », 02 « Médiatrices & réflexions du plan », 03 « Suites géométriques & sommes infinies », 04 « Sous-groupes & multiples entiers », 05 « Groupes cycliques & ordre d’un élément », 06 « Morphismes & isomorphismes de groupes », 07 « Groupes quotients & classes », 08 « Permutations & cycles », 09 « Actions de groupes, orbites & stabilisateurs », 10 « Lagrange & conjugaison », 11 « Anneaux & corps », 12 « Idéaux & multiples », 13 « Anneaux quotients & morphismes », 14 « Polynômes, division & racines », 15 « Polynômes irréductibles & racines », 16 « Corps finis & polynômes irréductibles » (fichiers dans `src/content/lessons/`, notes `docs/demandes/codex-lecon-NN-*-reponse.md`). Les lire pour le ton, le niveau, la structure, les notations déjà fixées et les résultats que vous pouvez citer comme acquis (corps, polynômes, groupes, rotations du carré).
- **Lire d'abord** `docs/PROGRESSION.md` et `docs/CHARTE_PEDAGOGIQUE.md`. Les modules 1 à 3 de la progression sont couverts par les leçons 04 à 16 ; les leçons 17 à 22 ouvrent le **module 4 « Algèbre linéaire structurelle »** (17 à 20) puis le **module 5 « Groupes de Lie »** (21 et 22).
- **Travail en parallèle :** les leçons 17 à 22 sont rédigées simultanément par six instances de Codex. Sujets assignés, dans l'ordre de dépendance logique (découpage proposé par Claude d'après les thèmes des modules 4 et 5 ; vous pouvez justifier un écart dans la note) :
  - 17 espaces vectoriels abstraits ; 18 dualité ; 19 endomorphismes ; 20 diagonalisation (module 4) ;
  - 21 rotations et groupes matriciels ; 22 exponentielle matricielle et premières algèbres de Lie (module 5).
- **Votre leçon : 17, thème assigné : espaces vectoriels abstraits (axiomes, exemples non géométriques, sous-espaces, familles libres et génératrices, bases)** (module 4). Vous restez libre du contenu, du niveau, du plan, des énoncés et des preuves.
- **Cohérence entre leçons parallèles :** chaque leçon doit être lisible seule. Ne pas redémontrer ce que traite une autre leçon assignée ; la citer par son thème (« voir la leçon sur … ») sans numéro de théorème d'un texte non validé, et signaler dans la note les prérequis et les résultats que vous admettez d'une leçon voisine. Notations : celles des leçons déjà publiées. Le corps de base doit être précisé (ℝ, ℚ ou un corps quelconque) et la convention de rotation des leçons 01 et 09 n'étant pas encore harmonisée, **ne pas vous appuyer sur le sens de rotation de ces deux leçons : définir explicitement la matrice de rotation utilisée** (leçons 21 et 22).

## Ce qui est demandé

Rédiger la leçon 17 du domaine Algèbre sur le thème assigné ci-dessus. **Le choix de la progression, du niveau, des définitions, des énoncés, des démonstrations, des exemples, des exercices et des corrections appartient à Codex**, dans l’esprit du projet (de l’intuition au niveau universitaire, voir `AGENTS.md`). Une continuité avec les leçons 01 à 04 est bienvenue si elle est réelle.

Contenu attendu, comme pour les leçons précédentes :

1. le cours (définitions, énoncés, exemples, remarques ; commentaire historique facultatif et justifié) ;
2. une démonstration progressive et sa preuve intégrale ;
3. des exercices avec indices et corrections ;
4. éventuellement une section de connexions, en qualifiant chaque lien (lien mathématique démontré, application, analogie).

## Format technique (obligatoire)

- Suivre `docs/GABARIT-LECON.md` ; s’inspirer de la structure de `src/content/lessons/mediatrices-reflexions.mdx`.
- **Un seul fichier de leçon** : `src/content/lessons/<slug>.mdx`, slug en minuscules sans accents, avec `status: "draft"`, `domain: "Algèbre"`, `number: "17"`, `companion: false`.
- Ne pas utiliser `<SquareExperiment />` ni `<PlaneFigure />` (propres aux leçons 01 et 02 ; ni `<SeriesFigure />` (leçon 03), ni `<StepsFigure />` (leçon 04), ni les figures des leçons 05 à 16). Si une figure ou une manipulation serait utile (par exemple un tableau de composition ou un objet dont on modifie un paramètre), la décrire dans la note : Claude la développera après validation. Le texte et les formules doivent suffire sans figure.
- Une seule `<Proof>` par page ; chaque `id` de `sections` doit exister dans la page.
- Formules `$…$` et `$$…$$` ; `\$` pour un dollar littéral ; pas de `\href`, `\url` ni commande HTML. Tableaux Markdown possibles.
- Laisser une ligne vide après chaque balise ouvrante de composant et avant sa balise fermante.
- **Formules : éviter le motif `\{ … ^{…} … \}`** (accolades littérales encadrant une accolade de puissance dans une même formule), qui fait échouer l'analyseur MDX ; écrire `\lbrace … \rbrace` à la place.
- Typographie française : espace insécable avant `?`, `!`, `:` et `;` (U+202F ou U+00A0).

## Ce qui ne doit pas être modifié

Aucun autre fichier du projet : ni code, ni styles, ni leçons existantes, ni `catalog.ts`, ni `atlas.ts`, ni `package.json`. Claude ajoutera l’entrée de catalogue et l’adresse publique après validation.

## Note à rendre

`docs/demandes/codex-lecon-17-espaces-vectoriels-reponse.md`, indiquant :

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
- `docs/demandes/codex-lecon-17-espaces-vectoriels-reponse.md`.

Ne modifier **aucun** autre fichier, en particulier ni `docs/PROGRESSION.md` (consigner vos propositions pour le module dans la note), ni `JURNAL.md`, ni le fichier de demande, ni les fichiers des autres leçons.
