/*
  Der Blick durchs Okular: aus Objekt und Teleskop ein Bild rechnen.

  Schritte (alle Helligkeiten linear, sRGB erst ganz am Ende):
    1. Ausschnitt: Das Bild zeigt genau das wahre Gesichtsfeld. Ein Pixel
       sind feld / N Bogensekunden – kleine Vergrößerung, kleine Planeten.
    2. Flächen (Planet, Mond, Nebel) in echter Winkelgröße zeichnen,
       um 180° gedreht (ein Newton stellt das Bild auf den Kopf).
    3. Unschärfe: Gaußglocke aus Beugung und Luftunruhe (physik/Sehen.js).
    4. Flächenhelligkeit nach der Austrittspupille, dazu der Himmel.
    5. Sterne als Punkte mit derselben Unschärfe, sichtbar bis zur
       Grenzgröße; helle bekommen die vier Zacken der Fangspiegelspinne.
    6. Belichtung wie ein Auge (sanft sättigend), runde Feldblende.

  Das ist eine Simulation: Sie vergleicht Teleskope richtig, aber kein
  Bildschirm zeigt so viele Einzelheiten und so viel Helligkeit wie ein
  echtes Okular.
*/
(function (O) {
  'use strict';

  var BELICHTUNG = 2.2;       // Fläche: Saturn bei 3 mm Austrittspupille gut belichtet
  var AP_BEZUG_MM = 3;
  var HIMMEL = 0.004;         // Himmelshintergrund bei 3 mm Austrittspupille (Stadtrand)
  // Das Auge trennt etwa eine Bogenminute im Okular, das sind bei 52°
  // scheinbarem Feld rund 3 100 Bildpunkte quer übers Feld. Die Lupe
  // zeigt die Bildmitte mit genau dieser Feinheit: 1 Pixel = 1 Augenpunkt.
  var AUGE_PUNKTE_IM_FELD = O.Optik.SCHEINBARES_FELD_GRAD * 60;
  var SIGMA_MAX_PX = 7;       // mehr Unschärfe lohnt nicht zu rechnen

  // sRGB-Byte ↔ linear (Näherung mit Gamma 2,2 – reicht hier)
  var zuLinear = new Float32Array(256);
  for (var i = 0; i < 256; i++) zuLinear[i] = Math.pow(i / 255, 2.2);

  // ---------- Unschärfe ----------

  function kern(sigma) {
    var r = Math.ceil(sigma * 3);
    var k = new Float32Array(2 * r + 1);
    var summe = 0;
    for (var i = -r; i <= r; i++) {
      k[i + r] = Math.exp(-(i * i) / (2 * sigma * sigma));
      summe += k[i + r];
    }
    for (var j = 0; j < k.length; j++) k[j] /= summe;
    return k;
  }

  // Getrennte Faltung: erst Zeilen, dann Spalten (spart viel Rechenzeit)
  function verwische(kanal, n, sigma) {
    if (sigma < 0.3) return kanal;
    var k = kern(Math.min(sigma, SIGMA_MAX_PX));
    var r = (k.length - 1) / 2;
    var hilf = new Float32Array(n * n);
    var x, y, j, s, q;
    for (y = 0; y < n; y++) {
      for (x = 0; x < n; x++) {
        s = 0;
        for (j = -r; j <= r; j++) {
          q = x + j;
          if (q >= 0 && q < n) s += kanal[y * n + q] * k[j + r];
        }
        hilf[y * n + x] = s;
      }
    }
    for (y = 0; y < n; y++) {
      for (x = 0; x < n; x++) {
        s = 0;
        for (j = -r; j <= r; j++) {
          q = y + j;
          if (q >= 0 && q < n) s += hilf[q * n + x] * k[j + r];
        }
        kanal[y * n + x] = s;
      }
    }
    return kanal;
  }

  // ---------- Sterne ----------

  // Wie hell ein Stern dem Auge erscheint: knapp über der Grenzgröße
  // schwach, mehrere Größenklassen darüber gleißend (empfundene, nicht
  // physikalische Helligkeit – das Auge rechnet logarithmisch)
  function sternWirkung(mag, grenz) {
    var abstand = grenz - mag;
    if (abstand <= 0) return 0;
    var v = Math.min(1, 0.12 + 0.88 * Math.pow(Math.min(1, abstand / 7), 1.2));
    return -Math.log(1 - Math.min(0.985, v));     // vor der Sättigung in Schritt 6
  }

  function stempel(kanaele, n, x, y, sigma, staerke, farbe) {
    var r = Math.ceil(sigma * 3.5);
    var x0 = Math.max(0, Math.floor(x - r));
    var x1 = Math.min(n - 1, Math.ceil(x + r));
    var y0 = Math.max(0, Math.floor(y - r));
    var y1 = Math.min(n - 1, Math.ceil(y + r));
    var zwei = 2 * sigma * sigma;
    for (var py = y0; py <= y1; py++) {
      for (var px = x0; px <= x1; px++) {
        var dx = px - x;
        var dy = py - y;
        var w = staerke * Math.exp(-(dx * dx + dy * dy) / zwei);
        var i = py * n + px;
        kanaele[0][i] += w * farbe[0];
        kanaele[1][i] += w * farbe[1];
        kanaele[2][i] += w * farbe[2];
      }
    }
  }

  // Beugungszacken: dünne Linien senkrecht zu den Streben der Spinne
  function zacken(kanaele, n, x, y, laenge, staerke, farbe, winkel) {
    for (var s = 0; s < 4; s++) {
      var w = winkel + s * Math.PI / 2;
      var dx = Math.cos(w);
      var dy = Math.sin(w);
      for (var t = 1; t < laenge; t += 0.5) {
        var px = Math.round(x + dx * t);
        var py = Math.round(y + dy * t);
        if (px < 0 || py < 0 || px >= n || py >= n) break;
        var v = staerke * Math.pow(1 - t / laenge, 2) * 0.5;
        var i = py * n + px;
        kanaele[0][i] += v * farbe[0];
        kanaele[1][i] += v * farbe[1];
        kanaele[2][i] += v * farbe[2];
      }
    }
  }

  // ---------- Bild ----------

  /*
    canvas: Ziel (quadratisch, N × N Gerätepixel)
    p = { objekt, D, f, okularMm, luftBs, fokusWinkel }
    lupe: true = nur die Bildmitte, so fein wie das Auge sieht
    Ergebnis: Kennzahlen des Bilds (für die Anzeige und Prüfungen)
  */
  function rendere(canvas, p, lupe) {
    var n = canvas.width;
    var m = O.Optik.masseNewton({ oeffnungMm: p.D, brennweiteMm: p.f });
    var ganzesFeldBs = O.Optik.wahresFeldGrad(m, p.okularMm) * 3600;
    var feldBs = lupe ? ganzesFeldBs * n / AUGE_PUNKTE_IM_FELD : ganzesFeldBs;
    var bsProPx = feldBs / n;
    var V = p.f / p.okularMm;
    var ap = p.D / V;
    var sigmaPx = O.Sehen.sigmaBs(p.D, p.luftBs) / bsProPx;
    var grenz = O.Sehen.grenzgroesse(p.D);
    // Empfundene Helligkeit wächst nur mit der Wurzel der Leuchtdichte
    // (Stevens-Gesetz) – und das Auge passt sich an. Halbe Austritts-
    // pupille heißt deshalb nicht „viermal so dunkel“, sondern etwa halb.
    var flaeche = Math.sqrt(O.Sehen.flaechenhelligkeit(ap) / O.Sehen.flaechenhelligkeit(AP_BEZUG_MM));

    // 2. Flächen zeichnen (auf einer eigenen Leinwand, dann linear lesen)
    var tmp = document.createElement('canvas');
    tmp.width = tmp.height = n;
    var c = tmp.getContext('2d');
    // Die Lupe zeigt die interessanteste Stelle (bei Epsilon Lyrae ein Paar)
    var mitte = lupe ? O.Objekte.lupenMitte(p.objekt) : { x: 0, y: 0 };
    c.translate(n / 2, n / 2);
    c.rotate(Math.PI);                         // Newton: Bild steht kopf
    c.scale(1 / bsProPx, 1 / bsProPx);
    c.translate(-mitte.x, -mitte.y);
    O.Objekte.ausgedehnt(c, p.objekt, grenz);
    var roh = c.getImageData(0, 0, n, n).data;

    var kanaele = [new Float32Array(n * n), new Float32Array(n * n), new Float32Array(n * n)];
    for (var i = 0; i < n * n; i++) {
      var a = roh[i * 4 + 3] / 255;
      kanaele[0][i] = zuLinear[roh[i * 4]] * a;
      kanaele[1][i] = zuLinear[roh[i * 4 + 1]] * a;
      kanaele[2][i] = zuLinear[roh[i * 4 + 2]] * a;
    }

    // 3. Unschärfe
    kanaele.forEach(function (k) { verwische(k, n, sigmaPx); });

    // 4. Flächenhelligkeit und Himmel
    var gewinn = flaeche * BELICHTUNG * (O.Objekte.hell[p.objekt.id] || 1);
    var himmel = HIMMEL * flaeche;
    var himmelFarbe = [0.55, 0.62, 0.85];
    for (var j = 0; j < n * n; j++) {
      kanaele[0][j] = kanaele[0][j] * gewinn + himmel * himmelFarbe[0];
      kanaele[1][j] = kanaele[1][j] * gewinn + himmel * himmelFarbe[1];
      kanaele[2][j] = kanaele[2][j] * gewinn + himmel * himmelFarbe[2];
    }

    // 5. Sterne
    var sichtbar = 0;
    var zackenWinkel = (p.fokusWinkel || 0) + Math.PI;
    O.Objekte.sterne(p.objekt).forEach(function (st) {
      var w = sternWirkung(st.mag, grenz);
      if (!w) return;
      sichtbar++;
      var x = n / 2 - (st.x - mitte.x) / bsProPx;     // um 180° gedreht
      var y = n / 2 - (st.y - mitte.y) / bsProPx;
      var helligkeit = grenz - st.mag;
      var sigma = Math.max(0.65, Math.min(SIGMA_MAX_PX, sigmaPx)) * (1 + 0.06 * Math.max(0, helligkeit - 5));
      stempel(kanaele, n, x, y, sigma, w, st.farbe);
      // nur sehr helle Sterne zeigen die Zacken deutlich
      if (helligkeit > 8.5) {
        zacken(kanaele, n, x, y, sigma * 3 * (helligkeit - 7.5), w * 0.14, st.farbe, zackenWinkel);
      }
    });

    // 6. Belichtung, Feldblende, ausgeben
    var ctx = canvas.getContext('2d');
    var bild = ctx.createImageData(n, n);
    var zentrum = n / 2;
    var rand = n / 2 - 1;
    for (var y = 0; y < n; y++) {
      for (var x = 0; x < n; x++) {
        var k = y * n + x;
        var o = k * 4;
        var dx = x + 0.5 - zentrum;
        var dy = y + 0.5 - zentrum;
        var r = Math.sqrt(dx * dx + dy * dy);
        if (r > rand) {
          bild.data[o + 3] = 255;
          continue;
        }
        var kante = Math.min(1, (rand - r) / 1.5);     // weiche, aber scharfe Feldblende
        for (var f = 0; f < 3; f++) {
          var v = 1 - Math.exp(-kanaele[f][k]);
          bild.data[o + f] = Math.round(Math.pow(v, 1 / 2.2) * 255 * kante);
        }
        bild.data[o + 3] = 255;
      }
    }
    ctx.putImageData(bild, 0, 0);

    return {
      vergroesserung: V,
      austrittspupille: ap,
      feldGrad: ganzesFeldBs / 3600,
      ausschnittGrad: feldBs / 3600,
      bsProPx: bsProPx,
      unschaerfeBs: O.Sehen.sigmaBs(p.D, p.luftBs) * 2.3548,
      grenzgroesse: grenz,
      sterneSichtbar: sichtbar,
      kanaele: kanaele,
      n: n
    };
  }

  O.Okularblick = {
    rendere: rendere,
    // Wie viel stärker die Lupe vergrößert als das ganze Bild (bei n Pixeln)
    lupenFaktor: function (n) { return AUGE_PUNKTE_IM_FELD / n; }
  };
})(globalThis.OPTIK = globalThis.OPTIK || {});
