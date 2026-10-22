/*
  Zentraler Zustand: das Teleskop als Zahlen, nicht als 3D-Objekte.

  Aus diesen Werten entstehen später zwei Dinge aus derselben Quelle:
  die optischen Elemente für den Strahlverfolger (physik/Optik.js) und das
  3D-Modell (modell/). Deshalb passen Licht und Modell immer zusammen.

  Änderungen laufen über Zustand.aendere(), danach wird genau einmal
  „teleskop-geaendert“ gemeldet.
*/
(function (O) {
  'use strict';

  O.zustand = {
    bauart: 'dobson',
    oeffnungMm: 200,      // Durchmesser des Hauptspiegels
    brennweiteMm: 1200,   // Brennweite des Hauptspiegels
    okularMm: 25,         // Brennweite des Okulars
    hoeheGrad: 42,        // Neigung des Tubus über dem Horizont
    azimutGrad: -32,      // Drehung der Rockerbox
    lichtAn: false,       // Sternlicht im Teleskop zeigen
    sternVersatzGrad: 0   // wie weit der Stern neben der Blickrichtung steht
  };

  O.Zustand = {
    aendere: function (fn) {
      fn(O.zustand);
      O.Ereignisse.melde('teleskop-geaendert');
    }
  };
})(globalThis.OPTIK = globalThis.OPTIK || {});
