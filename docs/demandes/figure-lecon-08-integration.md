# Intégration de la figure « Réordonner des cartes » (leçon 08)

Note pour Claude. Fichiers créés : `src/figures/perm.ts`, `src/figures/perm-svg.ts`, `src/components/figures/PermutationFigure.astro`, `src/scripts/perm-figures.ts`, `src/styles/figures-perm.css`, `tests/perm.test.mjs`. Aucun fichier partagé n'a été modifié.

## 1. Balise MDX

```mdx
<PermutationFigure number="1" />
```

## 2. Emplacement

Dans `src/content/lessons/permutations-cycles.mdx`, section « Exploration », en nouveau paragraphe séparé par des lignes vides, juste après la phrase finale du dernier paragraphe : « Ces exemples suggèrent de décrire une permutation en suivant les positions successives, mais ne prouvent pas que cela fonctionne pour toute permutation. »
(Le fichier de réponse de Codex ne donne pas d'emplacement précis ; c'est le choix naturel, la figure illustrant l'exploration. À valider.)

## 3. Lignes à ajouter

`src/components/lesson/index.ts` :
```ts
import PermutationFigure from '../figures/PermutationFigure.astro';
// ... et ajouter PermutationFigure à la fin de l'objet lessonComponents
```

`docs/GABARIT-LECON.md` (tableau des composants) :
```
| `<PermutationFigure>` | `number` | cartes de la leçon 08 : n de 2 à 6 (initial 4), échange de deux images, application de la permutation aux positions courantes, compteur, décomposition en cycles calculée, table et lecture textuelle |
```

`package.json` (script `test:figures`, ajouter à la fin) :
```
 && node --experimental-strip-types tests/perm.test.mjs
```

`scripts/check-build.mjs` (à côté du bloc `sous-groupes-entiers` ; slug de page `permutations-cycles`) :
```js
    if (page.includes('permutations-cycles')) {
      assert.equal(doc.querySelectorAll('[data-perm-figure]').length, 1, 'Une figure interactive');
      assert.match(doc.querySelector('[data-perm-status]').textContent, /Les cartes sont à leur position initiale\. Décomposition de σ : \(1.3.2\)\./, 'Lecture textuelle de la figure sans JavaScript');
      assert.equal(doc.querySelectorAll('[data-perm-table] tr').length, 4, 'Table des images présente');
    }
```

`tests/browser_site.py` : ajouter `'perm-static', 'perm-keyboard', 'perm-buttons'` après `'steps-buttons'` dans PLAN et DRAFT_PLAN, `checks.perm()` après `checks.steps()` (deux endroits), et la méthode (page `/cours/permutations-cycles/`, `fig = '#figure-permutation'`). Le séparateur interne des cycles est U+202F ; les textes ci-dessous l'écrivent ` `.

```python
    # ---------- Permutation figure (lesson « Permutations & cycles ») ----------
    def perm(self):
        d = self.d
        page = '/cours/permutations-cycles/'
        fig = '#figure-permutation'
        status = lambda: d.js(f"return document.querySelector('{fig} [data-perm-status]').textContent;")
        rows = lambda: d.js(f"return Object.fromEntries([...document.querySelectorAll('{fig} [data-perm-rows] > div')].map(r=>[r.children[0].textContent,r.children[1].textContent]));")
        choose = lambda which, value: d.js(f"const s=document.querySelector('{fig} [data-perm-image={which}]');s.value='{value}';s.dispatchEvent(new Event('change'));")
        action = lambda name: d.js(f"document.querySelector('{fig} [data-action={name}]').click();")

        def static():
            html = (self.root / page.strip('/') / 'index.html').read_text(encoding='utf-8')
            for expected in ('Les cartes sont à leur position initiale.', 'Décomposition de σ : (1 3 2).', 'ne constituent pas une preuve générale.'):
                assert expected in html, f'Texte initial absent du HTML compilé : {expected}'
            self.open(page)
            state = d.js(f"""const f=document.querySelector('{fig}');return {{
              enabled:[...f.querySelectorAll('select,button')].every(e=>!e.disabled),
              label:f.querySelector('svg').getAttribute('aria-labelledby'),
              cards:f.querySelectorAll('svg .perm-card').length,
              table:f.querySelectorAll('[data-perm-table] tr').length}};""")
            assert state['enabled'], state
            assert state['cards'] == 4 and state['table'] == 4, state
            assert all(d.js('return !!document.getElementById(arguments[0]);', ref) for ref in state['label'].split()), state
            r = rows()
            assert r['Points fixes'] == '4' and r['Applications effectuées'] == '0', r
            return {'cards': 4}
        self.case('perm-static', static)

        def keyboard():
            self.open(page)
            d.js(f"document.querySelector('{fig} [data-perm-image=b]').focus();")
            d.key(''); time.sleep(0.1)  # Arrow down: seconde image = 3
            assert d.js(f"return document.querySelector('{fig} [data-perm-image=b]').value;") == '3'
            d.js(f"document.querySelector('{fig} [data-action=swap]').focus();")
            d.key(''); time.sleep(0.1)  # Enter: échange les images 1 et 3
            r = rows()
            assert r['Images de σ'] == '1 ↦ 1 ; 2 ↦ 3 ; 3 ↦ 2 ; 4 ↦ 4', r
            assert r['Décomposition en cycles'] == '(2 3)', r
            assert status().startswith('Images 1 et 3 échangées'), status()
            return {'swapByKeyboard': True}
        self.case('perm-keyboard', keyboard)

        def buttons():
            self.open(page)
            back = f"document.querySelector('{fig} [data-action=back]')"
            assert d.js('return ' + back + ".getAttribute('aria-disabled');") == 'true'
            for _ in range(2):
                action('apply')
            r = rows()
            assert r['Applications effectuées'] == '2' and r['Positions courantes'].startswith('carte 1 en position 2 ;'), r
            action('apply')
            assert status().startswith('Permutation appliquée aux positions courantes. Après 3 applications, toutes les cartes sont revenues à leur position initiale.'), status()
            d.js(back + ".focus();"); d.key(''); time.sleep(0.1)
            assert rows()['Applications effectuées'] == '0'
            assert d.js('return ' + back + ".getAttribute('aria-disabled');") == 'true'
            assert d.js(f"return document.activeElement === {back};"), 'Le focus doit rester sur le bouton indisponible'
            choose('b', '1')
            swap = f"document.querySelector('{fig} [data-action=swap]')"
            assert d.js('return ' + swap + ".getAttribute('aria-disabled');") == 'true'
            choose('b', '2')
            d.js(f"const n=document.querySelector('{fig} [data-perm-n]');n.value='6';n.dispatchEvent(new Event('change'));")
            r = rows()
            assert r['Décomposition en cycles'].startswith('e ') and r['Points fixes'] == '1, 2, 3, 4, 5, 6', r
            assert d.js(f"return document.querySelectorAll('{fig} [data-perm-table] tr').length;") == 6
            return {'identity': True, 'bound': 6}
        self.case('perm-buttons', buttons)
```
