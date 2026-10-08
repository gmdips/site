"""Generate Material You 3 tonal palettes from seed colors (offline, one-shot).
Mirrors the runtime generator in main/assets/m3/color.js (CIELAB-based tonal palettes)."""
import math

def srgb_to_lin(c):
    c = c / 255.0
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

def lin_to_srgb(c):
    c = max(0.0, min(1.0, c))
    v = 12.92 * c if c <= 0.0031308 else 1.055 * (c ** (1 / 2.4)) - 0.055
    return round(max(0, min(255, v * 255)))

def hex_to_rgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))

def rgb_to_hex(rgb):
    return '#%02X%02X%02X' % tuple(rgb)

# sRGB (D65) -> XYZ -> Lab
def rgb_to_lab(rgb):
    r, g, b = [srgb_to_lin(c) for c in rgb]
    x = r * 0.4124564 + g * 0.3575761 + b * 0.1804375
    y = r * 0.2126729 + g * 0.7151522 + b * 0.0721750
    z = r * 0.0193339 + g * 0.1191920 + b * 0.9503041
    xn, yn, zn = 0.95047, 1.0, 1.08883
    def f(t):
        return t ** (1/3) if t > 216/24389 else (841/108) * t + 4/29
    fx, fy, fz = f(x/xn), f(y/yn), f(z/zn)
    return (116*fy - 16, 500*(fx-fy), 200*(fy-fz))

def lab_to_rgb(lab):
    L, a, bb = lab
    fy = (L + 16) / 116
    fx = fy + a / 500
    fz = fy - bb / 200
    def f_inv(t):
        return t ** 3 if t ** 3 > 216/24389 else (t - 4/29) * (108/841)
    x = f_inv(fx) * 0.95047
    y = f_inv(fy) * 1.0
    z = f_inv(fz) * 1.08883
    r = x * 3.2404542 + y * -1.5371385 + z * -0.4985314
    g = x * -0.9692660 + y * 1.8760108 + z * 0.0415560
    bl = x * 0.0556434 + y * -0.2040259 + z * 1.0572252
    return (lin_to_srgb(r), lin_to_srgb(g), lin_to_srgb(bl))

def in_gamut(rgb):
    r, g, b = [srgb_to_lin(c) for c in rgb]
    x = r * 0.4124564 + g * 0.3575761 + b * 0.1804375
    y = r * 0.2126729 + g * 0.7151522 + b * 0.0721750
    z = r * 0.0193339 + g * 0.1191920 + b * 0.9503041
    xn, yn, zn = 0.95047, 1.0, 1.08883
    x, y, z = x/xn, y/yn, z/zn
    return (-1e-4 <= x <= 1.0001) and (-1e-4 <= y <= 1.0001) and (-1e-4 <= z <= 1.0001)

def tone_to_hex(L, a, b):
    """Return hex for target lightness L keeping (a,b) chroma, clamped into sRGB gamut."""
    aa, bb = a, b
    rgb = lab_to_rgb((L, aa, bb))
    if in_gamut(rgb):
        return rgb_to_hex(rgb)
    # binary search chroma reduction
    lo, hi = 0.0, 1.0
    best = (255, 255, 255) if L > 50 else (0, 0, 0)
    for _ in range(24):
        mid = (lo + hi) / 2
        rgb = lab_to_rgb((L, aa * mid, bb * mid))
        if in_gamut(rgb):
            best = rgb
            lo = mid
        else:
            hi = mid
    return rgb_to_hex(best)

TONES = [0, 4, 5, 6, 10, 12, 17, 20, 22, 24, 25, 30, 35, 40, 50, 60, 70, 80, 87, 90, 92, 94, 95, 96, 98, 99, 100]

def palette(seed_hex, chroma_scale=1.0, forced_hue=None):
    L, a, b = rgb_to_lab(hex_to_rgb(seed_hex))
    hue = math.atan2(b, a)
    chroma = math.hypot(a, b) * chroma_scale
    if forced_hue is not None:
        hue = math.radians(forced_hue)
    out = {}
    for t in TONES:
        out[t] = tone_to_hex(t, chroma * math.cos(hue), chroma * math.sin(hue))
    return out, math.degrees(hue), chroma

