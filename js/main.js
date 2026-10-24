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

  // Beim Öffnen immer derselbe Anfang (Julian): der Klassiker 200/1200,
  // ganz, ohne Licht – nichts vom letzten Besuch (O.zustand, Zustand.js)

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
      if (ansicht && ansicht.modus === 'zerlegt') fokussiere(teil);
    },
    beiSchweben: function (teil, x, y) { karte.schwebe(teil, x, y); }
  });

  function waehle(teil) {
    auswahl.waehle(teil);
  }

  // ---------- Fokus beim Zerlegen ----------
  // Klick auf ein Bauteil: Die Kamera fährt heran, der Drehpunkt ist die
  // Mitte des Bauteils (auch fürs Mausrad, zoomMitte). Klick daneben:
  // zurück auf das ganze zerlegte Teleskop.

  var fokus = null;   // { drehpunkt, radius } des Bauteils oder null

  // Die Bauteil-Gruppe zum getroffenen Netz – nur ihre sichtbaren Netze
  // desselben Teils zählen (das zweite Höhenrad ist eine eigene Gruppe)
  function bauteilKugel(teil) {
    var gruppen = Object.keys(teleskop.teile).map(function (k) { return teleskop.teile[k]; }).concat([mensch]);
    var g = auswahl.getroffen;
    while (g && gruppen.indexOf(g) < 0) g = g.parent;
    if (!g) g = gruppen.filter(function (x) { return x.userData.teil === teil; })[0];
    if (!g) return null;
    var box = new THREE.Box3();
    g.updateMatrixWorld(true);
    g.traverse(function (o) {
      var an = o.isMesh && o.userData.teil === teil && o.material.visible !== false;
      for (var p = o; an && p; p = p.parent) if (!p.visible) an = false;
      if (an) box.expandByObject(o);
    });
    return box.isEmpty() ? null : box.getBoundingSphere(new THREE.Sphere());
  }

  function fokussiere(teil) {
    var kugel = teil ? bauteilKugel(teil) : null;
    if (!kugel) {
      if (fokus) {
        fokus = null;
        ansicht.kameraNachfuehren();   // zurück: alles Zerlegte im Bild
      }
      return;
    }
    fokus = { drehpunkt: kugel.center.clone(), radius: kugel.radius };
    var k = buehne.kamera;
    var s = buehne.steuerung;
    var richtung = k.position.clone().sub(s.target).normalize();
    var abstand = Math.max(s.minDistance, buehne.abstandFuer(kugel.radius) * 1.6);
    var vonZiel = s.target.clone();
    var vonPos = k.position.clone();
    var nachPos = kugel.center.clone().addScaledVector(richtung, abstand);
    if (buehne.bodenDa() && nachPos.y < 40) nachPos.y = 40;
    buehne.animiere('kamera', 700, buehne.bogen(vonPos, vonZiel, nachPos, kugel.center));
  }

  O.Ereignisse.an('ansicht-geaendert', function () { fokus = null; });

  // Mausrad zoomt zu dem, was unter der Maus liegt (Buehne.zoomZurMaus)
  buehne.zoomZiele = function () { return [teleskop.wurzel, mensch, O.Umgebung.boden()]; };
  buehne.zoomMitte = function () {
    if (fokus && ansicht.modus === 'zerlegt') return fokus;
    return { drehpunkt: O.Dobson.huelle(teleskop).center, radius: blickZiel().radius };
  };
  buehne.bodenDa = function () { return !!O.Umgebung.boden(); };
  buehne.zoomFilter = function (treffer) { return !ansicht || ansicht.istSichtbar(treffer); };

  var beschriftung = new O.Beschriftung(buehne, document.getElementById('schilder'));
  var datenblatt = new O.Datenblatt(document.getElementById('datenblatt'));
  var nav = document.getElementById('ansicht');

  O.Oberflaeche.baueAnsicht(nav, function (id) { ansicht.setze(id); });
  O.Ereignisse.an('ansicht-geaendert', function (id) {
    O.Oberflaeche.markiereAnsicht(nav, id);
  });

  // ---------- Teleskop bauen ----------

  // modus: in dieser Ansicht anfangen (sonst bleibt die bisherige)
  function baueTeleskop(modus) {
    modus = modus || (ansicht ? ansicht.modus : 'ganz');

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
      if (info) {
        beschriftung.neu(schluessel, objekt, info.name, function (teil) {
          auswahl.getroffen = objekt;
          waehle(teil);
        }, info.schild === 'links');
      }
    });

    auswahl.neuesTeleskop();
    ansicht = new O.Ansicht(buehne, teleskop, auswahl, beschriftung);
    ansicht.startBlick = startBlick;
    ansicht.setze(modus, true, true);

    if (licht) licht.neuesTeleskop(teleskop, ansicht);
    else licht = new O.Licht(buehne, teleskop, ansicht, document.getElementById('licht'), nav);

    if (beobachten) beobachten.neuesTeleskop(teleskop, ansicht);
    if (okularansicht) okularansicht.neuesTeleskop(teleskop);

    O.Mensch.stelle(mensch, teleskop);
    document.body.classList.toggle('ohne-okular', !!(teleskop.beruehmt && !teleskop.okularOptik));
    O.Umgebung.ort(teleskop.weltall ? 'weltall' : 'wiese', buehne.szene, buehne.himmel, buehne.steuerung,
      { erde: teleskop.weltall === 'erde', sonne: teleskop.sonne });
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
    buehne.zeichneBald();
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
    // Jedes Teleskop öffnet wie die Seite: ganz, ohne Licht, aus der
    // Ausgangsstellung
    if (okularansicht.offen) okularansicht.schliesse();
    waehle(null);
    if (O.zustand.lichtAn) licht.setze(false);
    O.zustand.beruehmt = id;
    baueTeleskop('ganz');
    var z = startBlick();
    buehne.animiere('kamera', 700, buehne.bogen(buehne.kamera.position.clone(),
      buehne.steuerung.target.clone(), z.pos, z.ziel));
  }, function () {
    // Hubbles Spiegel von 1990 an/aus: neu bauen, dann rechnen Licht und
    // Kamerabild mit dem anderen Spiegel
    baueTeleskop();
    if (okularansicht.offen) okularansicht.rendere();
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
    durchschauen: durchschauen
  });
  beobachten.neuesTeleskop(teleskop, ansicht);

  okularansicht = new O.Okularansicht(buehne, document.getElementById('okular-blick'), beobachten, {
    okular: wechsleOkular,
    luft: function () { beobachten.auffrischen(); },
    objekt: function (id) { beobachten.waehle(id); }
  });
  okularansicht.neuesTeleskop(teleskop);

  // Erst zum Objekt schwenken (falls nötig), dann ins Okular fliegen
  function durchschauen() {
    // Webb hat kein Okular (und sein Licht sieht das Auge nicht)
    if (okularansicht.offen || (teleskop.beruehmt && !teleskop.okularOptik)) return;
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

  // Ausgangsstellung: aus START_RICHTUNG, alles im Bild
  function startBlick() {
    var z = blickZiel();
    var abstand = buehne.abstandFuer(z.radius) * 1.05;
    return { ziel: z.mitte, pos: z.mitte.clone().addScaledVector(START_RICHTUNG.clone().normalize(), abstand) };
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
    buehne.animiere('kamera', 700, buehne.bogen(vonPos, vonZiel, nachPos, z.mitte));
  }

  ganzesTeleskop();

  // ---------- Tasten ----------

  var bildrate = document.getElementById('bildrate');
  // Beim Start eine kurze Führung, die man überspringen kann
  var hilfe = new O.Hilfe();
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
        break;
      case 'o':
        durchschauen();
        break;
      case 'h':
        hilfe.zeige();
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
  O.hilfe = hilfe;
  buehne.zeichneBald();
  hilfe.zeige();
})(globalThis.OPTIK);
