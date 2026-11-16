# Intégration de la figure de la leçon 09 (ActionFigure)

Fichiers créés : `src/figures/action.ts`, `src/figures/action-svg.ts`, `src/components/figures/ActionFigure.astro`, `src/scripts/action-figures.ts`, `src/styles/figures-action.css`, `tests/action.test.mjs`. Aucun fichier partagé n'a été modifié.

## 1. Balise MDX

```mdx
<ActionFigure number="1" />
```

## 2. Emplacement dans `actions-orbites-stabilisateurs.mdx`

Codex ne donne aucun emplacement précis (« Aucune figure n'est développée dans ce livrable »). Proposition : section « Exploration », juste après le paragraphe qui se termine par « Pourquoi ce nombre est-il le même pour toutes les positions accessibles ? » et avant « Ce tableau suggère une règle. » La figure y illustre le tableau des images de A (quatre rotations, puis huit symétries). Décision d'emplacement : direction.

Point de vigilance : la leçon 09 définit $r$ par A→B→C→D→A ; la leçon 01 parle d'un quart de tour positif (antihoraire) avec r(A)=D en positions initiales. La figure suit la leçon 09 et ne dessine aucun sens de rotation (les sommets sont des emplacements fixes : A haut gauche, B haut droite, C bas droite, D bas gauche, comme en leçon 01). À valider par la direction/Codex si la différence de convention doit être explicitée dans la leçon.

## 3. Lignes à ajouter

`src/components/lesson/index.ts`

```ts
import ActionFigure from '../figures/ActionFigure.astro';
// ... et ajouter ActionFigure à l'objet lessonComponents
```

`docs/GABARIT-LECON.md` (tableau des composants, après la ligne `<StepsFigure>`)

```md
| `<ActionFigure>` | `number` | figure de la leçon 09 : carré et sommets A, B, C, D, quatre rotations ou huit symétries, image, orbite et stabilisateur du sommet choisi, transformations regroupées par image ; tableau des images et lecture textuelle |
```

`package.json`, script `test:figures` : ajouter `&& node --experimental-strip-types tests/action.test.mjs`.

`scripts/check-build.mjs` (à côté du bloc `sous-groupes-entiers`)

```js
if (page.includes('actions-orbites-stabilisateurs')) {
  assert.equal(doc.querySelectorAll('[data-act-figure]').length, 1, 'Une figure interactive');
  assert.match(doc.querySelector('[data-act-status]').textContent, /^e envoie A sur A\. Orbite de A : \{A, B, C, D\}\. Stabilisateur de A : \{e\}\./, 'Lecture textuelle sans JavaScript');
  assert.equal(doc.querySelectorAll('[data-act-table] tr').length, 4, 'Tableau des images (quatre rotations)');
  assert.equal(doc.querySelectorAll('[data-act-groups] tr').length, 4, 'Tableau des regroupements');
}
```

`tests/browser_site.py` : ajouter `'action-static', 'action-keyboard', 'action-buttons'` aux deux listes de scénarios (lignes 38 et 43), appeler `checks.action()` là où `checks.steps()` est appelé (lignes 805 et 813), et ajouter la méthode :

```python
    # ---------- Action figure (lesson « Actions de groupes, orbites & stabilisateurs ») ----------
    def action(self):
        d = self.d
        page = '/cours/actions-orbites-stabilisateurs/'   # à confirmer d'après le slug du catalogue
        fig = '#figure-action'
        status = lambda: d.js(f"return document.querySelector('{fig} [data-act-status]').textContent;")
        rows = lambda: d.js(f"return Object.fromEntries([...document.querySelectorAll('{fig} [data-act-rows] > div')].map(r=>[r.children[0].textContent,r.children[1].textContent]));")
        pick = lambda kind, value: d.js(f"document.querySelector('{fig} [data-act-{kind}][value=\"{value}\"]').click();")

        def static():
            html = (self.root / page.strip('/') / 'index.html').read_text(encoding='utf-8')
            assert 'e envoie A sur A. Orbite de A : {A, B, C, D}. Stabilisateur de A : {e}.' in html
            self.open(page)
            state = d.js(f"""const f=document.querySelector('{fig}');return {{
              enabled:[...f.querySelectorAll('input,button')].every(e=>!e.disabled),
              label:f.querySelector('svg').getAttribute('aria-labelledby'),
              hidden:[...f.querySelectorAll('[data-act-transform-label][hidden]')].length,
              images:f.querySelectorAll('[data-act-table] tr').length,
              groups:f.querySelectorAll('[data-act-groups] tr').length}};""")
            assert state['enabled'] and state['images'] == 4 and state['groups'] == 4 and state['hidden'] == 4, state
            assert all(d.js('return !!document.getElementById(arguments[0]);', ref) for ref in state['label'].split()), state
            return state
        self.case('action-static', static)

        def keyboard():
            self.open(page)
            # Flèche droite dans le groupe de sommets : A -> B.
            d.js(f"document.querySelector('{fig} [data-act-vertex][value=\"0\"]').focus();")
            d.key(''); time.sleep(0.1)
            assert status() == 'e envoie B sur B. Orbite de B : {A, B, C, D}. Stabilisateur de B : {e}.', status()
            d.js(f"document.querySelector('{fig} [data-act-transform][value=\"e\"]').focus();")
            d.key(''); time.sleep(0.1)  # e -> r
            assert status().startswith('r envoie B sur C.'), status()
            return {'arrowKeys': True}
        self.case('action-keyboard', keyboard)

        def buttons():
            self.open(page)
            pick('group', 'symmetries'); pick('transform', 'r2s')
            assert status() == 'r²s envoie A sur C. Orbite de A : {A, B, C, D}. Stabilisateur de A : {e, s}.', status()
            assert d.js(f"return document.querySelectorAll('{fig} [data-act-table] tr').length;") == 8
            assert d.js(f"return [...document.querySelectorAll('{fig} [data-act-groups] tr')][2].textContent;") == 'C{r², r²s}'
            # Retour aux rotations : r²s n'en fait pas partie, retour à e.
            pick('group', 'rotations')
            assert status().startswith('e envoie A sur A.') and d.js(f"return document.querySelectorAll('{fig} [data-act-table] tr').length;") == 4
            pick('vertex', '2'); pick('transform', 'r')
            assert rows()['Image'] == 'r(C) = D', rows()
            reset = f"document.querySelector('{fig} [data-act-reset]')"
            d.js(reset + '.focus();')
            d.key(''); time.sleep(0.1)
            assert status() == 'e envoie A sur A. Orbite de A : {A, B, C, D}. Stabilisateur de A : {e}.', status()
            assert d.js('return ' + reset + ".getAttribute('aria-disabled');") == 'true'
            assert d.js(f"return document.activeElement === {reset};"), 'Le focus doit rester sur le bouton indisponible'
            return {'reset': True}
        self.case('action-buttons', buttons)
```
