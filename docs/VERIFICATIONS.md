# Reprise après installation — vérifications et décision restante

13 novembre 2026. Autorisation de poursuivre donnée par la direction du projet. Aucun contenu pédagogique n’a été modifié. Aucun commit, push ou déploiement.

## Résultats

| Vérification | Résultat |
| --- | --- |
| `npm run check` | 28 fichiers, aucune erreur, aucun avertissement ni indication |
| `npm test` | 5 tests de données et 5 tests DOM réussis |
| `npm run build` | 5 pages compilées ; aucun avertissement de collection ou de taille de module |
| `npm run verify:build` | 5 pages et 62 références locales vérifiées |
| Module Three.js | 704,89 → 473,93 ko ; gzip : 181,19 → 119,42 ko |
| Serveur de développement | Tentative sur `127.0.0.1:4325` refusée par le sandbox : `EPERM` |
| Navigateur | Firefox Snap ne peut créer son répertoire dans `/run/user/1000` |
| Audit npm en ligne | Inaccessible depuis le terminal : `EAI_AGAIN` |
| Claude | Aucun appel supplémentaire ; les deux tentatives initiales sont conservées et la limite de la mission est respectée |

Le script de contrôle du build examine le véritable HTML émis par Astro : langue, titre, région principale, lien d’évitement, unicité des identifiants, ancres et fichiers locaux. Il vérifie aussi le rendu de l’emplacement MDX, la présence de la carte 2D et de la liste, les options du filtre et l’accès à la preuve intégrale hors des panneaux repliables. Ce contrôle ne remplace pas un navigateur, un lecteur d’écran ou un contexte WebGL réel.

Les résultats structurés sont conservés dans `audits/reprise-verifications.json`. Le verrouillage `package-lock.json` provient de l’installation effectuée par la direction du projet et n’a pas été modifié à cette reprise.

## Fichiers créés ou modifiés

- `src/content.config.ts` : création de la collection MDX explicite avec schéma de métadonnées ; suppression de l’inférence dépréciée d’Astro.
- `src/lib/three-primitives.ts` : création d’un module qui exporte uniquement les primitives utiles à l’Atlas, afin de permettre l’élimination des exports inutilisés.
- `src/scripts/atlas.ts` : chargement différé de ce module à la place du namespace Three.js complet ; interactions et données inchangées.
- `tests/core.test.ts` renommé en `tests/core.test.mjs` : tests natifs Node, au même format que la suite DOM ; suppression des deux annotations TypeScript inutiles au test d’exécution. Le code applicatif reste vérifié en TypeScript strict. Aucun ajout de dépendance de typage Node nécessaire.
- `astro.config.mjs` : utilisation du service d’image sans transformation ; le prototype ne contient que des SVG locaux.
- `scripts/check-build.mjs` : création du contrôle des pages compilées.
- `package.json` : mise à jour du chemin de la suite de tests et ajout de `verify:build`.
- `README.md`, `docs/LIVRAISON.md`, ce bilan et les fichiers de diagnostic dans `audits/` : actualisation des résultats et de leurs limites.

## Dépendances vulnérables

La sortie de l’installation signale sept paquets concernés. Les avis conservés dans le cache npm permettent de retrouver ces sept paquets et leurs plages de versions. Il s’agit de données de cache, pas d’un nouvel audit en ligne ; le détail est dans `audits/dependances-cache.json`.

| Paquet installé | Version | Gravité maximale dans le cache |
| --- | --- | --- |
| Astro | 5.18.2 | Critique |
| Sharp | 0.34.5 | Importante / high |
| Zod | 3.25.76 | Importante / high |
| zod-to-ts | 1.2.0 | Importante / high |
| esbuild | 0.27.7 | Faible / low |
| @astrojs/mdx | 4.3.14 | Faible / low |
| KaTeX | 0.16.47 | Faible / low |

**La sortie « zéro vulnérabilité » de `npm audit --offline` ne valide pas la sécurité.** Sans accès au service d’audit, cette commande n’a pas reçu les avis à recalculer ; elle contredit les données conservées et le résultat de l’installation. Aucun correctif automatique forcé n’a été appliqué.

