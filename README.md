# L’Atelier des abstractions

Mémoire de continuité : [JURNAL.md](JURNAL.md). À lire lors d’une reprise, après les consignes de gouvernance. Il conserve les autorisations, l’état vérifié, les blocages et la prochaine action.

Répartition actuelle : **Claude développe le site ; Codex rédige les contenus mathématiques et pédagogiques ; l’utilisateur dirige et valide.** Aucun rôle de relecteur ni cycle d’audit entre agents. Consignes : [AGENTS.md](AGENTS.md) et [CLAUDE.md](CLAUDE.md).

Expériences 2D : [intégration p5.js](docs/P5.md), composant réutilisable Astro/MDX et banc technique local à `/experiences/p5/`. Three.js reste utilisé pour l’Atlas 3D.

Tests en vrai navigateur : [commande Firefox, scénarios et état réel](docs/TESTS-NAVIGATEUR.md). Cinq scénarios Firefox réels ont réussi ; la correction du défilement du sixième attend sa validation. Les relances dans le terminal Codex restent bloquées avant les scénarios.

Première version locale des interfaces, réalisée dans le périmètre autorisé par la direction du projet. Aucun cours, énoncé ou démonstration validé n’a été fourni au démarrage : les emplacements scientifiques restent explicitement provisoires.

**État actuel : six pages compilées, typage sans erreur ni avertissement, 29 tests réussis dont 19 pour p5.** Le contrôle du HTML compilé vérifie aussi 72 références locales. Versions : Astro 7.4.12, @astrojs/mdx 8.1.6, KaTeX 0.19.1, Three.js 0.180 ; `npm audit` en ligne : 0 vulnérabilité. Les suites Firefox réelles (`npm run test:browser`) réussissent : 14 scénarios p5 (rendu Canvas 2D, chargement après action de p5.js auto-hébergé et vérifié par SRI, clavier natif, pause hors écran, mouvement réduit) et 21 scénarios Atlas/site (WebGL et perte de contexte, clavier, reflow à 320 px, zoom texte 200 %, taille des cibles, contrastes, carré, preuve progressive, compagnon, bibliothèque). Voir `docs/TESTS-NAVIGATEUR.md`. Les vérifications visuelles et WebGL sur matériel réel restent à faire. Voir le [bilan de reprise et la proposition de migration de sécurité](docs/VERIFICATIONS.md).

## Lancement local

Prérequis : **Node.js 22.23.4 ou supérieur** (exigé par Astro 7), npm, accès au registre npm pour la première installation. Le fichier `.nvmrc` sélectionne la bonne version : avec un Node plus ancien, Astro refuse de démarrer (« Node.js v22.22.3 is not supported by Astro! »).

```bash
nvm use        # Node 22.23.4, à refaire dans chaque nouveau terminal
npm ci         # installation exacte depuis package-lock.json
npm run dev
```

Adresse attendue : `http://127.0.0.1:4321`. Le serveur écoute uniquement sur l’interface locale. Il peut être lancé dans le terminal de la direction du projet ; le terminal sandboxé de Codex refuse l’ouverture de ce port.

```bash
npm test
npm run check
npm run build
npm run verify:build
npm run preview
```

`preview` sert la compilation locale, après un `build` réussi. Aucune configuration de publication, synchronisation de sources, opération Git ou connexion à un modèle d’IA n’est installée.

Dans un environnement disposant de Firefox et geckodriver et autorisant les ports locaux : `npm run test:browser`. Les résultats sont écrits dans `test-results/browser/`. Cette vérification est distincte des tests unitaires et DOM de `npm test`.

## Pages et fonctionnalités

| Route | Interface |
| --- | --- |
| `/` | Accueil éditorial responsive, figures vectorielles et accès aux explorations |
| `/atlas/` | Atlas Three.js chargé à l’approche du viewport, carte 2D et liste accessibles |
| `/bibliotheque/` | Catalogue, recherche insensible aux accents, filtre par domaine et état vide |
| `/cours/groupes-rotations/` | Carré animé, commandes de rotation, historique et remise à zéro, emplacement MDX, progression et preuve intégrale indépendante, compagnon simulé |
| `/experiences/p5/` | Banc technique Astro/MDX : deux instances p5 indépendantes, pause, pas-à-pas, destruction et remplacements accessibles |
| `/404.html` | Page d’erreur statique |

