"""
Baut aus MakeHuman-Daten (CC0) den Menschen für js/daten/modell-mensch.js:
je Teil Positionen (int16, mm), Normalen (int8), UV (uint16), Dreiecke
und eine kleine WebP-Textur. Läuft nur einmal, nicht beim Laden der Seite.

  python3 pruefungen/werkzeuge/mensch-wandeln.py QUELLE js/daten/modell-mensch.js

QUELLE ist ein Ordner mit (alles CC0, makehumancommunity.org):
  base.obj, caucasian-male-young.target, default.mhskel,
  default_weights.mhw   – aus github.com/makehumancommunity/makehuman,
                          makehuman/data/{3dobjs,targets/macrodetails,rigs}
  mh/                   – entpackt aus makehuman_system_assets_cc0.zip
                          (files.makehumancommunity.org/asset_packs/)
Braucht Pillow (mit WebP).
"""
import base64, io, math, os, struct, sys, json
from PIL import Image

os.chdir(sys.argv[1])
AUSGABE = os.path.abspath(os.path.join(os.environ.get('PWD', '.'), sys.argv[2])) if not os.path.isabs(sys.argv[2]) else sys.argv[2]
MH = 'mh/'
GROESSE = 1750.0

def lies_obj(pfad, nur_gruppe=None):
    V, T, F = [], [], []
    gruppe = None
    for z in open(pfad):
        w = z.split()
        if not w: continue
        if w[0] == 'v': V.append([float(x) for x in w[1:4]])
        elif w[0] == 'vt': T.append([float(x) for x in w[1:3]])
        elif w[0] == 'g': gruppe = w[1] if len(w) > 1 else None
        elif w[0] == 'f':
            if nur_gruppe and gruppe != nur_gruppe: continue
            ecken = []
            for e in w[1:]:
                t = e.split('/')
                ecken.append((int(t[0]) - 1, int(t[1]) - 1 if len(t) > 1 and t[1] else -1))
            F.append(ecken)
    return V, T, F

def lies_target(pfad):
    d = {}
    for z in open(pfad):
        if z.startswith('#') or not z.strip(): continue
        w = z.split()
        d[int(w[0])] = [float(x) for x in w[1:4]]
    return d

def lies_mhclo(pfad):
    ref, skala, loesch = [], {}, set()
    modus = None
    obj = None
    for z in open(pfad):
        w = z.split()
        if not w or w[0].startswith('#'): continue
        if w[0] == 'obj_file': obj = w[1]
        elif w[0] in ('x_scale', 'y_scale', 'z_scale'):
            skala['xyz'.index(w[0][0])] = (int(w[1]), int(w[2]), float(w[3]))
        elif w[0] == 'verts': modus = 'verts'
        elif w[0] == 'delete_verts': modus = 'del'
        elif not w[0].lstrip('-').replace('.', '').isdigit(): continue
        elif modus == 'verts':
            if len(w) == 1: ref.append(((int(w[0]), 0, 0), (1.0, 0, 0), (0, 0, 0)))
            elif len(w) >= 9:
                ref.append(((int(w[0]), int(w[1]), int(w[2])), tuple(float(x) for x in w[3:6]), tuple(float(x) for x in w[6:9])))
        elif modus == 'del':
            i = 0
            while i < len(w):
                if i + 2 < len(w) and w[i + 1] == '-':
                    loesch.update(range(int(w[i]), int(w[i + 2]) + 1)); i += 3
                else:
                    loesch.add(int(w[i])); i += 1
    return ref, skala, loesch, obj

def passe_an(V, pfad):
    ref, skala, loesch, obj = lies_mhclo(pfad)
    s = [1.0, 1.0, 1.0]
    for a, (i1, i2, d) in skala.items():
        s[a] = abs(V[i1][a] - V[i2][a]) / d
    P = []
    for (r, w, o) in ref:
        P.append([V[r[0]][a] * w[0] + V[r[1]][a] * w[1] + V[r[2]][a] * w[2] + o[a] * s[a] for a in range(3)])
    ordner = pfad.rsplit('/', 1)[0] + '/'
    _, T, F = lies_obj(ordner + obj)
    return P, T, F, loesch

