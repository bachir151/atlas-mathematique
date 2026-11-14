# Vérifications p5 dans Firefox réel

## Relance du 14 novembre 2026, 18:30 — gabarit de leçon et petits textes

`npm run test:browser` : p5 14/14 et site 21/21, sur deux passages. Le scénario `real-canvas` a révélé que p5.js 2.4.0 tente de télécharger ses traductions sur jsDelivr au chargement ; la politique `connect-src 'self'` de production bloque désormais cet appel (voir `docs/P5.md`). Reflow à 320 px, zoom 200 %, taille des cibles et contrastes restent conformes après le relèvement des tailles de texte (minimum 11 px).

## Seconde suite : Atlas et accessibilité du site — 14 novembre 2026, 17:50

`tests/browser_site.py` (lancé par `npm run test:browser` après la suite p5) réutilise le même pilote WebDriver. Rapport : `test-results/browser-site/report.json`. **21/21 sur deux passages consécutifs** (15 scénarios à 17:50, 6 ajoutés à 18:10).

| Scénario | Vérification |
| --- | --- |
| `atlas-3d-load` | Modules Three.js chargés à la demande, contexte WebGL réel non perdu, vue 3D active, étiquettes dans la scène |
| `atlas-selection-sync` | Un thème choisi dans la liste est marqué partout (carte 2D, liste, étiquette 3D) ; un clic sur une étiquette 3D garde la vue 3D |
| `atlas-camera` | Zoom et réinitialisation modifient puis restaurent la projection |
| `atlas-modes-keyboard` | Entrée/Espace sur « Vue 2D », Tab vers la carte, sélection au clavier, retour en 3D |
| `atlas-context-loss` | `WEBGL_lose_context` : retour en 2D, scène libérée, 3D signalée indisponible, **focus conservé** (bouton) ou **transféré à la carte 2D** (étiquette 3D supprimée) |
| `atlas-cleanup` | `pagehide` libère canevas et étiquettes |
| `three-not-loaded-elsewhere` | Aucun module Three.js sur les quatre autres pages |
| `skip-link` | Premier arrêt Tab visible ; Entrée place le focus sur `#main` |
| `keyboard-focus` | Sur les six pages, chaque arrêt Tab est visible et dispose d’un contour |
| `reflow-320` | Aucun défilement horizontal à 320 px CSS (WCAG 1.4.10) |
| `text-zoom-200` | Police racine à 200 % dans une fenêtre de 640 px : aucun défilement horizontal |
| `target-size` | Cibles d’au moins 24 × 24 px à 390 px (WCAG 2.5.8 ; liens dans une phrase exemptés) |
| `contrast` | Contraste WCAG du texte sur les six pages (4,5:1, ou 3:1 pour le grand texte ; commandes inactives exemptées) |
| `square-rotation` | Entrée/Espace sur les commandes ; position à l’écran du sommet marqué A conforme à l’angle affiché et au sens antihoraire annoncé par l’interface (coordonnées SVG via `getScreenCTM`) |
| `square-reset-history` | Historique borné à 8 ; remise à zéro immédiate, sans animation inverse |
| `proof-progressive` | Preuve intégrale hors des panneaux et toujours visible ; ouverture des étapes au clavier avec focus sur l’étape ouverte ; focus conservé en fin de progression ; lien de navigation vers la preuve |
| `companion` | Masquer/Afficher avec `aria-expanded` ; saisie clavier réelle ; historique borné à 20 ; focus rendu au champ ; `maxlength` 300 |
| `library-filters` | Recherche sans accents, filtre par domaine, état vide, effacement des filtres avec retour du focus |
| `atlas-reduced-motion` | Avec mouvement réduit, l’Atlas démarre en 2D ; la 3D reste disponible sur demande |
| `square-reduced-motion` | Avec mouvement réduit, la rotation du carré est immédiate (transition coupée) |
| `page-errors` | Aucune erreur JavaScript non interceptée |

**Largeurs étroites — correction d’une erreur de mesure.** Firefox ne réduit pas sa fenêtre en dessous d’environ 500 px CSS. Le scénario p5 `narrow-layout`, annoncé à 390 px, mesurait en réalité 500 px. Les largeurs de 320 et 390 px sont désormais obtenues dans une iframe de même origine et de taille exacte (`Driver.framed`), où les media queries s’appliquent ; chaque test vérifie la largeur obtenue.

**Défauts trouvés et corrigés par cette suite :**

