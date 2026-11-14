# Demande à Codex — rédaction de la leçon 02 (Géométrie)

- **Demandeur :** Claude (développeur), à la demande de la direction du projet, le 14 novembre 2026.
- **Destinataire :** Codex (rédacteur des contenus mathématiques).
- **Statut attendu du livrable :** brouillon (`status: "draft"`), soumis à la validation de la direction.

## Contexte

- Leçon 01 publiée et validée : « Groupes & rotations du carré » (`src/content/lessons/groupes-rotations.mdx`, note `docs/demandes/codex-groupes-rotations-reponse.md`).
- Le catalogue (`src/data/catalog.ts`) réserve la place 02 au domaine **Géométrie**, affichée « À venir ».
- L’Atlas présente les thèmes Groupes, Rotations du carré, Géométrie, Analyse et Topologie, sans lien scientifique validé à ce jour.

## Ce qui est demandé

Rédiger la leçon 02 du domaine Géométrie. **Le choix du sujet, de la progression, du niveau, des définitions, des énoncés, des démonstrations, des exemples, des exercices et des corrections appartient à Codex**, dans l’esprit du projet (de l’intuition au niveau universitaire, voir `AGENTS.md`) et en continuité avec la leçon 01.

Contenu attendu, comme pour la leçon 01 :

1. le cours (définitions, énoncés, exemples, remarques ; commentaire historique facultatif et justifié) ;
2. une démonstration progressive et sa preuve intégrale ;
3. des exercices avec indices et corrections ;
4. éventuellement une section de connexions, en qualifiant chaque lien (lien mathématique démontré, application, analogie).

## Format technique (obligatoire)

- Suivre `docs/GABARIT-LECON.md` ; s’inspirer de la structure de `src/content/lessons/groupes-rotations.mdx`.
- **Un seul fichier de leçon** : `src/content/lessons/<slug>.mdx`, slug en minuscules sans accents (par exemple dérivé du titre), avec `status: "draft"`, `domain: "Géométrie"`, `number: "02"`.
- `companion: false` : le compagnon simulé n’est pas prévu pour cette leçon.
- **Aucune interaction existante n’est propre à cette leçon.** Ne pas utiliser `<SquareExperiment />` sauf si le sujet s’y rapporte réellement. Si une figure ou une manipulation serait utile, la décrire dans la note (voir plus bas) : Claude la développera après validation. Les formules KaTeX et le texte doivent suffire à suivre la leçon sans figure.
- Une seule `<Proof>` par page ; chaque `id` de `sections` doit exister dans la page.
- Formules `$…$` et `$$…$$` ; `\$` pour un dollar littéral ; pas de `\href`, `\url` ni commande HTML. Tableaux Markdown possibles.
- Laisser une ligne vide après chaque balise ouvrante de composant et avant sa balise fermante.
- Typographie française : espace insécable avant `?`, `!`, `:` et `;` si possible (caractère U+202F ou U+00A0), pour éviter les signes isolés en fin de ligne.

## Ce qui ne doit pas être modifié

Aucun autre fichier du projet : ni code, ni styles, ni leçons existantes, ni `catalog.ts`. Claude ajoutera l’entrée de catalogue et l’adresse publique après validation.

## Note à rendre

`docs/demandes/codex-lecon-02-geometrie-reponse.md`, indiquant :

- le sujet retenu, le slug du fichier et la raison de ce choix ;
- le niveau visé et les prérequis (dont le lien avec la leçon 01) ;
- le plan ;
- les points à trancher par la direction ;
- les figures ou interactions souhaitées, décrites précisément (objets, paramètres manipulables, ce que le lecteur doit observer), avec leur alternative textuelle.

## Vérification

Node 22.23.4 : `export PATH=/home/elbash/.nvm/versions/node/v22.23.4/bin:$PATH`, puis `npm run check` et `ATELIER_DRAFTS=1 npx astro build --outDir /tmp/codex-drafts-build-02`. En cas d’erreur `EXDEV`, compiler depuis une copie temporaire comme pour la leçon 01. Ne pas lancer `npm run dev` (serveur de la direction sur le port 4321), ni commit, push ou déploiement.
