/*
  Die vier Ansichten des Teleskops:

    ganz           so, wie es auf der Wiese steht
    aufgeschnitten eine Schnittebene fährt der Länge nach durch den Tubus
                   und nimmt die Hälfte zur Kamera hin weg
    zerlegt        die Teile schweben auseinander, jedes beschriftet
    roentgen       Tubus und Spiegelzelle werden fast durchsichtig

  Jede Ansicht ist ein Satz aus drei Reglern zwischen 0 und 1:
    schnitt  (0 = heil, 1 = bis zur Achse aufgeschnitten)
    zerlegt  (0 = zusammengebaut, 1 = ganz auseinander)
    roentgen (0 = deckend, 1 = durchsichtig)
  Ein Wechsel blendet alle drei gleichzeitig vom Ist- zum Zielwert über.
  So geht auch ein Wechsel mitten im Übergang glatt.

  Geschnitten und durchsichtig wird nur die Hülle (teleskop.randschicht:
  beim Dobson Tubus und Spiegelzelle, beim Refraktor Rohr, Taukappe,
  Auszug und Zenitspiegel) – die Optik im Inneren soll ja sichtbar werden.
*/
(function (O) {
  'use strict';

  var DAUER_MS = 1100;
  var ZIELE = {
    ganz: { schnitt: 0, zerlegt: 0, roentgen: 0 },
    aufgeschnitten: { schnitt: 1, zerlegt: 0, roentgen: 0 },
    zerlegt: { schnitt: 0, zerlegt: 1, roentgen: 0 },
    roentgen: { schnitt: 0, zerlegt: 0, roentgen: 1 }
  };
  var DURCHSICHTIG = 0.13;     // Deckkraft der Außenhaut im Röntgenblick

  function Ansicht(buehne, teleskop, auswahl, beschriftung) {
    this.buehne = buehne;
    this.t = teleskop;
    this.auswahl = auswahl;
    this.beschriftung = beschriftung;
    this.modus = 'ganz';
    this.wert = { schnitt: 0, zerlegt: 0, roentgen: 0 };
    this.ebene = new THREE.Plane(new THREE.Vector3(0, 1, 0), 1e9);   // schneidet nichts
    this.schnittRichtung = new THREE.Vector3(1, 0, 0);               // im Tubus
    this.haeute = [];
    this.ziele = teleskop.zerlegeZiele();

    this.ziele.forEach(function (z) {
      z.basis = z.objekt.position.clone();
    });
    this.eigeneMaterialien();
  }

  // Tubus und Spiegelzelle bekommen eigene Materialkopien mit Schnittebene
  // – die Originale teilen sie mit Sucher, Okularauszug und Co.
  Ansicht.prototype.eigeneMaterialien = function () {
    var kopien = {};
    var self = this;
    this.t.wurzel.traverse(function (n) {
      // was geschnitten / durchsichtig wird, sagt das Teleskop selbst
      if (!n.isMesh || self.t.randschicht.indexOf(n.userData.teil) < 0) return;
      var alt = n.material;
      if (!kopien[alt.uuid]) {
        var k = alt.clone();
        k.clippingPlanes = [self.ebene];
        k.clipShadows = true;
        k.userData = { deckkraft: alt.opacity, durchsichtig: alt.transparent, innen: alt.side === THREE.BackSide };
        kopien[alt.uuid] = k;
        self.haeute.push(k);
      }
      n.material = kopien[alt.uuid];
    });
  };

  // ---------- Wechsel ----------

  // kameraLassen: beim Umbau des Teleskops die Kamera nicht anfassen
  Ansicht.prototype.setze = function (modus, sofort, kameraLassen) {
    if (!ZIELE[modus]) return;
    this.modus = modus;
    if (modus === 'aufgeschnitten') this.merkeSchnittRichtung();

    var von = Object.assign({}, this.wert);
    var nach = ZIELE[modus];
    var self = this;
    this.beschriftung.zeige(function () { return false; });

    function schritt(t) {
      Object.keys(nach).forEach(function (k) {
        self.wert[k] = von[k] + (nach[k] - von[k]) * t;
      });
      self.anwenden();
      if (t === 1) self.schilderZeigen();
    }

    if (sofort) {
      this.buehne.stoppe('ansicht');
      schritt(1);
    } else {
      this.buehne.animiere('ansicht', DAUER_MS, schritt);
    }
    if (!kameraLassen) this.kameraNachfuehren(sofort);
    O.Ereignisse.melde('ansicht-geaendert', modus);
  };

  // Aufgeschnitten wird die Seite, die gerade zur Kamera zeigt.
  // Gemerkt im Tubus-System, damit der Schnitt beim Zerlegen mitwandert.
  Ansicht.prototype.merkeSchnittRichtung = function () {
    var tubus = this.t.tubus;
    var m = this.t.masse;
    var mitte = new THREE.Vector3(0, 0, (m.zHinten + m.zVorne) / 2);
    var kamera = tubus.worldToLocal(this.buehne.kamera.position.clone());
    var r = kamera.sub(mitte);
    r.z = 0;
    if (r.lengthSq() < 1) r.set(1, 0, 0);
    this.schnittRichtung.copy(r.normalize());
  };

  Ansicht.prototype.anwenden = function () {
    var w = this.wert;
    var m = this.t.masse;

    // Zerlegen: jedes Teil von seinem Platz zum Ziel
    this.ziele.forEach(function (z) {
      z.objekt.position.copy(z.basis).addScaledVector(z.versatz, w.zerlegt);
    });

    // Schnitt: Ebene durch die Tubusachse, von außen hereingefahren.
    // Behalten wird, was höchstens s vor der Achse (zur Kamera hin) liegt.
    var tubus = this.t.tubus;
    tubus.updateMatrixWorld(true);
    var s = (1 - w.schnitt) * (m.rAussen + 60);
    if (w.schnitt <= 0) {
      this.ebene.set(new THREE.Vector3(0, 1, 0), 1e9);
    } else {
      var achse = tubus.localToWorld(new THREE.Vector3(0, 0, 0));
      var c = this.schnittRichtung.clone().transformDirection(tubus.matrixWorld);
      this.ebene.normal.copy(c).negate();
      this.ebene.constant = c.dot(achse) + s;
    }

    // Röntgen: Außenhaut fast durchsichtig, schwarze Innenseite ganz weg
    this.haeute.forEach(function (k) {
      var ziel = k.userData.innen ? 0 : DURCHSICHTIG;
      var deck = k.userData.deckkraft * (1 - w.roentgen * (1 - ziel));
      var durch = k.userData.durchsichtig || deck < 0.999;
      if (durch !== k.transparent) k.needsUpdate = true;
      k.transparent = durch;
      k.opacity = deck;
      // Durchsichtiges schreibt keine Tiefe, sonst verdeckt es die Optik dahinter
      k.depthWrite = k.userData.durchsichtig ? false : !durch;
      k.visible = deck > 0.01;
    });

    this.auswahl.angleichen();
  };

  // ---------- Kamera ----------

  // Beim Zerlegen wächst das Teleskop – die Kamera geht so weit zurück,
  // dass alles ins Bild passt (aber nie näher heran als gerade).
  Ansicht.prototype.kameraNachfuehren = function (sofort) {
    var b = this.buehne;
    var k = b.kamera;
    var steuerung = b.steuerung;

    var merke = this.wert.zerlegt;
    this.wert.zerlegt = ZIELE[this.modus].zerlegt;
    this.anwenden();
    var huelle = O.Dobson.huelle(this.t);
    this.wert.zerlegt = merke;
    this.anwenden();

    var vonZiel = steuerung.target.clone();
    var vonPos = k.position.clone();
    var richtung = vonPos.clone().sub(vonZiel).normalize();
    var noetig = b.abstandFuer(huelle.radius);
    var abstand = Math.max(vonPos.distanceTo(vonZiel), this.modus === 'zerlegt' ? noetig : 0);
    var nachZiel = this.modus === 'zerlegt' ? huelle.center : vonZiel;
    var nachPos = nachZiel.clone().addScaledVector(richtung, abstand);
    if (nachPos.distanceTo(vonPos) < 1 && nachZiel.distanceTo(vonZiel) < 1) return;

    function schritt(t) {
      steuerung.target.lerpVectors(vonZiel, nachZiel, t);
      k.position.lerpVectors(vonPos, nachPos, t);
    }
    if (sofort) {
      b.stoppe('kamera');
      schritt(1);
    } else {
      b.animiere('kamera', DAUER_MS, schritt);
    }
  };

  // ---------- Schilder ----------

  Ansicht.prototype.schilderZeigen = function () {
    var modus = this.modus;
    this.beschriftung.zeige(function (s) {
      var info = O.TEILE[s.objekt.userData.teil] || {};
      if (s.schluessel === 'hoehenradLinks') return false;     // ein Schild reicht
      if (modus === 'zerlegt') return true;
      if (modus === 'aufgeschnitten' || modus === 'roentgen') return !!info.innen;
      return false;
    });
  };

  // Ist ein Treffer des Mausstrahls wirklich zu sehen? (für Auswahl.js)
  // Weggeschnittene und fast durchsichtige Flächen lassen den Klick durch.
  Ansicht.prototype.istSichtbar = function (treffer) {
    var mat = treffer.object.material;
    if (mat.clippingPlanes && mat.clippingPlanes.some(function (e) {
      return e.distanceToPoint(treffer.point) < 0;
    })) return false;
    return !(mat.transparent && mat.opacity < 0.35);
  };

  O.Ansicht = Ansicht;
})(globalThis.OPTIK = globalThis.OPTIK || {});
