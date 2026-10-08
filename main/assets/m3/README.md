# GDIPS · Material You 3 design system

Everything the redesigned site renders comes from this folder. No build step, no
dependencies — plain CSS and plain ES5-compatible JavaScript that runs straight
from Cloudflare Pages.

## Load order

Every page links the same five stylesheets, in this order, then its own page
stylesheet:

```html
<link rel="stylesheet" href="…/assets/m3/palettes.css">   <!-- colour roles, light + dark -->
<link rel="stylesheet" href="…/assets/m3/tokens.css">     <!-- type, shape, elevation, motion, spacing -->
<link rel="stylesheet" href="…/assets/m3/components.css"> <!-- M3 components -->
<link rel="stylesheet" href="…/assets/m3/site.css">       <!-- shared chrome: app bar, hero, footer, tiles -->
<link rel="stylesheet" href="…/assets/m3/pages.css">      <!-- page-specific patterns (or the page's own css) -->
<script src="…/assets/m3/color.js"></script>              <!-- dynamic colour, in <head> -->
<script src="…/assets/m3/ui.js" defer></script>           <!-- behaviour, deferred -->
```

`color.js` is intentionally **not** deferred: it resolves the theme and paints the
colour roles before first paint so there is no flash of the wrong theme.

## Colour

Colours are Material 3 *roles*, never raw hex values: `--m3-primary`,
`--m3-on-primary`, `--m3-primary-container`, `--m3-surface-container-high`,
`--m3-outline-variant`, `--m3-error-container`, … Use the role that describes the
meaning, and pair every `on-*` role with the surface it sits on.

| Theme | Selector | Palette |
| --- | --- | --- |
| Light | `<html>` or `<html data-theme="light">` | `:root` block |
| Dark | `<html data-theme="dark">` | `:root[data-theme="dark"]` |
| System | no attribute, resolved by `color.js` | `@media (prefers-color-scheme: dark)` fallback |

`<html data-seed="…">` picks a named seed palette (`indigo`, `violet`, `crimson`,
`emerald`, `amber`, `azure`); the default is the GDIPS brand red. The seed picker
in the app bar (`<div data-m3-color-picker>`) can also generate a palette from any
hex colour at runtime — the result is stored in `localStorage['gdips:seed']`.

### Regenerating the palettes

```bash
python3 main/assets/m3/gen_palette.py    # rewrites main/assets/m3/palettes.css
```

The generator and the runtime engine in `color.js` share the same algorithm
(CIELAB tone mapping with gamut-clamped chroma) and the same contrast rule: dark
container roles step down the tonal ramp until they reach 4.5:1 against their
`on-*` label. Never hand-edit `palettes.css`; change the generator and re-run it.

## Typescale and spacing

- `--m3-display-*`, `--m3-headline-*`, `--m3-title-*`, `--m3-body-*`,
  `--m3-label-*` for size/weight/letter-spacing.
- `--m3-space-1 … --m3-space-16` for a 4 px-based spacing rhythm.
- `--m3-shape-xs|sm|md|lg|xl|full` for corner radii.
- `--m3-elevation-0 … --m3-elevation-5` for the M3 shadow levels (the dark theme
  raises them automatically).

## Components

`components.css` provides `.m3-btn` (filled/tonal/outlined/text/elevated),
`.m3-icon-button`, `.m3-fab`, `.m3-chip` / `.m3-chip-set`, `.m3-card`,
`.m3-list` / `.m3-list-item`, `.m3-menu`, `.m3-dialog`, `.m3-sheet`, `.m3-scrim`,
`.m3-tabs`, `.m3-segmented`, `.m3-switch`, `.m3-slider`, `.m3-text-field`,
`.m3-table`, `.m3-expansion`, `.m3-snackbar`, `.m3-tooltip`, `.m3-meter`,
`.m3-empty`, plus loaders and skeletons. All of them define hover, focus-visible,
pressed, disabled, loading and error states.

## Behaviour hooks

`ui.js` binds declarative attributes, so pages stay markup-only:

| Hook | Purpose |
| --- | --- |
| `[data-m3-drawer-toggle="#id"]`, `[data-m3-drawer-legacy]` | open/close a navigation drawer |
| `[data-m3-scrim-for="#id"]` | scrim that closes its drawer |
| `[data-m3-menu-trigger="#id"]` | menu button + `aria-expanded` sync |
| `[data-m3-dialog-open="#id"]` / `[data-m3-dialog-close]` | dialogs |
| `[data-m3-tabs]`, `[data-m3-segmented]`, `[data-m3-chip-toggle]` | selection groups |
| `[data-m3-copy]`, `[data-m3-range-output]`, `[data-m3-color-picker]` | copy buttons, slider output, seed picker |
| `.m3-theme-toggle` | light/dark switch |
| `.m3-reveal` | scroll-in animation (respects `prefers-reduced-motion`) |
| `m3ui:refresh` (event) | re-scan after injecting markup |

`M3UI` also exposes `snackbar`, `openDialog`, `closeDialog`, `openDrawer`,
`setLoading`, `copy`, `lockScroll` and `unlockScroll`; `M3Color` exposes
`applySeed`, `resetSeed`, `setTheme`, `toggleTheme`, `theme`, `preference`,
`seed`, `presets`, `role`, `mountPicker` and emits `m3color:theme` /
`m3color:seed`.

## Accessibility

- Light and dark palettes are generated so every `on-*` / surface pair clears
  WCAG AA (≥ 4.5:1); alternate seeds are checked the same way.
- Focus states use `:focus-visible` with a visible ring; dialogs and drawers are
  labelled and manage `aria-hidden`/`aria-expanded`; toasts and the list grid are
  `aria-live` regions; icon-only controls carry `aria-label`s.
- `prefers-reduced-motion` collapses animation and transition durations.

## Print

`site.css` and the page stylesheets trim chrome (app bar, drawers, action rows,
pagination, toasts) and switch to plain black-on-white surfaces for printing.
