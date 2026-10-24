/*
  Krater für den Mond im Okular (Mond.js): ihre Form, die gewürfelten
  kleinen Krater zwischen den benannten und wie sehr ein Punkt zu einem
  Mare gehört (das braucht das Würfeln – im Mare gibt es weniger Krater).

  Koordinaten wie in Mond.js: km, Ursprung in der Mondmitte, Z zur Erde.
*/
(function (O) {
  'use strict';

  /*
    Form eines Kraters aus seinem Durchmesser. Einfache Krater (unter
    15 km) sind Schüsseln, Tiefe ≈ 0,2 · D; größere haben einen flachen
    Boden, Terrassen und einen Zentralberg, Tiefe 1,044 · D^0,301 km
    (beides Pike 1977, Size-Dependence in the Shape of Fresh Impact
    Craters on the Moon). Wallhöhe ein Viertel der Tiefe (geschätzt).
    frisch: 0 = abgetragen, 1 = frisch.
  */
  function form(mitte, r, art, frisch) {
    var D = 2 * r;
    if (art === 'jung') frisch = 1;
    else if (art === 'alt') frisch = 0.15;
    else if (art === 'flach') frisch = 0.6;
    else if (art === '') frisch = 0.75;
    var tiefe = D < 15 ? 0.2 * D : 1.044 * Math.pow(D, 0.301);
    var wall = tiefe * 0.25;
    tiefe *= 0.3 + 0.7 * frisch;
    wall *= 0.35 + 0.65 * frisch;
    var boden = D < 15 ? 0 : Math.min(0.6, 0.25 + 0.003 * (D - 15));
    var berg = D > 26 && art !== 'flach' ? tiefe * 0.4 * (0.5 + 0.5 * frisch) : 0;
    if (art === 'flach') {
      boden = 0.8;
      tiefe *= 0.55;
    }
    return {
      x: mitte[0], y: mitte[1], z: mitte[2], r: r,
      tiefe: tiefe, wall: wall, boden: boden, berg: berg,
      // frische Krater haben einen hellen Hof aus Auswurf
      hof: frisch > 0.92 ? 0.25 + (frisch - 0.92) * 4 : 0
    };
  }

  // Höhe (km) im Abstand d (in Kraterradien) von der Mitte
  function profil(k, d) {
    if (d >= 3) return 0;
    if (d >= 1) return k.wall * (1 / (d * d * d) - 1 / 27) / (26 / 27);
    var h;
    if (d <= k.boden) h = -k.tiefe;
    else {
      var t = (d - k.boden) / (1 - k.boden);
      // Terrassen: die Wand steigt in Stufen
      if (k.boden > 0) t = t + Math.sin(t * Math.PI * 5 + k.r) * 0.012;
      h = -k.tiefe + (k.tiefe + k.wall) * (k.boden > 0 ? t * t * (3 - 2 * t) : t * t);
    }
    if (k.berg && d < 0.2) {
      var s = 1 - d / 0.2;
      h += k.berg * s * s;
    }
    return h;
  }

  // Wie sehr ein Punkt (Einheitsvektor) zu einem Mare gehört, 0..1.
  // rand verbiegt die Ränder (Rauschen, in Bruchteilen des Mare-Radius).
  function mareAnteil(karte, x, y, z, rand) {
    var m = 0;
    for (var i = 0; i < karte.mare.length; i++) {
      var e = karte.mare[i];
      var c = x * e.v[0] + y * e.v[1] + z * e.v[2];
      if (c < e.cosAussen) continue;
      var t = Math.acos(Math.min(1, c)) / e.winkel + rand;
      if (t >= 1) continue;
      var s = t <= 0.7 ? 1 : (1 - t) / 0.3;
      s = s * s * (3 - 2 * s) * e.staerke;
      if (s > m) m = s;
    }
    return m;
  }

  // ---------- Gewürfelte Krater ----------

  // Größenstufen: Radius r…2r, Zellen der Kantenlänge 6,3·r. Pro Zelle
  // höchstens ein Krater. So wächst die Zahl wie D^−2 – wie gezählt im
  // Hochland (nahe der Sättigung). Im Mare und auf jungen Böden viel weniger.
  var STUFE_MAX_R = 24;
  var ZELLE = 6.3;
  var DICHTE_HOCHLAND = 0.6;

  function wuerfleKrater(karte, box, kmProPx, rein) {
    var R = karte.R;
    var H = O.Raster.hash;
    for (var stufe = 0; stufe < 10; stufe++) {
      var r0 = STUFE_MAX_R / Math.pow(2, stufe);
      if (r0 / kmProPx < 0.5) break;            // feiner als ein Pixel
      var s = r0 * ZELLE;
      var rand = 6 * r0 + s;
      var i0 = Math.floor((box.x0 - rand) / s), i1 = Math.floor((box.x1 + rand) / s);
      var j0 = Math.floor((box.y0 - rand) / s), j1 = Math.floor((box.y1 + rand) / s);
      for (var i = i0; i <= i1; i++) {
        for (var j = j0; j <= j1; j++) {
          // nur Zellen nahe der Kugeloberfläche
          var nx = Math.max(i * s, Math.min(0, (i + 1) * s)), ny = Math.max(j * s, Math.min(0, (j + 1) * s));
          var fx = Math.max(Math.abs(i * s), Math.abs((i + 1) * s)), fy = Math.max(Math.abs(j * s), Math.abs((j + 1) * s));
          var nah = nx * nx + ny * ny, fern = fx * fx + fy * fy;
          var aussen = R + s / 2, innen = R - s / 2;
          if (nah > aussen * aussen) continue;
          var zHoch = Math.sqrt(aussen * aussen - nah);
          var zTief = fern < innen * innen ? Math.sqrt(innen * innen - fern) : -rand;
          for (var k = Math.floor(zTief / s); k <= Math.floor(zHoch / s); k++) {
            var cx = (i + H(i, j, k, stufe * 7 + 1)) * s;
            var cy = (j + H(i, j, k, stufe * 7 + 2)) * s;
            var cz = (k + H(i, j, k, stufe * 7 + 3)) * s;
            var L = Math.sqrt(cx * cx + cy * cy + cz * cz);
            if (Math.abs(L - R) >= s / 2 || cz < -rand) continue;
            cx /= L; cy /= L; cz /= L;
            var wurf = H(i, j, k, stufe * 7 + 4);
            if (wurf >= DICHTE_HOCHLAND) continue;
            if (wurf >= DICHTE_HOCHLAND * (1 - 0.85 * mareAnteil(karte, cx, cy, cz, 0))) continue;
            // auf den Böden der großen Krater mit Namen ebenfalls weniger
            if (wurf >= DICHTE_HOCHLAND * jungerBoden(karte, cx * R, cy * R, cz * R, stufe)) continue;
            var r = r0 / Math.sqrt(1 - 0.75 * H(i, j, k, stufe * 7 + 5));
            rein(form([cx * R, cy * R, cz * R], r, null, H(i, j, k, stufe * 7 + 6)));
          }
        }
      }
    }
  }

  // Innerhalb eines benannten Kraters: große Zufallskrater gar nicht (sie
  // würden die bekannten Krater verdecken), kleine seltener
  function jungerBoden(karte, x, y, z, stufe) {
    for (var i = 0; i < karte.krater.length; i++) {
      var k = karte.krater[i];
      var dx = x - k.x, dy = y - k.y, dz = z - k.z;
      var d2 = (dx * dx + dy * dy + dz * dz) / (k.r * k.r);
      if (stufe === 0 && d2 < 2.25) return 0;
      if (d2 < 0.64) return 0.25;
    }
    return 1;
  }

  O.Mondkrater = { form: form, profil: profil, mareAnteil: mareAnteil, wuerfle: wuerfleKrater };
})(globalThis.OPTIK = globalThis.OPTIK || {});
