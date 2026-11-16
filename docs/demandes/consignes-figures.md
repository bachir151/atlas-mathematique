# Consignes communes — développement d'une figure interactive de leçon

Document technique pour les agents qui développent les figures en parallèle. Aucun contenu mathématique nouveau : la figure réalise exactement l'interaction décrite par Codex et validée par la direction.

## Spécification

La section « Interaction proposée » (ou « Figures et interactions proposées ») de la note de réponse de Codex de la leçon concernée fait foi : objets, paramètres, bornes, valeurs par défaut, ce que le lecteur observe, alternative textuelle. Suivre à la lettre ; annoncer la plage finie et le caractère exploratoire (« ne démontre rien »). Ne jamais énoncer de théorème dans la figure. Ne pas modifier le texte de la leçon. Lire la leçon pour reprendre exactement ses notations. Quand la spécification est muette, choisir la lecture la plus littérale et consigner le choix dans la note d'intégration.

## Modèles à lire en entier avant d'écrire

- Figure de la leçon 04 : `src/figures/steps.ts`, `steps-svg.ts`, `src/components/figures/StepsFigure.astro`, `src/scripts/steps-figures.ts`, `tests/steps.test.mjs`.
- Figures à tableaux (leçons 07 et 05 à 10) : `src/figures/quotient.ts`, `src/components/figures/QuotientFigure.astro`, `src/scripts/quotient-figures.ts`, `src/styles/figures-quotient.css`, `tests/quotient.test.mjs`.
- Classes CSS communes : `src/styles/figures.css` (`plane-figure`, `plane-controls`, `plane-actions`, `plane-reading`, `plane-status`, `series-table`, `fig-*`). `src/figures/rational.ts` fournit les fractions exactes (BigInt) si des rationnels sont nécessaires.

## Exigences

- Modèle pur, calcul exact (entiers ou fractions), testé exhaustivement sur toute la plage autorisée.
- Lecture textuelle, tableaux et état initial rendus à la compilation (visibles sans JavaScript).
- Commandes indisponibles en `aria-disabled` (jamais `disabled` une fois actives : le focus doit rester). Clavier complet. Aucune animation obligatoire (mouvement réduit). Texte français, vrai signe moins « − », espace insécable avant `? ! : ;`.
- `aria-live="polite"` pour l'état ; SVG de dessin en `aria-hidden`, élément `role="img"` avec `aria-labelledby` ; tableaux larges dans un cadre défilant focalisable (`table-scroll`, `tabindex="0"`, `role="region"`, `aria-labelledby`).
- Cibles tactiles d'au moins 24 px, contrastes suffisants, pas de débordement à 320 px.
- Noms uniques (préfixe de la figure) pour les fichiers, les ids, les attributs `data-*` et les classes CSS, afin qu'aucune autre figure n'en soit affectée. Ne pas utiliser `data-action` ni `data-param` nus déjà employés par d'autres figures : préfixer.
- Styles propres dans `src/styles/figures-<nom>.css`, importé par le composant avec `../../styles/figures.css` ; ne pas modifier `figures.css`.

## Fichiers à créer (et seulement ceux-là)

`src/figures/<nom>.ts`, `src/figures/<nom>-svg.ts`, `src/components/figures/<Composant>.astro`, `src/scripts/<nom>-figures.ts`, `src/styles/figures-<nom>.css`, `tests/<nom>.test.mjs` (`node --experimental-strip-types tests/<nom>.test.mjs`), `docs/demandes/figure-lecon-NN-integration.md`.

## Note d'intégration (format imposé, pour le script d'intégration de Claude)

Quatre blocs de code balisés, dans cet ordre, un seul de chaque type :
1. ```` ```mdx ```` : la ou les balises exactes, ex. `<RingFigure number="1" />`.
2. ```` ```ts ```` : la ligne d'import du composant (`import X from '../figures/X.astro';`) — pour information.
3. ```` ```js ```` : le bloc à insérer dans `scripts/check-build.mjs`, de la forme `if (page.includes('<slug>')) { … }` avec 4 espaces d'indentation, qui vérifie : une figure présente, lecture textuelle sans JavaScript, plage finie annoncée, tableau présent.
4. ```` ```python ```` : une seule méthode `def <nom>(self):` (4 espaces d'indentation, modèle : `steps` dans `tests/browser_site.py`) avec trois scénarios `self.case('<nom>-static' | '<nom>-keyboard' | '<nom>-buttons', …)` ; **écrire les touches spéciales avec des échappements Python** (`''` flèche haut, `''` flèche bas, `''` tabulation, `''` entrée), jamais les caractères bruts.

Ajouter dans une section de texte : l'emplacement dans la leçon (phrase exacte de Codex, après laquelle insérer), les choix de lecture faits, et une ligne de tableau du gabarit commençant par `| \`<Composant>\` |` (colonnes : composant, props, description) placée dans un bloc de code sans langage.

## Interdit

Modifier un fichier existant (leçons, catalogue, `index.ts`, `GABARIT-LECON.md`, `package.json`, `check-build.mjs`, `browser_site.py`, `JURNAL.md`, `figures.css`) ; lancer `npm`, `astro`, `npm ci`, un build, un serveur, Firefox ou `git` ; installer quoi que ce soit ; créer des dossiers temporaires dans le projet. Vérifier uniquement avec le test node de la figure. Six agents travaillent en parallèle dans le même dossier. Terminer par la liste des fichiers créés et le résultat réel du test.
