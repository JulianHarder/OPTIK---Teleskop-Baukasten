/*
  Optik der Weltraumteleskope Hubble und Webb – wie physik/Historisch.js,
  nur mit zwei gewölbten Spiegeln hintereinander (Cassegrain-Bauart): Der
  große Hauptspiegel wirft das Licht auf einen kleinen, nach außen
  gewölbten Fangspiegel, der es durch ein Loch im Hauptspiegel zurück
  nach hinten schickt. Dort liegt der Brennpunkt, dort sitzen die Kameras.

  Hubble (Ritchey-Chrétien, zwei Hyperboloide), Maße nach dem Entwurf:
    Hauptspiegel R = 11 040 mm, k = −1,0022985, Ø 2 400 mm, Loch Ø 600 mm
    Fangspiegel  R = −1 358 mm, k = −1,496,    Ø 281 mm
    Abstand 4 906,07 mm (COMSOL; die Übersicht nennt 4 906,9 – damit
    landet der Brennpunkt 1,41 statt 1,50 m hinter dem Spiegel und
    schärft schlechter), Brennweite 57,6 m (f/24)
    So gebaut wurde der Hauptspiegel mit k ≈ −1,0144 – am Rand rund
    2 µm zu flach. Das ist der berühmte Fehler von 1990.
    (arxiv.org/pdf/1203.0002, COMSOL-Modell „Hubble Space Telescope“,
    en.wikipedia.org/wiki/Hubble_Space_Telescope)

  Webb, vereinfacht: Hauptspiegel R = 15 880 mm, k = −0,9967, Ø 6,5 m
  (NASA NTRS 20140008580), Fangspiegel Ø 0,74 m. Webb hat noch einen
  dritten Spiegel und einen Lenkspiegel; das Licht wird hier nur bis zum
  ersten Brennpunkt hinter dem Hauptspiegel verfolgt. ANNAHMEN: Abstand
  der Spiegel 7,16 m (die Streben sind etwa 7,6 m lang), Brennpunkt 0,8 m
  hinter dem Hauptspiegel; daraus folgen Radius und Form des Fangspiegels
  (die Form so gesucht, dass Rand- und Mittelstrahlen sich treffen).
*/
(function (O) {
  'use strict';

  var V = O.Vektor;
  var Z = { x: 0, y: 0, z: 1 };
  var X = { x: 1, y: 0, z: 0 };

  var HUBBLE = {
    D: 2400, R1: 11040, k1: -1.0022985, k1Fehler: -1.0144, loch: 300,
    R2: 1358, k2: -1.496, sekD: 281, abstand: 4906.071, f: 57600, fokusWinkel: Math.PI / 2
  };

  var WEBB = { D: 6500, R1: 15880, k1: -0.9967, loch: 660, sekD: 740, abstand: 7160, hinten: 800, fokusWinkel: Math.PI / 2 };
  (function () {
    // Fangspiegel so, dass das Bild des Hauptspiegels (bei f₁ = R₁/2)
    // 0,8 m hinter dem Hauptspiegel landet: Spiegelgleichung, und die
    // Hyperbel, die das ohne Fehler schafft (k₂ = −((m+1)/(m−1))²)
    var f1 = WEBB.R1 / 2;
    var s = f1 - WEBB.abstand;
    var s2 = WEBB.abstand + WEBB.hinten;
    var f2 = s * s2 / (s2 - s);
    var m = s2 / s;
    WEBB.R2 = 2 * f2;
    WEBB.k2 = -((m + 1) / (m - 1)) * ((m + 1) / (m - 1));
    WEBB.f = f1 * m;
  })();

  // Hauptspiegel bei z = 0 (hohl nach +z), Fangspiegel bei z = abstand,
  // nach außen gewölbt und zum Hauptspiegel gedreht (lokales z = −z)
  function spiegel(t, k1) {
    var F = O.Flaeche;
    var haupt = F.imRahmen(new O.Lage(V.v(0, 0, 0), X, V.v(0, 1, 0), Z),
      F.Kegelschnitt(1 / t.R1, k1, { r: t.D / 2, loch: t.loch }), 'hauptspiegel');
    var fang = F.imRahmen(new O.Lage(V.v(0, 0, t.abstand), X, V.v(0, -1, 0), V.v(0, 0, -1)),
      F.Kegelschnitt(-1 / t.R2, t.k2, { r: t.sekD / 2 }), 'fangspiegel');
    return [haupt, fang];
  }

  // Wo kreuzt ein achsnaher Strahl hinter beiden Spiegeln die Achse?
  function brennpunktZ(t, k1) {
    var el = spiegel(t, k1);
    var h = t.D * 0.2;
    var e = O.Strahlverfolger.verfolge({ p: V.v(0, h, t.abstand + 1000), d: V.v(0, 0, -1) }, el, { auslaufMm: 10 });
    var p = e.ende.p;
    var d = e.ende.d;
    return p.z + (-p.y / d.y) * d.z;
  }

  // Webbs Hauptspiegel ist keine ganz genaue Parabel (k = −0,9967) – die
  // Form des Fangspiegels, bei der sich Strahlen aus der Mitte und vom Rand
  // im selben Punkt treffen, wird gesucht (Intervallhalbierung)
  (function () {
    function kreuz(k2, h) {
      var t = Object.assign({}, WEBB, { k2: k2 });
      var el = spiegel(t, t.k1);
      var e = O.Strahlverfolger.verfolge({ p: V.v(0, h, t.abstand + 1000), d: V.v(0, 0, -1) }, el, { auslaufMm: 10 });
      return e.ende.p.z + (-e.ende.p.y / e.ende.d.y) * e.ende.d.z;
    }
    function fehler(k2) { return kreuz(k2, WEBB.D * 0.2) - kreuz(k2, WEBB.D * 0.47); }
    var a = -1.7;
    var b = -1.2;
    for (var i = 0; i < 40; i++) {
      var mitte = (a + b) / 2;
      if ((fehler(a) < 0) === (fehler(mitte) < 0)) a = mitte;
      else b = mitte;
    }
    WEBB.k2 = (a + b) / 2;
  })();

  HUBBLE.zFokus = brennpunktZ(HUBBLE, HUBBLE.k1);
  WEBB.zFokus = brennpunktZ(WEBB, WEBB.k1);

  // Licht verfolgen bis zum Brennpunkt. Eine Blende dort fängt auch die
  // Strahlen, die am Fangspiegel vorbei durchs Loch fallen.
  function licht(t, k1, zVorne) {
    var el = spiegel(t, k1);
    el.push(O.Flaeche.imRahmen(O.Lage.mitAchse(V.v(0, 0, t.zFokus), Z, X),
      O.Flaeche.Blende(t.D * 0.03, t.D * 0.5), 'feldblende'));
    var m = { D: t.D, zVorne: zVorne, fokusWinkel: t.fokusWinkel };
    var faecher = O.Optik.sternStrahlen(m, 0, 13, 4).faecher;
    var ring = O.Optik.sternStrahlen(m, 0, 2, 28).ring;
    function verfolge(s) {
      var p = O.Strahlverfolger.verfolge(s, el, { auslaufMm: 300 });
      p.farbe = null;
      return p;
    }
    var r = ring.map(verfolge);
    return { faecher: faecher.map(verfolge), ringe: [{ farbe: null, pfade: r }], imBild: 1 };
  }

  O.Weltraumoptik = {
    HUBBLE: HUBBLE,
    WEBB: WEBB,
    brennpunktZ: brennpunktZ,
    spiegel: spiegel,

    // fehler1990: Hubble mit dem Hauptspiegel, wie er 1990 war
    lichtHubble: function (zVorne, fehler1990) {
      var l = licht(HUBBLE, fehler1990 ? HUBBLE.k1Fehler : HUBBLE.k1, zVorne);
      l.dichte = 0.45;
      return l;
    },
    lichtWebb: function (zVorne) {
      var l = licht(WEBB, WEBB.k1, zVorne);
      l.dichte = 0.35;
      return l;
    },

    // Hubble hat kein Okular – das Bild ist das seiner Kamera: ein
    // Ausschnitt von 2,7′, scharf wie der Spiegel (keine Luft im All).
    // okularMm ist ein gedachtes Okular mit 3 mm Austrittspupille, damit
    // die Helligkeit wie bei einem gut belichteten Bild ist. Die vier
    // Streben des Fangspiegels machen die bekannten Zacken. 1990 lagen
    // nur etwa 15 % des Lichts im scharfen Kern (geplant: 70 % in 0,1″),
    // der Rest in einem Hof, etwa zehnmal so groß.
    // (physicstoday.aip.org/features/hubbles-blurry-years)
    okularHubble: function (fehler1990) {
      return {
        D: HUBBLE.D, f: HUBBLE.f, okularMm: HUBBLE.f / (HUBBLE.D / 3),
        // scheinbarGrad steuert die Lupe: 54 → 3 240 Bildpunkte übers Feld,
        // so viele trennt Hubble (162″ / 0,05″)
        feldGrad: 162 / 3600, scheinbarGrad: 54,
        farbFokus: null, sx: 1, sy: 1, zackenWinkel: Math.PI / 4,
        weltall: true, kamera: true,
        hof: fehler1990 ? { anteil: 0.85, fwhmBs: 1.5 } : null
      };
    }
  };
})(globalThis.OPTIK = globalThis.OPTIK || {});
