/*
  Minimaler Ereignis-Bus. Wer etwas am Teleskop ändert, meldet
  „teleskop-geaendert“; Werkbank und Seitenleiste hören zu.
*/
(function (O) {
  'use strict';

  var hoerer = {};

  O.Ereignisse = {
    an: function (name, fn) {
      (hoerer[name] = hoerer[name] || []).push(fn);
    },

    melde: function (name, daten) {
      (hoerer[name] || []).forEach(function (fn) {
        fn(daten);
      });
    }
  };
})(globalThis.OPTIK = globalThis.OPTIK || {});
