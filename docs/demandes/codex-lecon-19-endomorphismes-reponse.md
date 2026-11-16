# Réponse Codex — leçon 19 : endomorphismes

**Statut : brouillon soumis à la direction ; aucun contenu nouveau n’est validé.**

## Sujet, niveau et prérequis

La leçon « Endomorphismes, matrices & valeurs propres » figure dans `src/content/lessons/endomorphismes-matrices.mdx` ; ce slug court nomme l’objet et son écriture en coordonnées. Elle vise le début de licence, avec une exploration calculatoire accessible en fin de lycée accompagnée. Elle suppose les corps, les espaces vectoriels, les bases finies et l’unicité des coordonnées, ainsi que les applications, la composition et les calculs élémentaires. Les matrices et leur action sur une colonne sont introduites dans le texte.

La leçon voisine sur les espaces vectoriels abstraits, rédigée en parallèle, est citée par thème : ses définitions d’espace vectoriel, de base, de dimension finie et l’existence et l’unicité des coordonnées dans une base sont admises ici. La leçon sur la diagonalisation est citée pour l’étude de l’existence d’une base propre ; aucun de ses résultats n’est admis pour les preuves. La dualité n’est pas requise. La compatibilité effective des prérequis sera à vérifier lors de la validation des leçons parallèles.

## Plan et précautions scientifiques

Exploration d’une transformation du plan ; linéarité et contre-exemples ; matrice par colonnes et composition ; valeurs et espaces propres ; théorème de changement de base avec preuve progressive et intégrale ; exemple résolu exhaustivement et dépendance au corps ; groupe des automorphismes ; quatre exercices corrigés ; reconstruction.

Le corps est explicité, et la définition générale porte sur un corps commutatif. La matrice de passage est définie dans son sens précis : ses colonnes sont les nouveaux vecteurs de base exprimés dans l’ancienne. L’espace propre contient zéro, contrairement à l’ensemble des vecteurs propres. L’exemple réel sans valeur propre est distingué de son analogue complexe. La résolution n’utilise pas de déterminant ni de polynôme caractéristique. Une base propre particulière est construite dans un exercice, sans énoncer de critère général de diagonalisation. La formule $r(x,y)=(-y,x)$ est explicite et aucune convention de sens des leçons 01 ou 09 n’est utilisée.

Pour le module 4, proposer comme critères de maîtrise : reconnaître une application linéaire, construire sa matrice dans une base, interpréter un changement de base, déterminer des espaces propres par résolution et distinguer un résultat intrinsèque de ses coordonnées. Cette proposition ne modifie pas la progression de référence.

## Décisions à prendre

La direction est invitée à valider le contenu et le niveau, notamment l’introduction du changement de base et l’exemple complexe. Elle peut décider si la manipulation proposée ci-dessous enrichit la leçon. Aucune application interdisciplinaire ni référence historique n’est avancée.

## Interaction proposée après validation

Après la phrase exacte « Les essais suggèrent des réponses ; ils ne suffisent pas à exclure toutes les autres possibilités. », proposer une figure du plan réel pour $u(x,y)=(2x+y,y)$. Deux champs entiers $x,y$ vont de −5 à 5, avec valeurs initiales $(-1,1)$ ; afficher le vecteur choisi et son image depuis l’origine, leurs coordonnées et le calcul $(2x+y,y)$. Un bouton permet de revenir aux valeurs initiales. Si le vecteur est non nul, afficher s’il est propre et, le cas échéant, le coefficient exact : $2$ lorsque $y=0$, $1$ lorsque $x=-y$, aucun dans les autres cas. Pour $(0,0)$, indiquer explicitement qu’il n’est pas un vecteur propre. Le lecteur peut comparer les directions et constater qu’une image nulle, si elle apparaît dans une variante future, ne doit pas être décrite comme une direction. Ces essais ne démontrent pas l’exhaustivité.

Alternative textuelle permanente, utilisable au clavier et sans dessin : champs et résultat calculé en texte, avec tableau des exemples $(1,0)\mapsto(2,0)$, $(-1,1)\mapsto(-1,1)$, $(1,1)\mapsto(3,1)$ et $(0,0)\mapsto(0,0)$, coefficients propres indiqués pour les deux premiers. La figure est une proposition pédagogique, non une réalisation ni une validation.

## Vérifications

Contrôles de structure, de ponctuation et d’équilibre des délimiteurs mathématiques sur les deux fichiers seulement ; aucune compilation, commande npm ou Astro, installation ou test technique. Claude assurera les vérifications techniques après remise.
