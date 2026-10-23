/*
  Gemeinsames für die berühmten Teleskope (Galilei.js, Newton1668.js,
  Yerkes.js): aus den gebauten Gruppen ein Teleskop-Objekt machen, das
  dieselbe Form hat wie das von Dobson.erzeuge – damit Ansichten,
  Schilder, Auswahl und Infokarten ohne Sonderweg funktionieren.

  Berühmte Teleskope sind fest: Man kann sie nicht umbauen. Licht und
  Okular-Blick rechnet physik/Historisch.js (teleskop.licht(),
  teleskop.okularOptik). Sie haben einen Steckbrief (js/daten/teleskope.js)
  statt eines Datenblatts.
*/
(function (O) {
  'use strict';

  var T = O.Teile;

  // id → Baufunktion; die Modelle tragen sich beim Laden selbst ein
  var BAUER = {};

  O.Beruehmt = {
    melde: function (id, erzeuge) {
      BAUER[id] = erzeuge;
    },

    erzeuge: function (id) {
      return BAUER[id]();
    },

    // o = { id, wurzel, azimut, hoehe, tubus, teile, masse, randschicht,
    //       ziele() → [{objekt, versatz}], licht() → wie Optik.licht,
    //       lichtMassstab (Größe und Tempo der Lichtpulse), mensch? (Vector3),
    //       auge?() → { punkt, achse } (Welt): wo man ins Okular schaut, wenn
    //       nicht von oben in teile.okular, okularOptik? (sonst aus
    //       Historisch.okular), weltall?, sonne? (Vector3) }
    teleskop: function (o) {
      o.wurzel.updateMatrixWorld(true);
      Object.keys(o.teile).forEach(function (k) {
        var teil = o.teile[k];
        if (!teil.userData.anker) teil.userData.anker = T.anker(teil);
      });
      var t = {
        bauart: 'beruehmt',
        beruehmt: o.id,
        licht: o.licht,
        lichtMassstab: o.lichtMassstab || 1,
        okularOptik: o.okularOptik !== undefined ? o.okularOptik : O.Historisch.okular(o.id),
        weltall: o.weltall || null,       // 'erde' (Hubble) oder 'tief' (Webb): Weltraum statt Wiese
        sonne: o.sonne || null,           // Richtung zur Sonne
        auge: o.auge || null,
        teile: o.teile,
        wurzel: o.wurzel,
        azimut: o.azimut,
        hoehe: o.hoehe,
        tubus: o.tubus,
        masse: o.masse,
        okularHoeheMm: null,
        randschicht: o.randschicht,
        mensch: o.mensch || null,
        zerlegeZiele: o.ziele
      };
      return t;
    }
  };
})(globalThis.OPTIK = globalThis.OPTIK || {});
