/*
  Zufall mit festem Startwert (mulberry32).

  Sternenhimmel, Holzmaserung und Hügel sollen bei jedem Laden gleich
  aussehen – Math.random() würde jedes Mal etwas anderes würfeln.
*/
(function (O) {
  'use strict';

  // O.Zufall(42) → Funktion, die bei jedem Aufruf eine Zahl in [0, 1) liefert
  O.Zufall = function (startwert) {
    var a = startwert >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
})(globalThis.OPTIK = globalThis.OPTIK || {});
