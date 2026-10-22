/*
  Zahlen deutsch formatieren: Komma als Dezimalzeichen, Punkt als
  Tausendertrenner („1.200,5“).
*/
(function (O) {
  'use strict';

  var cache = {};

  function formatierer(stellen) {
    if (!cache[stellen]) {
      cache[stellen] = new Intl.NumberFormat('de-DE', {
        minimumFractionDigits: stellen,
        maximumFractionDigits: stellen
      });
    }
    return cache[stellen];
  }

  O.Format = {
    // zahl(1234.5, 1) → "1.234,5"
    zahl: function (wert, stellen) {
      var s = formatierer(stellen || 0).format(wert);
      // −0,000 sieht nach einem Fehler aus, ist aber nur Rundung
      return s.replace(/^-(0[,.]?0*)$/, '$1');
    },

    // mm(700) → "700 mm"
    mm: function (wert, stellen) {
      return O.Format.zahl(wert, stellen) + ' mm';
    }
  };
})(globalThis.OPTIK = globalThis.OPTIK || {});
