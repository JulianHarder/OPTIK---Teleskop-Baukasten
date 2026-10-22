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
    var k = kern(Math.min(sigma, SIGMA_MAX_PX * 3));
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

  // Farbfehler (Refraktor): Rot und Blau haben ihren Brennpunkt vor bzw.
  // hinter dem gelben, auf den scharf gestellt ist. Im Okular werden sie
  // zu Scheibchen mit Durchmesser D·Δz/f² (Δz an den Linien C und F).
  // Die Bildschirmkanäle R und B enthalten aber auch Licht nahe am Gelb,
  // und für tiefes Rot und Blau ist das Auge wenig empfindlich: Nur ein
  // Teil (HOF_ANTEIL) wird zum Farbhof, der Rest bleibt scharf. So
  // bleibt ein Sternkern weiß, nur der Rand wird violett.
  var FARBKANAL_ANTEIL = 0.8;
  var HOF_ANTEIL = 0.5;

  function farbUnschaerfeBs(m) {
    if (!m.farbFokus) return [0, 0, 0];
    var faktor = FARBKANAL_ANTEIL * m.D / (m.f * m.f) * 206264.8 / 4;    // Scheibe → σ
    return [Math.abs(m.farbFokus.C) * faktor, 0, Math.abs(m.farbFokus.F) * faktor];
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

  // Ein Stern als Gaußfleck in einem Farbkanal
  function stempelKanal(kanal, n, x, y, sigma, staerke) {
    if (!staerke) return;
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
        kanal[py * n + px] += staerke * Math.exp(-(dx * dx + dy * dy) / zwei);
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
    p = { objekt, D, f, okularMm, luftBs, bauart, objektiv }
    lupe: true = nur die Bildmitte, so fein wie das Auge sieht
    Ergebnis: Kennzahlen des Bilds (für die Anzeige und Prüfungen)
  */
  function rendere(canvas, p, lupe) {
    var n = canvas.width;
    var m = O.Optik.masse({ oeffnungMm: p.D, brennweiteMm: p.f, bauart: p.bauart, objektiv: p.objektiv });
    var refraktor = m.bauart === 'refraktor';
    var ganzesFeldBs = O.Optik.wahresFeldGrad(m, p.okularMm) * 3600;
    var feldBs = lupe ? ganzesFeldBs * n / AUGE_PUNKTE_IM_FELD : ganzesFeldBs;
    var bsProPx = feldBs / n;
    var V = p.f / p.okularMm;
    var ap = p.D / V;
    var sigmaBs = O.Sehen.sigmaBs(p.D, p.luftBs);
    var farbe = farbUnschaerfeBs(m);
    var sigmaPx = farbe.map(function (s) { return Math.sqrt(sigmaBs * sigmaBs + s * s) / bsProPx; });
    // Bildlage: Newton dreht um 180°, Linse + Zenitspiegel spiegelt seitenverkehrt
    var sx = -1;
    var sy = refraktor ? 1 : -1;
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
    c.scale(sx / bsProPx, sy / bsProPx);
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

    // 3. Unschärfe; beim Farbfehler ein scharfer Teil und ein Farbhof
    var sigmaScharf = sigmaBs / bsProPx;
    kanaele = kanaele.map(function (k, f) {
      if (sigmaPx[f] - sigmaScharf < 0.3) return verwische(k, n, sigmaScharf);
      var hof = verwische(new Float32Array(k), n, sigmaPx[f]);
      var scharf = verwische(k, n, sigmaScharf);
      for (var i = 0; i < n * n; i++) scharf[i] = scharf[i] * (1 - HOF_ANTEIL) + hof[i] * HOF_ANTEIL;
      return scharf;
    });

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
    var zackenWinkel = m.fokusWinkel + Math.PI;
    O.Objekte.sterne(p.objekt).forEach(function (st) {
      var w = sternWirkung(st.mag, grenz);
      if (!w) return;
      sichtbar++;
      var x = n / 2 + sx * (st.x - mitte.x) / bsProPx;
      var y = n / 2 + sy * (st.y - mitte.y) / bsProPx;
      var helligkeit = grenz - st.mag;
      var wachsen = 1 + 0.06 * Math.max(0, helligkeit - 5);
      var sigma = sigmaPx.map(function (s) {
        return Math.max(0.65, Math.min(SIGMA_MAX_PX * 3, s)) * wachsen;
      });
      // Farbfehler: ein Teil bleibt im scharfen Kern, der Rest wird zum Hof
      // (gleiche Lichtmenge auf mehr Fläche, also entsprechend dunkler)
      for (var f = 0; f < 3; f++) {
        var hofAnteil = sigma[f] > sigma[1] * 1.2 ? HOF_ANTEIL : 0;
        stempelKanal(kanaele[f], n, x, y, sigma[1], w * (1 - hofAnteil) * st.farbe[f]);
        if (hofAnteil) {
          stempelKanal(kanaele[f], n, x, y, sigma[f], w * hofAnteil * Math.pow(sigma[1] / sigma[f], 2) * st.farbe[f]);
        }
      }
      // nur sehr helle Sterne zeigen die Zacken der Spinne (nur Newton)
      if (!refraktor && helligkeit > 8.5) {
        zacken(kanaele, n, x, y, sigma[1] * 3 * (helligkeit - 7.5), w * 0.14, st.farbe, zackenWinkel);
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
      unschaerfeBs: sigmaBs * 2.3548,
      farbsaumBs: farbe.map(function (s) { return s * 4; }),
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
