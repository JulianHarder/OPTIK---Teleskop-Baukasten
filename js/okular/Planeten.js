/*
  Jupiter und Saturn im Okular – Pixel für Pixel als beleuchtete Kugel.

  Früher: Farbverlauf in einer Ellipse, Roter Fleck als Ellipse, Ringe als
  Ellipsenringe (Julian: „sehen sehr künstlich aus“). Jetzt wird für
  jeden Bildpunkt gerechnet, wo er die abgeplattete Kugel trifft:

    - Breite → Wolkenband (Breiten nachgesehen, siehe unten), die Ränder
      der Bänder verwirbelt (Rauschen, längs gestreckt wie die Winde)
    - Neigung zur Sonne → Randverdunklung (Minnaert-Gesetz)
    - Saturn: Wo trifft der Blick die Ringebene, in welchem Abstand?
      → Helligkeit und Durchsichtigkeit aus dem Ringprofil; Schatten der
      Ringe auf der Kugel und der Kugel auf den Ringen

  Koordinaten: X nach rechts, Y nach Norden, Z zum Betrachter, in
  Äquatorradien. Am Himmel ist Norden oben, also Himmels-y = −Y.
*/
(function (O) {
  'use strict';

  function lin(c) { return Math.pow(c / 255, 2.2); }

  // Farbtabelle nach Breite: [[Breite°, r, g, b], …] (absteigend), linear gemischt
  function tabelle(stufen) {
    var t = stufen.map(function (s) { return [s[0], lin(s[1]), lin(s[2]), lin(s[3])]; });
    return function (breite, aus) {
      for (var i = 1; i < t.length; i++) {
        if (breite >= t[i][0] || i === t.length - 1) {
          var a = t[i - 1], b = t[i];
          var f = Math.max(0, Math.min(1, (a[0] - breite) / (a[0] - b[0])));
          aus[0] = a[1] + (b[1] - a[1]) * f;
          aus[1] = a[2] + (b[2] - a[2]) * f;
          aus[2] = a[3] + (b[3] - a[3]) * f;
          return;
        }
      }
    };
  }

  function mische(aus, farbe, anteil) {
    aus[0] += (farbe[0] - aus[0]) * anteil;
    aus[1] += (farbe[1] - aus[1]) * anteil;
    aus[2] += (farbe[2] - aus[2]) * anteil;
  }

  var W = O.Raster.wert;
  var GRAD = 180 / Math.PI;

  // ---------- Jupiter ----------

  // Bänder (dunkel) und Zonen (hell), planetografische Breite in Grad.
  // EZ 7° S–7° N, NEB bis 18° N, SEB bis 18–20° S (Wikipedia, Atmosphere
  // of Jupiter); STB zwischen den Strahlströmen bei 26–29° S und 32° S,
  // SSTB ab 36° S (BAA, Rogers u. a. 2013); NTB ab dem Strahlstrom bei
  // 24° N; Polgebiete ab 40–48°, bläulich grau. Farben nach Fotos.
  var jupiterBand = tabelle([
    [90, 120, 118, 118], [50, 150, 142, 132], [44, 178, 165, 145], [40, 160, 145, 125],
    [36, 205, 195, 175], [31.5, 200, 188, 165], [30, 165, 135, 105], [25, 172, 140, 108],
    [23.5, 228, 218, 198], [18.8, 226, 214, 192], [17.5, 178, 128, 92], [13, 160, 108, 75],
    [8.5, 145, 95, 68], [7, 222, 205, 175], [2, 232, 218, 190], [0, 214, 198, 168],
    [-2, 232, 218, 190], [-7, 225, 208, 178], [-8, 150, 104, 74], [-10.5, 158, 112, 80],
    [-12, 188, 150, 115], [-15, 182, 142, 108], [-17, 152, 106, 76], [-19.5, 160, 115, 84],
    [-21, 232, 222, 202], [-26, 226, 214, 194], [-27.5, 170, 140, 110], [-31.5, 168, 138, 108],
    [-33, 214, 204, 184], [-36, 208, 196, 176], [-37, 175, 155, 130], [-41, 178, 160, 136],
    [-43, 196, 186, 168], [-48, 152, 144, 134], [-90, 120, 118, 118]
  ]);

  // Großer Roter Fleck: bei 22° S (Wikipedia); heute rund 14 000 × 10 000 km
  // (geschrumpft, NASA/Hubble 2017: 16 350 km lang) – hier 13° × 9°
  var GRF = { breite: -22.4, laenge: 0.3, halbL: 7.5 / GRAD, halbB: 4.2 };
  var FESTON = [118, 112, 118].map(lin);
  var GRF_FARBE = [205, 128, 92].map(lin);
  var GRF_MITTE = [214, 152, 118].map(lin);
  var WEISS = [238, 232, 218].map(lin);
  var BARKE = [120, 70, 55].map(lin);

  // Wolkenmuster bei Breite φ (Grad) und Länge λ (Bogenmaß)
  function jupiterFarbe(phi, lam, aus) {
    // Bandränder wellig: die Breite wird mit längs gestrecktem Rauschen verschoben
    var welle = W(lam * 9, phi * 0.35, 0.5, 61) * 2.2 + W(lam * 26, phi * 1.1, 3.5, 62) * 0.9;
    jupiterBand(phi + welle, aus);
    // feine Schlieren in den Bändern
    var schliere = W(lam * 40, phi * 2.2, 7.5, 63) + W(lam * 90, phi * 4.5, 1.5, 64) * 0.6;
    var inBand = (aus[0] < 0.45) ? 1 : 0.45;
    var f = 1 + schliere * 0.22 * inBand;
    aus[0] *= f; aus[1] *= f; aus[2] *= f;

    // Girlanden: dunkle Fahnen vom Südrand des NEB, die sich gebogen in
    // die EZ ziehen – unregelmäßig verteilt, verschieden lang
    if (phi > 0.5 && phi < 9) {
      var tiefe = (8.5 - phi) / 8;                // 0 am NEB, 1 am Äquator
      var lage = lam / 0.45 + tiefe * tiefe * 0.9 + W(lam * 10, phi * 0.4, 2.5, 66) * 0.7;
      var k0 = Math.round(lage);
      var los = O.Raster.hash(k0, 0, 0, 67);
      if (los > 0.3) {
        var ende = 0.45 + 0.5 * O.Raster.hash(k0, 1, 0, 68);
        var breite = (0.06 + 0.1 * los) * (1 - 0.5 * tiefe);
        var fahne = Math.max(0, 1 - Math.abs(lage - k0) / breite) *
          Math.max(0, Math.min(1, (ende - tiefe) / 0.2)) * Math.min(1, (phi - 0.5) / 2);
        if (fahne > 0) mische(aus, FESTON, fahne * 0.5);
      }
    }
    // braune „Barken“ im NEB und weiße Ovale im SSTB
    for (var k = -3; k <= 3; k++) {
      var bl = k * 0.5 + 0.12, bdx = (lam - bl) * GRAD / 3.2, bdy = (phi - 15.5) / 1.2;
      var barke = 1 - (bdx * bdx + bdy * bdy);
      if (barke > 0 && (k & 1)) mische(aus, BARKE, barke * 0.6);
      var ol = k * 0.42 - 0.1, odx = (lam - ol) * GRAD / 2.2, ody = (phi + 39.5) / 1.4;
      var oval = 1 - (odx * odx + ody * ody);
      if (oval > 0) mische(aus, WEISS, oval * 0.6);
    }
    // Großer Roter Fleck mit hellem Hof („Red Spot Hollow“) drumherum
    var gx = (lam - GRF.laenge) / GRF.halbL, gy = (phi - GRF.breite) / GRF.halbB;
    var g = Math.sqrt(gx * gx + gy * gy) + W(lam * 30, phi * 0.8, 9.5, 65) * 0.12;
    if (g < 1.7) {
      if (g > 1) mische(aus, WEISS, Math.max(0, 1 - Math.abs(g - 1.3) / 0.45) * 0.35);
      else {
        var rot = Math.min(1, (1 - g) / 0.25);
        mische(aus, GRF_FARBE, rot * 0.9);
        if (g < 0.5) mische(aus, GRF_MITTE, (0.5 - g) / 0.5 * 0.6);
      }
    }
  }

  function jupiter(ctx, o) {
    var R = o.durchmesserBs / 2;
    var q = o.abplattung;
    // Sonne 6° von rechts (Jupiter steht nie ganz der Sonne gegenüber)
    var sx = Math.sin(6 / GRAD), sz = Math.cos(6 / GRAD);
    var tmp = [0, 0, 0];
    O.Raster.male(ctx, { x0: -R, y0: -R, x1: R, y1: R }, function (x, y, aus) {
      var X = x / R, Y = -y / R;
      var w2 = 1 - X * X - (Y / q) * (Y / q);
      if (w2 <= 0) { aus[3] = 0; return; }
      var Z = Math.sqrt(w2);
      // Normale des Ellipsoids
      var nx = X, ny = Y / (q * q), nz = Z;
      var nl = Math.sqrt(nx * nx + ny * ny + nz * nz);
      nx /= nl; ny /= nl; nz /= nl;
      var phi = Math.asin(ny) * GRAD;
      var lam = Math.atan2(X, Z);
      jupiterFarbe(phi, lam, tmp);
      var mu0 = Math.max(0, nx * sx + nz * sz), mu = Math.max(0.02, nz);
      // Minnaert mit k = 0,9: zum Rand hin deutlich dunkler, etwas grauer
      var hell = Math.pow(mu0, 0.9) * Math.pow(mu, -0.1);
      var grau = (1 - mu) * 0.35;
      var mitte = (tmp[0] + tmp[1] + tmp[2]) / 3;
      aus[0] = (tmp[0] + (mitte - tmp[0]) * grau) * hell;
      aus[1] = (tmp[1] + (mitte - tmp[1]) * grau) * hell;
      aus[2] = (tmp[2] + (mitte * 1.05 - tmp[2]) * grau) * hell;
      aus[3] = 1;
    }, 2);
  }

  // ---------- Saturn ----------

  // Bänder Saturns: viel blasser als bei Jupiter. Helle Äquatorzone,
  // bräunliche Gürtel, Polgebiet bläulich grau (nach Fotos, keine Messwerte).
  var saturnBand = tabelle([
    [90, 165, 166, 156], [74, 170, 168, 152], [66, 188, 178, 150], [58, 200, 182, 142],
    [48, 214, 196, 155], [38, 222, 204, 162], [30, 200, 176, 132], [21, 196, 172, 128],
    [15, 224, 205, 160], [8, 238, 220, 176], [-8, 238, 220, 176], [-15, 224, 205, 160],
    [-21, 196, 172, 128], [-30, 202, 178, 134], [-45, 214, 196, 155], [-70, 180, 172, 150],
    [-90, 165, 166, 156]
  ]);

  // Ringprofil: [innen km, außen km, Helligkeit, Deckkraft, Farbe]
  // Radien: Wikipedia, Rings of Saturn (C 74 658–92 000, Maxwell-Lücke
  // 87 491, B 92 000–117 580, Cassini-Teilung 117 580–122 170, A 122 170–
  // 136 775, Encke-Lücke 133 589). C-Ring fast durchsichtig (optische
  // Tiefe 0,05–0,12), B-Ring am hellsten und dichtesten, A-Ring 0,4–0,9.
  var C_FARBE = [150, 140, 126], B_FARBE = [240, 226, 196], A_FARBE = [214, 204, 184];
  var RINGE = [
    [74658, 87356, 0.22, 0.10, C_FARBE],
    [87356, 87626, 0, 0, C_FARBE],                 // Maxwell-Lücke (270 km)
    [87626, 92000, 0.26, 0.12, C_FARBE],
    [92000, 99000, 0.72, 0.65, B_FARBE],
    [99000, 104000, 0.92, 0.9, B_FARBE],
    [104000, 115500, 1.0, 0.97, B_FARBE],
    [115500, 117580, 0.88, 0.92, B_FARBE],
    [117580, 122170, 0.1, 0.07, C_FARBE],          // Cassini-Teilung
    [122170, 128000, 0.78, 0.62, A_FARBE],
    [128000, 133427, 0.72, 0.58, A_FARBE],
    [133427, 133751, 0, 0, A_FARBE],               // Encke-Lücke (325 km)
    [133751, 136775, 0.66, 0.5, A_FARBE]
  ];
  var RING_INNEN = 74658, RING_AUSSEN = 136775, RING_SCHRITT = 20;

  // Aufsummierte Tabellen, damit ein Pixel über seine ganze Breite mitteln
  // kann – sonst flimmern schmale Lücken wie die Encke-Lücke
  var ringSumme = null;
  function ringTabellen() {
    if (ringSumme) return ringSumme;
    var n = Math.ceil((RING_AUSSEN - RING_INNEN) / RING_SCHRITT) + 2;
    var t = { deck: new Float64Array(n), r: new Float64Array(n), g: new Float64Array(n), b: new Float64Array(n) };
    var d = 0, r = 0, g = 0, b = 0;
    for (var i = 1; i < n; i++) {
      var radius = RING_INNEN + (i - 0.5) * RING_SCHRITT;
      var ring = RINGE.find(function (e) { return radius >= e[0] && radius < e[1]; });
      if (ring) {
        // feine Ringlein: Helligkeit wellt sich über wenige 100 km
        var welle = 1 + W(radius / 260, 0.5, 0.5, 71) * 0.25 + W(radius / 1400, 2.5, 0.5, 72) * 0.2;
        var deck = Math.min(1, ring[3] * welle);
        var hell = ring[2] * welle * deck;
        d += deck;
        r += hell * lin(ring[4][0]); g += hell * lin(ring[4][1]); b += hell * lin(ring[4][2]);
      }
      t.deck[i] = d; t.r[i] = r; t.g[i] = g; t.b[i] = b;
    }
    ringSumme = t;
    return t;
  }

  // Mittel über [r − dr/2, r + dr/2] (km) → aus = [r, g, b, deck]
  function ringMittel(t, r, dr, aus) {
    dr = Math.max(dr, RING_SCHRITT);
    function lese(feld, km) {
      var u = Math.max(0, Math.min(feld.length - 1.001, (km - RING_INNEN) / RING_SCHRITT));
      var i = Math.floor(u);
      return feld[i] + (feld[i + 1] - feld[i]) * (u - i);
    }
    var a = r - dr / 2, e = r + dr / 2;
    aus[0] = (lese(t.r, e) - lese(t.r, a)) / dr * RING_SCHRITT;
    aus[1] = (lese(t.g, e) - lese(t.g, a)) / dr * RING_SCHRITT;
    aus[2] = (lese(t.b, e) - lese(t.b, a)) / dr * RING_SCHRITT;
    aus[3] = (lese(t.deck, e) - lese(t.deck, a)) / dr * RING_SCHRITT;
  }

  function saturn(ctx, o) {
    var R = o.durchmesserBs / 2;
    var q = o.abplattung;
    var kmJeRe = o.aequatorKm;
    var B = o.ringneigungGrad / GRAD;
    var sB = Math.sin(B), cB = Math.cos(B);
    // Achse (Nordpol zum Betrachter geneigt) und Hilfsachse in der Äquatorebene
    var A = [0, cB, sB], E2 = [0, sB, -cB];
    // Sonne 5° von rechts (größter Phasenwinkel Saturns ≈ 6°)
    var S = [Math.sin(5 / GRAD), 0, Math.cos(5 / GRAD)];
    var t = ringTabellen();
    var aussen = RING_AUSSEN / kmJeRe;
    var ring = [0, 0, 0, 0], kugel = [0, 0, 0];

    // Wo schneidet der Strahl P + s·D die Kugel? nah: die kleinere
    // Lösung s, sonst die größere. −∞, wenn er sie verfehlt.
    function trifftKugel(px, py, pz, dx, dy, dz, nah) {
      var a1 = px, b1 = dx;
      var a2 = py * E2[1] + pz * E2[2], b2 = dy * E2[1] + dz * E2[2];
      var a3 = (py * A[1] + pz * A[2]) / q, b3 = (dy * A[1] + dz * A[2]) / q;
      var qa = b1 * b1 + b2 * b2 + b3 * b3;
      var qb = 2 * (a1 * b1 + a2 * b2 + a3 * b3);
      var qc = a1 * a1 + a2 * a2 + a3 * a3 - 1;
      var disk = qb * qb - 4 * qa * qc;
      if (disk < 0) return -Infinity;
      return (-qb + (nah ? -1 : 1) * Math.sqrt(disk)) / (2 * qa);
    }

    O.Raster.male(ctx, { x0: -aussen * R, y0: -aussen * R, x1: aussen * R, y1: aussen * R }, function (x, y, aus, bsProPx) {
      var X = x / R, Y = -y / R;
      // Blickstrahl von vorn in Richtung −Z: der erste Schnitt liegt bei Z = −s
      var sKugel = trifftKugel(X, Y, 0, 0, 0, -1, true);
      var zKugel = isFinite(sKugel) ? -sKugel : -Infinity;

      // Ringebene: A·P = 0 → Z = −Y·cB/sB
      var zRing = -Y * cB / sB;
      var p1 = X, p2 = Y * sB - zRing * cB;
      var rRe = Math.sqrt(p1 * p1 + p2 * p2);
      var hatRing = rRe * kmJeRe >= RING_INNEN && rRe * kmJeRe <= RING_AUSSEN;
      if (hatRing) {
        // Breite des Pixels in der Ringebene, radial
        var px = bsProPx / R / 2;
        var dr = px * (Math.abs(X) + Math.abs(Y) / (sB * sB)) / rRe * kmJeRe;
        ringMittel(t, rRe * kmJeRe, dr, ring);
        // Kugelschatten auf dem Ring
        if (trifftKugel(X, Y, zRing, S[0], S[1], S[2], false) > 0) {
          ring[0] *= 0.04; ring[1] *= 0.04; ring[2] *= 0.04;
        }
        // Licht fällt flach auf die Ringe: etwas dunkler als die Kugel
        ring[0] *= 0.9; ring[1] *= 0.9; ring[2] *= 0.9;
      }

      var hatKugel = zKugel > -Infinity;
      if (hatKugel) {
        var Z = zKugel;
        var k1 = X, k2 = Y * sB - Z * cB, k3 = Y * cB + Z * sB;
        // Normale in Kugel-Koordinaten (k1, k2, k3/q²) → Blick-Koordinaten
        var n3 = k3 / (q * q);
        var nx = k1, ny = k2 * E2[1] + n3 * A[1], nz = k2 * E2[2] + n3 * A[2];
        var nl = Math.sqrt(nx * nx + ny * ny + nz * nz);
        nx /= nl; ny /= nl; nz /= nl;
        var phi = Math.asin((ny * A[1] + nz * A[2])) * GRAD;
        var lam = Math.atan2(k1, -k2);
        var welle = W(lam * 7, phi * 0.3, 0.5, 81) * 1.6;
        saturnBand(phi + welle, kugel);
        var f = 1 + (W(lam * 30, phi * 1.5, 4.5, 82) * 0.08);
        var mu0 = Math.max(0, nx * S[0] + ny * S[1] + nz * S[2]), mu = Math.max(0.02, nz);
        var hell = Math.pow(mu0, 0.9) * Math.pow(mu, -0.1) * f;
        // Schatten der Ringe auf der Kugel
        var sa = S[1] * A[1] + S[2] * A[2];
        var s = -(Y * A[1] + Z * A[2]) / sa;
        if (s > 0) {
          var hx = X + s * S[0], hy = Y + s * S[1], hz = Z + s * S[2];
          var h1 = hx, h2 = hy * E2[1] + hz * E2[2];
          var rs = Math.sqrt(h1 * h1 + h2 * h2) * kmJeRe;
          if (rs >= RING_INNEN && rs <= RING_AUSSEN) {
            var sch = [0, 0, 0, 0];
            ringMittel(t, rs, Math.max(RING_SCHRITT, bsProPx / R * kmJeRe), sch);
            hell *= 1 - sch[3] * 0.92;
          }
        }
        kugel[0] *= hell; kugel[1] *= hell; kugel[2] *= hell;
      }

      var vorn = hatRing && (!hatKugel || zRing > zKugel);
      if (hatKugel) {
        aus[0] = kugel[0]; aus[1] = kugel[1]; aus[2] = kugel[2]; aus[3] = 1;
        if (vorn) {
          var d = ring[3];
          aus[0] = ring[0] + kugel[0] * (1 - d);
          aus[1] = ring[1] + kugel[1] * (1 - d);
          aus[2] = ring[2] + kugel[2] * (1 - d);
        }
        return;
      }
      if (hatRing && ring[3] > 0) {
        // Ring vor schwarzem Himmel: Farbe ohne Vormultiplizieren, Deckkraft
        aus[0] = ring[0] / ring[3]; aus[1] = ring[1] / ring[3]; aus[2] = ring[2] / ring[3];
        aus[3] = ring[3];
        return;
      }
      aus[3] = 0;
    }, 2);
  }

  O.Planeten = { jupiter: jupiter, saturn: saturn };
})(globalThis.OPTIK = globalThis.OPTIK || {});
