/*
  Einstieg: Bühne, Himmel und Wiese aufbauen, dann das Teleskop – und alles,
  was am Teleskop hängt (Ansichten, Auswahl, Schilder, Licht, Datenblatt).

  Das Teleskop wird bei jeder Änderung im Konfigurator komplett neu gebaut
  (baueTeleskop). Was daran hängt, bekommt das neue Teleskop übergeben;
  das alte wird freigegeben (Dobson.entsorge), damit der Grafikspeicher
  nicht volläuft. Genauso beim Wechsel zu einem berühmten Teleskop
  (O.zustand.beruehmt) – das eigene bleibt im Zustand und kommt zurück.
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

  // Gemerktes Teleskop vom letzten Besuch
  var gemerkt = O.Speicher.lade();
  if (gemerkt) Object.assign(O.zustand, gemerkt.zustand);

  var mensch = O.Mensch.erzeuge();
  buehne.szene.add(mensch);

  var teleskop = null;
  var beruehmtLeiste = null;
  var ansicht = null;
  var licht = null;
  var beobachten = null;
  var okularansicht = null;

  // ---------- Karte, Auswahl, Schilder ----------

  var karte = new O.Infokarte(
    document.getElementById('karte'),
    document.getElementById('hinweis'),
    function () { waehle(null); }
  );

  var auswahl = new O.Auswahl(buehne, {
    wurzeln: function () { return [teleskop.wurzel, mensch]; },
    istSichtbar: function (treffer) { return ansicht.istSichtbar(treffer); },
    beiWahl: function (teil) {
      if (teil) karte.zeige(teil, teleskop, O.zustand);
      else karte.schliesse();
    },
    beiSchweben: function (teil, x, y) { karte.schwebe(teil, x, y); }
  });

  function waehle(teil) {
    auswahl.waehle(teil);
  }

  var beschriftung = new O.Beschriftung(buehne, document.getElementById('schilder'));
  var datenblatt = new O.Datenblatt(document.getElementById('datenblatt'));
  var nav = document.getElementById('ansicht');

  O.Oberflaeche.baueAnsicht(nav, function (id) { ansicht.setze(id); });
  O.Ereignisse.an('ansicht-geaendert', function (id) {
    O.Oberflaeche.markiereAnsicht(nav, id);
    merken();
  });

  // ---------- Teleskop bauen ----------

  function baueTeleskop() {
    var modus = ansicht ? ansicht.modus : (gemerkt && gemerkt.ansicht) || 'ganz';

    if (teleskop) {
      buehne.szene.remove(teleskop.wurzel);
      O.Dobson.entsorge(teleskop);
    }
    if (O.zustand.beruehmt) teleskop = O.Beruehmt.erzeuge(O.zustand.beruehmt);
    else teleskop = (O.zustand.bauart === 'refraktor' ? O.Stativ : O.Dobson).erzeuge(O.zustand);
    buehne.szene.add(teleskop.wurzel);

    beschriftung.leeren();
    Object.keys(teleskop.teile).forEach(function (schluessel) {
      var objekt = teleskop.teile[schluessel];
      var info = O.TEILE[objekt.userData.teil];
      if (info) beschriftung.neu(schluessel, objekt, info.name, waehle, info.schild === 'links');
    });

    auswahl.neuesTeleskop();
    ansicht = new O.Ansicht(buehne, teleskop, auswahl, beschriftung);
    ansicht.setze(modus, true, true);

    if (licht) licht.neuesTeleskop(teleskop, ansicht);
    else licht = new O.Licht(buehne, teleskop, ansicht, document.getElementById('licht'), nav);

    if (beobachten) beobachten.neuesTeleskop(teleskop, ansicht);
    if (okularansicht) okularansicht.neuesTeleskop(teleskop);

    O.Mensch.stelle(mensch, teleskop);
    var huelle = O.Dobson.huelle(teleskop);
    O.Umgebung.schattenFuer(huelle);
    O.Umgebung.nebelFuer(buehne.szene, huelle);
    // Zoomgrenzen nach Größe: Newtons 16-cm-Rohr will man aus der Nähe
    // sehen, Yerkes aus 40 m Abstand
    buehne.steuerung.maxDistance = Math.max(9000, huelle.radius * 5);
    buehne.steuerung.minDistance = Math.max(60, Math.min(150, huelle.radius * 0.15));
    nachAenderung();

    // zum Nachsehen in der Konsole und für pruefungen/blicke.js
    O.teleskop = teleskop;
    O.ansicht = ansicht;
    O.licht = licht;
  }

  // Was nach jeder Änderung neu angezeigt wird
  function nachAenderung() {
    if (!teleskop.beruehmt) datenblatt.zeige(teleskop, O.zustand);
    if (beruehmtLeiste) beruehmtLeiste.zeige();
    O.Oberflaeche.zeigeTeleskop();
    if (karte.teil) karte.zeige(karte.teil, teleskop, O.zustand);
    merken();
    buehne.zeichneBald();
  }

  function merken() {
    O.Speicher.sichere(O.zustand, ansicht ? ansicht.modus : 'ganz');
  }

  // Während man zieht, kommen viele Änderungen kurz hintereinander –
  // gebaut wird höchstens einmal pro Bild. Der Timer ist die Rückfallebene
  // für verdeckte Fenster ohne requestAnimationFrame.
  var umbauBestellt = false;
  function bestelleUmbau() {
    if (umbauBestellt) return;
    umbauBestellt = true;
    function los() {
      if (!umbauBestellt) return;
      umbauBestellt = false;
      baueTeleskop();
    }
    requestAnimationFrame(los);
    setTimeout(los, 80);
  }

  baueTeleskop();

  // ---------- Berühmte Teleskope ----------

  beruehmtLeiste = new O.BeruehmtLeiste(document.getElementById('beruehmt'), function (id) {
    if (okularansicht.offen) okularansicht.schliesse();
    waehle(null);
    O.zustand.beruehmt = id;
    baueTeleskop();
    kameraNachziehen(true);
  });

  // ---------- Konfigurator ----------

  var konfigurator = new O.Konfigurator(
    document.getElementById('bauen'),
    function (art) {
      if (art === 'form') {
        bestelleUmbau();
      } else {
        licht.neuesTeleskop(teleskop, ansicht);   // anderes Okular: nur Licht und Zahlen
        nachAenderung();
      }
    },
    function () { kameraNachziehen(); }
  );

  function wechsleOkular(mm) {
    O.zustand.okularMm = mm;
    konfigurator.auffrischen();
    licht.neuesTeleskop(teleskop, ansicht);
    nachAenderung();
  }

  // ---------- Beobachten und Durchschauen ----------

  beobachten = new O.Beobachten(buehne, document.getElementById('beobachten'), nav, {
    geschwenkt: nachAenderung,
    luftGeaendert: merken,
    durchschauen: durchschauen
  });
  beobachten.neuesTeleskop(teleskop, ansicht);

  okularansicht = new O.Okularansicht(buehne, document.getElementById('okular-blick'), beobachten, {
    okular: wechsleOkular,
    luft: function () { beobachten.auffrischen(); merken(); },
    objekt: function (id) { beobachten.waehle(id); merken(); }
  });
  okularansicht.neuesTeleskop(teleskop);

  // Erst zum Objekt schwenken (falls nötig), dann ins Okular fliegen
  function durchschauen() {
    if (okularansicht.offen) return;
    waehle(null);
    if (ansicht.modus === 'zerlegt') ansicht.setze('ganz', true);
    // Berühmte Teleskope schwenken nicht – sie zeigen, was gewählt ist
    if (O.zustand.zielt || teleskop.beruehmt) okularansicht.oeffne();
    else beobachten.waehle(O.zustand.objektId, function () { okularansicht.oeffne(); });
  }

  // ---------- Kamera ----------

  // Startblick: schräg von vorne links, eher flach, damit über dem
  // Teleskop noch Himmel zu sehen ist.
  var START_RICHTUNG = new THREE.Vector3(-0.85, 0.14, -0.62);

  function blickZiel() {
    var box = new THREE.Box3().setFromObject(teleskop.wurzel).expandByObject(mensch);
    var h = box.getBoundingSphere(new THREE.Sphere());
    var mitte = h.center.clone();
    mitte.y += h.radius * 0.12;     // Teleskop etwas unter die Bildmitte
    return { mitte: mitte, radius: h.radius * 0.97 };
  }

  function ganzesTeleskop() {
    var z = blickZiel();
    buehne.blickAuf(z.mitte, z.radius, START_RICHTUNG);
  }

  // Nach dem Umbau: Blickrichtung behalten, aber Abstand und Mitte so
  // nachführen, dass das neue Teleskop wieder gut ins Bild passt
  // immer: auch in der Ansicht „zerlegt“ (beim Wechsel des Teleskops)
  function kameraNachziehen(immer) {
    if (ansicht.modus === 'zerlegt' && !immer) return;
    var k = buehne.kamera;
    var s = buehne.steuerung;
    var z = blickZiel();
    var richtung = k.position.clone().sub(s.target).normalize();
    var vonZiel = s.target.clone();
    var vonPos = k.position.clone();
    var nachPos = z.mitte.clone().addScaledVector(richtung, buehne.abstandFuer(z.radius) * 1.05);
    buehne.animiere('kamera', 700, function (t) {
      s.target.lerpVectors(vonZiel, z.mitte, t);
      k.position.lerpVectors(vonPos, nachPos, t);
    });
  }

  ganzesTeleskop();
  if (O.zustand.lichtAn) licht.setze(true);

  // ---------- Tasten ----------

  var bildrate = document.getElementById('bildrate');
  var ansichtTaste = { 1: 'ganz', 2: 'aufgeschnitten', 3: 'zerlegt', 4: 'roentgen' };

  window.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    // In Reglern bleiben die Pfeiltasten beim Regler, Buchstaben gehen durch
    if (e.target && e.target.tagName === 'INPUT' && e.target.type !== 'range') return;

    // Im Okular gibt es nur einen Weg: zurück
    if (okularansicht.offen) {
      if (e.key === 'Escape') {
        okularansicht.schliesse();
        e.preventDefault();
      }
      return;
    }

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
        merken();
        break;
      case 'o':
        durchschauen();
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

  O.buehne = buehne;
  O.auswahl = auswahl;
  O.konfigurator = konfigurator;
  O.mensch = mensch;
  O.baueTeleskop = baueTeleskop;
  O.beobachten = beobachten;
  O.okularansicht = okularansicht;
  O.durchschauen = durchschauen;
  O.ganzesTeleskop = ganzesTeleskop;
  buehne.zeichneBald();
})(globalThis.OPTIK);