LIGHT = dict(
    primary=40, on_primary=100, primary_container=90, on_primary_container=10,
    primary_fixed=90, primary_fixed_dim=80, on_primary_fixed=10, on_primary_fixed_variant=30,
    secondary=40, on_secondary=100, secondary_container=90, on_secondary_container=10,
    tertiary=40, on_tertiary=100, tertiary_container=90, on_tertiary_container=10,
    error=40, on_error=100, error_container=90, on_error_container=10,
    background=98, on_background=10,
    surface=98, on_surface=10, surface_variant=90, on_surface_variant=30,
    surface_dim=87, surface_bright=98,
    surface_container_lowest=100, surface_container_low=96, surface_container=94,
    surface_container_high=92, surface_container_highest=90,
    outline=50, outline_variant=80,
    inverse_surface=20, inverse_on_surface=95, inverse_primary=80,
    scrim=0, shadow=0, surface_tint=40,
)
DARK = dict(
    primary=80, on_primary=20, primary_container=30, on_primary_container=90,
    primary_fixed=90, primary_fixed_dim=80, on_primary_fixed=10, on_primary_fixed_variant=30,
    secondary=80, on_secondary=20, secondary_container=30, on_secondary_container=90,
    tertiary=80, on_tertiary=20, tertiary_container=30, on_tertiary_container=90,
    error=80, on_error=20, error_container=30, on_error_container=90,
    background=6, on_background=90,
    surface=6, on_surface=90, surface_variant=30, on_surface_variant=80,
    surface_dim=6, surface_bright=24,
    surface_container_lowest=4, surface_container_low=10, surface_container=12,
    surface_container_high=17, surface_container_highest=22,
    outline=60, outline_variant=30,
    inverse_surface=90, inverse_on_surface=20, inverse_primary=40,
    scrim=0, shadow=0, surface_tint=80,
)

ERROR_SEED = '#B3261E'   # M3 fixed error palette
NEUTRAL_CHROMA = 3.2
NV_CHROMA = 9.0

def build(seed_hex, tertiary_hue_shift=60):
    p, hue, chroma = palette(seed_hex)
    # secondary = desaturated version of the seed hue
    sec, _, _ = palette(seed_hex, chroma_scale=0.34)
    ter, _, _ = palette(seed_hex, chroma_scale=0.72, forced_hue=hue + tertiary_hue_shift)
    n_err, _, _ = palette(ERROR_SEED)
    neu = {}
    nv = {}
    for t in TONES:
        L, a, b = rgb_to_lab(hex_to_rgb(p[t]))
        neu[t] = tone_to_hex(t, NEUTRAL_CHROMA * math.cos(math.radians(hue)), NEUTRAL_CHROMA * math.sin(math.radians(hue)))
        nv[t] = tone_to_hex(t, NV_CHROMA * math.cos(math.radians(hue)), NV_CHROMA * math.sin(math.radians(hue)))
    return dict(primary=p, secondary=sec, tertiary=ter, error=n_err, neutral=neu, neutral_variant=nv)

# role -> (palette key, tone)  -- explicit Material 3 role mapping
ROLE_MAP_LIGHT = {
    'primary': ('primary', 40), 'on_primary': ('primary', 100),
    'primary_container': ('primary', 90), 'on_primary_container': ('primary', 10),
    'primary_fixed': ('primary', 90), 'primary_fixed_dim': ('primary', 80),
    'on_primary_fixed': ('primary', 10), 'on_primary_fixed_variant': ('primary', 30),
    'secondary': ('secondary', 40), 'on_secondary': ('secondary', 100),
    'secondary_container': ('secondary', 90), 'on_secondary_container': ('secondary', 10),
    'tertiary': ('tertiary', 40), 'on_tertiary': ('tertiary', 100),
    'tertiary_container': ('tertiary', 90), 'on_tertiary_container': ('tertiary', 10),
    'error': ('error', 40), 'on_error': ('error', 100),
    'error_container': ('error', 90), 'on_error_container': ('error', 10),
    'background': ('neutral', 98), 'on_background': ('neutral', 10),
    'surface': ('neutral', 98), 'on_surface': ('neutral', 10),
    'surface_variant': ('neutral_variant', 90), 'on_surface_variant': ('neutral_variant', 30),
    'surface_dim': ('neutral', 87), 'surface_bright': ('neutral', 98),
    'surface_container_lowest': ('neutral', 100), 'surface_container_low': ('neutral', 96),
    'surface_container': ('neutral', 94), 'surface_container_high': ('neutral', 92),
    'surface_container_highest': ('neutral', 90),
    'outline': ('neutral_variant', 50), 'outline_variant': ('neutral_variant', 80),
    'inverse_surface': ('neutral', 20), 'inverse_on_surface': ('neutral', 95),
    'inverse_primary': ('primary', 80),
    'scrim': ('neutral', 0), 'shadow': ('neutral', 0), 'surface_tint': ('primary', 40),
}
ROLE_MAP_DARK = dict(ROLE_MAP_LIGHT)
ROLE_MAP_DARK.update({
    'primary': ('primary', 80), 'on_primary': ('primary', 20),
    'primary_container': ('primary', 30), 'on_primary_container': ('primary', 90),
    'secondary': ('secondary', 80), 'on_secondary': ('secondary', 20),
    'secondary_container': ('secondary', 30), 'on_secondary_container': ('secondary', 90),
    'tertiary': ('tertiary', 80), 'on_tertiary': ('tertiary', 20),
    'tertiary_container': ('tertiary', 30), 'on_tertiary_container': ('tertiary', 90),
    'error': ('error', 80), 'on_error': ('error', 20),
    'error_container': ('error', 30), 'on_error_container': ('error', 90),
    'background': ('neutral', 6), 'on_background': ('neutral', 90),
    'surface': ('neutral', 6), 'on_surface': ('neutral', 90),
    'surface_variant': ('neutral_variant', 30), 'on_surface_variant': ('neutral_variant', 80),
    'surface_dim': ('neutral', 6), 'surface_bright': ('neutral', 24),
    'surface_container_lowest': ('neutral', 4), 'surface_container_low': ('neutral', 10),
    'surface_container': ('neutral', 12), 'surface_container_high': ('neutral', 17),
    'surface_container_highest': ('neutral', 22),
    'outline': ('neutral_variant', 60), 'outline_variant': ('neutral_variant', 30),
    'inverse_surface': ('neutral', 90), 'inverse_on_surface': ('neutral', 20),
    'inverse_primary': ('primary', 40), 'surface_tint': ('primary', 80),
})

