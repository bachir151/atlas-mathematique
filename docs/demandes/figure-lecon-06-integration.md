# Figure leçon 06 — note d'intégration (pour Claude)

Fichiers créés : `src/figures/morphism.ts`, `src/figures/morphism-svg.ts`, `src/components/figures/MorphismFigure.astro`, `src/scripts/morphism-figures.ts`, `src/styles/figures-morphism.css`, `tests/morphism.test.mjs`. Fichiers partagés non modifiés. Id de figure : `figure-morphisme`. Page : `/cours/morphismes-isomorphismes/`.

## 1. Balise MDX

```mdx
<MorphismFigure number="1" />
```

## 2. Emplacement

Dans la section `exploration`, après le paragraphe se terminant par « … deux entiers différents peuvent décrire la même rotation. » (commence par « Sur papier, comparez les rotations associées à $1+2$ … »), avant « Cette correspondance respecte l’addition et la composition… ». Codex ne fixe pas l'endroit exact : choix proposé d'après le plan (« 1. Exploration des quarts de tour associés aux entiers et observation des collisions »), à valider.

## 3. Lignes à ajouter

`src/components/lesson/index.ts` :
```ts
import MorphismFigure from '../figures/MorphismFigure.astro';
// ... et ajouter MorphismFigure à lessonComponents
```

`docs/GABARIT-LECON.md` (tableau des composants) :
```
| `<MorphismFigure>` | `number` | figure de la leçon 06 : p(k) = r^k de −12 à 12, deux entiers m, n (−12 à 12, défauts 1 et 5), p(m), p(n), n − m et son reste modulo 4, p(m+n) et p(m)∘p(n) (somme exacte de −24 à 24), tableau des 25 entiers |
```

`package.json` (test:figures, ajouter à la fin de la chaîne) :
```
 && node --experimental-strip-types tests/morphism.test.mjs
```

`scripts/check-build.mjs` (à côté des autres blocs `page.includes`) :
```js
    if (page.includes('morphismes-isomorphismes')) {
      assert.equal(doc.querySelectorAll('[data-morphism-figure]').length, 1, 'Une figure interactive');
      assert.match(doc.querySelector('[data-morphism-status]').textContent, /Essai avec m = 1 et n = 5 : p\(m\) = r, p\(n\) = r/, 'Lecture textuelle de la figure sans JavaScript');
      assert.match(doc.querySelector('[data-morphism-status]').textContent, /ne prouvent pas la propriété générale/, 'Plage finie annoncée');
      assert.equal(doc.querySelectorAll('[data-morphism-table] tr').length, 25, 'Tableau des 25 entiers présent');
    }
```

`tests/browser_site.py` : ajouter `'morphism-static', 'morphism-keyboard', 'morphism-buttons'` aux deux listes de scénarios (lignes 38 et 43), appeler `checks.morphism()` à côté de `checks.steps()` (lignes 805 et 813), et ajouter la méthode :

