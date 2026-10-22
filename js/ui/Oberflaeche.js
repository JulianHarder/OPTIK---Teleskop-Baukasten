/*
  Die schwebenden Leisten über der 3D-Bühne: Name des Teleskops oben
  links, Bedienhinweise unten, Bildrate (Taste P) oben rechts.
*/
(function (O) {
  'use strict';

  function el(tag, klasse, text) {
    var e = document.createElement(tag);
    if (klasse) e.className = klasse;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function teleskopZeile(zustand) {
    var D = zustand.oeffnungMm;
    var f = zustand.brennweiteMm;
    return O.TEXTE.teleskopZeile
      .replace('{bauart}', O.TEXTE.bauarten[zustand.bauart])
      .replace('{D}', D)
      .replace('{f}', f)
      .replace('{N}', O.Format.zahl(f / D, 1).replace(/,0$/, ''));
  }

  O.Oberflaeche = {
    baue: function () {
      document.getElementById('teleskop-zeile').textContent = teleskopZeile(O.zustand);

      var fuss = document.getElementById('fuss');
      O.TEXTE.fuss.forEach(function (eintrag) {
        var span = el('span');
        span.appendChild(el('kbd', null, eintrag[0]));
        span.appendChild(document.createTextNode(' ' + eintrag[1]));
        fuss.appendChild(span);
      });
    },

    fehler: function (text) {
      var box = el('div', 'fehler', text);
      document.getElementById('buehne').appendChild(box);
    }
  };
})(globalThis.OPTIK = globalThis.OPTIK || {});