def normalen(P, F):
    N = [[0.0, 0.0, 0.0] for _ in P]
    for f in F:
        for k in range(1, len(f) - 1):
            a, b, c = P[f[0][0]], P[f[k][0]], P[f[k + 1][0]]
            u = [b[i] - a[i] for i in range(3)]; v = [c[i] - a[i] for i in range(3)]
            n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]
            for e in (f[0], f[k], f[k + 1]):
                for i in range(3): N[e[0]][i] += n[i]
    for n in N:
        l = math.sqrt(sum(x * x for x in n)) or 1
        for i in range(3): n[i] /= l
    return N

def b64(daten):
    return base64.b64encode(daten).decode()

def teil(name, P, T, F, textur, ohne=frozenset(), bild_groesse=512, alpha=False, extra=None):
    N = normalen(P, F)
    eck = {}
    pos, nor, uv, idx = [], [], [], []
    for f in F:
        if any(e[0] in ohne for e in f): continue
        ids = []
        for e in f:
            if e not in eck:
                eck[e] = len(eck)
                pos.append(P[e[0]]); nor.append(N[e[0]])
                uv.append(T[e[1]] if e[1] >= 0 else [0, 0])
            ids.append(eck[e])
        for k in range(1, len(ids) - 1):
            idx += [ids[0], ids[k], ids[k + 1]]
    pb = b''.join(struct.pack('<3h', *[int(round(p[i])) for i in range(3)]) for p in pos)
    nb = b''.join(struct.pack('<3b', *[int(round(n[i] * 127)) for i in range(3)]) for n in nor)
    ub = b''.join(struct.pack('<2H', int(round(min(max(t[0], 0), 1) * 65535)), int(round(min(max(t[1], 0), 1) * 65535))) for t in uv)
    gross = len(pos) > 65535
    ib = struct.pack('<%d%s' % (len(idx), 'I' if gross else 'H'), *idx)
    erg = {'name': name, 'pos': b64(pb), 'nor': b64(nb), 'uv': b64(ub), 'idx': b64(ib), 'idx32': gross}
    if textur:
        bild = Image.open(textur)
        bild = bild.convert('RGBA' if alpha else 'RGB').resize((bild_groesse, bild_groesse), Image.LANCZOS)
        puffer = io.BytesIO()
        bild.save(puffer, 'WEBP', quality=82, method=6)
        erg['textur'] = 'data:image/webp;base64,' + b64(puffer.getvalue())
    if extra: erg.update(extra)
    print(name, len(pos), 'Ecken', len(idx) // 3, 'Dreiecke', sum(len(v) for k, v in erg.items() if isinstance(v, str)) // 1024, 'KB', file=sys.stderr)
    return erg

# ---------- Körper ----------
V, T, F = lies_obj('base.obj', 'body')
for rasse in ('caucasian', 'african', 'asian'):
    gewicht = 1.0 if rasse == 'caucasian' else 0.0
    if gewicht == 0: continue
    for i, d in lies_target(rasse + '-male-young.target').items():
        for a in range(3): V[i][a] += d[a] * gewicht

# ---------- Arme senken (A-Haltung → locker hängend) ----------
# Skelett und Gewichte von MakeHuman (default.mhskel, default_weights.mhw,
# CC0). Gelenk = Mittel seiner Bezugs-Ecken. Der Oberarm und alles, was
# an ihm hängt, dreht sich um das Schultergelenk (lineares Skinning).
skel = json.load(open('default.mhskel'))
gew = json.load(open('default_weights.mhw'))['weights']
def gelenk(name):
    ids = skel['joints'][name]
    return [sum(V[i][a] for i in ids) / len(ids) for a in range(3)]
def kinder(wurzel):
    erg = {wurzel}
    neu = True
    while neu:
        neu = False
        for k, b in skel['bones'].items():
            if b['parent'] in erg and k not in erg:
                erg.add(k); neu = True
    return erg
# Gewichte je Ecke auf Summe 1 bringen (wie MakeHuman beim Laden)
summe = {}
for liste in gew.values():
    for i, g in liste: summe[i] = summe.get(i, 0) + g
HAENGEN = math.radians(84)   # Winkel des Oberarms unter der Waagerechten
for seite in ('L', 'R'):
    c = gelenk('upperarm01.%s____head' % seite)
    e = gelenk('lowerarm01.%s____head' % seite)
    dx, dy = e[0] - c[0], e[1] - c[1]
    jetzt = math.atan2(-dy, abs(dx))
    w = (HAENGEN - jetzt) * (1 if dx > 0 else -1)   # um die Blickachse z
    co, si = math.cos(-w), math.sin(-w)
    anteil = {}
    for k in kinder('upperarm01.' + seite):
        for i, g in gew.get(k, []):
            anteil[i] = anteil.get(i, 0) + g / summe[i]
    for i, a in anteil.items():
        x, y = V[i][0] - c[0], V[i][1] - c[1]
        rx, ry = c[0] + x * co - y * si, c[1] + x * si + y * co
        V[i][0] += (rx - V[i][0]) * a
        V[i][1] += (ry - V[i][1]) * a
    print(seite, 'Oberarm vorher', round(math.degrees(jetzt)), '° unter der Waagerechten', file=sys.stderr)

# Hände drehen, bis die Handflächen zum Oberschenkel zeigen: alles ab dem
# Handgelenk um die Achse des Unterarms
DREHUNG_HAND = math.radians(-40)   # ausprobiert: so zeigt die Handfläche zum Bein
ANTEIL_GERADE = 0.8
def drehe(knochen, c, achse, winkel):
    l = math.sqrt(sum(x * x for x in achse)); k = [x / l for x in achse]
    co, si = math.cos(winkel), math.sin(winkel)
    anteil = {}
    for kn in knochen:
        for i, g in gew.get(kn, []):
            anteil[i] = anteil.get(i, 0) + g / summe[i]
    for i, a in anteil.items():
        v = [V[i][j] - c[j] for j in range(3)]
        kv = [k[1] * v[2] - k[2] * v[1], k[2] * v[0] - k[0] * v[2], k[0] * v[1] - k[1] * v[0]]
        kd = sum(k[j] * v[j] for j in range(3))
        r = [v[j] * co + kv[j] * si + k[j] * kd * (1 - co) for j in range(3)]
        for j in range(3): V[i][j] += (c[j] + r[j] - V[i][j]) * a
def richtung(a, b):
    d = [b[j] - a[j] for j in range(3)]
    l = math.sqrt(sum(x * x for x in d))
    return [x / l for x in d]
def ausrichten(knochen, pivot, von, nach, anteil):
    achse = [von[1] * nach[2] - von[2] * nach[1], von[2] * nach[0] - von[0] * nach[2], von[0] * nach[1] - von[1] * nach[0]]
    winkel = math.acos(max(-1, min(1, sum(von[j] * nach[j] for j in range(3)))))
    if winkel > 1e-4: drehe(knochen, pivot, achse, winkel * anteil)
    return math.degrees(winkel)

# Der Ellbogen ist in der Grundhaltung stark nach vorn gebeugt – fast
# strecken (ein Rest von 15 % bleibt, so hängt ein Arm locker)
for seite in ('L', 'R'):
    sch = gelenk('upperarm01.%s____head' % seite)
    ell = gelenk('lowerarm01.%s____head' % seite)
    hg = gelenk('wrist.%s____head' % seite)
    w = ausrichten(kinder('lowerarm01.' + seite), ell, richtung(ell, hg), richtung(sch, ell), 0.85)
    print(seite, 'Ellbogen gebeugt um', round(w), '°', file=sys.stderr)

# Die Hand ist in der A-Haltung im Handgelenk abgeknickt – erst in die
# Linie des Unterarms bringen
for seite in ('L', 'R'):
    e = gelenk('lowerarm01.%s____head' % seite)
    h = gelenk('wrist.%s____head' % seite)
    f = gelenk('metacarpal2.%s____tail' % seite)
    u = [h[j] - e[j] for j in range(3)]; d = [f[j] - h[j] for j in range(3)]
    lu = math.sqrt(sum(x * x for x in u)); ld = math.sqrt(sum(x * x for x in d))
    u = [x / lu for x in u]; d = [x / ld for x in d]
    achse = [d[1] * u[2] - d[2] * u[1], d[2] * u[0] - d[0] * u[2], d[0] * u[1] - d[1] * u[0]]
    winkel = math.acos(max(-1, min(1, sum(d[j] * u[j] for j in range(3)))))
    print(seite, 'Hand abgeknickt um', round(math.degrees(winkel)), '°', file=sys.stderr)
    drehe(kinder('wrist.' + seite), h, achse, winkel * ANTEIL_GERADE)
for seite, vz in (('L', 1), ('R', -1)):
    e = gelenk('lowerarm01.%s____head' % seite)
    h = gelenk('wrist.%s____head' % seite)
    achse = [h[j] - e[j] for j in range(3)]
    drehe(kinder('wrist.' + seite), h, achse, DREHUNG_HAND * vz)

# Nur Körper-Ecken zählen für die Größe (Helfer liegen woanders)
koerper = set(e[0] for f in F for e in f)
ymin = min(V[i][1] for i in koerper); ymax = max(V[i][1] for i in koerper)
massstab = GROESSE / (ymax - ymin)
print('Höhe MH', ymax - ymin, 'Maßstab', massstab, file=sys.stderr)

def mm(P):
    return [[p[0] * massstab, (p[1] - ymin) * massstab, p[2] * massstab] for p in P]

teile = []
geloescht = set()
kleidung = []
for pfad, tex, groesse, alpha, art in [
    ('clothes/male_casualsuit05/male_casualsuit05.mhclo', 'clothes/male_casualsuit05/male_casualsuit05_diffuse.png', 1024, False, 'stoff'),
    ('clothes/shoes02/shoes02.mhclo', 'clothes/shoes02/shoes02_diffuse.png', 512, False, 'stoff'),
    ('hair/short02/short02.mhclo', 'hair/short02/short02_diffuse.png', 512, True, 'haar'),
    ('eyebrows/eyebrow001/eyebrow001.mhclo', 'eyebrows/eyebrow001/eyebrow001.png', 128, True, 'haar'),
    ('eyes/low-poly/low-poly.mhclo', 'eyes/materials/brown_eye.png', 256, False, 'auge'),
]:
    P, Tk, Fk, loesch = passe_an(V, MH + pfad)
    geloescht |= loesch
    kleidung.append(teil(pfad.split('/')[1], mm(P), Tk, Fk, MH + tex, bild_groesse=groesse, alpha=alpha, extra={'art': art}))

haut = teil('haut', mm(V), T, F, MH + 'skins/young_caucasian_male/young_lightskinned_male_diffuse.png',
            ohne=geloescht, bild_groesse=1024, extra={'art': 'haut'})
teile = [haut] + kleidung

with open(AUSGABE, 'w') as aus:
    aus.write('''/*
  Mensch zum Größenvergleich, 1,75 m – erzeugt mit den Daten von
  MakeHuman (makehumancommunity.org): Grundkörper, Körperform „junger
  Mann“, Haut, Kleidung (male_casualsuit05, shoes02), Haare (short02),
  Augenbrauen und Augen. Lizenz der Daten: CC0 1.0 (gemeinfrei),
  siehe github.com/makehumancommunity/makehuman, LICENSE.ASSETS.md.

  Umgewandelt mit pruefungen/werkzeuge/mensch-wandeln.py (dort auch, wo
  die Daten herkommen; Arme aus der A-Haltung gesenkt): je Teil
  Positionen (int16, mm, y nach oben, Blick nach +z), Normalen (int8),
  UV (uint16), Dreiecke und eine kleine WebP-Textur, alles Base64.
  Gelesen von js/modell/Mensch.js.
*/
(function (O) {
  'use strict';
  O.MODELLE = O.MODELLE || {};
  O.MODELLE.mensch = ''')
    json.dump({'teile': teile}, aus, indent=0, separators=(',', ':'))
    aus.write(';\n})(globalThis.OPTIK = globalThis.OPTIK || {});\n')
