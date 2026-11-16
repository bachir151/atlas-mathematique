# Figure leçon 16 — note d'intégration pour Claude

Fichiers prêts (non branchés) : `src/figures/field.ts`, `src/figures/field-svg.ts`, `src/components/figures/FieldFigure.astro`, `src/scripts/field-figures.ts`, `src/styles/figures-field.css`, `tests/field.test.mjs` (9 tests node : réussis). Aucun fichier existant n'a été modifié.

## 1. Balise MDX

```mdx
<FieldFigure number="1" />
```

## 2. Import du composant

```ts
import FieldFigure from '../figures/FieldFigure.astro';
```

## 3. Bloc `scripts/check-build.mjs`

```js
    if (page.includes('corps-finis')) {
      assert.equal(doc.querySelectorAll('[data-field-figure]').length, 1, 'Une figure interactive');
      assert.match(doc.querySelector('[data-field-status]').textContent, /Cas courant dans F = 𝔽₂\[X\]\/\(X² \+ X \+ 1\) : α × \(α \+ 1\) = 1\./, 'Lecture textuelle de la figure sans JavaScript');
      assert.match(doc.querySelector('[data-field-status]').textContent, /une seule opération entre deux des quatre éléments : elle ne démontre rien/, 'Plage finie annoncée');
      assert.equal(doc.querySelectorAll('[data-field-table] tr').length, 8, 'Tables d’addition et de multiplication présentes');
      assert.equal(doc.querySelectorAll('[data-field-figure] th[scope="col"]').length, 10, 'En-têtes de colonnes');
      assert.equal(doc.querySelectorAll('[data-field-figure] th[scope="row"]').length, 8, 'En-têtes de lignes');
    }
```

## 4. Méthode `tests/browser_site.py`

À ajouter aux deux listes de scénarios (`'field-static', 'field-keyboard', 'field-buttons'`) et à appeler à côté de `checks.steps()` (`checks.field()`). Page `/cours/corps-finis/`, figure `#figure-corps-fini`.

```python
    # ---------- Field figure (lesson « Corps finis & polynômes irréductibles ») ----------
    def field(self):
        d = self.d
        page = '/cours/corps-finis/'
        fig = '#figure-corps-fini'
        status = lambda: d.js(f"return document.querySelector('{fig} [data-field-status]').textContent;")
        rows = lambda: d.js(f"return Object.fromEntries([...document.querySelectorAll('{fig} [data-field-rows] > div')].map(r=>[r.children[0].textContent,r.children[1].textContent]));")
        choose = lambda name, value: d.js(f"const s=document.querySelector('{fig} [data-field-select={name}]');s.value='{value}';s.dispatchEvent(new Event('change'));")

        def static():
            html = (self.root / page.strip('/') / 'index.html').read_text(encoding='utf-8')
            for expected in ('α × (α + 1) = 1', 'elle ne démontre rien'):
                assert expected in html, f'Texte initial absent du HTML compilé : {expected}'
            self.open(page)
            state = d.js(f"""const f=document.querySelector('{fig}');return {{
              enabled:[...f.querySelectorAll('select,button')].every(e=>!e.disabled),
              label:f.querySelector('svg').getAttribute('aria-labelledby'),
              boxes:f.querySelectorAll('svg .fig-class').length,
              tables:f.querySelectorAll('[data-field-table]').length,
              rowHeads:f.querySelectorAll('[data-field-table] th[scope=row]').length,
              current:[...f.querySelectorAll('td[aria-current=true]')].map(c=>c.textContent)}};""")
            assert state['enabled'], state
            assert state['boxes'] == 4 and state['tables'] == 2 and state['rowHeads'] == 8, state
            assert state['current'] == ['1', '1'], state
            assert all(d.js('return !!document.getElementById(arguments[0]);', ref) for ref in state['label'].split()), state
            return {'boxes': state['boxes']}
        self.case('field-static', static)

        def keyboard():
            self.open(page)
            d.js(f"document.querySelector('{fig} [data-field-select=op]').focus();")
            d.key(''); time.sleep(0.1)  # Arrow down: multiplication -> addition
            r = rows()
            assert r['Résultat'] == 'α + (α + 1) = 1', r
            d.js(f"document.querySelector('{fig} [data-field-select=x]').focus();")
            d.key(''); time.sleep(0.1)  # Arrow up: x = α -> 1
            assert rows()['Opérandes'] == 'x = 1 ; y = α + 1', rows()
            return {'arrowKeys': True}
        self.case('field-keyboard', keyboard)

        def buttons():
            self.open(page)
            reset = f"document.querySelector('{fig} [data-field-reset]')"
            assert d.js('return ' + reset + ".getAttribute('aria-disabled');") == 'true'
            choose('op', 'mul'); choose('x', '11'); choose('y', '11')
            r = rows()
            assert r['Résultat'] == '(α + 1) × (α + 1) = α', r
            assert r['Réduction par α² = α + 1'] == 'α² est remplacé par α + 1 : α² + 2α + 1 = 3α + 2', r
            assert d.js('return ' + reset + ".getAttribute('aria-disabled');") == 'false'
            d.js(reset + ".focus();"); d.key(''); time.sleep(0.1)  # Enter
            assert rows()['Opérandes'] == 'x = α ; y = α + 1', rows()
            assert d.js('return ' + reset + ".getAttribute('aria-disabled');") == 'true'
            assert d.js(f"return document.activeElement === {reset};"), 'Le focus doit rester sur le bouton'
            return {'reset': True}
        self.case('field-buttons', buttons)
```

