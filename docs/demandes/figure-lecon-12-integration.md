# Note d'intégration — figure de la leçon 12 « Idéaux & multiples »

Fichiers créés : `src/figures/ideal.ts`, `src/figures/ideal-svg.ts`, `src/components/figures/IdealFigure.astro`, `src/scripts/ideal-figures.ts`, `src/styles/figures-ideal.css`, `tests/ideal.test.mjs`. Fichiers partagés non modifiés : extraits ci-dessous. Test : `node --experimental-strip-types tests/ideal.test.mjs` (9 tests, vérification exhaustive des 625 couples (a, b) de −12 à 12).

## Emplacement dans `src/content/lessons/ideaux-multiples.mdx`

Section « Exploration », après la phrase exacte de Codex : « Les exemples guideront nos conjectures ; ils ne démontrent pas les résultats généraux. » (dernière phrase du dernier paragraphe, avant `</CourseSection>`).

## Choix de lecture

- Quatre lignes superposées sur la droite des entiers de −24 à 24 : multiples de a (cercles), multiples de b (carrés), multiples communs = intersection (losanges), combinaisons u a + v b listées (croix). Formes différentes : la couleur n'est jamais le seul indice. Un trait pointillé et un anneau marquent le résultat du calcul sélectionné ; s'il sort de [−24 ; 24] (jusqu'à ±120), il n'est pas dessiné sur la droite : une mention « hors de la droite » est affichée (dessin et texte).
- Intersection lue littéralement : entiers multiples de a et de b à la fois ; pour a = 0 ou b = 0, les « multiples de 0 » sont {0}, sans aucune division par zéro (test `isMultiple`). Le texte l'annonce (« a = 0 : les multiples de 0 se réduisent à 0 » ; cas a = b = 0 : toute combinaison vaut 0).
- « Ne pas identifier la réunion à la somme » : la figure ne dessine pas de réunion ; elle affiche seulement, en nombres, combien d'entiers affichés sont multiples de a ou de b et combien ont une combinaison, et l'indication de figure dit que ce sont deux listes distinctes. Aucun théorème n'est énoncé.
- Curseurs u et v : `<input type="range">` natifs (flèches, début, fin, pas de 1), valeur courante affichée et en `aria-valuetext`. Générateurs a et b : champs numériques (valeurs hors bornes ramenées dans [−12 ; 12] à la sortie du champ). Un seul bouton, « Revenir à a = 6, b = 4, u = 1 et v = −1 » (texte d'interface ajouté), en `aria-disabled` aux valeurs initiales.
- Tableau : un couple (u, v) avec |u| + |v| minimal (premier trouvé à égalité) pour chaque entier atteint dans les bornes, sinon « aucune dans les bornes ». Le tableau a 49 lignes dans un cadre défilant focalisable.
- La ligne « Plus petit entier strictement positif affiché comme combinaison » est un calcul sur la liste bornée (comme la figure 04) ; il vaut « aucun » pour a = b = 0.
- Texte avec espaces insécables avant « : » et « ; » : les motifs ci-dessous utilisent donc ` `.

## 1. Balise MDX

```mdx
<IdealFigure number="1" />
```

## 2. Import (information)

```ts
import IdealFigure from '../figures/IdealFigure.astro';
```

## 3. Bloc `scripts/check-build.mjs`

```js
    if (page.includes('ideaux-multiples')) {
      assert.equal(doc.querySelectorAll('[data-ideal-figure]').length, 1, 'Une figure interactive');
      assert.match(doc.querySelector('[data-ideal-status]').textContent, /^Calcul sélectionné : 1 × 6 \+ \(−1\) × 4 = 2\./, 'Lecture textuelle de la figure sans JavaScript');
      assert.match(doc.querySelector('[data-ideal-status]').textContent, /de −24 à 24, combinaisons calculées seulement pour u et v entre −5 et 5/, 'Plage finie annoncée');
      assert.equal(doc.querySelectorAll('[data-ideal-table] tr').length, 49, 'Tableau des entiers présent');
    }
```

## 4. Méthode `tests/browser_site.py`

Ajouter `'ideal-static', 'ideal-keyboard', 'ideal-buttons'` aux deux listes de cas, appeler `checks.ideal()` à côté de `checks.steps()`, et ajouter :

```python
    # ---------- Ideal figure (lesson « Idéaux & multiples ») ----------
    def ideal(self):
        d = self.d
        page = '/cours/ideaux-multiples/'
        fig = '#figure-ideal'
        status = lambda: d.js(f"return document.querySelector('{fig} [data-ideal-status]').textContent;")
        rows = lambda: d.js(f"return Object.fromEntries([...document.querySelectorAll('{fig} [data-ideal-rows] > div')].map(r=>[r.children[0].textContent,r.children[1].textContent]));")
        set_field = lambda name, value: d.js(f"const f=document.querySelector('{fig} [data-ideal-param={name}]');f.value='{value}';f.dispatchEvent(new Event('input'));")

        def static():
            html = (self.root / page.strip('/') / 'index.html').read_text(encoding='utf-8')
            for expected in ('Calcul sélectionné : 1 × 6 + (−1) × 4 = 2.', 'combinaisons calculées seulement pour u et v entre −5 et 5'):
                assert expected in html, f'Texte initial absent du HTML compilé : {expected}'
            self.open(page)
            state = d.js(f"""const f=document.querySelector('{fig}');return {{
              enabled:[...f.querySelectorAll('input,button')].every(e=>!e.disabled),
              label:f.querySelector('svg').getAttribute('aria-labelledby'),
              multiplesA:f.querySelectorAll('svg .ideal-mark-a').length,
              table:f.querySelectorAll('[data-ideal-table] tr').length}};""")
            assert state['enabled'], state
            assert state['table'] == 49 and state['multiplesA'] == 9, state
            assert all(d.js('return !!document.getElementById(arguments[0]);', ref) for ref in state['label'].split()), state
            return {'integers': state['table']}
        self.case('ideal-static', static)

        def keyboard():
            self.open(page)
            d.js(f"document.querySelector('{fig} [data-ideal-param=u]').focus();")
            d.key(''); time.sleep(0.1)  # Arrow up: u = 2
            d.js(f"document.querySelector('{fig} [data-ideal-param=v]').focus();")
            d.key(''); time.sleep(0.1)  # Arrow down: v = −2
            r = rows()
            assert r['Calcul sélectionné u a + v b'] == '2 × 6 + (−2) × 4 = 4', r
            assert r['Multiple de a'] == 'non' and r['Multiple de b'] == 'oui', r
            # Out-of-range values are clamped when the field is left.
            d.js(f"const f=document.querySelector('{fig} [data-ideal-param=a]');f.focus();f.select();")
            for ch in '99':
                d.key(ch)
            d.key(''); time.sleep(0.1)
            a = d.js(f"return document.querySelector('{fig} [data-ideal-param=a]').value;")
            assert a == '12' and rows()['Générateurs et coefficients'].startswith('a = 12 ;'), (a, rows())
            return {'arrowKeys': True, 'clamped': a}
        self.case('ideal-keyboard', keyboard)

        def buttons():
            self.open(page)
            set_field('a', '0')
            st = status()
            assert 'a = 0 : les multiples de 0 se réduisent à 0.' in st, st
            assert rows()['Multiples de a affichés'] == '1 (seulement 0)', rows()
            set_field('b', '0')
            assert 'a = b = 0 : les multiples de 0 se réduisent à 0 et toute combinaison' in status(), status()
            assert rows()['Plus petit entier strictement positif affiché comme combinaison'] == 'aucun', rows()
            reset = f"document.querySelector('{fig} [data-ideal-action=reset]')"
            assert d.js('return ' + reset + ".getAttribute('aria-disabled');") == 'false'
            d.js(reset + ".focus();"); d.key(''); time.sleep(0.1)
            assert d.js('return ' + reset + ".getAttribute('aria-disabled');") == 'true'
            assert d.js(f"return document.activeElement === {reset};"), 'Le focus doit rester sur le bouton indisponible'
            assert rows()['Calcul sélectionné u a + v b'] == '1 × 6 + (−1) × 4 = 2', rows()
            return {'reset': True}
        self.case('ideal-buttons', buttons)
```

## 5. Ligne du gabarit (`docs/GABARIT-LECON.md`)

```
| `<IdealFigure>` | `number` | figure de la leçon 12 : multiples de a, multiples de b, multiples communs et combinaisons u a + v b (u, v de −5 à 5) sur les entiers de −24 à 24 ; le cas 0 est traité, la liste bornée ne prouve rien ; calcul exact en entiers, tableau et lecture textuelle |
```

`package.json` (test:figures) : ajouter `&& node --experimental-strip-types tests/ideal.test.mjs`. Le composant doit aussi être ajouté à `src/components/lesson/index.ts`.
