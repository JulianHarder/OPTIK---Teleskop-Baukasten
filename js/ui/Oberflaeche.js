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
    if (zustand.beruehmt) {
      var b = O.TELESKOPE[zustand.beruehmt];
      return O.TEXTE.beruehmt.teleskopZeile.replace('{name}', b.name).replace('{jahr}', b.jahr);
    }
    var D = zustand.oeffnungMm;
    var f = zustand.brennweiteMm;
    var bauart = O.TEXTE.bauarten[zustand.bauart];
    if (zustand.bauart === 'refraktor') bauart += ' (' + O.TEXTE.objektive[zustand.objektiv] + ')';
    return O.TEXTE.teleskopZeile
      .replace('{bauart}', bauart)
      .replace('{D}', D)
      .replace('{f}', f)
      .replace('{N}', O.Format.zahl(f / D, 1).replace(/,0$/, ''));
  }

  O.Oberflaeche = {
    baue: function () {
      O.Oberflaeche.zeigeTeleskop();

      var fuss = document.getElementById('fuss');
      O.TEXTE.fuss.forEach(function (eintrag) {
        var span = el('span', 'fuss-zeile');
        span.appendChild(el('kbd', null, eintrag[0]));
        span.appendChild(document.createTextNode(' ' + eintrag[1]));
        fuss.appendChild(span);
      });

      // Auf dem Handy sind Bauen und Datenblatt eingeklappt
      var knopf = document.getElementById('bauen-knopf');
      knopf.textContent = O.TEXTE.bauen.knopfHandy;
      knopf.addEventListener('click', function () {
        var offen = document.body.classList.toggle('bauen-offen');
        knopf.setAttribute('aria-expanded', offen ? 'true' : 'false');
      });
    },

    zeigeTeleskop: function () {
      document.getElementById('teleskop-zeile').textContent = teleskopZeile(O.zustand);
    },

    // Ansicht-Schalter: ein Knopf je Ansicht, Ziffer als Taste
    baueAnsicht: function (nav, beiWahl) {
      O.TEXTE.ansichten.forEach(function (a, i) {
        var k = el('button', 'ansicht-knopf');
        k.type = 'button';
        k.dataset.ansicht = a.id;
        k.setAttribute('aria-pressed', i === 0 ? 'true' : 'false');
        k.appendChild(el('kbd', null, String(i + 1)));
        k.appendChild(document.createTextNode(' ' + a.name));
        k.addEventListener('click', function () { beiWahl(a.id); });
        nav.appendChild(k);
      });
    },

    markiereAnsicht: function (nav, id) {
      nav.querySelectorAll('.ansicht-knopf[data-ansicht]').forEach(function (k) {
        k.setAttribute('aria-pressed', k.dataset.ansicht === id ? 'true' : 'false');
      });
    },

    fehler: function (text) {
      var box = el('div', 'fehler', text);
      document.getElementById('buehne').appendChild(box);
    }
  };
})(globalThis.OPTIK = globalThis.OPTIK || {});