## 5. Emplacement dans `src/content/lessons/corps-finis.mdx`

Dans l'exemple « Un corps à quatre éléments », juste après la phrase exacte « L’addition des coefficients se fait modulo deux. » : nouveau paragraphe séparé par des lignes vides, contenant `<FieldFigure number="1" />`, avant `</Example>` (ou, si la direction préfère, après `</Example>`).

## 6. Choix de lecture

- Notation reprise de la leçon : F = 𝔽₂[X]/(X² + X + 1), α = [X], règle α² = α + 1, éléments 0, 1, α, α + 1 (écrits avec des espaces autour du +).
- Sélecteurs et opération : `<select>` natifs (x, y, opération), initialement α, α + 1 et multiplication ; bouton de remise à zéro en `aria-disabled` quand l'état est initial.
- Éléments modélisés par des couples (a, b) = a + bα modulo 2. Lignes de lecture : opérandes, opération, développement (coefficients entiers), réduction par α² = α + 1, coefficients modulo 2, résultat.
- Alternative permanente : les deux tables complètes (addition et multiplication) sont toujours affichées, avec en-têtes de lignes et de colonnes ; la case de l'opération courante est repérée (`aria-current`) dans les deux tables. La règle α² = α + 1 et l'exemple détaillé sont rendus sous les tables ; l'exemple est écrit « α(α + 1) = α² + α = (α + 1) + α = 2α + 1 = 1, car 2 vaut 0 modulo 2 » (calcul direct de la règle, à valider par la direction).
- Aucun théorème n'est énoncé ; la figure annonce qu'elle traite une seule opération entre deux des quatre éléments et ne démontre rien.
- Le dessin SVG (quatre cases, x, y et résultat repérés) est un complément décoratif ; il est lié au titre et à l'état.

## 7. Ligne du gabarit `docs/GABARIT-LECON.md`

```
| `FieldFigure` | `number` | table de calcul de la leçon 16 dans le corps à quatre éléments 𝔽₂[X]/(X² + X + 1) : deux opérandes parmi 0, 1, α, α + 1, addition ou multiplication, développement et réduction par α² = α + 1 ; tables complètes d'addition et de multiplication toujours visibles |
```

Pour `package.json`, script `test:figures` : ajouter ` && node --experimental-strip-types tests/field.test.mjs`.
