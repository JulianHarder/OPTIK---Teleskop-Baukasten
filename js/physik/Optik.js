/*
  Maße eines Newton-Teleskops aus Öffnung und Brennweite.

  Die Maße kommen aus der Optik, nicht aus dem Gefühl: Der Fangspiegel
  sitzt genau dort, wo das Licht ihn treffen muss, damit der Brennpunkt
  oben im Okularauszug liegt, und er ist genau so groß, dass er den
  Lichtkegel nicht anschneidet.

  Koordinaten im Tubus (überall im Projekt gleich):
    z = optische Achse, Scheitel des Hauptspiegels bei z = 0,
        die Öffnung des Tubus liegt bei +z (dort kommt das Sternlicht herein)
    x, y = quer dazu. Der Okularauszug zeigt in Richtung fokusWinkel
        (gemessen von +x nach +y).
  Alle Längen in mm.
*/
(function (O) {
  'use strict';

  // Handelsübliche Fangspiegel (kleine Achse in mm)
  var FANGSPIEGEL_MM = [25, 30, 35, 40, 50, 63, 70, 82, 100, 127, 152];

  var FELD_RESERVE = 1.25;    // Fangspiegel größer als nötig, damit auch der Bildrand voll beleuchtet ist

  function masseNewton(zustand) {
    var D = zustand.oeffnungMm;
    var f = zustand.brennweiteMm;

    var rInnen = D / 2 + 0.06 * D + 5;          // Luft zwischen Spiegel und Tubuswand
    var rAussen = rInnen + 2;                   // 2 mm Blech
    var spiegelDicke = Math.max(10, D / 8);

    // Brennpunkt liegt seitlich außen, oben im Okularauszug. Kleine
    // Teleskope haben flachere Auszüge (bei 200 mm Öffnung: 75 mm) –
    // je höher der Auszug, desto größer muss der Fangspiegel werden.
    var auszugHoehe = 45 + 0.15 * D;
    var seitlich = rAussen + auszugHoehe;       // Abstand Achse → Brennpunkt
    var zFang = f - seitlich;                   // Mitte des Fangspiegels auf der Achse

    // Der Lichtkegel ist am Fangspiegel noch D · seitlich / f breit
    var fangNoetig = D * seitlich / f;
    var fang = FANGSPIEGEL_MM.find(function (m) {
      return m >= fangNoetig * FELD_RESERVE;
    }) || FANGSPIEGEL_MM[FANGSPIEGEL_MM.length - 1];

    var zHinten = -(spiegelDicke + 35);          // Spiegelzelle hinter dem Spiegel
    var zVorne = zFang + Math.max(100, 0.6 * D); // Tubus reicht übers Fangspiegel hinaus (Streulicht)
    var laenge = zVorne - zHinten;

    return {
      bauart: 'dobson',
      D: D,
      f: f,
      rInnen: rInnen,
      rAussen: rAussen,
      spiegelDicke: spiegelDicke,
      sag: function (r) { return r * r / (4 * f); },   // Parabel: Tiefe bei Radius r
      seitlich: seitlich,
      auszugHoehe: auszugHoehe,
      zFang: zFang,
      fangNoetig: fangNoetig,
      fang: fang,
      zHinten: zHinten,
      zVorne: zVorne,
      laenge: laenge,
      zBalance: zHinten + 0.42 * laenge,          // Schwerpunkt, hier liegen die Höhenräder
      fokusWinkel: Math.PI / 4                     // Okularauszug schräg nach oben zur Seite
    };
  }

  // ---------- Das optische System ----------

  var V = O.Vektor;
  var SCHEINBARES_FELD_GRAD = 52;   // typisches Plössl-Okular
  var Z = { x: 0, y: 0, z: 1 };

  // Richtung zum Okularauszug, quer zur Achse
  function zumAuszug(m) {
    return V.v(Math.cos(m.fokusWinkel), Math.sin(m.fokusWinkel), 0);
  }

  // Brennpunkt: seitlich außen, oben im Okularauszug
  function brennpunkt(m) {
    return V.plus(V.mal(zumAuszug(m), m.seitlich), V.v(0, 0, m.zFang));
  }

  // Feldblende des Okulars: so groß, dass das scheinbare Feld (52°) voll ist
  function feldblendeMm(okularMm) {
    return 2 * okularMm * Math.tan(SCHEINBARES_FELD_GRAD / 2 * Math.PI / 180);
  }

  // Alle Elemente im Tubus-Koordinatensystem, in Lichtrichtung:
  // Hauptspiegel (Parabel), Fangspiegel (Ebene unter 45°), Feldblende im
  // Brennpunkt, Okular (ideale Linse eine Okularbrennweite dahinter).
  function elementeNewton(m, zustand) {
    var F = O.Flaeche;
    var u = zumAuszug(m);
    var fOk = zustand.okularMm;

    var haupt = F.imRahmen(
      new O.Lage(V.v(0, 0, 0), V.v(1, 0, 0), V.v(0, 1, 0), V.v(0, 0, 1)),
      F.Kegelschnitt(1 / (2 * m.f), -1, { r: m.D / 2 }),
      'hauptspiegel'
    );

    // Fangspiegel: Normale zeigt zum Hauptspiegel und zum Auszug, die
    // lange Achse der Ellipse liegt in der Ebene aus Achse und Auszug
    var n = V.norm(V.minus(u, Z));
    var lang = V.norm(V.plus(u, Z));
    var fang = F.imRahmen(
      new O.Lage(V.v(0, 0, m.zFang), V.kreuz(lang, n), lang, n),
      F.Kegelschnitt(0, 0, { a: m.fang / 2, b: m.fang / 2 * Math.SQRT2 }),
      'fangspiegel'
    );

    var fokus = brennpunkt(m);
    var blende = F.imRahmen(
      O.Lage.mitAchse(fokus, u, Z),
      F.Blende(feldblendeMm(fOk) / 2, 40),
      'feldblende'
    );

    var okular = F.imRahmen(
      O.Lage.mitAchse(V.plus(fokus, V.mal(u, fOk)), u, Z),
      O.IdealeLinse({ posMm: 0, fMm: fOk, durchmesserMm: 2 * fOk * 1.4 + 10 }),
      'okular'
    );

    return [haupt, fang, blende, okular];
  }

  // Sternlicht: Strahlen, die parallel von einem Stern kommen.
  // feldGrad = wie weit der Stern neben der Blickrichtung steht (Richtung:
  // zum Okularauszug hin, damit man das Wandern des Brennpunkts sieht).
  //   faecher: in der Ebene aus Achse und Auszug, quer über den Spiegel
  //   ring:    auf einem Kreis nahe am Spiegelrand (für den Lichtkegel)
  function sternStrahlen(m, feldGrad, anzahlFaecher, anzahlRing) {
    var u = zumAuszug(m);
    var w = feldGrad * Math.PI / 180;
    var zumStern = V.plus(V.mal(Z, Math.cos(w)), V.mal(u, Math.sin(w)));
    var d = V.mal(zumStern, -1);
    var weg = (m.zVorne + 450) / Math.cos(w);    // Start ein Stück über dem Tubus
    var R = m.D / 2;

    function strahl(punktAufSpiegel) {
      return { p: V.plus(punktAufSpiegel, V.mal(zumStern, weg)), d: d };
    }

    var faecher = [];
    for (var i = 0; i < anzahlFaecher; i++) {
      var h = -0.96 * R + 1.92 * R * i / (anzahlFaecher - 1);
      faecher.push(strahl(V.mal(u, h)));
    }
    var quer = V.kreuz(Z, u);
    var ring = [];
    for (var k = 0; k < anzahlRing; k++) {
      var a = k / anzahlRing * Math.PI * 2;
      ring.push(strahl(V.plus(V.mal(u, Math.cos(a) * 0.93 * R), V.mal(quer, Math.sin(a) * 0.93 * R))));
    }
    return { faecher: faecher, ring: ring };
  }

  // Alles zusammen: Strahlen erzeugen und verfolgen.
  // Ergebnis: { faecher: [Pfad], ring: [Pfad], imBild: Anteil 0…1 }
  function lichtNewton(m, zustand, feldGrad) {
    var elemente = elementeNewton(m, zustand);
    var grenzen = { auslaufMm: zustand.okularMm + 70 };
    var start = sternStrahlen(m, feldGrad, 13, 32);
    function verfolge(s) { return O.Strahlverfolger.verfolge(s, elemente, grenzen); }

    var faecher = start.faecher.map(verfolge);
    var ring = start.ring.map(verfolge);
    // Spiegel kennen keine Farbfehler: ein Strahl steht für alle Farben
    faecher.concat(ring).forEach(function (p) { p.farbe = null; });

    // Wie viel vom Licht, das der Hauptspiegel einfängt, kommt durchs Okular?
    var gefangen = 0;
    var durch = 0;
    faecher.concat(ring).forEach(function (p) {
      if (p.getroffen.indexOf('hauptspiegel') < 0) return;
      gefangen++;
      if (p.getroffen.indexOf('okular') >= 0) durch++;
    });

    return {
      faecher: faecher,
      ring: ring,
      ringe: [{ farbe: null, pfade: ring }],
      imBild: gefangen ? durch / gefangen : 0
    };
  }

  // Wahres Gesichtsfeld in Grad: Feldblende geteilt durch Brennweite
  function wahresFeldGrad(m, okularMm) {
    return 2 * Math.atan(feldblendeMm(okularMm) / 2 / m.f) * 180 / Math.PI;
  }

  // Für beide Bauarten: Maße und Licht. zustand.bauart entscheidet.
  function masse(zustand) {
    return zustand.bauart === 'refraktor' ? O.Linsenoptik.masseRefraktor(zustand) : masseNewton(zustand);
  }

  function licht(m, zustand, feldGrad) {
    return m.bauart === 'refraktor'
      ? O.Linsenoptik.lichtRefraktor(m, zustand, feldGrad)
      : lichtNewton(m, zustand, feldGrad);
  }

  O.Optik = {
    masse: masse,
    licht: licht,
    FANGSPIEGEL_MM: FANGSPIEGEL_MM,
    SCHEINBARES_FELD_GRAD: SCHEINBARES_FELD_GRAD,
    masseNewton: masseNewton,
    brennpunkt: brennpunkt,
    feldblendeMm: feldblendeMm,
    elementeNewton: elementeNewton,
    sternStrahlen: sternStrahlen,
    lichtNewton: lichtNewton,
    wahresFeldGrad: wahresFeldGrad
  };
})(globalThis.OPTIK = globalThis.OPTIK || {});
