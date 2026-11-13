# Préparation de migration — 13 novembre 2026

La direction a autorisé la migration après création préalable de `JURNAL.md`. La mémoire a été créée en premier ; le manifeste actif et son verrouillage sont conservés.

- Runtime disponible et vérifié : `/home/elbash/.nvm/versions/node/v22.23.4/bin/node`, version 22.23.4 ; npm associé 10.9.9.
- Fichier `.nvmrc` créé avec `22.23.4`.
- Manifeste candidat : `docs/migration/package.candidate.json`.
- Installation candidate préparée dans `/tmp/atelier-migration-0bjT5p` ; ce chemin temporaire ne doit pas être considéré comme persistant entre sessions.
- Premier lancement par sous-processus Node refusé (`spawnSync ... EPERM`), consigné dans `migration-preparation.json`.
- Reprise par appel direct au terminal avec le cache du projet : échec `ENOTCACHED` sur les métadonnées jsdom.
- Regroupement des caches déjà disponibles dans `/tmp/atelier-npm-cache`, puis nouvel appel direct hors ligne : échec `ENOTCACHED` sur `@astrojs/markdown-satteri`. Aucun cache tiers d’origine n’a été modifié.
- Vérification en ligne : `npm view node@22.23.4 version` échoue avec `EAI_AGAIN` depuis le terminal de Codex.

Les commandes directes de contrôle sous Node 22.23.4 réussissent sur la version Astro 5 actuelle ; voir `runtime-22.23.4-validation.txt`. Les résultats vides des premiers essais par sous-processus n’ont pas été utilisés pour conclure : les commandes ont été relancées directement et leurs sorties vérifiées.

État final : migration autorisée mais non appliquée, dépendances actives fonctionnelles, sept vulnérabilités antérieures non déclarées corrigées. Reprendre la résolution du candidat quand l’accès npm fonctionne, puis vérifier avant toute bascule.
