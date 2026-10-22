/*
  Datenblatt: die wichtigsten Zahlen zum gebauten Teleskop, jede mit Ampel
  und einer Erklärung zum Aufklappen (<details> – geht auch per Finger).
  Die Zahlen kommen aus physik/Kennzahlen.js und aus dem 3D-Modell
  (Tubuslänge, Höhe des Okulars).
*/
(function (O) {
  'use strict';

  var LEITER_AB_MM = 1700;

  function el(tag, klasse, text) {
    var e = document.createElement(tag);
    if (klasse) e.className = klasse;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function Datenblatt(leiste) {
    var T = O.TEXTE.datenblatt;
    this.leiste = leiste;
    this.zeilen = {};
    leiste.appendChild(el('h2', 'leiste-titel', T.titel));

    var self = this;
    T.zeilen.forEach(function (z) {
      var d = el('details', 'kennzahl');
      var s = el('summary');
      var ampel = el('span', 'ampel');
      s.appendChild(ampel);
      s.appendChild(el('span', 'kennzahl-name', z.name));
      var wert = el('span', 'kennzahl-wert');
      s.appendChild(wert);
      d.appendChild(s);
      var text = el('p', 'kennzahl-text');
      d.appendChild(text);
      leiste.appendChild(d);
      self.zeilen[z.id] = { ampel: ampel, wert: wert, text: text, erklaerung: z.erklaerung, details: d };
    });
  }

  Datenblatt.prototype.zeige = function (teleskop, zustand) {
    var F = O.Format;
    var T = O.TEXTE.datenblatt;
    var k = O.Kennzahlen.berechne(teleskop.masse, zustand);

    // Werte aus dem Modell dazu
    k.tubuslaenge = { wert: teleskop.masse.laenge, ampel: [null, null] };
    k.okularhoehe = {
      wert: teleskop.okularHoeheMm,
      ampel: teleskop.okularHoeheMm > LEITER_AB_MM ? ['warnung', 'leiter'] : [null, null]
    };

    var anzeige = {
      vergroesserung: function (w) { return F.zahl(w, 0) + '-fach'; },
      austrittspupille: function (w) { return F.mm(w, 1); },
      oeffnungsverhaeltnis: function (w) { return 'f/' + F.zahl(w, 1).replace(/,0$/, ''); },
      aufloesung: function (w) { return F.zahl(w, 2) + '″'; },
      lichtsammeln: function (w) { return F.zahl(w, 0) + ' × Auge'; },
      grenzgroesse: function (w) { return 'Größe ' + F.zahl(w, 1); },
      gesichtsfeld: function (w) { return F.zahl(w, 2) + '°'; },
      abschattung: function (w) { return F.zahl(w * 100, 0) + ' %'; },
      maxVergroesserung: function (w) { return F.zahl(w, 0) + '-fach'; },
      tubuslaenge: function (w) { return F.zahl(w / 1000, 2) + ' m'; },
      farbfehler: function (w) { return w < 0.05 ? 'keiner' : F.zahl(w, w < 10 ? 1 : 0) + '″'; },
      okularhoehe: function (w) { return F.zahl(w / 1000, 2) + ' m'; }
    };

    var self = this;
    Object.keys(this.zeilen).forEach(function (id) {
      var z = self.zeilen[id];
      var kz = k[id];
      z.wert.textContent = anzeige[id](kz.wert);
      z.ampel.className = 'ampel' + (kz.ampel[0] ? ' ' + kz.ampel[0] : '');
      var text = z.erklaerung;
      if (kz.faustformel) text += ' (' + T.faustformel + ')';
      z.text.textContent = text;
      if (kz.ampel[1]) {
        var grund = el('strong', 'kennzahl-grund', T.gruende[kz.ampel[1]]);
        z.text.insertBefore(grund, z.text.firstChild);
        z.text.insertBefore(document.createTextNode(' '), grund.nextSibling);
      }
    });
  };

  O.Datenblatt = Datenblatt;
})(globalThis.OPTIK = globalThis.OPTIK || {});
