/*
  Pixelweise zeichnen – für Mond und Planeten.

  Mit Ellipsen und Farbverläufen sehen Planeten gemalt aus (Julian:
  „sehr künstlich“). Stattdessen wird jeder Bildpunkt einzeln gerechnet:
  Wo trifft der Blick die Kugel, wie steht dort die Sonne, welche Farbe
  hat die Oberfläche an dieser Stelle?

  Der Canvas-Kontext ist schon so verschoben und skaliert, dass 1 Einheit
  = 1″ ist (siehe Objekte.js). bereich() rechnet aus dieser Abbildung
  zurück, welcher Himmelspunkt hinter jedem Gerätepixel liegt – so ist
  das Bild bei jeder Vergrößerung pixelgenau, auch in der Lupe.

  Dazu Rauschen (Wertrauschen in 3D) für Wolken, Gebirge und Flecken.
*/
(function (O) {
  'use strict';

  // linear → sRGB-Byte (Gamma 2,2 wie in Okularblick.js)
  var ZU_SRGB = new Uint8ClampedArray(4096);
  for (var i = 0; i < 4096; i++) ZU_SRGB[i] = Math.round(Math.pow(i / 4095, 1 / 2.2) * 255);

  /*
    Welche Gerätepixel decken das Rechteck box = { x0, y0, x1, y1 } (in ″)?
    Ergebnis: { px0, py0, w, h, bsProPx, x(spalte), y(zeile) } oder null,
    wenn nichts davon auf der Leinwand liegt. x() und y() liefern den
    Himmelspunkt (″) in der Mitte eines Pixels.
  */
  function bereich(ctx, box) {
    var m = ctx.getTransform();
    var ax = [m.a * box.x0 + m.e, m.a * box.x1 + m.e];
    var ay = [m.d * box.y0 + m.f, m.d * box.y1 + m.f];
    var px0 = Math.max(0, Math.floor(Math.min(ax[0], ax[1])));
    var px1 = Math.min(ctx.canvas.width, Math.ceil(Math.max(ax[0], ax[1])));
    var py0 = Math.max(0, Math.floor(Math.min(ay[0], ay[1])));
    var py1 = Math.min(ctx.canvas.height, Math.ceil(Math.max(ay[0], ay[1])));
    if (px1 <= px0 || py1 <= py0) return null;
    return {
      px0: px0, py0: py0, w: px1 - px0, h: py1 - py0,
      bsProPx: 1 / Math.abs(m.a),
      // Vorzeichen der Abbildung: −1 heißt, das Bild ist gespiegelt
      sx: m.a < 0 ? -1 : 1, sy: m.d < 0 ? -1 : 1,
      x: function (spalte) { return (px0 + spalte + 0.5 - m.e) / m.a; },
      y: function (zeile) { return (py0 + zeile + 0.5 - m.f) / m.d; }
    };
  }

  // rgba: Float32Array (w·h·4), Farbe linear, Deckkraft 0..1 – auf die
  // Leinwand an die Stelle des Bereichs
  function ausgeben(ctx, b, rgba) {
    var bild = ctx.createImageData(b.w, b.h);
    var d = bild.data;
    for (var i = 0; i < b.w * b.h * 4; i += 4) {
      d[i] = ZU_SRGB[Math.max(0, Math.min(4095, Math.round(rgba[i] * 4095)))];
      d[i + 1] = ZU_SRGB[Math.max(0, Math.min(4095, Math.round(rgba[i + 1] * 4095)))];
      d[i + 2] = ZU_SRGB[Math.max(0, Math.min(4095, Math.round(rgba[i + 2] * 4095)))];
      d[i + 3] = Math.round(Math.max(0, Math.min(1, rgba[i + 3])) * 255);
    }
    var tmp = document.createElement('canvas');
    tmp.width = b.w;
    tmp.height = b.h;
    tmp.getContext('2d').putImageData(bild, 0, 0);
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(tmp, b.px0, b.py0);
    ctx.restore();
  }

  /*
    Jeden Pixel des Rechtecks box mit farbe(x, y, aus) rechnen (x, y in ″;
    aus = [r, g, b, a], Farbe linear). fein × fein Proben pro Pixel
    glätten die Ränder – Planeten sind in der Lupe nur ein paar hundert
    Pixel groß.
  */
  function male(ctx, box, farbe, fein) {
    var b = bereich(ctx, box);
    if (!b) return;
    fein = fein || 1;
    var rgba = new Float32Array(b.w * b.h * 4);
    var aus = [0, 0, 0, 0];
    var schritt = 1 / fein;
    var m = ctx.getTransform();
    for (var zeile = 0; zeile < b.h; zeile++) {
      for (var spalte = 0; spalte < b.w; spalte++) {
        var r = 0, g = 0, bl = 0, a = 0;
        for (var u = 0; u < fein; u++) {
          for (var v = 0; v < fein; v++) {
            var x = (b.px0 + spalte + (u + 0.5) * schritt - m.e) / m.a;
            var y = (b.py0 + zeile + (v + 0.5) * schritt - m.f) / m.d;
            aus[3] = 0;
            farbe(x, y, aus, b.bsProPx);
            r += aus[0] * aus[3];
            g += aus[1] * aus[3];
            bl += aus[2] * aus[3];
            a += aus[3];
          }
        }
        var k = (zeile * b.w + spalte) * 4;
        if (a > 0) {
          rgba[k] = r / a;
          rgba[k + 1] = g / a;
          rgba[k + 2] = bl / a;
        }
        rgba[k + 3] = a / (fein * fein);
      }
    }
    ausgeben(ctx, b, rgba);
  }

  // ---------- Rauschen ----------

  // Ganzzahl-Hash → [0, 1)
  function hash(x, y, z, salz) {
    var h = Math.imul(x, 0x27d4eb2d) ^ Math.imul(y, 0x165667b1) ^ Math.imul(z, 0x9e3779b1) ^ Math.imul(salz, 0x85ebca77);
    h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
    h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }

  // Tabellen fürs Rauschen: eine feste Mischung der Zahlen 0..255
  // (doppelt, damit die Indizes nicht umbrechen müssen) und Zufallswerte
  var MISCH = new Uint8Array(512);
  var WERTE = new Float32Array(256);
  (function () {
    var z = O.Zufall(2026);
    var i;
    for (i = 0; i < 256; i++) { MISCH[i] = i; WERTE[i] = z() - 0.5; }
    for (i = 255; i > 0; i--) {
      var j = Math.floor(z() * (i + 1));
      var t = MISCH[i]; MISCH[i] = MISCH[j]; MISCH[j] = t;
    }
    for (i = 0; i < 256; i++) MISCH[i + 256] = MISCH[i];
  })();

  // Wertrauschen in 3D: weich zwischen Zufallswerten an ganzen Zahlen,
  // −0,5..0,5. (Über Tabellen statt Hash – das ist hier die meiste Rechenzeit.)
  function wert(x, y, z, salz) {
    var ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
    var fx = x - ix, fy = y - iy, fz = z - iz;
    fx = fx * fx * (3 - 2 * fx);
    fy = fy * fy * (3 - 2 * fy);
    fz = fz * fz * (3 - 2 * fz);
    var X = (ix + salz * 31) & 255, Y = iy & 255, Z = iz & 255;
    var A = MISCH[X] + Y, B = MISCH[X + 1] + Y;
    var AA = MISCH[A] + Z, AB = MISCH[A + 1] + Z, BA = MISCH[B] + Z, BB = MISCH[B + 1] + Z;
    var a = WERTE[MISCH[AA]] + (WERTE[MISCH[BA]] - WERTE[MISCH[AA]]) * fx;
    var b = WERTE[MISCH[AB]] + (WERTE[MISCH[BB]] - WERTE[MISCH[AB]]) * fx;
    var c = WERTE[MISCH[AA + 1]] + (WERTE[MISCH[BA + 1]] - WERTE[MISCH[AA + 1]]) * fx;
    var d = WERTE[MISCH[AB + 1]] + (WERTE[MISCH[BB + 1]] - WERTE[MISCH[AB + 1]]) * fx;
    var unten = a + (b - a) * fy;
    var oben = c + (d - c) * fy;
    return unten + (oben - unten) * fz;
  }

  // Mehrere Lagen Rauschen übereinander: Wellenlänge von gross bis klein
  // (halbiert sich je Lage), Stärke nimmt je Lage um den Faktor abfall ab.
  // Lagen feiner als klein werden weggelassen – sie wären feiner als ein Pixel.
  // nurUnter (wahlweise): nur die Lagen mit kürzerer Wellenlänge – die
  // groben rechnet der Aufrufer auf einem gröberen Gitter (siehe Mond.js).
  function lagen(x, y, z, gross, klein, abfall, salz, nurUnter) {
    var summe = 0;
    var staerke = 1;
    var grenze = nurUnter || Infinity;
    for (var w = gross, n = 0; w >= klein && n < 12; w /= 2, n++) {
      if (w < grenze) summe += wert(x / w, y / w, z / w, salz + n) * staerke;
      staerke *= abfall;
    }
    return summe;
  }

  O.Raster = {
    bereich: bereich,
    ausgeben: ausgeben,
    male: male,
    hash: hash,
    wert: wert,
    lagen: lagen
  };
})(globalThis.OPTIK = globalThis.OPTIK || {});
