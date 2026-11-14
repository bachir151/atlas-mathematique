# Mise en ligne sur Netlify

État au 14 novembre 2026 : **site en ligne et public** à https://loquacious-concha-324072.netlify.app (projet Netlify `loquacious-concha-324072`, relié à `bachir151/atlas-mathematique`, branche `main`, créé par la direction). Chaque push sur `main` redéploie.
Le déploiement exige une autorisation explicite de la direction du projet
précisant l’action et la cible (voir `CLAUDE.md`).

## Ce qui est configuré

| Élément | Où | Rôle |
| --- | --- | --- |
| Compilation | `netlify.toml` → `npm run build && npm run verify:build` | le déploiement échoue sur un lien cassé, un brouillon, une formule brute, un script sans empreinte ou un p5.js altéré |
| Node | `netlify.toml` (`NODE_VERSION = "22.23.4"`) et `.nvmrc` | Astro 7 refuse les versions plus anciennes |
| Brouillons | `ATELIER_DRAFTS = "0"` | aucune leçon non validée n’est compilée, y compris dans les aperçus |
| Politique de contenu de page | `astro.config.mjs` → `security.csp` | balise meta générée par Astro : scripts limités au site et à leurs empreintes SHA-256, connexions limitées au site (bloque l’appel de p5.js à jsDelivr), images et polices locales, `object-src 'none'` |
| En-têtes HTTP | `netlify.toml` | `frame-ancestors 'self'`, `X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy` (caméra, micro, position… refusés), `Cross-Origin-Opener-Policy` |
| Cache | `netlify.toml` | fichiers `/_astro/*` et `/vendor/*` immuables (noms versionnés) ; pages HTML revalidées |
| Page 404 | `dist/404.html` | servie automatiquement par Netlify |

Les styles en ligne restent autorisés (`style-src 'unsafe-inline'`) : KaTeX et
la carte de l’Atlas positionnent leurs éléments par attributs `style`. Aucun
script en ligne non haché ne peut s’exécuter.

## Vérification locale

`npm run test:browser` sert `dist/` avec **les en-têtes de `netlify.toml`**
(`tests/browser_p5.py`, `QuietHandler`). Le scénario `security-policy` vérifie
les en-têtes reçus, la balise CSP et le blocage effectif d’une connexion vers
jsDelivr. Résultat du 14 novembre : p5 14/14, site 22/22.

## Procédure de mise en ligne (après autorisation)

Deux possibilités ; la première est recommandée.

1. **Site Netlify relié au dépôt GitHub** `bachir151/atlas-mathematique`,
   branche `main` : la direction crée le site dans l’interface Netlify
   (« Add new site » → « Import an existing project » → GitHub) ; les
   réglages sont lus depuis `netlify.toml`. Chaque push sur `main` redéploie.
   Désactiver les aperçus de branches et de PR si l’on ne veut aucune URL
   publique supplémentaire.
2. **Déploiement manuel** avec Netlify CLI (`npx netlify-cli deploy`), qui
   demande une connexion au compte Netlify de la direction.

Après la première mise en ligne : vérifier les en-têtes réels
(`curl -sI https://<site>.netlify.app/`), ouvrir l’Atlas, une expérience p5 et
la page du cours ; activer HTTPS forcé (par défaut sur Netlify) ; ajouter
`Strict-Transport-Security` seulement une fois le domaine définitif choisi.

## Vérification en ligne du 14 novembre 2026

- Pages publiques : 200 ; brouillons et page inexistante : 404 avec la page « Hors de la carte ».
- En-têtes reçus conformes à `netlify.toml` ; Netlify ajoute `Strict-Transport-Security` ; fichiers `/_astro/*` et `/vendor/*` immuables.
- p5.js en ligne : empreinte SHA-384 identique à la valeur SRI ; l’appel de p5.js vers jsDelivr est bloqué par `connect-src`.
- HTML en ligne identique au build local, à deux ajouts près de Netlify (offre gratuite) : un commentaire publicitaire et le script du badge « Powered by Netlify » (`/.netlify/scripts/hud`, servi par le site, sans connexion tierce, mémorise son masquage dans `localStorage`). Il peut être désactivé dans *Project configuration → General → Powered by Netlify badge*.
- Firefox sur le site en ligne : Atlas 3D (WebGL) fonctionnel. Défaut trouvé : sur une connexion lente, p5.js (296 Ko compressés) dépassait le délai de 15 s du chargeur ; corrigé et publié (`769fbfa`) ; revérifié en ligne : p5 chargé et animé, aucune requête tierce.

## Limites

- Aucun test sur l’infrastructure Netlify elle-même n’a été fait.
- Le compagnon reste une simulation locale ; un vrai modèle exigerait une
  fonction serveur et une nouvelle autorisation (`AGENTS.md`).
