# Note d'intégration — figure de la leçon 14 « Polynômes, division & racines »

Fichiers créés : `src/figures/poly.ts`, `src/figures/poly-svg.ts`, `src/components/figures/PolyFigure.astro`, `src/scripts/poly-figures.ts`, `src/styles/figures-poly.css`, `tests/poly.test.mjs`. Fichiers partagés non modifiés : extraits ci-dessous.

Test : `node --experimental-strip-types tests/poly.test.mjs` (7 tests, dont les 7⁴ = 2401 cas vérifiés exhaustivement : P = (X − a)Q + R, deg R < 1, R = P(a), reste nul ⇔ P(a) = 0, valeurs du graphe).

## Choix de lecture de la note de Codex

- Une seule figure (id `figure-polynome`, attributs `data-poly-*`). Quatre champs numériques entiers (c₂, c₁, c₀, a de −3 à 3, initiaux 0, 0, −1, 1) et, par paramètre, deux boutons « + 1 » / « − 1 » (`aria-disabled` aux bornes), plus « Remettre les valeurs initiales ».
- Calcul par division euclidienne exacte dans ℚ[X] (`divide`, fractions BigInt de `rational.ts`), valeur par Horner ; la vérification P = (X − a)Q + R n'est faite que dans les tests. Quotient et reste sont entiers ici ; le code générique accepte des coefficients rationnels (testé).
- Dessin : graphe discret de P aux entiers −4 … 4 (points avec tiges pointillées vers l'axe), point (a, P(a)) orange cerclé et étiqueté ; les points d'ordonnée nulle ont un fond blanc. Tableau des valeurs P(x), ligne de a repérée par `aria-current`.
- Lecture textuelle (toujours présente, `aria-live="polite"`) : paramètres, P, diviseur, quotient, reste, P(a), identité de division complète (ex. `X³ − 1 = (X − 1) × (X² + X + 1) + 0`), comparaison reste / P(a), constat « reste nul » ou « non nul » pour l'essai, et mention « ces essais ne démontrent rien ». L'énoncé ne formule aucun théorème : il décrit chaque essai.
- Diviseur écrit `X`, `X − 2` ou `X + 2` selon le signe de a ; un reste négatif apparaît « − 18 » dans l'identité.

## Emplacement dans `src/content/lessons/polynomes-division-racines.mdx`

Section « Exploration », immédiatement après la phrase (espaces fines insécables U+202F avant les points d'interrogation, à reprendre telle quelle) :

« Est-ce toujours vrai ? Pourquoi peut-on être certain de trouver un quotient et un reste uniques ? »

La phrase termine le paragraphe ; insérer la balise sur une ligne séparée, après ce paragraphe et avant « Ces calculs suggèrent une règle… ».

## 1. Balise MDX

```mdx
<PolyFigure number="1" />
```

## 2. Import

```ts
import PolyFigure from '../figures/PolyFigure.astro';
```

## 3. `scripts/check-build.mjs`

```js
    if (page.includes('polynomes-division-racines')) {
      assert.equal(doc.querySelectorAll('[data-poly-figure]').length, 1, 'Une figure interactive');
      assert.match(doc.querySelector('[data-poly-status]').textContent, /Quotient X² \+ X \+ 1, reste 0, P\(1\) = 0\./, 'Lecture textuelle de la figure sans JavaScript');
      assert.match(doc.querySelector('[data-poly-status]').textContent, /entre −3 et 3\u00a0: ces essais ne démontrent rien/, 'Plage finie annoncée');
      assert.equal(doc.querySelectorAll('[data-poly-table] tr').length, 9, 'Tableau des valeurs présent');
    }
```

Le texte compilé emploie U+00A0 avant « : » : le motif de plage ci-dessus doit donc contenir une espace insécable (`\u00a0`) à la place de l'espace avant « : ».

## 4. `tests/browser_site.py`

Ajouter `'poly-static', 'poly-keyboard', 'poly-buttons'` aux listes de cas, appeler `checks.poly()` à côté de `checks.steps()`, et ajouter la méthode :

```python
    # ---------- Polynomial figure (lesson « Polynômes, division & racines ») ----------
    def poly(self):
        d = self.d
        page = '/cours/polynomes-division-racines/'
        fig = '#figure-polynome'
        status = lambda: d.js(f"return document.querySelector('{fig} [data-poly-status]').textContent;")
        rows = lambda: d.js(f"return Object.fromEntries([...document.querySelectorAll('{fig} [data-poly-rows] > div')].map(r=>[r.children[0].textContent,r.children[1].textContent]));")
        set_field = lambda name, value: d.js(f"const f=document.querySelector('{fig} [data-poly-param={name}]');f.value='{value}';f.dispatchEvent(new Event('input'));")
        action = lambda name: d.js(f"document.querySelector('{fig} [data-poly-action={name}]').click();")

        def static():
            html = (self.root / page.strip('/') / 'index.html').read_text(encoding='utf-8')
            for expected in ('X³ − 1 = (X − 1) × (X² + X + 1) + 0', 'ces essais ne démontrent rien'):
                assert expected in html, f'Texte initial absent du HTML compilé : {expected}'
            self.open(page)
            state = d.js(f"""const f=document.querySelector('{fig}');return {{
              enabled:[...f.querySelectorAll('input,button')].every(e=>!e.disabled),
              label:f.querySelector('svg').getAttribute('aria-labelledby'),
              dots:f.querySelectorAll('svg .fig-dot').length,
              table:f.querySelectorAll('[data-poly-table] tr').length}};""")
            assert state['enabled'], state
            assert state['dots'] == 9 and state['table'] == 9, state
            assert all(d.js('return !!document.getElementById(arguments[0]);', ref) for ref in state['label'].split()), state
            return {'dots': state['dots']}
        self.case('poly-static', static)

        def keyboard():
            self.open(page)
            d.js(f"document.querySelector('{fig} [data-poly-param=c2]').focus();")
            d.key(''); time.sleep(0.1)  # Arrow up: c2 = 1, P = X³ + X² − 1
            r = rows()
            assert r['Reste R'] == '1' and r['Valeur P(1)'] == '1', r
            d.js(f"document.querySelector('{fig} [data-poly-param=a]').focus();")
            d.key(''); time.sleep(0.1)  # Arrow down: a = 0
            r = rows()
            assert r['Quotient Q'] == 'X² + X' and r['Reste R'] == '−1' and r['Valeur P(0)'] == '−1', r
            # Out-of-range values are clamped when the field is left.
            d.js(f"const f=document.querySelector('{fig} [data-poly-param=a]');f.focus();f.select();")
            for ch in '99':
                d.key(ch)
            d.key(''); time.sleep(0.1)
            a = d.js(f"return document.querySelector('{fig} [data-poly-param=a]').value;")
            assert a == '3' and rows()['Paramètres'].endswith('a = 3'), (a, rows())
            return {'arrowKeys': True, 'clamped': a}
        self.case('poly-keyboard', keyboard)

        def buttons():
            self.open(page)
            up = f"document.querySelector('{fig} [data-poly-action=c0-up]')"
            d.js(up + ".focus();")
            for _ in range(7):
                d.key('')  # Enter: stops at the bound c0 = 3
            time.sleep(0.1)
            assert rows()['Polynôme P'] == 'X³ + 3', rows()
            assert d.js('return ' + up + ".getAttribute('aria-disabled');") == 'true'
            assert d.js(f"return document.activeElement === {up};"), 'Le focus doit rester sur le bouton indisponible'
            action('a-down'); action('a-down')  # a = −1: P(−1) = 2
            assert rows()['Reste R'] == '2', rows()
            action('reset')
            assert rows()['Reste R'] == '0' and rows()['Polynôme P'] == 'X³ − 1', rows()
            set_field('c0', '2'); set_field('a', '−1'.replace('−', '-'))
            assert 'ne démontrent rien' in status(), status()
            return {'reset': True}
        self.case('poly-buttons', buttons)
```

## 5. Tableau du gabarit (`docs/GABARIT-LECON.md`)

```
| `<PolyFigure>` | `number` | figure de la leçon 14 : division exacte de X³ + c₂X² + c₁X + c₀ par X − a (quatre entiers de −3 à 3) ; graphe discret de P sur −4 … 4 avec le point (a, P(a)), quotient, reste, P(a) et identité de division en lecture textuelle, tableau des valeurs |
```

`package.json` (test:figures) : ajouter `&& node --experimental-strip-types tests/poly.test.mjs`.
