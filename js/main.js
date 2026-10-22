/*
  Einstieg: Bühne, Himmel, Wiese und das Teleskop zusammensetzen.
*/
(function (O) {
  'use strict';

  var buehne = new O.Buehne(document.getElementById('buehne'));
  O.Oberflaeche.baue();

  if (!buehne.ok()) {
    O.Oberflaeche.fehler(O.TEXTE.fehlerWebgl);
    return;
  }

  buehne.himmel = O.Himmel.erzeuge();
  O.Umgebung.erzeuge(buehne.szene, buehne.renderer);

  var teleskop = O.Dobson.erzeuge(O.zustand);
  buehne.szene.add(teleskop.wurzel);
  O.teleskop = teleskop;    // zum Nachsehen in der Konsole
  O.buehne = buehne;

  // Startblick: schräg von vorne links, leicht von oben – so sieht man
  // Okularauszug, Sucher und Beschriftung.
  // Eher flach, damit über dem Teleskop noch Himmel zu sehen ist.
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

  window.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target && e.target.tagName === 'INPUT') return;

    switch (e.key.toLowerCase()) {
      case 'f':
        ganzesTeleskop();
        break;
      case 'p':
        bildrate.hidden = !bildrate.hidden;
        if (!bildrate.hidden) buehne.zeigeBildrate(bildrate);
        break;
      default:
        return;
    }
    e.preventDefault();
  });

  buehne.zeichneBald();
})(globalThis.OPTIK);
