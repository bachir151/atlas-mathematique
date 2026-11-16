# Leçon 17 — espaces vectoriels et bases

**Statut :** brouillon soumis à la direction. Aucun contenu nouveau n'est validé.

## Sujet, niveau et prérequis

La leçon présente les axiomes d'espace vectoriel, les sous-espaces, les combinaisons linéaires, les familles libres et génératrices et les bases. Le fichier `src/content/lessons/espaces-vectoriels.mdx`, de slug `espaces-vectoriels`, nomme le thème assigné sans le restreindre à la géométrie.

Niveau visé : début de licence, avec exploration accessible à une fin de lycée familière des preuves. Prérequis : ensembles, applications, groupe commutatif, opérations et axiomes d'un corps commutatif, calcul sur les polynômes et égalité de leurs coefficients. Sont admis les propriétés élémentaires des corps et des polynômes des leçons déjà publiées ; l'irrationalité de $\sqrt2$ est rappelée et justifiée. Aucun résultat des leçons parallèles sur dualité, endomorphismes, diagonalisation, groupes matriciels ou exponentielle n'est admis. La dualité est seulement annoncée par thème.

## Plan

1. Deux recettes pour un polynôme : existence et unicité.
2. Axiomes, exemples non géométriques, critère de sous-espace et contre-exemple affine.
3. Combinaisons, liberté, génération et bases ; dépendance au corps et cas vide.
4. Équivalence entre base et unicité des coordonnées, démontrée progressivement et intégralement.
5. Changement concret de base, quatre exercices corrigés et reconstruction.

## Précautions scientifiques

Le corps est commutatif et précisé dans chaque exemple. Les vecteurs ne sont pas nécessairement des flèches. Les familles traitées sont finies, avec convention explicite pour la famille vide ; l'exercice sur $K[X]$ établit qu'une base finie n'existe pas toujours sans exclure les bases infinies. La leçon ne suppose ni ne démontre l'existence générale d'une base, l'égalité des cardinalités des bases ou la notion de dimension. Le changement de corps peut modifier la liberté ; le changement de base modifie les coordonnées. Le calcul en caractéristique deux est distingué du calcul réel. L'exploration ne remplace pas la preuve et le lien proposé est qualifié de mathématique démontré. Aucun contenu existant n'est modifié.

## Propositions pour le module 4

Placer cette leçon en ouverture de l'algèbre linéaire structurelle, après les corps et les polynômes. Objectifs proposés : reconnaître un espace et un sous-espace, distinguer liberté et génération, construire des coordonnées et reconstruire le théorème. Critères de maîtrise : justifier les deux conditions d'une base, fournir un contre-exemple et identifier le rôle du corps. Ces propositions ne modifient pas la progression de référence.

## Interaction proposée après validation

**Emplacement exact :** après la phrase « Nous allons le démontrer en général. » dans l'exploration.

Afficher les coefficients de $a\cdot1+b\cdot X+c\cdot(1+X)$, soit $(a+c)+(b+c)X$, et deux recettes simultanées. Six champs entiers, bornés de −5 à 5, présentent les coefficients $(a,b,c)$ et $(a',b',c')$, initialisés respectivement à $(2,3,0)$ et $(1,2,1)$. Afficher les deux polynômes calculés exactement et indiquer s'ils coïncident. Le lecteur peut constater que des recettes distinctes peuvent donner le même résultat, puis fixer les deux coefficients de $1+X$ à zéro pour comparer les recettes utilisant seulement $1$ et $X$. Les bornes ne couvrent que des essais entiers ; elles ne démontrent ni la liberté sur $\mathbb R$ ni le théorème général.

**Alternative textuelle permanente :** champs accessibles au clavier, deux expressions développées et comparaison textuelle actualisées ; les deux recettes initiales et le raisonnement restent présents dans la leçon sans interaction. Aucune figure n'est nécessaire à la lecture.

## Décisions à prendre

La direction peut valider ou ajuster le niveau, le traitement de la famille vide, l'exercice sur $K[X]$, la reconstruction et l'interaction proposée. Elle décide séparément des propositions pour le module et de l'articulation des trois modes. Aucun arbitrage scientifique bloquant n'est identifié.

## Vérifications et limites

Contrôles de structure, de délimiteurs et de ponctuation limités aux deux livrables ; aucune compilation, installation, commande npm ou Astro. Claude vérifiera le rendu MDX et KaTeX ainsi que l'intégration et l'accessibilité après remise.
