/*
  Feste Blickwinkel für Prüf-Screenshots (pruefungen/ansicht.sh).
  Wird nur von den Prüfungen geladen, nicht von index.html.

    OPTIK.pruefBlick('vorne')    – von vorne in den Tubus (Spinne, Spiegel)
    OPTIK.pruefBlick('okular')   – nah an Okularauszug und Sucher
    OPTIK.pruefBlick('box')      – Rockerbox und Höhenrad von der Seite
    OPTIK.pruefBlick('hinten')   – Spiegelzelle mit Justierschrauben
*/
(function (O) {
  'use strict';

  // Punkt und Richtung im Tubus → Welt
  function tubusPunkt(z, x, y) {
    return O.teleskop.tubus.localToWorld(new THREE.Vector3(x || 0, y || 0, z));
  }

  function setze(von, nach) {
    var b = O.buehne;
    b.kamera.position.copy(von);
    b.steuerung.target.copy(nach);
    b.steuerung.update();
  }

  O.pruefBlick = function (name) {
    var m = O.teleskop.masse;
    var vorne = tubusPunkt(m.zVorne);
    var achse = tubusPunkt(m.zVorne + 1).sub(vorne).normalize();

    switch (name) {
      case 'vorne':
        setze(vorne.clone().addScaledVector(achse, 650).add(new THREE.Vector3(-120, 60, 0)),
          tubusPunkt(m.zVorne - 200));
        break;
      case 'okular':
        var a = tubusPunkt(m.zFang, m.rAussen * 0.7, m.rAussen * 0.7);
        setze(a.clone().add(new THREE.Vector3(-420, 160, -60)), a);
        break;
      case 'box':
        setze(new THREE.Vector3(-1100, 520, 900), new THREE.Vector3(0, 420, 0));
        break;
      case 'hinten':
        var h = tubusPunkt(m.zHinten);
        setze(h.clone().addScaledVector(achse, -520).add(new THREE.Vector3(-200, -40, 120)), h);
        break;
    }
  };
})(globalThis.OPTIK);
