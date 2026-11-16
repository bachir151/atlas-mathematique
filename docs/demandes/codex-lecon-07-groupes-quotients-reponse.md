# Leçon 07 — réponse de Codex

**Statut : brouillon soumis à la direction.** Aucun contenu nouveau n’est validé par cette note.

## Choix et niveau

Sujet : classes à gauche, sous-groupes distingués et construction d’un groupe quotient, avec le premier théorème d’isomorphisme en approfondissement. Fichier : `src/content/lessons/groupes-quotients.mdx` ; slug : `groupes-quotients`. Ce nom désigne directement le thème assigné. Les restes modulo quatre relient les sous-groupes d’entiers aux rotations du carré ; un exemple de bijections non commutatives montre pourquoi il faut une hypothèse supplémentaire.

Niveau visé : début de licence, avec exploration accessible à qui connaît les entiers et les groupes. Prérequis : opérations sur les entiers relatifs, multiples et division euclidienne, ensembles, applications, groupes et sous-groupes, composition et inverse. Les définitions utiles sont rappelées. Pour l’approfondissement, savoir lire une application injective ou surjective ; morphisme, noyau, image et isomorphisme sont définis dans le texte. La loi des puissances entières et la division euclidienne sont admises. Le groupe des rotations du carré, les propriétés de $r$ et la description de $4\mathbb Z$ s’appuient sur les leçons 01 et 04. La leçon sur les morphismes est citée par thème : elle est rédigée en parallèle et n’est pas supposée validée. Les classes, la condition de distinction et le premier théorème d’isomorphisme sont établis ici, sans dépendre d’un numéro ou énoncé de cette leçon voisine.

## Plan

1. Exploration des restes modulo quatre et question du choix des représentants.
2. Classes à gauche et à droite, relation d’équivalence, sous-groupe distingué, énoncé du quotient ; exemples entiers et contre-exemple de bijections.
3. Démonstration progressive et intégrale de la nécessité et de la suffisance de la distinction, puis des axiomes du quotient.
4. Lien mathématique démontré avec noyau, image et premier théorème d’isomorphisme ; application aux rotations du carré.
5. Quatre exercices avec indices et corrections, puis reconstruction guidée.

## Précautions scientifiques

Les classes sont des ensembles et leurs représentants ne sont pas canoniques. La notation $G/H$ désigne d’abord un ensemble de classes à gauche ; elle ne désigne ici un groupe que si $H$ est distingué. La bonne définition du produit est démontrée pour tous les représentants et sa nécessité est prouvée, sans hypothèse de finitude ni de commutativité. La convention de composition est explicitée pour le contre-exemple. Le noyau est distingué et l’isomorphisme porte sur l’image, pas nécessairement sur tout le groupe d’arrivée. La connexion aux rotations est un lien mathématique démontré, non une identification littérale des objets. Une observation finie ne remplace pas une preuve. Aucune affirmation historique ni connexion interdisciplinaire artificielle n’est ajoutée.

## Module 1 — propositions à examiner

Ces propositions ne modifient pas `docs/PROGRESSION.md` et ne sont pas validées :

- **Objectifs :** construire des classes, distinguer ensemble quotient et groupe quotient, vérifier la bonne définition et reconnaître le rôle d’un noyau.
- **Prérequis :** groupes et sous-groupes, ensembles et applications ; calcul des entiers pour les exemples. Les morphismes facilitent l’approfondissement.
- **Place proposée :** après groupes, sous-groupes et introduction aux morphismes ; les leçons parallèles restent à coordonner après rédaction.
- **Résultats :** critère de distinction pour le produit des classes et premier théorème d’isomorphisme vers l’image.
- **Expérience envisageable :** manipulation des restes décrite ci-dessous.
- **Connexions :** lien mathématique avec les rotations ; aucune connexion interdisciplinaire n’est proposée dans ce brouillon.
- **Réflexion possible :** préciser ce qu’une relation d’équivalence choisit de conserver ou d’oublier, sans attribuer à cette formulation une portée philosophique générale.
- **Maîtrise :** calculer des classes, changer de représentants, produire un contre-exemple et reconstruire les deux sens du critère ainsi que le rôle du noyau.

## Interaction proposée après validation

Présenter les classes de $\mathbb Z/n\mathbb Z$ et leur addition sous forme d’un tableau, avec $n$ entier réglable de $2$ à $8$, valeur initiale $4$. Deux champs entiers $a,b$ de $-20$ à $20$, initialement $1$ et $2$, sélectionnent des représentants. Afficher leurs restes entre $0$ et $n-1$, les classes correspondantes et le reste de $a+b$. Proposer pour chaque champ les changements $+n$ et $-n$ lorsqu’ils restent dans les bornes, ainsi que la remise aux valeurs initiales. Afficher aussi la table complète des sommes des classes pour le $n$ choisi. Le lecteur observe que changer un représentant par un multiple de $n$ ne change pas la classe résultat et que le nombre de classes change avec $n$. Les bornes et l’exploration finie sont explicites ; cette observation ne démontre pas le résultat général et ne traite pas les sous-groupes non distingués.

**Alternative textuelle permanente :** champs et commandes accessibles au clavier, valeurs et calcul exact annoncés en texte, table des restes et de leur addition avec en-têtes de lignes et colonnes. La leçon reste réalisable sur papier sans interaction.

## Points à trancher par la direction

- Valider le sujet, le niveau et le rattachement au module 1, ainsi que la place du premier théorème d’isomorphisme en approfondissement.
- Valider les exercices, le contre-exemple non commutatif et l’activité de reconstruction.
- Retenir, modifier ou écarter l’interaction et ses bornes ; la forme des trois modes reste une décision distincte.
- Examiner séparément les propositions de progression et la coordination des leçons rédigées en parallèle.

## Vérifications

Contrôles limités à la structure du fichier et à la lecture des formules et de la ponctuation ; aucune compilation ni vérification de rendu n’est effectuée. Claude devra vérifier notamment le MDX, KaTeX et l’accessibilité après remise.