- Perte du contexte WebGL : le bouton « Vue 3D » recevait `disabled` (focus perdu) et la suppression de la scène effaçait une étiquette 3D focalisée. Le bouton passe en `aria-disabled` (module commun `src/lib/availability.ts`, aussi utilisé par p5) ; le focus d’une étiquette est transféré au thème correspondant de la carte 2D ; le message de perte n’est plus écrasé.
- Contraste : numéros et domaines des cartes de leçon entre 2,9:1 et 4,3:1. Ils utilisent maintenant une encre propre à chaque tonalité (6,3 à 7,9:1) ; les dessins gardent leurs couleurs.
- Cible trop petite : lien « Les cours » du fil d’Ariane (42 × 15 px), porté à 24 px de hauteur.
- Reflow à 320 px : titre de l’accueil (74 px fixes), titre de l’Atlas (« connaissances. ») et en-tête du compagnon (`nowrap`) provoquaient un défilement horizontal. Tailles fluides sous 370-396 px et passage à la ligne de l’en-tête ; affichage inchangé au-delà.

Limites : WebGL logiciel (pas de GPU matériel), zoom texte simulé par la taille de police racine, fonds en image ou dégradé non évalués pour le contraste, pas de lecteur d’écran ni de téléphone réel.

## État au 14 novembre 2026, 17:15 — suite complète réussie

**14 scénarios sur 14 réussis dans Firefox 152.0.1 headless, sur deux passages consécutifs (code de sortie 0).** Exécution par Claude dans un terminal autorisant les ports loopback, Firefox Snap et le CDN p5 2.4.0. Rapport : `test-results/browser/report.json`.

Le passage intermédiaire de 16:57 (sept succès, échec `keyboard` sans message) est archivé dans `test-results/browser/history/20261114T155702Z/`. Corrections apportées ensuite :

- **Composant — focus clavier perdu.** Le bouton principal recevait `disabled` pendant le chargement ; le bouton d’arrêt aussi après usage. Un bouton désactivé qui détient le focus le renvoie à `<body>`. Les commandes indisponibles utilisent désormais `aria-disabled="true"` et restent focalisables ; chaque gestionnaire ignore une commande indisponible. L’attribut `disabled` du HTML initial reste l’état sans JavaScript.
- **Composant — erreur `ResizeObserver loop completed with undelivered notifications`.** Redimensionner le canevas dans le callback modifiait la hauteur de l’élément observé. Seuls les changements de largeur sont traités, à la frame suivante ; la frame en attente est annulée au démontage.
- **Runner.** Disponibilité testée via `aria-disabled` ; maintien du focus pendant le chargement désormais exigé ; arrêt explicite si la tabulation quitte le document (Firefox n’active plus les boutons de la page dans ce cas, cause directe de l’échec de 16:57) ; messages d’erreur ajoutés aux assertions muettes ; stabilisation de 0,15 s après `noLoop()` dans `offscreen-pause` avant la mesure stricte sur 0,3 s.

Restent hors de portée de cette suite : téléphone réel, lecteur d’écran, mesure mémoire.

## Historique — état antérieur du 14 novembre 2026

**Validation partielle réelle : cinq scénarios réussis dans Firefox 152.0.1 headless à 16:50 Europe/Paris (15:50 UTC).** Ce passage a chargé p5 2.4.0 et vérifié le rendu Canvas, les instances indépendantes, la pause/pas-à-pas et la destruction/redémarrage, ainsi que l’absence de chargement initial. Il échoue au sixième scénario `offscreen-pause` ; les huit suivants ne sont pas lancés.

L’audit Claude transmis par la direction relève une vérification immédiate après un défilement soumis au CSS `scroll-behavior: smooth`. Le runner a été corrigé : défilement explicitement instantané, attente de la géométrie hors écran après redimensionnement et du retour en haut avant le test clavier, diagnostics géométriques à expiration. Le CSS du site n’est pas modifié. La correction attend sa confirmation dans Firefox.

Les preuves de 16:50 sont préservées dans `test-results/browser/history/20261114T155034Z/` : rapport, journal du pilote et captures. Une relance après correction depuis le terminal Codex compile six pages mais échoue à l’ouverture du port local (`EPERM`) avant tout scénario. Son résultat est dans `test-results/browser/report.json`, avec `status: "blocked"`. Les restrictions de ce terminal ne contredisent pas le passage Firefox archivé.

La syntaxe Python et celle des 41 fragments JavaScript du runner corrigé sont vérifiées, sans erreur. Ces contrôles statiques ne valident pas la correction dans un navigateur. Le diagnostic initial `audits/p5/browser-environment.json` reste un historique des tentatives bloquées, et non l’état de toutes les exécutions.

## Commande reproductible

Depuis un terminal qui permet de lancer un serveur et un navigateur :

```bash
npm run test:browser
```

Cette commande compile le site, puis lance `tests/browser_p5.py`. Elle utilise **Firefox, geckodriver et Python 3**, sans paquet Selenium ou Playwright supplémentaire. Ces programmes doivent être disponibles sur la machine. Le pilote n’est ni téléchargé ni installé automatiquement et aucune authentification ou profil personnel du navigateur n’est utilisé.