La 3D n’effectue aucun mouvement automatique. Le rendu se fait à la demande, le ratio de pixels est plafonné à 1,5 et les géométries, matériaux, contrôles et observateurs sont libérés à la sortie de page. La préférence de mouvement réduit ouvre d’abord la carte 2D et supprime les transitions CSS. Un échec de chargement ou une perte du contexte WebGL laisse la carte 2D et la liste utilisables.

Le compagnon répond uniquement par des messages techniques préprogrammés. Aucun message n’est transmis ou conservé après la fermeture de la page ; l’historique est limité à 20 messages. Le texte utilisateur est inséré avec `textContent`.

## Architecture

```text
public/
  favicon.svg
src/
  pages/
    index.astro
    atlas.astro
    bibliotheque.astro
    cours/groupes-rotations.astro
    experiences/p5.astro
    404.astro
  layouts/Layout.astro
  components/
    Atlas.astro
    SquareExperiment.astro
    Proof.astro
    Companion.astro
    LessonCard.astro
    Diagram.astro
    Formula.astro
    Icon.astro
    experiences/P5Experience.astro
  scripts/
    atlas.ts
    square.ts
    proof.ts
    companion.ts
    p5-experience.ts
  experiences/p5/
    types.ts
    model.ts
    registry.ts
    runtime.ts
    instance.ts
    sketches/technical-bars.ts
  examples/p5-integration.mdx
  data/
    atlas.ts
    catalog.ts
    proof.ts
  content/lessons/groupes-rotations.mdx
  lib/
    rotation.ts
    three-primitives.ts
  content.config.ts
  styles/global.css
  styles/p5-experience.css
  env.d.ts
tests/
  core.test.mjs
  dom.test.mjs
  p5.test.mjs
scripts/audit_claude.py
scripts/check-build.mjs
docs/LIVRAISON.md
docs/VERIFICATIONS.md
docs/P5.md
audits/
  claude-1.md
  claude-1-sources.json
  claude-2.md
  claude-2-sources.json
  tests-local.txt
  syntax-local.txt
  contrast-local.txt
  modifications-entre-passages.json
  p5/
astro.config.mjs
tsconfig.json
package.json
.npmrc
.gitignore
```

Astro produit un site statique avec TypeScript strict et MDX. Aucun framework de composants supplémentaire n’est nécessaire. Les données de l’Atlas restent indépendantes de Three.js ; les liens ont un type, une justification et un état de validation. La liste des liens est vide : aucune relation scientifique n’est inventée. Les tokens CSS permettent de changer le thème sans toucher aux contenus.

`Formula.astro` fournit un rendu KaTeX avec MathML, `trust: false` et erreur de compilation sur une formule invalide. Aucune formule pédagogique nouvelle n’est ajoutée pour illustrer ce composant. L’intégration directe de MDX suit la [documentation officielle Astro](https://docs.astro.build/en/guides/integrations-guide/mdx/#using-mdx-in-astro).

## Contenus à intégrer après validation

- Corps du cours : `src/content/lessons/groupes-rotations.mdx`.
- Étapes et texte intégral de la preuve : `src/data/proof.ts`, actuellement constitués uniquement d’emplacements.
- Descriptions et connexions scientifiques de l’Atlas : `src/data/atlas.ts`.

La zone de preuve intégrale reste indépendante de l’ouverture des étapes. Une navigation de leçon collante permet d’y accéder pendant le défilement. Les illustrations de l’accueil sont des compositions graphiques ; aucun lien de l’Atlas n’y est affirmé.

## Traces de l’ancienne organisation

Les anciens rapports dans `audits/` et le script `scripts/audit_claude.py` sont conservés comme historique. Ce script ne fait plus partie du fonctionnement du projet et ne doit pas être lancé. Claude prend désormais en charge le développement et les tests techniques ; Codex rédige les contenus mathématiques à soumettre à l’utilisateur.

Voir [le bilan de livraison](docs/LIVRAISON.md) pour les vérifications, corrections techniques et limites.
