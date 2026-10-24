/*
  Der Mond im Okular – als beleuchtete Landschaft gerechnet.

  Früher waren es helle Kreise und dunkle Flecken (Julian: „grauenhaft“).
  Jetzt bekommt jeder Bildpunkt eine Höhe und eine Helligkeit des Bodens,
  und die Sonne scheint von der Seite darauf:

    1. Boden: Mare (dunkel, tiefer gelegen) an ihren echten Orten aus
       daten/mondkarte.js, Hochland mit welligem Gelände (Rauschen),
       Gebirge entlang ihrer Linien.
    2. Krater: die großen mit Namen, dazu viele kleine, gewürfelt in
       Größenstufen (Mondkrater.js). Nur so fein, wie das Bild auflöst.
    3. Schatten: Das Sonnenlicht fällt entlang der Bildzeilen ein. Eine
       Zeile wird von der Sonnenseite her abgelaufen – was hinter einer
       höheren Stelle liegt, liegt im Schatten. Am Terminator steht die
       Sonne flach, die Schatten werden lang.
    4. Licht: Neigung jedes Bildpunkts zur Sonne (Lommel-Seeliger, wie
       Mondstaub streut: kaum Randverdunklung), Erdschein auf der Nachtseite.

  Koordinaten: X nach rechts (Osten am Mond), Y nach Norden, Z zur Erde,
  in km, Ursprung in der Mondmitte. Am Himmel ist Norden oben, also
  Himmels-y = −Y.
*/
(function (O) {
  'use strict';

  // Phase: Der Terminator steht bei 7° West – gut einen Tag nach dem
  // ersten Viertel. Dann liegen Ptolemaeus, Alphonsus und Arzachel und
  // die Apenninen im flachen Licht kurz hinter der Schattengrenze.
  var TERMINATOR_LAENGE = -7;
  var SONNE_LAENGE = (TERMINATOR_LAENGE + 90) * Math.PI / 180;
  var SX = Math.sin(SONNE_LAENGE), SZ = Math.cos(SONNE_LAENGE);
  // Die Lupe schaut auf Alphonsus (13,4° S, 2,9° W) mitten in der Kette
  var LUPE = { breite: -13.39, laenge: -2.85 };

  var MARE_TIEFE = 1.6;            // km, so viel tiefer liegt ein Mare (geschätzt)
  var HELL = 0.2;                 // Helligkeit des Hochlands (linear)

  function zuVektor(breite, laenge) {
    var b = breite * Math.PI / 180, l = laenge * Math.PI / 180;
    return [Math.cos(b) * Math.sin(l), Math.sin(b), Math.cos(b) * Math.cos(l)];
  }

  // ---------- Karte vorbereiten (einmal) ----------

  var karte = null;

  function bereiteVor() {
    if (karte) return karte;
    var K = O.MONDKARTE;
    var R = K.radiusKm;
    karte = {
      R: R,
      mare: K.mare.map(function (m) {
        var winkel = m[2] / 2 / R;
        return { v: zuVektor(m[0], m[1]), winkel: winkel, cosAussen: Math.cos(winkel * 1.5), staerke: m[3] };
      }),
      krater: K.krater.map(function (k) {
        var v = zuVektor(k[1], k[2]);
        return O.Mondkrater.form([v[0] * R, v[1] * R, v[2] * R], k[3] / 2, k[4], 0);
      }),
      gebirge: K.gebirge.map(function (g) {
        var p = g.punkte.map(function (q) {
          var v = zuVektor(q[0], q[1]);
          return [v[0] * R, v[1] * R, v[2] * R];
        });
        return { punkte: p, hoehe: g.hoeheKm, breite: g.breiteKm };
      })
    };
    return karte;
  }

  // ---------- Zeichnen ----------

  function zeichne(ctx, o) {
    var kt = bereiteVor();
    var R = kt.R;
    var Rbs = o.durchmesserBs / 2;
    var kBs = Rbs / R;                         // ″ pro km
    var mx = -Math.sin(TERMINATOR_LAENGE * Math.PI / 180) * Rbs;   // Mondmitte am Himmel
    var b = O.Raster.bereich(ctx, { x0: mx - Rbs, y0: -Rbs, x1: mx + Rbs, y1: Rbs });
    if (!b) return;
    var s = b.bsProPx;
    var kmProPx = s / kBs;

    // Gitter in Himmelskoordinaten, aufsteigend. Rechts (zur Sonne hin)
    // ein Streifen mehr, der nur Schatten wirft und nicht gezeichnet wird.
    var xa = Math.min(b.x(0), b.x(b.w - 1)), xe = Math.max(b.x(0), b.x(b.w - 1));
    var ya = Math.min(b.y(0), b.y(b.h - 1));
    var extra = Math.max(0, Math.ceil((Math.min(mx + Rbs, xe + b.w * 0.4 * s) - xe) / s));
    var W = b.w + extra, Hh = b.h, N = W * Hh;
    var PX = new Float32Array(N), PY = new Float32Array(N), PZ = new Float32Array(N);
    var auf = new Uint8Array(N);
    var hoehe = new Float32Array(N), albedo = new Float32Array(N), mare = new Float32Array(N);
    var gx, gy, i;

    // Ausdehnung des Gitters in Mond-km (für die gewürfelten Krater)
    var box = { x0: (xa - mx) / kBs, x1: (xa + (W - 1) * s - mx) / kBs, y0: -(ya + (Hh - 1) * s) / kBs, y1: -ya / kBs };

    // 1. Boden. Was sich nur langsam ändert (Mare, grobe Hügel, Flecken),
    // auf einem Gitter mit jedem G-ten Pixel rechnen und dazwischen
    // mitteln – nur die feinen Lagen Pixel für Pixel. Das spart den
    // größten Teil der Rechenzeit.
    var klein = Math.max(kmProPx * 1.5, 0.3);
    var G = kmProPx > 3 ? 2 : 4;
    var grob = kmProPx * G * 2;                 // ab dieser Wellenlänge aufs grobe Gitter
    var Wg = Math.floor((W - 1) / G) + 2, Hg = Math.floor((Hh - 1) / G) + 2;
    var gMare = new Float32Array(Wg * Hg), gHoehe = new Float32Array(Wg * Hg), gFlecken = new Float32Array(Wg * Hg);
    var X, Y, Z, r2, m;
    for (gy = 0; gy < Hg; gy++) {
      for (gx = 0; gx < Wg; gx++) {
        X = (xa + gx * G * s - mx) / kBs;
        Y = -(ya + gy * G * s) / kBs;
        r2 = X * X + Y * Y;
        if (r2 > R * R) {
          X *= R / Math.sqrt(r2); Y *= R / Math.sqrt(r2);
          r2 = R * R;
        }
        Z = Math.sqrt(R * R - r2);
        i = gy * Wg + gx;
        var verbogen = O.Raster.lagen(X, Y, Z, 240, 25, 0.6, 11) * 0.9;
        gMare[i] = O.Mondkrater.mareAnteil(kt, X / R, Y / R, Z / R, verbogen);
        gHoehe[i] = O.Raster.lagen(X, Y, Z, 160, Math.max(klein, grob), 0.55, 3);
        gFlecken[i] = O.Raster.lagen(X, Y, Z, 220, Math.max(klein, 4, grob), 0.6, 5);
      }
    }
    function mittel(feld, gx, gy) {
      var u = gx / G, v = gy / G;
      var iu = Math.floor(u), iv = Math.floor(v);
      u -= iu; v -= iv;
      var k = iv * Wg + iu;
      var oben = feld[k] + (feld[k + 1] - feld[k]) * u;
      var unten = feld[k + Wg] + (feld[k + Wg + 1] - feld[k + Wg]) * u;
      return oben + (unten - oben) * v;
    }
    var grenze = R + 0.5 * kmProPx;
    for (gy = 0; gy < Hh; gy++) {
      for (gx = 0; gx < W; gx++) {
        i = gy * W + gx;
        X = (xa + gx * s - mx) / kBs;
        Y = -(ya + gy * s) / kBs;
        r2 = X * X + Y * Y;
        if (r2 > grenze * grenze) continue;
        if (r2 > R * R * 0.9999) {
          var f = Math.sqrt(R * R * 0.9999 / r2);
          X *= f; Y *= f;
          r2 = X * X + Y * Y;
        }
        Z = Math.sqrt(R * R - r2);
        PX[i] = X; PY[i] = Y; PZ[i] = Z;
        auf[i] = 1;
        m = mittel(gMare, gx, gy);
        mare[i] = m;
        var gelaende = (mittel(gHoehe, gx, gy) + O.Raster.lagen(X, Y, Z, 160, klein, 0.55, 3, grob)) * 2.4 * (1 - 0.75 * m);
        hoehe[i] = -MARE_TIEFE * m + gelaende + gebirge(kt, X, Y, Z, klein);
        // der Streifen rechts wird nicht gezeichnet – dort reicht die Höhe
        if (gx >= b.w) continue;
        var flecken = mittel(gFlecken, gx, gy) + O.Raster.lagen(X, Y, Z, 220, Math.max(klein, 4), 0.6, 5, grob);
        // im Mare etwas kräftigere Flecken: Lavaströme verschiedenen Alters
        albedo[i] = (1 - 0.47 * m) * (1 + (0.22 + 0.12 * m) * flecken);
      }
    }

    // 2. Krater stempeln
    function stemple(k) {
      var rBs = k.r * kBs;
      if (rBs / s < 0.5) return;
      var cx = mx + k.x * kBs, cy = -k.y * kBs;
      var weit = 3 * rBs;
      var x0 = Math.max(0, Math.ceil((cx - weit - xa) / s)), x1 = Math.min(W - 1, Math.floor((cx + weit - xa) / s));
      var y0 = Math.max(0, Math.ceil((cy - weit - ya) / s)), y1 = Math.min(Hh - 1, Math.floor((cy + weit - ya) / s));
      var unrund = rBs / s > 6;                  // große Krater: Wall nicht ganz rund
      for (var yy = y0; yy <= y1; yy++) {
        for (var xx = x0; xx <= x1; xx++) {
          var j = yy * W + xx;
          if (!auf[j]) continue;
          var dx = PX[j] - k.x, dy = PY[j] - k.y, dz = PZ[j] - k.z;
          var d = Math.sqrt(dx * dx + dy * dy + dz * dz) / k.r;
          if (d >= 3) continue;
          if (unrund) d *= 1 + 0.06 * O.Raster.wert(PX[j] / (k.r * 0.6), PY[j] / (k.r * 0.6), PZ[j] / (k.r * 0.6), 41);
          hoehe[j] += O.Mondkrater.profil(k, d);
          if (k.hof) {
            var hof = Math.max(0, 1 - d / 2.2);
            albedo[j] += k.hof * hof * hof;
          }
        }
      }
    }
    O.Mondkrater.wuerfle(kt, box, kmProPx, stemple);
    kt.krater.forEach(stemple);

    // 3. Schatten: jede Zeile von der Sonnenseite (rechts) her ablaufen.
    // b = Lage quer zum Sonnenstrahl; liegt ein Punkt tiefer als ein
    // Punkt davor, kommt kein Licht hin.
    var licht = new Float32Array(N);
    var weich = Math.max(0.02, kmProPx * 0.1);
    for (gy = 0; gy < Hh; gy++) {
      var hoechstes = -Infinity;
      for (gx = W - 1; gx >= 0; gx--) {
        i = gy * W + gx;
        if (!auf[i]) continue;
        var q = 1 + hoehe[i] / R;
        var quer = (-PX[i] * SZ + PZ[i] * SX) * q;
        licht[i] = Math.max(0, Math.min(1, 1 + (quer - hoechstes) / weich));
        if (quer > hoechstes) hoechstes = quer;
      }
    }

    // 4. Licht und Farbe, nur für den sichtbaren Teil
    var rgba = new Float32Array(b.w * b.h * 4);
    function punkt(j, aus) {
      var q = 1 + hoehe[j] / R;
      aus[0] = PX[j] * q; aus[1] = PY[j] * q; aus[2] = PZ[j] * q;
    }
    var p0 = [0, 0, 0], p1 = [0, 0, 0], p2 = [0, 0, 0], p3 = [0, 0, 0];
    for (var zeile = 0; zeile < b.h; zeile++) {
      gy = b.sy > 0 ? zeile : b.h - 1 - zeile;
      for (var spalte = 0; spalte < b.w; spalte++) {
        gx = b.sx > 0 ? spalte : b.w - 1 - spalte;
        i = gy * W + gx;
        if (!auf[i]) continue;
        // Neigung aus den Nachbarn
        punkt(gx < W - 1 && auf[i + 1] ? i + 1 : i, p0);
        punkt(gx > 0 && auf[i - 1] ? i - 1 : i, p1);
        punkt(gy < Hh - 1 && auf[i + W] ? i + W : i, p2);
        punkt(gy > 0 && auf[i - W] ? i - W : i, p3);
        var ax = p0[0] - p1[0], ay = p0[1] - p1[1], az = p0[2] - p1[2];
        var bx = p2[0] - p3[0], by = p2[1] - p3[1], bz = p2[2] - p3[2];
        var nx = ay * bz - az * by, ny = az * bx - ax * bz, nz = ax * by - ay * bx;
        var nl = Math.sqrt(nx * nx + ny * ny + nz * nz);
        if (nl === 0 || nx * PX[i] + ny * PY[i] + nz * PZ[i] < 0) nl = -nl;
        if (nl === 0) { nx = PX[i]; ny = PY[i]; nz = PZ[i]; nl = R; }
        nx /= nl; ny /= nl; nz /= nl;
        var mu0 = nx * SX + nz * SZ;
        var mu = Math.max(0.1, nz);
        var hell = mu0 > 0 ? (0.8 * 2 * mu0 / (mu0 + mu) + 0.2 * mu0) * licht[i] : 0;
        hell += 0.0004;                           // Erdschein
        var a = Math.max(0.05, albedo[i]) * hell * HELL;
        var m = mare[i];
        // Hochland leicht warmgrau, Mare eine Spur kühler
        var k4 = (zeile * b.w + spalte) * 4;
        rgba[k4] = a * (1 - 0.06 * m);
        rgba[k4 + 1] = a * (0.97 - 0.02 * m);
        rgba[k4 + 2] = a * (0.92 + 0.02 * m);
        // weicher Rand
        var rx = xa + gx * s - mx, ry = ya + gy * s;
        rgba[k4 + 3] = Math.max(0, Math.min(1, (Rbs - Math.sqrt(rx * rx + ry * ry)) / s + 0.5));
      }
    }
    O.Raster.ausgeben(ctx, b, rgba);
  }

  // Gebirge: ein Rücken entlang der Linie, zerteilt in Gipfel
  function gebirge(kt, x, y, z, klein) {
    var h = 0;
    for (var g = 0; g < kt.gebirge.length; g++) {
      var e = kt.gebirge[g];
      var naechst = Infinity;
      for (var i = 0; i + 1 < e.punkte.length; i++) {
        var a = e.punkte[i], b = e.punkte[i + 1];
        var ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
        var t = ((x - a[0]) * ux + (y - a[1]) * uy + (z - a[2]) * uz) / (ux * ux + uy * uy + uz * uz);
        t = Math.max(0, Math.min(1, t));
        var dx = x - a[0] - t * ux, dy = y - a[1] - t * uy, dz = z - a[2] - t * uz;
        naechst = Math.min(naechst, dx * dx + dy * dy + dz * dz);
      }
      var w = e.breite;
      if (naechst > 9 * w * w) continue;
      var gipfel = Math.max(0, 0.5 + O.Raster.lagen(x, y, z, 50, klein, 0.6, 21) * 1.4);
      h += e.hoehe * Math.exp(-naechst / (w * w)) * gipfel * gipfel * 1.6;
    }
    return h;
  }

  // Wo die Lupe hinschaut (″ vom Bildmittelpunkt; der liegt auf dem
  // Terminator am Äquator)
  function lupenMitte(o) {
    var Rbs = o.durchmesserBs / 2;
    var v = zuVektor(LUPE.breite, LUPE.laenge);
    var t = Math.sin(TERMINATOR_LAENGE * Math.PI / 180);
    return { x: (v[0] - t) * Rbs, y: -v[1] * Rbs };
  }

  O.Mond = { zeichne: zeichne, lupenMitte: lupenMitte };
})(globalThis.OPTIK = globalThis.OPTIK || {});
