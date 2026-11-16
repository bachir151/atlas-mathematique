# Leçon 06 — réponse de Codex

**Statut : brouillon soumis à la direction.** Aucun contenu de cette note ou de la leçon n’est encore validé.

## Sujet et niveau

La leçon présente les morphismes de groupes, leur noyau et leur image, puis les isomorphismes comme correspondances bijectives compatibles avec les opérations. Le slug `morphismes-isomorphismes` et le fichier `src/content/lessons/morphismes-isomorphismes.mdx` nomment directement le sujet assigné. Les rotations du carré et les multiples de 4 donnent un exemple commun aux leçons 01 et 04.

Niveau visé : fin de lycée familière des raisonnements sur les ensembles ou début de licence ; le dernier exercice est facultatif. Prérequis : applications, injectivité et surjectivité, entiers relatifs, division euclidienne, groupes et sous-groupes, inverses et calcul de puissances entières. Les notions d’injectivité et de surjectivité sont rappelées. La leçon 01 fournit les quatre rotations et leur table ; la leçon 04 fournit les multiples et le lien avec les rotations. Les règles des puissances dans un groupe et la division euclidienne sont utilisées sans nouvelle démonstration. Aucun résultat des leçons parallèles n’est nécessaire ni admis.

## Plan

1. Exploration des quarts de tour associés aux entiers et observation des collisions.
2. Morphisme, conservation du neutre et des inverses, contre-exemple bijectif, noyau, image, sous-groupes et isomorphisme.
3. Démonstration progressive et preuve intégrale du critère d’injectivité par le noyau, avec caractérisation de toutes les collisions.
4. Lien mathématique démontré entre les groupes additifs $\mathbb Z$ et $2\mathbb Z$, et rôle de l’ensemble d’arrivée.
5. Quatre exercices avec indices et corrections, puis questions de reconstruction.

## Précautions scientifiques

Les groupes ne sont pas supposés commutatifs dans le théorème : l’ordre de $x^{-1}\cdot y$ et la multiplication à gauche sont conservés. Noyau et image vivent dans des groupes différents ; l’image ne se confond avec l’ensemble d’arrivée que pour une application surjective. Un noyau trivial caractérise l’injectivité, non la surjectivité. Une bijection quelconque ne suffit pas à être un isomorphisme, et la réciproque d’un isomorphisme est justifiée. L’exemple des rotations utilise la division euclidienne aussi pour les exposants négatifs. La leçon ne définit ni quotient ni théorème d’isomorphisme : ces sujets relèvent de la leçon parallèle sur les groupes quotients. Les essais ne remplacent pas une preuve. Aucun contenu validé existant n’est modifié.

## Propositions pour le module 1

À examiner séparément, sans modification de `docs/PROGRESSION.md` :

- **Objectifs :** comparer des groupes par leurs opérations, calculer noyau et image, distinguer morphisme et isomorphisme.
- **Prérequis :** groupes, sous-groupes, applications et raisonnement sur injectivité et surjectivité.
- **Place proposée :** après une première rencontre des groupes et sous-groupes, avant les quotients ; la dépendance précise avec les groupes cycliques reste à déterminer.
- **Résultat central :** caractérisation des collisions par le noyau et critère d’injectivité, avec preuve valable sans commutativité.
- **Expérience envisageable :** comparaison finie des pas entiers et rotations décrite ci-dessous.
- **Connexions :** lien mathématique démontré entre les structures additives de $\mathbb Z$ et $2\mathbb Z$ ; aucune connexion interdisciplinaire ni affirmation historique n’est proposée artificiellement.
- **Maîtrise :** vérifier la conservation de l’opération, calculer noyau et image, identifier les collisions et construire ou réfuter un isomorphisme.

## Interaction proposée après validation

Une table accessible associerait à chaque entier $k$ de $-12$ à $12$ la rotation $r^k$ parmi $e,r,r^2,r^3$. Deux sélecteurs entiers $m,n$, bornés de $-12$ à $12$ et initialisés à $1$ et $5$, afficheraient $p(m)$, $p(n)$, $n-m$, son reste euclidien modulo 4 et l’égalité ou non des rotations. Une seconde ligne afficherait $p(m+n)$ et $p(m)\circ p(n)$ ; la somme, comprise entre $-24$ et $24$, serait calculée exactement sans la limiter à la plage des sélecteurs. Le lecteur observerait la conservation de l’opération et les collisions lorsque la différence est multiple de 4, notamment pour les valeurs négatives. Les bornes et le caractère expérimental seraient annoncés : les essais finis ne prouvent pas la propriété générale.

**Alternative textuelle permanente :** champs numériques et commandes clavier pour $m,n$, valeurs exactes et conclusions en texte, ainsi qu’un tableau des 25 entiers de la plage avec leur rotation. Les calculs et la preuve restent possibles sur papier sans la figure.

## Points à trancher par la direction

- Valider le sujet, le niveau et son rattachement au module 1.
- Valider la démonstration, les quatre exercices et la reconstruction, ou demander leurs ajustements.
- Retenir, modifier ou écarter l’interaction et ses bornes ; les modes de navigation restent une décision distincte.
- Examiner séparément les propositions relatives à la progression.

## Vérifications

Contrôles de structure limités aux deux livrables ; compilation, rendu des formules et tests techniques restent à la charge de Claude. Aucun npm, Astro, installation ou compilation lancé.
