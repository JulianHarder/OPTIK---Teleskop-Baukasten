/*
  Optisches Glas: Brechzahl abhängig von der Wellenlänge (Dispersion).

  Sellmeier-Gleichung (λ in µm):
      n²(λ) = 1 + Σ Bᵢ·λ² / (λ² − Cᵢ)

  Koeffizienten aus den Glasdatenblättern von Schott (N-BK7 und F2) –
  geprüft über die bekannten Werte n_d(BK7) = 1,5168 und n_d(F2) = 1,6200
  (pruefungen/strahlen-test.js).

  Kronglas (BK7) bricht schwach und zerstreut die Farben wenig, Flintglas
  (F2, mit Blei) bricht stärker und zerstreut viel stärker. Aus beiden
  zusammen lässt sich eine Linse bauen, deren Farbfehler sich aufheben:
  der Achromat.
*/
(function (O) {
  'use strict';

  var GLAESER = {
    BK7: {
      name: 'Kronglas (BK7)',
      B: [1.03961212, 0.231792344, 1.01046945],
      C: [0.00600069867, 0.0200179144, 103.560653]
    },
    F2: {
      name: 'Flintglas (F2)',
      B: [1.34533359, 0.209073176, 0.937357162],
      C: [0.00997743871, 0.0470450767, 111.886764]
    }
  };

  // Fraunhofer-Linien (nm): blau, gelb, rot
  var LINIEN = { F: 486.13, d: 587.56, C: 656.27 };

  function brechzahl(glas, lambdaNm) {
    var g = GLAESER[glas];
    var l2 = (lambdaNm / 1000) * (lambdaNm / 1000);
    var s = 1;
    for (var i = 0; i < 3; i++) s += g.B[i] * l2 / (l2 - g.C[i]);
    return Math.sqrt(s);
  }

  // Abbe-Zahl: je größer, desto weniger zerstreut das Glas die Farben
  function abbe(glas) {
    return (brechzahl(glas, LINIEN.d) - 1) / (brechzahl(glas, LINIEN.F) - brechzahl(glas, LINIEN.C));
  }

  O.Glas = {
    GLAESER: GLAESER,
    LINIEN: LINIEN,
    brechzahl: brechzahl,
    abbe: abbe,
    // Brechzahl als Funktion der Wellenlänge (für die Flächen)
    funktion: function (glas) {
      if (!glas) return function () { return 1; };     // Luft
      return function (lambdaNm) { return brechzahl(glas, lambdaNm); };
    }
  };
})(globalThis.OPTIK = globalThis.OPTIK || {});
