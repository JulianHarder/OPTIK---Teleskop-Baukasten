/*
  Optik der berühmten Teleskope: Maße und Sternlicht für Galileis
  Fernrohr, Newtons erstes Spiegelteleskop und den Yerkes-Refraktor.
  Zahlen und Quellen: js/daten/teleskope.js.

  Wie überall: Tubus-System, z = optische Achse, alle Längen in mm. Die
  Modelle (modell/Galilei.js, Newton1668.js, Yerkes.js) holen ihre Maße
  von hier – so passen Licht und Modell zusammen.

  Ergebnis von licht(): wie Optik.licht – { faecher, ringe: [{farbe,
  pfade}], imBild }. Das Licht kommt immer genau aus Blickrichtung.
*/
(function (O) {
  'use strict';

  var V = O.Vektor;
  var Z = { x: 0, y: 0, z: 1 };
  var X = { x: 1, y: 0, z: 0 };
  var OBEN = { x: 0, y: 1, z: 0 };

  function linse(ort, fMm, durchmesser, name) {
    return O.Flaeche.imRahmen(O.Lage.mitAchse(ort, Z, X),
      O.IdealeLinse({ posMm: 0, fMm: fMm, durchmesserMm: durchmesser }), name);
  }

  // Strahlen in drei Farben (Linsen) oder einer (Spiegel) verfolgen.
  // m = { D, zVorne, fokusWinkel } für den Fächer, ringD = Durchmesser des
  // Strahlenrings (der Lichtkegel)
  function verfolgeAlle(elemente, m, ringD, farbig, auslaufMm) {
    var L = O.Glas.LINIEN;
    var faecherStart = O.Optik.sternStrahlen(m, 0, 13, 4).faecher;
    var ringStart = O.Optik.sternStrahlen(Object.assign({}, m, { D: ringD }), 0, 2, 28).ring;
    var linien = farbig ? ['C', 'd', 'F'] : [null];
    var faecher = [];
    var ringe = [];
    linien.forEach(function (linie) {
      var farbe = linie ? O.Linsenoptik.FARBEN[linie] : null;
      function verfolge(s) {
        var p = O.Strahlverfolger.verfolge({ p: s.p, d: s.d, lambda: linie ? L[linie] : L.d }, elemente, { auslaufMm: auslaufMm });
        p.farbe = farbe;
        p.linie = linie || undefined;
        return p;
      }
      faecher = faecher.concat(faecherStart.map(verfolge));
      ringe.push({ farbe: farbe, pfade: ringStart.map(verfolge) });
    });
    return { faecher: faecher, ringe: ringe, imBild: 1 };
  }

  // ---------- Galilei ----------

  // Eine Sammellinse, vorne gewölbt, hinten flach (Kronglas als Ersatz für
  // Galileis venezianisches Glas), dahinter eine 15-mm-Blende; vorne eine
  // Zerstreuungslinse, die das Licht wieder parallel macht. Der Brennpunkt
  // des Objektivs liegt 47,5 mm hinter dem Okular – noch hinter dem Auge.
  var galileiCache = null;
  function galilei() {
    if (galileiCache) return galileiCache;
    var g = {
      D: 37, blende: 15, f: 980, fOkular: -47.5, okularD: 22,
      zOkular: 10, dicke: 2.5, fokusWinkel: Math.PI / 2
    };
    var n = O.Glas.brechzahl('BK7', O.Glas.LINIEN.d);
    g.R = g.f * (n - 1);                                   // plankonvex: 1/f = (n − 1)/R
    g.flaechen = [
      { z: g.dicke, R: g.R, plus: null, minus: 'BK7' },
      { z: 0, R: Infinity, plus: 'BK7', minus: null }
    ];
    var kreuz = O.Linsenoptik.kreuzungen({ flaechen: g.flaechen }, g.D);
    // flache Seite so legen, dass der gelbe Brennpunkt |f_Okular| hinter dem Okular liegt
    g.zObjektiv = g.zOkular + g.fOkular - kreuz.d;
    g.zBlende = g.zObjektiv - 1.5;
    galileiCache = g;
    return g;
  }

  function lichtGalilei(zVorne) {
    var g = galilei();
    var el = g.flaechen.map(function (fl) {
      return O.Linsenoptik.flaecheZuElement(fl, g.zObjektiv, g.D / 2);
    });
    el.push(O.Flaeche.imRahmen(O.Lage.mitAchse(V.v(0, 0, g.zBlende), Z, X), O.Flaeche.Blende(g.blende / 2, 26), 'blende'));
    el.push(linse(V.v(0, 0, g.zOkular), g.fOkular, g.okularD, 'okular'));
    var m = { D: g.D, zVorne: zVorne, fokusWinkel: g.fokusWinkel };
    return verfolgeAlle(el, m, g.blende, true, 260);
  }

  // ---------- Newton 1668 ----------

  // Kugelspiegel (Scheitelkrümmung wie eine Parabel gleicher Brennweite),
  // flacher Fangspiegel unter 45°, Okular nach +y
  var NEWTON = { D: 33, f: 158, fOkular: 4.5, rAussen: 28.5, fokusWinkel: Math.PI / 2 };
  NEWTON.seitlich = NEWTON.rAussen + 10;
  NEWTON.zFang = NEWTON.f - NEWTON.seitlich;
  NEWTON.fang = NEWTON.D * NEWTON.seitlich / NEWTON.f + 2;     // Lichtkegel + Rand

  function lichtNewton(zVorne) {
    var n = NEWTON;
    var F = O.Flaeche;
    var haupt = F.imRahmen(new O.Lage(V.v(0, 0, 0), X, OBEN, Z),
      F.Kegelschnitt(1 / (2 * n.f), 0, { r: n.D / 2 }), 'hauptspiegel');
    var normale = V.norm(V.minus(OBEN, Z));
    var lang = V.norm(V.plus(OBEN, Z));
    var fang = F.imRahmen(new O.Lage(V.v(0, 0, n.zFang), V.kreuz(lang, normale), lang, normale),
      F.Kegelschnitt(0, 0, { a: n.fang / 2, b: n.fang / 2 * Math.SQRT2 }), 'fangspiegel');
    var fokus = V.v(0, n.seitlich, n.zFang);
    // Keine Feldblende wie heute – die Fassung der kleinen Okularlinse begrenzt
    var blende = F.imRahmen(O.Lage.mitAchse(fokus, OBEN, Z), F.Blende(3, 8), 'feldblende');
    var okular = F.imRahmen(O.Lage.mitAchse(V.plus(fokus, V.mal(OBEN, n.fOkular)), OBEN, Z),
      O.IdealeLinse({ posMm: 0, fMm: n.fOkular, durchmesserMm: 6 }), 'okular');
    var m = { D: n.D, zVorne: zVorne, fokusWinkel: n.fokusWinkel };
    return verfolgeAlle([haupt, fang, blende, okular], m, n.D, false, 40);
  }

  // ---------- Yerkes ----------

  // Achromat 102 cm, f = 19,3 m, aus derselben Formel wie im eigenen
  // Linsenfernrohr. Der gelbe Brennpunkt liegt im Okularende bei z = zFokus;
  // daraus folgt, wo das Objektiv im Rohr sitzt.
  var yerkesCache = null;
  function yerkes() {
    if (yerkesCache) return yerkesCache;
    var y = { D: 1020, f: 19300, fOkular: 40, zFokus: -620, fokusWinkel: Math.PI / 2 };
    y.objektiv = O.Linsenoptik.achromat(y.D, y.f);
    y.kreuz = O.Linsenoptik.kreuzungen(y.objektiv, y.D);
    y.zObjektiv = y.zFokus - y.kreuz.d;
    yerkesCache = y;
    return y;
  }

  function lichtYerkes(zVorne) {
    var y = yerkes();
    var el = y.objektiv.flaechen.map(function (fl) {
      return O.Linsenoptik.flaecheZuElement(fl, y.zObjektiv, y.D / 2);
    });
    var fokus = V.v(0, 0, y.zFokus);
    el.push(O.Flaeche.imRahmen(O.Lage.mitAchse(fokus, Z, X),
      O.Flaeche.Blende(O.Optik.feldblendeMm(y.fOkular) / 2, 90), 'feldblende'));
    el.push(linse(V.v(0, 0, y.zFokus - y.fOkular), y.fOkular, 2 * y.fOkular * 1.4 + 10, 'okular'));
    var m = { D: y.D, zVorne: zVorne, fokusWinkel: y.fokusWinkel };
    var licht = verfolgeAlle(el, m, y.D, true, 400);
    licht.dichte = 0.2;           // 19 m langes, dichtes Bündel – sonst nur noch weiß
    return licht;
  }

  // ---------- Blick durchs Okular ----------

  /*
    Was der Okular-Blick (okular/Okularblick.js) über jedes Teleskop wissen
    muss – dieselbe Form, die er sonst aus dem eigenen Teleskop rechnet:
      D, f, okularMm   wirksame Öffnung, Brennweite, Okular (Betrag)
      scheinbarGrad    scheinbares Feld des Okulars
      feldGrad         wahres Feld am Himmel
      farbFokus        { C, F }: Abstand der Farbbrennpunkte vom gelben, mm
      sx, sy           Bildlage: 1, 1 = aufrecht; −1, −1 = auf dem Kopf
      zackenWinkel     Beugungszacken einer Fangspiegelspinne, oder null
  */
  function farbFokus(kreuz) {
    return { C: kreuz.C - kreuz.d, F: kreuz.F - kreuz.d };
  }

  function okular(id) {
    if (id === 'hubble') return O.Weltraumoptik.okularHubble(false);
    if (id === 'webb') return null;                 // kein Okular, und Infrarot
    if (id === 'galilei') {
      // Feld 15′ laut Museo Galileo; die Zerstreuungslinse lässt das Bild
      // aufrecht. Farbsaum aus der Strahlverfolgung durch die Einzellinse,
      // wirksam ist nur die 15-mm-Mitte.
      var g = galilei();
      var V = g.f / -g.fOkular;
      return {
        D: g.blende, f: g.f, okularMm: -g.fOkular,
        feldGrad: 0.25, scheinbarGrad: 0.25 * V,
        farbFokus: farbFokus(O.Linsenoptik.kreuzungen({ flaechen: g.flaechen }, g.D)),
        sx: 1, sy: 1, zackenWinkel: null
      };
    }
    if (id === 'newton') {
      // Newtons Okular: eine kleine Linse ohne Feldblende. Ein Gesichtsfeld
      // ist nicht überliefert – angenommen sind 30° scheinbar (ANNAHME).
      // Spiegel: kein Farbsaum. Der Fangspiegel hängt an einem Arm, nicht
      // an einer Spinne – keine Zacken.
      var n = NEWTON;
      return {
        D: n.D, f: n.f, okularMm: n.fOkular,
        feldGrad: 30 / (n.f / n.fOkular), scheinbarGrad: 30,
        farbFokus: null, sx: -1, sy: -1, zackenWinkel: null
      };
    }
    // Yerkes: gerader Durchblick ohne Zenitspiegel, also auf dem Kopf.
    // Okular wie ein heutiges 40-mm-Plössl (52°) – ANNAHME.
    var y = yerkes();
    var Vy = y.f / y.fOkular;
    return {
      D: y.D, f: y.f, okularMm: y.fOkular,
      feldGrad: O.Optik.SCHEINBARES_FELD_GRAD / Vy, scheinbarGrad: O.Optik.SCHEINBARES_FELD_GRAD,
      farbFokus: farbFokus(y.kreuz), sx: -1, sy: -1, zackenWinkel: null
    };
  }

  O.Historisch = {
    okular: okular,
    galilei: galilei,
    NEWTON: NEWTON,
    yerkes: yerkes,
    lichtGalilei: lichtGalilei,
    lichtNewton: lichtNewton,
    lichtYerkes: lichtYerkes
  };
})(globalThis.OPTIK = globalThis.OPTIK || {});
