/* ============================================================================
   GDIPS · Material You 3 — Dynamic colour runtime
   ----------------------------------------------------------------------------
   Generates a full Material 3 role set from any seed colour at runtime, so the
   whole site can re-theme itself (Material You "dynamic colour") without a
   build step.  Tonal palettes use CIELAB tone mapping with sRGB gamut
   clamping — the same algorithm used to pre-generate assets/m3/palettes.css.

   Public API
     M3Color.applySeed(hex)          apply an arbitrary seed colour
     M3Color.seed()                  current seed (#RRGGBB)
     M3Color.setTheme('light'|'dark'|'system')
     M3Color.theme()                 resolved theme
     M3Color.presets                 [{ id, label, seed }]
     M3Color.mountPicker(el)         render an accessible seed-colour picker
   ========================================================================== */

(function (global) {
  'use strict';

  var STORAGE = { theme: 'gdips:theme', seed: 'gdips:seed' };
  var LEGACY_THEME_KEY = 'theme'; // older GDIPS scripts store the theme here
  var TONES = [0, 4, 5, 6, 10, 12, 17, 20, 22, 24, 25, 30, 35, 40, 50, 60, 70, 80, 87, 90, 92, 94, 95, 96, 98, 99, 100];

  var PRESETS = [
    { id: 'brand', label: 'GDIPS Merah', seed: '#C8102E' },
    { id: 'indigo', label: 'Indigo', seed: '#6366F1' },
    { id: 'violet', label: 'Violet', seed: '#8B5CF6' },
    { id: 'azure', label: 'Azure', seed: '#2563EB' },
    { id: 'emerald', label: 'Emerald', seed: '#0F9D58' },
    { id: 'amber', label: 'Amber', seed: '#F59E0B' }
  ];

  /* ── Colour maths ───────────────────────────────────────────────────── */

  function srgbToLin(c) {
    c /= 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  }

  function linToSrgb(c) {
    c = Math.min(1, Math.max(0, c));
    var v = c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
    return Math.round(Math.min(255, Math.max(0, v * 255)));
  }

  function hexToRgb(hex) {
    hex = String(hex).trim().replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(function (c) { return c + c; }).join('');
    var n = parseInt(hex, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  function rgbToHex(rgb) {
    return '#' + rgb.map(function (c) {
      var s = c.toString(16).toUpperCase();
      return s.length === 1 ? '0' + s : s;
    }).join('');
  }

  var WHITE = [0.95047, 1.0, 1.08883];

  function rgbToLab(rgb) {
    var r = srgbToLin(rgb[0]), g = srgbToLin(rgb[1]), b = srgbToLin(rgb[2]);
    var x = (r * 0.4124564 + g * 0.3575761 + b * 0.1804375) / WHITE[0];
    var y = (r * 0.2126729 + g * 0.7151522 + b * 0.0721750) / WHITE[1];
    var z = (r * 0.0193339 + g * 0.1191920 + b * 0.9503041) / WHITE[2];
    function f(t) { return t > 216 / 24389 ? Math.cbrt(t) : (841 / 108) * t + 4 / 29; }
    var fx = f(x), fy = f(y), fz = f(z);
    return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
  }

  function labToRgb(lab) {
    var fy = (lab[0] + 16) / 116;
    var fx = fy + lab[1] / 500;
    var fz = fy - lab[2] / 200;
    function fi(t) { var t3 = t * t * t; return t3 > 216 / 24389 ? t3 : (t - 4 / 29) * (108 / 841); }
    var x = fi(fx) * WHITE[0], y = fi(fy) * WHITE[1], z = fi(fz) * WHITE[2];
    return [
      linToSrgb(x * 3.2404542 + y * -1.5371385 + z * -0.4985314),
      linToSrgb(x * -0.9692660 + y * 1.8760108 + z * 0.0415560),
      linToSrgb(x * 0.0556434 + y * -0.2040259 + z * 1.0572252)
    ];
  }

  function inGamut(lab) {
    var fy = (lab[0] + 16) / 116;
    var fx = fy + lab[1] / 500;
    var fz = fy - lab[2] / 200;
    function fi(t) { var t3 = t * t * t; return t3 > 216 / 24389 ? t3 : (t - 4 / 29) * (108 / 841); }
    var x = fi(fx), y = fi(fy), z = fi(fz);
    return x >= -1e-4 && x <= 1.0001 && y >= -1e-4 && y <= 1.0001 && z >= -1e-4 && z <= 1.0001;
  }

  /** Hex for target CIELAB lightness, chroma reduced until inside sRGB. */
  function toneToHex(L, a, b) {
    if (L >= 100) return '#FFFFFF';
    if (L <= 0) return '#000000';
    var lab = [L, a, b];
    if (inGamut(lab)) return rgbToHex(labToRgb(lab));
    var lo = 0, hi = 1, best = L > 50 ? [255, 255, 255] : [0, 0, 0];
    for (var i = 0; i < 20; i++) {
      var mid = (lo + hi) / 2;
      lab = [L, a * mid, b * mid];
      if (inGamut(lab)) { best = labToRgb(lab); lo = mid; } else { hi = mid; }
    }
    return rgbToHex(best);
  }

  function tonalPalette(seed, chromaScale, hueOverride) {
    var lab = rgbToLab(hexToRgb(seed));
    var hue = Math.atan2(lab[2], lab[1]);
    var chroma = Math.hypot(lab[1], lab[2]) * (chromaScale === undefined ? 1 : chromaScale);
    if (hueOverride !== undefined) hue = hueOverride;
    var out = {};
    for (var i = 0; i < TONES.length; i++) {
      var t = TONES[i];
      out[t] = toneToHex(t, chroma * Math.cos(hue), chroma * Math.sin(hue));
    }
    return out;
  }

  var ROLE_MAP_LIGHT = {
    primary: ['primary', 40], 'on-primary': ['primary', 100],
    'primary-container': ['primary', 90], 'on-primary-container': ['primary', 10],
    'primary-fixed': ['primary', 90], 'primary-fixed-dim': ['primary', 80],
    'on-primary-fixed': ['primary', 10], 'on-primary-fixed-variant': ['primary', 30],
    secondary: ['secondary', 40], 'on-secondary': ['secondary', 100],
    'secondary-container': ['secondary', 90], 'on-secondary-container': ['secondary', 10],
    tertiary: ['tertiary', 40], 'on-tertiary': ['tertiary', 100],
    'tertiary-container': ['tertiary', 90], 'on-tertiary-container': ['tertiary', 10],
    error: ['error', 40], 'on-error': ['error', 100],
    'error-container': ['error', 90], 'on-error-container': ['error', 10],
    background: ['neutral', 98], 'on-background': ['neutral', 10],
    surface: ['neutral', 98], 'on-surface': ['neutral', 10],
    'surface-variant': ['neutral-variant', 90], 'on-surface-variant': ['neutral-variant', 30],
    'surface-dim': ['neutral', 87], 'surface-bright': ['neutral', 98],
    'surface-container-lowest': ['neutral', 100], 'surface-container-low': ['neutral', 96],
    'surface-container': ['neutral', 94], 'surface-container-high': ['neutral', 92],
    'surface-container-highest': ['neutral', 90],
    outline: ['neutral-variant', 50], 'outline-variant': ['neutral-variant', 80],
    'inverse-surface': ['neutral', 20], 'inverse-on-surface': ['neutral', 95],
    'inverse-primary': ['primary', 80],
    scrim: ['neutral', 0], shadow: ['neutral', 0], 'surface-tint': ['primary', 40]
  };

  var DARK_OVERRIDES = {
    primary: ['primary', 80], 'on-primary': ['primary', 20],
    'primary-container': ['primary', 30], 'on-primary-container': ['primary', 90],
    secondary: ['secondary', 80], 'on-secondary': ['secondary', 20],
    'secondary-container': ['secondary', 30], 'on-secondary-container': ['secondary', 90],
    tertiary: ['tertiary', 80], 'on-tertiary': ['tertiary', 20],
    'tertiary-container': ['tertiary', 30], 'on-tertiary-container': ['tertiary', 90],
    error: ['error', 80], 'on-error': ['error', 20],
    'error-container': ['error', 30], 'on-error-container': ['error', 90],
    background: ['neutral', 6], 'on-background': ['neutral', 90],
    surface: ['neutral', 6], 'on-surface': ['neutral', 90],
    'surface-variant': ['neutral-variant', 30], 'on-surface-variant': ['neutral-variant', 80],
    'surface-dim': ['neutral', 6], 'surface-bright': ['neutral', 24],
    'surface-container-lowest': ['neutral', 4], 'surface-container-low': ['neutral', 10],
    'surface-container': ['neutral', 12], 'surface-container-high': ['neutral', 17],
    'surface-container-highest': ['neutral', 22],
    outline: ['neutral-variant', 60], 'outline-variant': ['neutral-variant', 30],
    'inverse-surface': ['neutral', 90], 'inverse-on-surface': ['neutral', 20],
    'inverse-primary': ['primary', 40], 'surface-tint': ['primary', 80]
  };

  function roleMap(dark) {
    var map = {};
    for (var k in ROLE_MAP_LIGHT) map[k] = ROLE_MAP_LIGHT[k];
    if (dark) for (var d in DARK_OVERRIDES) map[d] = DARK_OVERRIDES[d];
    return map;
  }

  /** Build every M3 colour role for a seed colour. */
  /* WCAG relative luminance / contrast, used to keep container pairs readable. */
  function relLum(hex) {
    var rgb = hexToRgb(hex), chan = [];
    for (var i = 0; i < 3; i++) {
      var v = rgb[i] / 255;
      chan.push(v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
    }
    return 0.2126 * chan[0] + 0.7152 * chan[1] + 0.0722 * chan[2];
  }

  function contrast(a, b) {
    var la = relLum(a), lb = relLum(b), hi = Math.max(la, lb), lo = Math.min(la, lb);
    return (hi + 0.05) / (lo + 0.05);
  }

  function buildScheme(seed, dark) {
    var primary = tonalPalette(seed, 1);
    var secondary = tonalPalette(seed, 0.34);
    var seedLab = rgbToLab(hexToRgb(seed));
    var tertiary = tonalPalette(seed, 0.72, Math.atan2(seedLab[2], seedLab[1]) + Math.PI / 3);
    var error = tonalPalette('#B3261E');
    var hue = Math.atan2(seedLab[2], seedLab[1]);
    var neutral = tonalPalette(seed, 0);
    var neutralVariant = tonalPalette(seed, 0);
    TONES.forEach(function (t) {
      neutral[t] = toneToHex(t, 3.2 * Math.cos(hue), 3.2 * Math.sin(hue));
      neutralVariant[t] = toneToHex(t, 9 * Math.cos(hue), 9 * Math.sin(hue));
    });
    var maps = { primary: primary, secondary: secondary, tertiary: tertiary, error: error, neutral: neutral, 'neutral-variant': neutralVariant };
    var map = roleMap(dark);
    var out = {};
    Object.keys(map).forEach(function (role) {
      var ref = map[role];
      var tone = ref[1];
      if (tone === 100) out['--m3-' + role] = '#FFFFFF';
      else if (tone === 0) out['--m3-' + role] = '#000000';
      else out['--m3-' + role] = maps[ref[0]][tone];
    });

    /* Dark container roles default to tone 30; bright hues (crimson, amber) can
       fall short of 4.5:1 against their tone-90 label, so step the container
       down the tonal ramp until the pair stays readable. */
    if (dark) {
      [['primary-container', 'on-primary-container'],
       ['secondary-container', 'on-secondary-container'],
       ['tertiary-container', 'on-tertiary-container'],
       ['error-container', 'on-error-container']].forEach(function (pair) {
        var ref = map[pair[0]];
        if (!ref) return;
        var label = out['--m3-' + pair[1]];
        [ref[1], 25, 22, 20, 17, 12].some(function (tone) {
          var value = tone === 100 ? '#FFFFFF' : (tone === 0 ? '#000000' : maps[ref[0]][tone]);
          if (!value) return false;
          if (contrast(value, label) >= 4.5) { out['--m3-' + pair[0]] = value; return true; }
          return false;
        });
      });
    }

    return out;
  }

  /* ── State ──────────────────────────────────────────────────────────── */

  var media = global.matchMedia ? global.matchMedia('(prefers-color-scheme: dark)') : null;
  var root = document.documentElement;

  function read(key) {
    try { return global.localStorage.getItem(key); } catch (e) { return null; }
  }

  function write(key, value) {
    try { value === null ? global.localStorage.removeItem(key) : global.localStorage.setItem(key, value); } catch (e) { /* private mode */ }
  }

  function isHex(value) {
    return typeof value === 'string' && /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value.trim());
  }

  /* The data-seed attribute doubles as a *named* palette selector
     (e.g. data-seed="indigo" is delivered by palettes.css) and as an inline hex
     seed.  Only hex values are generated at runtime; named seeds stay in CSS. */
  var attrSeed = root.getAttribute('data-seed');
  var state = {
    theme: read(STORAGE.theme) || read(LEGACY_THEME_KEY) || 'system',
    seed: read(STORAGE.seed) || (isHex(attrSeed) ? attrSeed.toUpperCase() : null)
  };

  function resolvedTheme() {
    if (state.theme === 'system') return media && media.matches ? 'dark' : 'light';
    return state.theme;
  }

  function applyVars(vars) {
    Object.keys(vars).forEach(function (k) { root.style.setProperty(k, vars[k]); });
  }

  function syncMetaTheme() {
    var meta = document.querySelector('meta[name="theme-color"]');
    var color = getComputedStyle(document.body || root).getPropertyValue('--m3-surface').trim();
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'theme-color');
      document.head.appendChild(meta);
    }
    if (color) meta.setAttribute('content', color);
  }

  var appliedVars = [];

  function clearVars() {
    appliedVars.forEach(function (key) { root.style.removeProperty(key); });
    appliedVars = [];
  }

  function paint() {
    var theme = resolvedTheme();
    root.setAttribute('data-theme', theme);
    if (state.seed) {
      var vars = buildScheme(state.seed, theme === 'dark');
      clearVars();
      appliedVars = Object.keys(vars);
      applyVars(vars);
    } else {
      clearVars(); // fall back to the palette declared in palettes.css
    }
    syncMetaTheme();
  }

  function announce(type, detail) {
    root.dispatchEvent(new CustomEvent('m3color:' + type, { detail: detail }));
  }

  var api = {
    presets: PRESETS,

    seed: function () { return state.seed; },
    theme: function () { return resolvedTheme(); },
    preference: function () { return state.theme; },

    /** Apply an arbitrary seed colour (#RGB / #RRGGBB). */
    applySeed: function (seed, options) {
      var hex = String(seed || '').trim();
      if (!isHex(hex)) return false;
      if (hex.charAt(0) !== '#') hex = '#' + hex;
      state.seed = hex.toUpperCase();
      if (!options || options.persist !== false) write(STORAGE.seed, state.seed);
      paint();
      announce('seed', { seed: state.seed });
      return true;
    },

    /** Drop the custom seed and return to the page's declared palette. */
    resetSeed: function () {
      state.seed = isHex(attrSeed) ? attrSeed.toUpperCase() : null;
      write(STORAGE.seed, null);
      paint();
      announce('seed', { seed: state.seed });
    },

    /** light · dark · system */
    setTheme: function (mode) {
      state.theme = ['light', 'dark', 'system'].indexOf(mode) === -1 ? 'system' : mode;
      write(STORAGE.theme, state.theme);
      write(LEGACY_THEME_KEY, state.theme);
      paint();
      announce('theme', { theme: resolvedTheme(), preference: state.theme });
    },

    toggleTheme: function () {
      api.setTheme(resolvedTheme() === 'dark' ? 'light' : 'dark');
      return resolvedTheme();
    },

    /** Read a generated role, e.g. M3Color.role('primary') */
    role: function (name) {
      return getComputedStyle(root).getPropertyValue('--m3-' + name).trim();
    },

    /** Render an accessible dynamic-colour picker inside `el`. */
    mountPicker: function (el) {
      if (!el) return;
      el.innerHTML = '';
      el.classList.add('m3-color-picker');

      var row = document.createElement('div');
      row.className = 'm3-chip-set';
      row.setAttribute('role', 'radiogroup');
      row.setAttribute('aria-label', 'Dynamic colour');

      PRESETS.forEach(function (preset) {
        var chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'm3-chip m3-chip--accent';
        chip.dataset.seed = preset.seed;
        chip.dataset.id = preset.seed === '#C8102E' ? '' : preset.id;
        chip.setAttribute('role', 'radio');
        chip.setAttribute('aria-label', preset.label);
        chip.innerHTML = '<span aria-hidden="true" style="width:14px;height:14px;border-radius:50%;background:' +
          preset.seed + '"></span><span>' + preset.label + '</span>';
        chip.addEventListener('click', function () { api.applySeed(preset.seed); mark(); });
        row.appendChild(chip);
      });

      var custom = document.createElement('label');
      custom.className = 'm3-chip m3-chip--sm';
      custom.style.cursor = 'pointer';
      custom.innerHTML = '<i class="fas fa-eye-dropper" aria-hidden="true"></i><span>Custom</span>' +
        '<input type="color" value="' + state.seed + '" aria-label="Pick a custom seed colour" ' +
        'style="width:22px;height:22px;border:none;background:none;padding:0;cursor:pointer">';
      custom.querySelector('input').addEventListener('input', function (e) {
        api.applySeed(e.target.value);
        mark();
      });
      row.appendChild(custom);

      el.appendChild(row);

      function mark() {
        var chips = row.querySelectorAll('.m3-chip[data-seed]');
        var named = root.getAttribute('data-seed') || '';
        Array.prototype.forEach.call(chips, function (chip) {
          var active = state.seed
            ? chip.dataset.seed.toLowerCase() === state.seed.toLowerCase()
            : chip.dataset.id === named;
          chip.setAttribute('aria-checked', String(active));
          chip.classList.toggle('is-selected', active);
        });
      }

      mark();
      root.addEventListener('m3color:seed', mark);
      return el;
    }
  };

  /* Pages that manage their own toggle (the demon list) simply set
     <html data-theme>; adopt those changes so both systems stay in sync. */
  if (global.MutationObserver) {
    new MutationObserver(function () {
      var value = root.getAttribute('data-theme');
      if (value !== 'light' && value !== 'dark') return;
      if (value === resolvedTheme() && state.theme !== 'system') return;
      state.theme = value;
      write(STORAGE.theme, value);
      write(LEGACY_THEME_KEY, value);
      paint();
    }).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  }

  if (media) {
    var onSystem = function () { if (state.theme === 'system') paint(); };
    media.addEventListener ? media.addEventListener('change', onSystem) : media.addListener(onSystem);
  }

  root.addEventListener('m3color:theme', function () { syncMetaTheme(); });

  paint();
  global.M3Color = api;

  // Upgrade every declarative picker on the page.
  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-m3-color-picker]').forEach(function (el) { api.mountPicker(el); });
  });
})(window);
