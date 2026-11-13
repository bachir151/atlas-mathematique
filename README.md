# L’Atelier des abstractions

Mémoire de continuité : [JURNAL.md](JURNAL.md). À lire lors d’une reprise, après les consignes de gouvernance. Il conserve les autorisations, l’état vérifié, les blocages et la prochaine action.

Première version locale des interfaces, réalisée dans le périmètre autorisé par la direction du projet. Aucun cours, énoncé ou démonstration validé n’a été fourni au démarrage : les emplacements scientifiques restent explicitement provisoires.

**État actuel : compilation des cinq pages réussie, typage sans erreur ni avertissement, dix tests réussis.** L’installation effectuée par la direction du projet a débloqué les vérifications Astro. Le contrôle du HTML compilé vérifie aussi 62 références locales. Le serveur et le navigateur ne peuvent pas être lancés dans le terminal sandboxé : liaison réseau refusée (`EPERM`) et Firefox Snap inaccessible. Les vérifications visuelles et WebGL sur matériel réel restent à faire. Voir le [bilan de reprise et la proposition de migration de sécurité](docs/VERIFICATIONS.md).

## Lancement local

Prérequis : Node.js 22.13 ou supérieur, npm, accès au registre npm pour la première installation.

```bash
npm install
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

## Pages et fonctionnalités

| Route | Interface |
| --- | --- |
| `/` | Accueil éditorial responsive, figures vectorielles et accès aux explorations |
| `/atlas/` | Atlas Three.js chargé à l’approche du viewport, carte 2D et liste accessibles |
| `/bibliotheque/` | Catalogue, recherche insensible aux accents, filtre par domaine et état vide |
| `/cours/groupes-rotations/` | Carré animé, commandes de rotation, historique et remise à zéro, emplacement MDX, progression et preuve intégrale indépendante, compagnon simulé |
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
  scripts/
    atlas.ts
    square.ts
    proof.ts
    companion.ts
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
  env.d.ts
tests/
  core.test.mjs
  dom.test.mjs
scripts/audit_claude.py
scripts/check-build.mjs
docs/LIVRAISON.md
docs/VERIFICATIONS.md
audits/
  claude-1.md
  claude-1-sources.json
  claude-2.md
  claude-2-sources.json
  tests-local.txt
  syntax-local.txt
  contrast-local.txt
  modifications-entre-passages.json
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

## Audit Claude automatique

Claude Code 2.1.322 est installé et son authentification a été vérifiée. Le lanceur `scripts/audit_claude.py` transmet sur l’entrée standard un instantané numéroté des sources. Tous les outils de Claude sont supprimés avec `--tools ""` ; `--restricted`, `--safe-mode`, configuration MCP vide et stricte, absence de hooks, absence de persistance et refus automatique des permissions complètent ce dispositif. Aucun outil d’édition, commande, publication ou sous-agent n’est accordé à Claude.

Le lanceur Python exécuté par Codex écrit le résultat et les empreintes avant/après dans `audits/`. Claude n’écrit pas les rapports. Un délai maximal interrompt un appel bloqué. Les deux passages sont conservés sans écrasement ; leur statut réel figure dans chaque rapport. Un rapport marqué `unavailable` n’est pas un audit réussi et ne contient aucune recommandation à attribuer à Claude.

Pour cette mission, les deux tentatives ont atteint leur délai maximal sans rapport, en raison de l’accès API indisponible : [premier passage](audits/claude-1.md), [second passage](audits/claude-2.md). Les empreintes avant/après de chaque appel sont identiques. Ces appels ont porté sur les sources de la première remise. Les corrections effectuées à la reprise après installation ne sont pas auditées par Claude ; aucun troisième appel n’a été lancé, afin de conserver la limite fixée pour cette mission.

Voir [le bilan de livraison](docs/LIVRAISON.md) pour les vérifications, corrections techniques et limites.
