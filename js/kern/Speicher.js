/*
  Das eigene Teleskop im Browser merken (localStorage), damit es beim
  nächsten Öffnen wieder da ist.

  localStorage kann fehlen oder gesperrt sein (privates Fenster, Datei
  über file:// in manchen Browsern) – dann geht es eben ohne Merken.
  Gelesene Werte werden geprüft: Was nicht in die Grenzen passt, fliegt raus.
*/
(function (O) {
  'use strict';

  var SCHLUESSEL = 'optik.stand.v1';
  var ANSICHTEN = ['ganz', 'aufgeschnitten', 'zerlegt', 'roentgen'];

  function zahlIn(wert, min, max) {
    return typeof wert === 'number' && isFinite(wert) && wert >= min && wert <= max;
  }

  O.Speicher = {
    // → { zustand: {…}, ansicht: '…' } mit nur den gültigen Werten, oder null
    lade: function () {
      var roh;
      try {
        roh = JSON.parse(localStorage.getItem(SCHLUESSEL) || 'null');
      } catch (e) {
        return null;
      }
      if (!roh || typeof roh !== 'object') return null;

      var z = {};
      if (roh.bauart === 'dobson' || roh.bauart === 'refraktor') z.bauart = roh.bauart;
      if (roh.objektiv === 'achromat' || roh.objektiv === 'einzel') z.objektiv = roh.objektiv;
      var B = O.BAUARTEN[z.bauart || 'dobson'];
      if (zahlIn(roh.oeffnungMm, B.oeffnung.min, B.oeffnung.max)) z.oeffnungMm = roh.oeffnungMm;
      else if (z.bauart) { z.oeffnungMm = B.vorlagen[0].oeffnungMm; z.brennweiteMm = B.vorlagen[0].brennweiteMm; }
      if (zahlIn(roh.brennweiteMm, 100, B.brennweiteMax)) z.brennweiteMm = roh.brennweiteMm;
      if (B.okulare.indexOf(roh.okularMm) >= 0) z.okularMm = roh.okularMm;
      if (typeof roh.lichtAn === 'boolean') z.lichtAn = roh.lichtAn;
      if (O.HIMMEL.objekte.some(function (o) { return o.id === roh.objektId; })) z.objektId = roh.objektId;
      if (O.HIMMEL.luft.some(function (l) { return l.id === roh.luftId; })) z.luftId = roh.luftId;
      return { zustand: z, ansicht: ANSICHTEN.indexOf(roh.ansicht) >= 0 ? roh.ansicht : null };
    },

    sichere: function (zustand, ansicht) {
      try {
        localStorage.setItem(SCHLUESSEL, JSON.stringify({
          bauart: zustand.bauart,
          objektiv: zustand.objektiv,
          oeffnungMm: zustand.oeffnungMm,
          brennweiteMm: zustand.brennweiteMm,
          okularMm: zustand.okularMm,
          lichtAn: zustand.lichtAn,
          objektId: zustand.objektId,
          luftId: zustand.luftId,
          ansicht: ansicht
        }));
      } catch (e) {
        // ohne Speicher weiter – nichts zu tun
      }
    }
  };
})(globalThis.OPTIK = globalThis.OPTIK || {});
