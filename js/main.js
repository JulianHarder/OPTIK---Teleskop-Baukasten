/*
  Einstieg: Bühne, Himmel, Wiese und das Teleskop zusammensetzen, dazu
  Ansichten, Auswahl per Klick, Beschriftungen und Infokarte.
*/
(function (O) {
  'use strict';

  var buehne = new O.Buehne(document.getElementById('buehne'));
  O.Oberflaeche.baue();

  if (!buehne.ok()) {
    O.Oberflaeche.fehler(O.TEXTE.fehlerWebgl);
    document.getElementById('ansicht').hidden = true;
    return;
  }

  buehne.himmel = O.Himmel.erzeuge();
  O.Umgebung.erzeuge(buehne.szene, buehne.renderer);

  var teleskop = O.Dobson.erzeuge(O.zustand);
  buehne.szene.add(teleskop.wurzel);

  // ---------- Karte, Auswahl, Schilder, Ansicht ----------

  var karte = new O.Infokarte(
    document.getElementById('karte'),
    document.getElementById('hinweis'),
    function () { waehle(null); }
  );

  var ansicht;
  var auswahl = new O.Auswahl(buehne, {
    wurzel: teleskop.wurzel,
    istSichtbar: function (treffer) { return ansicht.istSichtbar(treffer); },
    beiWahl: function (teil) {
      if (teil) karte.zeige(teil, teleskop.masse, O.zustand);
      else karte.schliesse();
    },
    beiSchweben: function (teil, x, y) { karte.schwebe(teil, x, y); }
  });

  function waehle(teil) {
    auswahl.waehle(teil);
  }

  var beschriftung = new O.Beschriftung(buehne, document.getElementById('schilder'));
  Object.keys(teleskop.teile).forEach(function (schluessel) {
    var objekt = teleskop.teile[schluessel];
    var info = O.TEILE[objekt.userData.teil];
    if (info) beschriftung.neu(schluessel, objekt, info.name, waehle, info.schild === 'links');
  });

  ansicht = new O.Ansicht(buehne, teleskop, auswahl, beschriftung);

  var nav = document.getElementById('ansicht');
  O.Oberflaeche.baueAnsicht(nav, function (id) { ansicht.setze(id); });
  O.Ereignisse.an('ansicht-geaendert', function (id) {
    O.Oberflaeche.markiereAnsicht(nav, id);
  });

  var licht = new O.Licht(buehne, teleskop, ansicht, document.getElementById('licht'), nav);

  // zum Nachsehen in der Konsole und für pruefungen/blicke.js
  O.licht = licht;
  O.teleskop = teleskop;
  O.buehne = buehne;
  O.ansicht = ansicht;
  O.auswahl = auswahl;

  // ---------- Kamera ----------

  // Startblick: schräg von vorne links, eher flach, damit über dem
  // Teleskop noch Himmel zu sehen ist.
  var START_RICHTUNG = new THREE.Vector3(-0.85, 0.14, -0.62);

  function ganzesTeleskop() {
    var h = O.Dobson.huelle(teleskop);
    var mitte = h.center.clone();
    mitte.y += h.radius * 0.12;     // Teleskop etwas unter die Bildmitte
    buehne.blickAuf(mitte, h.radius * 0.9, START_RICHTUNG);
  }
  ganzesTeleskop();

  // ---------- Tasten ----------

  var bildrate = document.getElementById('bildrate');
  var ansichtTaste = { 1: 'ganz', 2: 'aufgeschnitten', 3: 'zerlegt', 4: 'roentgen' };

  window.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target && e.target.tagName === 'INPUT') return;

    if (ansichtTaste[e.key]) {
      ansicht.setze(ansichtTaste[e.key]);
      e.preventDefault();
      return;
    }
    switch (e.key.toLowerCase()) {
      case 'f':
        ganzesTeleskop();
        break;
      case 'l':
        licht.umschalten();
        break;
      case 'p':
        bildrate.hidden = !bildrate.hidden;
        if (!bildrate.hidden) buehne.zeigeBildrate(bildrate);
        break;
      case 'escape':
        waehle(null);
        break;
      default:
        return;
    }
    e.preventDefault();
  });

  buehne.zeichneBald();
})(globalThis.OPTIK);