def _rel_lum(hex_color):
    r, g, b = hex_to_rgb(hex_color)
    def chan(c):
        c = c / 255.0
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = chan(r), chan(g), chan(b)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b

def contrast(hex_a, hex_b):
    """WCAG contrast ratio between two hex colours."""
    la, lb = _rel_lum(hex_a), _rel_lum(hex_b)
    hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)

def readable_containers(scheme, maps):
    """Dark container roles default to tone 30.  Bright hues (crimson, amber)
    can fall just short of 4.5:1 against their tone-90 label, so step the
    container down the tonal ramp until the pair is accessible."""
    scheme = dict(scheme)
    pairs = (('primary_container', 'on_primary_container'),
             ('secondary_container', 'on_secondary_container'),
             ('tertiary_container', 'on_tertiary_container'),
             ('error_container', 'on_error_container'))
    for role, on_role in pairs:
        key, tone = scheme[role]
        on_key, on_tone = scheme[on_role]
        label = _tone(maps, on_key, on_tone)
        for candidate in (tone, 25, 22, 20, 17, 12):
            if candidate not in maps[key]:
                continue
            if contrast(_tone(maps, key, candidate), label) >= 4.5:
                scheme[role] = (key, candidate)
                break
    return scheme

def _tone(maps, key, tone):
    if tone == 100:
        return '#FFFFFF'
    if tone == 0:
        return '#000000'
    return maps[key][tone]

def roles(scheme, maps):
    return {role: _tone(maps, *ref) for role, ref in scheme.items()}

def css_block(selector, scheme, maps, indent='  '):
    r = roles(scheme, maps)
    lines = [f'{selector} {{']
    for k in scheme.keys():
        lines.append(f'{indent}--m3-{k.replace("_", "-")}: {r[k]};')
    lines.append('}')
    return '\n'.join(lines)

SEEDS = {
  '': '#C8102E',            # GDIPS red (default / brand)
  'indigo': '#6366F1',
  'violet': '#8B5CF6',
  'crimson': '#DC2626',
  'emerald': '#0F9D58',
  'amber': '#F59E0B',
  'azure': '#2563EB',
}

blocks = []
# default seed: light + dark (+ system dark fallback for no-JS)
maps_default = build(SEEDS[''])
blocks.append('/* ── Default dynamic palette: GDIPS red ───────────────────────────── */')
blocks.append(css_block(':root', ROLE_MAP_LIGHT, maps_default))
blocks.append(css_block(':root[data-theme="dark"]', readable_containers(ROLE_MAP_DARK, maps_default), maps_default))
blocks.append('@media (prefers-color-scheme: dark) {\n  ' +
              css_block(':root:not([data-theme="light"])', readable_containers(ROLE_MAP_DARK, maps_default), maps_default).replace('\n', '\n  ') + '\n}')

for name, seed in SEEDS.items():
    if not name:
        continue
    m = build(seed)
    blocks.append(f'/* ── Seed: {name} ({seed}) ───────────────────────────────────────── */')
    blocks.append(css_block(f':root[data-seed="{name}"]', ROLE_MAP_LIGHT, m))
    blocks.append(css_block(f':root[data-seed="{name}"][data-theme="dark"]', readable_containers(ROLE_MAP_DARK, m), m))
    blocks.append('@media (prefers-color-scheme: dark) {\n  ' +
                  css_block(f':root[data-seed="{name}"]:not([data-theme="light"])', readable_containers(ROLE_MAP_DARK, m), m).replace('\n', '\n  ') + '\n}')

header = '''/* ============================================================================
   GDIPS · Material You 3 — Dynamic color palettes
   ----------------------------------------------------------------------------
   Material 3 tonal palettes generated from seed colours (CIELAB tone mapping,
   gamut-clamped).  The default seed is the GDIPS brand red; alternate seeds are
   selected with  <html data-seed="indigo">  and the runtime generator in
   assets/m3/color.js can produce a palette from *any* user-chosen seed.
   ========================================================================== */
'''
open('main/assets/m3/palettes.css', 'w').write(header + '\n' + '\n\n'.join(blocks) + '\n')
print('wrote palettes.css', len(header + '\n'.join(blocks)))
print('sample light primary:', roles(ROLE_MAP_LIGHT, maps_default)['primary'], roles(ROLE_MAP_LIGHT, maps_default)['on_primary'])