```python
    # ---------- Morphism figure (lesson « Morphismes & isomorphismes ») ----------
    def morphism(self):
        d = self.d
        page = '/cours/morphismes-isomorphismes/'
        fig = '#figure-morphisme'
        status = lambda: d.js(f"return document.querySelector('{fig} [data-morphism-status]').textContent;")
        rows = lambda: d.js(f"return Object.fromEntries([...document.querySelectorAll('{fig} [data-morphism-rows] > div')].map(r=>[r.children[0].textContent,r.children[1].textContent]));")
        set_field = lambda name, value: d.js(f"const f=document.querySelector('{fig} [data-param={name}]');f.value='{value}';f.dispatchEvent(new Event('input'));")
        action = lambda name: d.js(f"document.querySelector('{fig} [data-action={name}]').click();")

        def static():
            html = (self.root / page.strip('/') / 'index.html').read_text(encoding='utf-8')
            for expected in ('Essai avec m = 1 et n = 5 : p(m) = r, p(n) = r', 'ne prouvent pas la propriété générale', 'entre −24 et 24'):
                assert expected in html, f'Texte initial absent du HTML compilé : {expected}'
            self.open(page)
            state = d.js(f"""const f=document.querySelector('{fig}');return {{
              enabled:[...f.querySelectorAll('input,button')].every(e=>!e.disabled),
              label:f.querySelector('svg').getAttribute('aria-labelledby'),
              dots:f.querySelectorAll('svg .fig-dot').length,
              table:f.querySelectorAll('[data-morphism-table] tr').length}};""")
            assert state['enabled'], state
            assert state['dots'] == 25 and state['table'] == 25, state
            assert all(d.js('return !!document.getElementById(arguments[0]);', ref) for ref in state['label'].split()), state
            r = rows()
            assert r['p(m + n)'] == 'p(6) = r²' and r['p(m) ∘ p(n)'] == 'r ∘ r = r²', r
            return {'integers': state['table']}
        self.case('morphism-static', static)

        def keyboard():
            self.open(page)
            d.js(f"document.querySelector('{fig} [data-param=m]').focus();")
            d.key(''); time.sleep(0.1)  # Arrow up: m = 2
            d.js(f"document.querySelector('{fig} [data-param=n]').focus();")
            d.key(''); time.sleep(0.1)  # Arrow down: n = 4
            r = rows()
            assert r['p(m)'] == 'p(2) = r²' and r['p(n)'] == 'p(4) = e', r
            assert r['Différence n − m'] == '4 − 2 = 2', r
            assert r['p(m) et p(n)'] == 'rotations différentes', r
            # Out-of-range values are clamped when the field is left.
            d.js(f"const f=document.querySelector('{fig} [data-param=m]');f.focus();f.select();")
            for ch in '99':
                d.key(ch)
            d.key(''); time.sleep(0.1)
            m = d.js(f"return document.querySelector('{fig} [data-param=m]').value;")
            assert m == '12' and rows()['Entiers choisis'] == 'm = 12 ; n = 4', (m, rows())
            return {'arrowKeys': True, 'clamped': m}
        self.case('morphism-keyboard', keyboard)

        def buttons():
            self.open(page)
            down = f"document.querySelector('{fig} [data-action=m-down]')"
            d.js(down + ".focus();")
            for _ in range(14):
                d.key('')  # Enter: stops at the bound m = −12
            time.sleep(0.1)
            assert rows()['p(m)'] == 'p(−12) = e', rows()
            assert d.js('return ' + down + ".getAttribute('aria-disabled');") == 'true'
            assert d.js(f"return document.activeElement === {down};"), 'Le focus doit rester sur le bouton indisponible'
            set_field('m', '-12'); set_field('n', '-12')
            r = rows()
            assert r['Somme m + n'] == '−12 + (−12) = −24' and r['p(m + n)'] == 'p(−24) = e', r
            set_field('m', '12'); set_field('n', '12')
            assert rows()['Somme m + n'] == '12 + 12 = 24', rows()
            set_field('m', '-3'); set_field('n', '5')
            r = rows()
            assert r['Différence n − m'] == '5 − (−3) = 8' and r['p(m) et p(n)'] == 'même rotation', r
            action('reset')
            assert rows()['Entiers choisis'] == 'm = 1 ; n = 5', rows()
            assert d.js(f"return document.querySelector('{fig} [data-action=reset]').getAttribute('aria-disabled');") == 'true'
            return {'bounds': True, 'negatives': True}
        self.case('morphism-buttons', buttons)
```

## Remarques

- Aucune affirmation mathématique ajoutée : la figure calcule et affiche ; la plage finie et le caractère expérimental sont annoncés (statut, indication sous le dessin, note technique).
- Texte du bouton de remise à l'état initial : « Revenir à m = 1 et n = 5 » (texte de l'interface, non fourni par Codex ; à garder ou ajuster).
- Les formules de la figure sont en texte brut (p(k) = r^k, r², r³) : pas de KaTeX dans le composant.
- Rien n'a été compilé ni testé dans Astro/Firefox ; seul `node --experimental-strip-types tests/morphism.test.mjs` a été exécuté (6 tests, tous réussis).
