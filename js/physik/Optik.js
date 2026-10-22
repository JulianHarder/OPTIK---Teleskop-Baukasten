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

  var AUSZUG_HOEHE_MM = 75;   // Tubusoberfläche → Brennpunkt (Okularauszug eingefahren)
  var FELD_RESERVE = 1.25;    // Fangspiegel größer als nötig, damit auch der Bildrand voll beleuchtet ist

  function masseNewton(zustand) {
    var D = zustand.oeffnungMm;
    var f = zustand.brennweiteMm;

    var rInnen = D / 2 + 0.06 * D + 5;          // Luft zwischen Spiegel und Tubuswand
    var rAussen = rInnen + 2;                   // 2 mm Blech
    var spiegelDicke = Math.max(10, D / 8);

    // Brennpunkt liegt seitlich außen, oben im Okularauszug
    var seitlich = rAussen + AUSZUG_HOEHE_MM;   // Abstand Achse → Brennpunkt
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
      D: D,
      f: f,
      rInnen: rInnen,
      rAussen: rAussen,
      spiegelDicke: spiegelDicke,
      sag: function (r) { return r * r / (4 * f); },   // Parabel: Tiefe bei Radius r
      seitlich: seitlich,
      auszugHoehe: AUSZUG_HOEHE_MM,
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

  O.Optik = {
    FANGSPIEGEL_MM: FANGSPIEGEL_MM,
    masseNewton: masseNewton
  };
})(globalThis.OPTIK = globalThis.OPTIK || {});
