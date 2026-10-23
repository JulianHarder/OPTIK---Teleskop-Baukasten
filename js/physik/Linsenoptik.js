/*
  Das Linsenfernrohr (Refraktor): Objektiv, Zenitspiegel, Okular.

  Koordinaten wie beim Newton (Tubus-System): z = optische Achse, das
  Licht kommt von +z und läuft nach −z. Der Zenitspiegel sitzt bei z = 0
  und lenkt das Licht nach +y (fokusWinkel = 90°) zum Okular hinauf.

  Objektiv – zwei Möglichkeiten:
    einzel   eine bikonvexe Linse aus Kronglas. Blau wird stärker
             gebrochen als Rot, die Farben landen in verschiedenen
             Brennpunkten: Farbsäume.
    achromat Sammellinse aus Kronglas, dahinter eine schwache
             Zerstreuungslinse aus Flintglas, verkittet. Die Brechkräfte
             sind so verteilt, dass Rot und Blau im selben Punkt landen:
                 φ₁ = φ·V₁/(V₁ − V₂)      φ₂ = −φ·V₂/(V₁ − V₂)
             (V = Abbe-Zahl). Gelbgrün liegt knapp daneben – das
             „sekundäre Spektrum“, das bleibt.

  Radien nach Optiker-Art: R > 0, wenn der Krümmungsmittelpunkt in
  Lichtrichtung (−z) liegt. Im lokalen Flächensystem (hohl nach +z für
  c > 0) heißt das c = −1/R.
*/
(function (O) {
  'use strict';

  var V = O.Vektor;
  var L = null;                     // Fraunhofer-Linien, beim ersten Aufruf
  var FALTUNG_MM = 70;              // Zenitspiegel → Brennpunkt
  var Z = { x: 0, y: 0, z: 1 };
  var NACH_OBEN = { x: 0, y: 1, z: 0 };

  // Anzeigefarben der drei Linien (r, g, b)
  var FARBEN = { F: [0.35, 0.55, 1.0], d: [1.0, 0.85, 0.45], C: [1.0, 0.32, 0.25] };

  // Flächen des Objektivs mit Scheitel bei z = 0, in Lichtrichtung
  function objektivFlaechen(D, f, art) {
    var n = function (glas) { return O.Glas.brechzahl(glas, L.d); };
    var flaechen = [];
    if (art === 'einzel') {
      // bikonvex, dünne Linse: 1/f = (n − 1)·2/R
      var R = 2 * (n('BK7') - 1) * f;
      var t = Math.max(4, D * 0.1);
      flaechen.push({ z: 0, R: R, plus: null, minus: 'BK7' });
      flaechen.push({ z: -t, R: -R, plus: 'BK7', minus: null });
      return { flaechen: flaechen, dicke: t, linsen: [{ glas: 'BK7', R1: R, R2: -R, t: t }] };
    }
    var V1 = O.Glas.abbe('BK7');
    var V2 = O.Glas.abbe('F2');
    var phi = 1 / f;
    var phi1 = phi * V1 / (V1 - V2);
    var phi2 = -phi * V2 / (V1 - V2);
    var R1 = 2 * (n('BK7') - 1) / phi1;           // Krone bikonvex
    var R2 = -R1;                                  // Kittfläche
    var R3 = 1 / (1 / R2 - phi2 / (n('F2') - 1)); // Rückseite der Flintlinse
    var t1 = Math.max(4, D * 0.1);
    var t2 = Math.max(3, D * 0.05);
    flaechen.push({ z: 0, R: R1, plus: null, minus: 'BK7' });
    flaechen.push({ z: -t1, R: R2, plus: 'BK7', minus: 'F2' });
    flaechen.push({ z: -t1 - t2, R: R3, plus: 'F2', minus: null });
    return {
      flaechen: flaechen,
      dicke: t1 + t2,
      linsen: [{ glas: 'BK7', R1: R1, R2: R2, t: t1 }, { glas: 'F2', R1: R2, R2: R3, t: t2 }]
    };
  }

  function flaecheZuElement(fl, verschiebung, rand) {
    var F = O.Flaeche;
    return F.imRahmen(
      new O.Lage(V.v(0, 0, fl.z + verschiebung), V.v(1, 0, 0), V.v(0, 1, 0), V.v(0, 0, 1)),
      F.Brechend(-1 / fl.R, 0, { r: rand }, O.Glas.funktion(fl.plus), O.Glas.funktion(fl.minus)),
      'objektiv'
    );
  }

  // Wo kreuzt ein achsnaher Strahl der Farbe λ hinter dem Objektiv die
  // Achse? (z, ohne Zenitspiegel, Objektiv-Scheitel bei z = 0)
  function achsenKreuzung(obj, D, lambda) {
    var el = obj.flaechen.map(function (fl) { return flaecheZuElement(fl, 0, D); });
    var h = D * 0.01;
    var e = O.Strahlverfolger.verfolge({ p: V.v(0, h, 100), d: V.v(0, 0, -1), lambda: lambda }, el, { auslaufMm: 10 });
    var p = e.ende.p;
    var d = e.ende.d;
    return p.z + (-p.y / d.y) * d.z;
  }

  function masseRefraktor(zustand) {
    L = O.Glas.LINIEN;
    var D = zustand.oeffnungMm;
    var f = zustand.brennweiteMm;
    var art = zustand.objektiv || 'achromat';
    var obj = objektivFlaechen(D, f, art);

    // Objektiv so legen, dass der gelbe Brennpunkt nach der Faltung am
    // Zenitspiegel (z = 0) genau FALTUNG_MM über der Achse liegt
    var zKreuzD = achsenKreuzung(obj, D, L.d);
    var zObjektiv = -FALTUNG_MM - zKreuzD;
    var farbFokus = {
      F: achsenKreuzung(obj, D, L.F) - zKreuzD,
      d: 0,
      C: achsenKreuzung(obj, D, L.C) - zKreuzD
    };

    var rInnen = D / 2 + 0.08 * D + 4;
    var rAussen = rInnen + 1.5;
    var zRohrHinten = 150;
    var zVorneRohr = zObjektiv + 15;
    var zVorne = zVorneRohr + 1.4 * D;              // Taukappe
    var zHinten = -35;                              // Rückseite Zenitspiegel

    return {
      bauart: 'refraktor',
      objektiv: art,
      D: D,
      f: f,
      rInnen: rInnen,
      rAussen: rAussen,
      objektivFlaechen: obj,
      zObjektiv: zObjektiv,
      zRohrHinten: zRohrHinten,
      zVorneRohr: zVorneRohr,
      zVorne: zVorne,
      zHinten: zHinten,
      laenge: zVorne - zHinten,
      zBalance: zObjektiv * 0.45,
      seitlich: FALTUNG_MM,
      zFang: 0,
      fang: 0,                                      // keine Abschattung
      fangNoetig: 0,
      fokusWinkel: Math.PI / 2,
      farbFokus: farbFokus,
      brennpunktZ: zObjektiv + zKreuzD               // ohne Faltung, für das Licht im Bild
    };
  }

  function elementeRefraktor(m, zustand) {
    var F = O.Flaeche;
    var fOk = zustand.okularMm;
    var el = m.objektivFlaechen.flaechen.map(function (fl) {
      return flaecheZuElement(fl, m.zObjektiv, m.D / 2);
    });

    // Zenitspiegel unter 45°: Normale zeigt zum Objektiv (+z) und nach oben
    var n = V.norm(V.v(0, 1, 1));
    el.push(F.imRahmen(O.Lage.mitAchse(V.v(0, 0, 0), n, V.v(1, 0, 0)),
      F.Kegelschnitt(0, 0, { a: 18, b: 18 * Math.SQRT2 }), 'zenitspiegel'));

    var fokus = V.v(0, FALTUNG_MM, 0);
    el.push(F.imRahmen(O.Lage.mitAchse(fokus, NACH_OBEN, Z),
      F.Blende(O.Optik.feldblendeMm(fOk) / 2, 30), 'feldblende'));
    el.push(F.imRahmen(O.Lage.mitAchse(V.plus(fokus, V.mal(NACH_OBEN, fOk)), NACH_OBEN, Z),
      O.IdealeLinse({ posMm: 0, fMm: fOk, durchmesserMm: 2 * fOk * 1.4 + 10 }), 'okular'));
    return el;
  }

  // Sternlicht in drei Farben – beim Achromat liegen sie fast aufeinander,
  // bei der Einzellinse sieht man die Brennpunkte auseinanderfallen
  function lichtRefraktor(m, zustand, feldGrad) {
    L = O.Glas.LINIEN;
    var elemente = elementeRefraktor(m, zustand);
    var grenzen = { auslaufMm: zustand.okularMm + 70 };
    var start = O.Optik.sternStrahlen(m, feldGrad, 11, 28);
    var faecher = [];
    var ringe = [];
    var gefangen = 0;
    var durch = 0;

    ['C', 'd', 'F'].forEach(function (linie) {
      function verfolge(s) {
        var p = O.Strahlverfolger.verfolge({ p: s.p, d: s.d, lambda: L[linie] }, elemente, grenzen);
        p.farbe = FARBEN[linie];
        p.linie = linie;
        return p;
      }
      var fa = start.faecher.map(verfolge);
      var ri = start.ring.map(verfolge);
      faecher = faecher.concat(fa);
      ringe.push({ farbe: FARBEN[linie], pfade: ri });
      if (linie === 'd') {
        fa.concat(ri).forEach(function (p) {
          if (p.getroffen.indexOf('objektiv') < 0) return;
          gefangen++;
          if (p.getroffen.indexOf('okular') >= 0) durch++;
        });
      }
    });
    return { faecher: faecher, ringe: ringe, imBild: gefangen ? durch / gefangen : 0 };
  }

  // Farbfehler: wie weit Rot und Blau vom gelben Brennpunkt fallen, und
  // wie groß der Farbsaum am Himmel ist (Durchmesser des unscharfen
  // Scheibchens in ″: D·Δz / f²)
  function farbfehler(m) {
    if (!m.farbFokus) return { abstandMm: 0, saumBs: 0 };
    var dz = Math.max(Math.abs(m.farbFokus.F), Math.abs(m.farbFokus.C));
    return {
      abstandMm: Math.abs(m.farbFokus.F - m.farbFokus.C),
      saumBs: m.D * dz / (m.f * m.f) * 206264.8
    };
  }

  // Für die berühmten Linsenfernrohre (physik/Historisch.js): Objektiv-
  // flächen und wo jede Farbe die Achse kreuzt (Scheitel bei z = 0).
  // obj = { flaechen: [{ z, R, plus, minus }] } – flache Seite: R = Infinity
  function achromat(D, f) {
    L = O.Glas.LINIEN;
    return objektivFlaechen(D, f, 'achromat');
  }

  function kreuzungen(obj, D) {
    L = O.Glas.LINIEN;
    return { C: achsenKreuzung(obj, D, L.C), d: achsenKreuzung(obj, D, L.d), F: achsenKreuzung(obj, D, L.F) };
  }

  O.Linsenoptik = {
    FARBEN: FARBEN,
    FALTUNG_MM: FALTUNG_MM,
    achromat: achromat,
    kreuzungen: kreuzungen,
    flaecheZuElement: flaecheZuElement,
    masseRefraktor: masseRefraktor,
    elementeRefraktor: elementeRefraktor,
    lichtRefraktor: lichtRefraktor,
    farbfehler: farbfehler
  };
})(globalThis.OPTIK = globalThis.OPTIK || {});
