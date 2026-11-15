# Gabarit de leçon — guide d’intégration

Ce guide décrit le format technique d’une leçon. Il ne contient aucun contenu
mathématique : les textes sont rédigés par Codex et validés par la direction du
projet avant intégration.

Exemple complet (brouillon, textes provisoires) :
`src/content/lessons/exemple-gabarit.mdx`, visible avec `npm run dev` à
l’adresse `/cours/exemple-gabarit/`.

## 1. Fichier et adresse

- Un fichier MDX par leçon : `src/content/lessons/<slug>.mdx`.
- Adresse publiée : `/cours/<slug>/`.
- Le `slug` s’écrit en minuscules, sans accents, mots séparés par des tirets.
- Une leçon publiée (statut autre que `draft`) doit avoir une entrée dans
  `src/data/catalog.ts` avec `href: '/cours/<slug>/'` ; sinon la compilation
  échoue avec un message explicite.

## 2. En-tête (frontmatter)

```yaml
---
title: "Titre complet"                # onglet du navigateur et fil d’Ariane
heading:                              # facultatif : titre affiché sur deux lignes
  lead: "Première ligne"
  emphasis: "seconde ligne en italique."
summary: "Résumé affiché sous le titre."
domain: "Algèbre"                     # Algèbre | Géométrie | Analyse
number: "02"                          # deux chiffres
breadcrumb: "Libellé court"           # facultatif
status: "draft"                       # placeholder | draft | validated
validation: "Référence de la décision" # obligatoire si status: validated
companion: false                      # true : affiche le compagnon simulé
sections:                             # navigation persistante de la page
  - { id: "cours", label: "Le cours" }
  - { id: "demonstration", label: "Démonstration" }
  - { id: "preuve-integrale", label: "Preuve intégrale" }
---
```

Chaque `id` de `sections` doit exister dans la page ; `npm run verify:build`
vérifie toutes les ancres.

## 3. Statuts

| Statut | Signification | Compilation de production |
| --- | --- | --- |
| `placeholder` | emplacements d’interface, aucun contenu scientifique | publiée |
| `draft` | contenu rédigé, pas encore validé | **exclue** (visible seulement avec `npm run dev` ou `ATELIER_DRAFTS=1`) |
| `validated` | contenu validé par la direction du projet | publiée, `validation` obligatoire |

Seule la direction du projet fait passer une leçon à `validated`.

## 4. Formules

- En ligne : `$…$`. Centrée : un bloc `$$ … $$` sur ses propres lignes.
- Rendu KaTeX à la compilation, avec MathML pour les lecteurs d’écran.
- Une formule invalide **fait échouer la compilation** et indique le fichier
  et la formule en cause.
- Commandes refusées par sécurité : `\href`, `\url`, `\htmlClass` et toute
  commande produisant du HTML ou un lien.
- Signe dollar littéral dans le texte : écrire `\$`.
- Les formules centrées trop larges défilent horizontalement sur petit écran.

## 5. Composants

Disponibles dans toute leçon sans `import`. Laisser une ligne vide après la
balise ouvrante et avant la balise fermante pour que le Markdown intérieur
(paragraphes, listes, formules) soit interprété.

| Composant | Attributs | Usage |
| --- | --- | --- |
| `<CourseSection>` | `id` (obligatoire), `eyebrow`, `title`, `label` | panneau de premier niveau, cible de la navigation |
| `<Definition>` | `number`, `name`, `id` | définition |
| `<Theorem>` | `kind` (`Théorème`, `Proposition`, `Lemme`, `Corollaire`), `number`, `name`, `id` | énoncé |
| `<Example>` | `name`, `id` | exemple |
| `<Remark>` | `name`, `id` | remarque |
| `<Historical>` | `label`, `name`, `id` | commentaire historique ou philosophique, visuellement distinct des énoncés |
| `<Exercise>` | `number`, `name`, `level`, `id` | exercice ; contient `<Hint>` et `<Solution>` |
| `<Hint>` / `<Solution>` | `label` | volets fermés par défaut |
| `<Proof>` | `eyebrow`, `title`, `intro` | démonstration progressive, **une seule par page** (ancres fixes `#demonstration` et `#preuve-integrale`) |
| `<ProofStep>` | `title` (obligatoire), `open` | étape de démonstration ; numérotation automatique |
| `<FullProof slot="full">` | — | preuve intégrale, toujours visible, jamais verrouillée |
| `<Formula>` | `tex`, `display` | formule passée en attribut (cas particuliers) |
| `<SquareExperiment>`, `<P5Experience>` | voir `docs/P5.md` | expériences interactives |
| `<PlaneFigure>` | `kind` (`mediatrice`, `reflexion`, `deux-reflexions`), `number` | figures planes interactives de la leçon 02 (SVG, clavier, alternative textuelle) |
| `<SeriesFigure>` | `kind` (`somme-geometrique`, `iteration-affine`), `number` | graphes discrets de la leçon 03, calcul exact en fractions, alternative textuelle |

Exemple de structure :

```mdx
<CourseSection id="cours" eyebrow="01 / Le cours" title="Titre">

Paragraphe avec $x$.

<Definition number="1" name="Nom">

Texte de la définition.

</Definition>

</CourseSection>

<Proof eyebrow="02 / Démonstration" intro="Phrase d’introduction.">
  <ProofStep title="Titre de l’étape" open>

Texte de l’étape.

  </ProofStep>
  <FullProof slot="full">

Texte de la preuve intégrale.

  </FullProof>
</Proof>
```

## 6. Remise d’une leçon

1. Codex fournit le fichier MDX avec `status: "draft"`.
2. Claude l’intègre sans reformulation, vérifie la compilation, les formules,
   l’accessibilité et l’affichage.
3. La direction du projet valide ; le statut passe à `validated` avec la
   référence de validation, et l’entrée du catalogue est ajoutée.

## 7. Tableaux

Les tableaux Markdown sont placés automatiquement dans un cadre qui défile horizontalement sur petit écran ; la première ligne et la première colonne sont présentées comme des en-têtes.

## 8. Vérifications

```sh
npm run check          # types et schéma des leçons
npm run build          # échoue sur une formule invalide ou un cours sans entrée de catalogue
npm run verify:build   # ancres, brouillons absents, aucune formule brute
npm run build:drafts   # compiler aussi les brouillons dans test-results/dist-drafts
npm run test:drafts    # accessibilité Firefox de toutes les leçons, brouillons compris
```
