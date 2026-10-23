"""
Wandelt den Astronauten der NASA in js/daten/modell-astronaut.js um,
gleiches Format wie mensch-wandeln.py. Läuft nur einmal.

  python3 pruefungen/werkzeuge/astronaut-wandeln.py Astronaut.glb js/daten/modell-astronaut.js

Astronaut.glb: github.com/nasa/NASA-3D-Resources, „3D Models/Astronaut“
(„free and without copyright“). Die Datei ist Draco-komprimiert – braucht
DracoPy (mit numpy < 2) und Pillow, am besten in einer eigenen venv.
"""
import base64, io, json, struct, sys
import DracoPy
from PIL import Image

HOEHE = 1900.0   # mit Helm und Stiefeln

b = open(sys.argv[1], 'rb').read()
l = struct.unpack('<I', b[12:16])[0]
j = json.loads(b[20:20 + l])
binaer = b[20 + l + 8:]

FORM = {5126: ('f', 4), 5123: ('H', 2), 5125: ('I', 4), 5121: ('B', 1)}
ANZ = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4}

def lies(i):
    a = j['accessors'][i]
    bv = j['bufferViews'][a['bufferView']]
    z, g = FORM[a['componentType']]
    n = ANZ[a['type']]
    start = bv.get('byteOffset', 0) + a.get('byteOffset', 0)
    schritt = bv.get('byteStride', g * n)
    return [struct.unpack_from('<%d%s' % (n, z), binaer, start + k * schritt) for k in range(a['count'])]

def bild(i):
    bv = j['bufferViews'][j['images'][i]['bufferView']]
    s = bv.get('byteOffset', 0)
    return Image.open(io.BytesIO(binaer[s:s + bv['byteLength']]))

def b64(d):
    return base64.b64encode(d).decode()

def draco(p):
    bv = j['bufferViews'][p['extensions']['KHR_draco_mesh_compression']['bufferView']]
    s0 = bv.get('byteOffset', 0)
    return DracoPy.decode(binaer[s0:s0 + bv['byteLength']])

prims = j['meshes'][0]['primitives']
netze = [draco(p) for p in prims]
alle = []
for m in netze:
    alle.append([(x, z, -y) for (x, y, z) in m.points.tolist()])
ymin = min(v[1] for P in alle for v in P)
ymax = max(v[1] for P in alle for v in P)
s = HOEHE / (ymax - ymin)
print('Höhe', ymax - ymin, 'Maßstab', s, file=sys.stderr)

# Arme senken: Das Modell steht in T-Haltung. Alles außerhalb der
# Schulter (|x| > 270 mm, oberhalb 1,15 m, nicht der Rucksack) dreht sich
# um das Schultergelenk nach unten, mit weichem Übergang über 90 mm.
import math
SENKEN = math.radians(55)
def arme(P, N):
    for k in range(len(P)):
        x, y, z = P[k][0] * s, (P[k][1] - ymin) * s, P[k][2] * s
        if y < 1150 or z < -120: continue
        t = min(max((abs(x) - 270) / 90, 0), 1)
        if t == 0: continue
        t = t * t * (3 - 2 * t)
        w = -SENKEN * t * (1 if x > 0 else -1)
        cx, cy = (300 if x > 0 else -300), 1420
        co, si = math.cos(w), math.sin(w)
        nx, ny = cx + (x - cx) * co - (y - cy) * si, cy + (x - cx) * si + (y - cy) * co
        P[k] = (nx / s, ny / s + ymin, P[k][2])
        a, b2, c = N[k]
        N[k] = (a * co - b2 * si, a * si + b2 * co, c)

teile = []
for p, m, P, name in zip(prims, netze, alle, ('anzug', 'visier')):
    N = [(x, z, -y) for (x, y, z) in m.normals.tolist()]
    T = m.tex_coord.tolist()
    I = [int(i) for i in m.faces.flatten().tolist()]
    P = list(P)
    arme(P, N)
    pb = b''.join(struct.pack('<3h', round(v[0] * s), round((v[1] - ymin) * s), round(v[2] * s)) for v in P)
    nb = b''.join(struct.pack('<3b', *[round(max(-1, min(1, c)) * 127) for c in n]) for n in N)
    # glTF zählt v von oben, OBJ (und flipY) von unten
    ub = b''.join(struct.pack('<2H', round(min(max(t[0] % 1.0001, 0), 1) * 65535), round(min(max(1 - t[1], 0), 1) * 65535)) for t in T)
    gross = len(P) > 65535
    ib = struct.pack('<%d%s' % (len(I), 'I' if gross else 'H'), *I)
    mat = j['materials'][p['material']]
    quelle = j['textures'][mat['pbrMetallicRoughness']['baseColorTexture']['index']]['source']
    gr = 512 if name == 'anzug' else 64
    im = bild(quelle).convert('RGB').resize((gr, gr), Image.LANCZOS)
    puffer = io.BytesIO()
    im.save(puffer, 'WEBP', quality=85, method=6)
    teile.append({'name': name, 'art': name, 'pos': b64(pb), 'nor': b64(nb), 'uv': b64(ub), 'idx': b64(ib), 'idx32': gross,
                  'textur': 'data:image/webp;base64,' + b64(puffer.getvalue())})
    print(name, len(P), len(I) // 3, file=sys.stderr)

with open(sys.argv[2], 'w') as aus:
    aus.write('''/*
  Astronaut im Raumanzug für Außeneinsätze – das Modell „Astronaut“ der
  NASA (github.com/nasa/NASA-3D-Resources, „free and without copyright“).
  Auf 1,90 m mit Helm gebracht, sonst unverändert.

  Umgewandelt mit pruefungen/werkzeuge/astronaut-wandeln.py, gleiches
  Format wie js/daten/modell-mensch.js. Gelesen von js/modell/Mensch.js.
*/
(function (O) {
  'use strict';
  O.MODELLE = O.MODELLE || {};
  O.MODELLE.astronaut = ''')
    json.dump({'teile': teile}, aus, indent=0, separators=(',', ':'))
    aus.write(';\n})(globalThis.OPTIK = globalThis.OPTIK || {});\n')