Le runner sert uniquement `dist/` sur un port loopback disponible, lance un pilote local et ouvre deux sessions Firefox headless neuves : animation normale, puis préférence de mouvement réduit. Les profils et résultats restent dans le dossier ignoré `test-results/browser/`. Les processus et le serveur créés par le runner sont arrêtés à sa sortie ; aucun réglage de sécurité du navigateur n’est désactivé.

Pour réutiliser un serveur de développement déjà lancé :

```bash
python3 tests/browser_p5.py --base-url http://127.0.0.1:4321
```

Pour préciser les exécutables :

```bash
python3 tests/browser_p5.py --driver /chemin/vers/geckodriver --firefox-binary /chemin/vers/firefox
```

Ces chemins sont des exemples à adapter à la machine. Avec Firefox Snap, utiliser le pilote compatible et un dossier de profils accessible à Snap ; le runner fournit `test-results/browser/profiles` via `--profile-root`. Ne pas lancer les tests Python avec `-O` ou `PYTHONOPTIMIZE`, car cela désactive les assertions ; le runner refuse ce cas.

## Scénarios préparés

| Scénario | Vérification prévue dans le navigateur réel |
| --- | --- |
| Chargement initial | Aucun script p5, aucune requête p5 ni canevas avant action ; alternatives accessibles présentes |
| Véritable rendu | Constructeur réel, contexte Canvas 2D, pixels peints et modification de l’image pendant l’animation |
| Deux instances | Une bibliothèque partagée ; pause de A sans arrêt de B |
| Pause et pas-à-pas | Compteur d’images stable en pause puis avance d’une seule image |
| Destruction et redémarrage | Appel public `remove()`, canevas retiré, boucle arrêtée et nouvelle instance après redémarrage |
| Hors écran | Composant entièrement hors viewport et boucle suspendue |
| Onglet masqué | Changement réel d’onglet, événements de visibilité et images stables ; résultat « skipped » si Firefox ne masque pas le document dans cette configuration |
| Clavier | Navigation native Tab, activation Entrée et Espace, focus visible |
| Viewport étroit | Largeur effectivement obtenue, absence de débordement horizontal, cibles de 44 px et `touch-action: pan-y` |
| Annulation du chargement | Insertion du script retardée, annulation puis arrivée de la vraie bibliothèque sans création tardive d’instance |
| Retrait pendant chargement | Composant retiré du DOM avant la fin du chargement, sans résurrection de canevas |
| Échec réseau et reprise | Véritable réponse HTTP 404 pour le premier script, remplacement visible puis chargement réussi au nouvel essai |
| Mouvement réduit | Préférence Firefox réelle, image fixe puis pas-à-pas manuel |
| Erreurs de page | Collecte des erreurs JavaScript et des rejets non traités dans les pages testées |

Le runner observe le constructeur p5 et ses méthodes publiques avec des wrappers qui transmettent leurs appels à la véritable bibliothèque. Il ne remplace ni les méthodes de dessin ni le contexte Canvas. Il conserve les références des instances pour l’observation : ce test ne mesure donc pas leur collecte mémoire par le moteur JavaScript.

L’insertion retardée du script et le premier 404 sont des conditions de test volontaires, isolées dans les pages et profils de test. Le reste du site et les sources du composant ne sont pas modifiés pour simuler leur comportement.

Le viewport étroit n’est pas un téléphone réel et ne certifie pas Safari mobile, les gestes tactiles matériels ou un lecteur d’écran. Les résultats de ces vérifications distinctes doivent rester ouverts.

## Résultats et captures

- `test-results/browser/report.json` : état, versions de navigateur, résultats individuels, scénarios non exécutés et limites.
- `test-results/browser/geckodriver.log` : diagnostic du pilote lorsque son lancement est atteint.
- `desktop.png`, `narrow.png`, `reduced.png` et éventuelles captures d’échec : uniquement si une session réelle a pu les produire.

Codes de sortie : `0` si tous les scénarios sont exécutés et réussis, `1` pour un échec observé du scénario ou de l’application, `2` pour une vérification bloquée, interrompue ou partielle. Un rapport bloqué ou un scénario sauté ne vaut pas validation complète.

## Responsabilité des tests

Claude est le développeur et prend en charge l’exécution et la maintenance de ces tests dans le périmètre autorisé. Codex rédige les contenus mathématiques. L’ancienne politique d’audit Claude en lecture seule est abandonnée ; aucun audit ni contre-audit entre agents n’est demandé.

Références techniques : [WebDriver W3C](https://www.w3.org/TR/webdriver2/), [capacités Firefox](https://firefox-source-docs.mozilla.org/testing/geckodriver/Capabilities.html), [préférence Firefox de mouvement réduit](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion#user_preferences).