La faille critique d’Astro concerne le traitement d’une image AVIF non fiable par le service Sharp. Le prototype utilise des SVG locaux et son service de transformation est désormais désactivé. Cette réduction de l’exposition ne supprime ni les paquets vulnérables ni les autres avis de sécurité. [Avis officiel Astro](https://github.com/withastro/astro/security/advisories/GHSA-26w7-cxv4-gfx2).

L’avis KaTeX suppose notamment une pollution préalable de prototype et des expressions contrôlées par un attaquant. Aucune formule non fiable n’est acceptée dans ce prototype ; une version corrigée reste à installer. [Avis officiel KaTeX](https://github.com/KaTeX/KaTeX/security/advisories/GHSA-238p-pmpm-9mq7).

## Proposition de migration — autorisation reçue, installation bloquée

Objectif : remplacer les versions concernées et refaire les contrôles sans changer les textes scientifiques. La direction a depuis autorisé cette migration et demandé de créer d’abord `JURNAL.md`. Ce journal a été créé, `.nvmrc` indique Node 22.23.4 et le runtime correspondant, déjà installé via nvm, a été vérifié. Le manifeste candidat figure dans `docs/migration/package.candidate.json`.

La résolution isolée des nouvelles dépendances échoue : réseau npm indisponible (`EAI_AGAIN`) et absence de `@astrojs/markdown-satteri` dans le cache (`ENOTCACHED`). Le manifeste et le verrouillage de la version fonctionnelle ne sont donc pas remplacés. La migration reste autorisée mais non appliquée ; l’avancement courant est dans `JURNAL.md`.

Versions cibles identifiées dans les métadonnées officielles npm disponibles au 13 novembre 2026 :

| Élément | État actuel | Cible proposée |
| --- | --- | --- |
| Node.js | 22.22.3 dans ce terminal | 22.23.4 minimum |
| Astro | 5.18.2 | 7.4.12 |
| @astrojs/mdx | 4.3.14 | 8.1.6, compatible avec Astro `^7.2.10` |
| KaTeX | 0.16.47 | 0.19.1, qui fournit ses propres types |

Le prérequis Node provient des métadonnées d’[Astro](https://registry.npmjs.org/astro/latest). Les migrations de génération Astro peuvent aussi changer le traitement Markdown et les espaces HTML ; ces différences doivent être contrôlées sans réécrire les contenus. [Guide officiel Astro 7](https://docs.astro.build/en/guides/upgrade-to/v7/).

Fichiers envisagés :

- `package.json` et `package-lock.json` : versions cibles, prérequis Node, retrait de `@types/katex` devenu redondant, dépendances de traitement MDX requises par la nouvelle intégration.
- `.nvmrc` : création pour indiquer le runtime attendu, sans modifier le Node installé sur la machine ni d’autre dépôt.
- `astro.config.mjs` et `src/content.config.ts` : adaptations éventuelles des API de configuration et de collection.
- `src/components/Formula.astro` : adaptation technique uniquement si les types ou options KaTeX évoluent ; aucun ajout de formule.
- Documentation et diagnostics : état de migration, versions effectivement résolues et résultats.

Risques à vérifier : changement de moteur Markdown, traitement des espaces, rendu MathML/KaTeX, prérequis des paquets natifs et compatibilité du nouveau bundler avec le chargement différé de Three.js. Le site doit rester statique et le service d’image sans transformation tant qu’il n’est pas nécessaire.

Critères de validation : installation avec le runtime cible, `npm run check`, les dix tests, compilation, `npm run verify:build`, audit npm en ligne et contrôle visuel/clavier/WebGL dans un environnement qui autorise le navigateur et le serveur. La migration ne pourra être déclarée terminée tant que ces vérifications nécessaires resteront bloquées par l’environnement. Un nouveau cycle Claude nécessiterait également de relever explicitement la limite des deux tentatives initiales.
