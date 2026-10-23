/*
  Welches Bauteil liegt unter der Maus? Hervorheben beim Darüberfahren,
  Auswählen per Klick.

  Ein Klick ist ein Drücken und Loslassen ohne nennenswerte Bewegung –
  sonst war es ein Drehen der Kamera (OrbitControls) und kein Klick.

  Hervorgehoben wird, indem die Netze eines Bauteils vorübergehend eine
  Kopie ihres Materials mit bläulichem Leuchten bekommen. Die Materialien
  sind zwischen Bauteilen geteilt; das Original anzufassen würde alle
  Teile aus demselben Material mit aufleuchten lassen.
*/
(function (O) {
  'use strict';

  var KLICK_PX = 5;
  var LEUCHTEN = {
    schweben: { farbe: 0x3b78c4, staerke: 0.55 },
    gewaehlt: { farbe: 0xd9a63a, staerke: 0.5 }
  };

  // optionen = { wurzeln() → [Object3D], istSichtbar(treffer) → bool,
  //             beiWahl(teil|null), beiSchweben(teil|null, x, y) }
  // wurzeln ist eine Funktion, weil das Teleskop beim Umbauen ersetzt wird.
  function Auswahl(buehne, optionen) {
    this.buehne = buehne;
    this.o = optionen;
    this.strahl = new THREE.Raycaster();
    this.zeiger = new THREE.Vector2();
    this.schwebt = null;
    this.gewaehlt = null;
    this.kopien = {};           // Leucht-Kopien je Material und Art
    this.getauscht = [];        // Netze mit Leucht-Material
    this.runter = null;

    var c = buehne.renderer.domElement;
    var self = this;
    c.addEventListener('pointerdown', function (e) {
      self.runter = { x: e.clientX, y: e.clientY, knopf: e.button };
    });
    c.addEventListener('pointerup', function (e) {
      var r = self.runter;
      self.runter = null;
      if (!r || r.knopf !== 0) return;
      if (Math.hypot(e.clientX - r.x, e.clientY - r.y) > KLICK_PX) return;
      self.waehle(self.teilBei(e.clientX, e.clientY));
    });
    c.addEventListener('pointermove', function (e) {
      if (e.buttons) return;     // wird gerade gedreht
      self.letzteMaus = { x: e.clientX, y: e.clientY };
      if (!self.mausBestellt) {
        self.mausBestellt = true;
        requestAnimationFrame(function () {
          self.mausBestellt = false;
          var m = self.letzteMaus;
          self.schwebe(self.teilBei(m.x, m.y), m.x, m.y);
        });
      }
    });
    c.addEventListener('pointerleave', function () { self.schwebe(null); });
  }

  // Name des vordersten sichtbaren Bauteils unter dem Bildschirmpunkt
  Auswahl.prototype.teilBei = function (x, y) {
    var c = this.buehne.renderer.domElement.getBoundingClientRect();
    this.zeiger.set(((x - c.left) / c.width) * 2 - 1, -((y - c.top) / c.height) * 2 + 1);
    this.strahl.setFromCamera(this.zeiger, this.buehne.kamera);
    var treffer = this.strahl.intersectObjects(this.o.wurzeln(), true);
    for (var i = 0; i < treffer.length; i++) {
      var t = treffer[i];
      if (t.object.userData.teil && t.object.visible && this.o.istSichtbar(t)) {
        this.getroffen = t.object;     // welches Netz genau (für den Fokus beim Zerlegen)
        return t.object.userData.teil;
      }
    }
    return null;
  };

  Auswahl.prototype.schwebe = function (teil, x, y) {
    if (teil !== this.schwebt) {
      this.schwebt = teil;
      this.buehne.renderer.domElement.style.cursor = teil ? 'pointer' : '';
      this.leuchten();
    }
    if (this.o.beiSchweben) this.o.beiSchweben(teil, x, y);
  };

  Auswahl.prototype.waehle = function (teil) {
    this.gewaehlt = teil;
    this.leuchten();
    if (this.o.beiWahl) this.o.beiWahl(teil);
  };

  // ---------- Leuchten ----------

  Auswahl.prototype.kopie = function (mat, art) {
    var schluessel = mat.uuid + art;
    if (!this.kopien[schluessel]) {
      var k = mat.clone();
      if (k.emissive) {
        k.emissive.setHex(LEUCHTEN[art].farbe);
        k.emissiveIntensity = LEUCHTEN[art].staerke;
      }
      this.kopien[schluessel] = k;
    }
    var kopie = this.kopien[schluessel];
    // Durchsichtigkeit und Schnitt können sich seit dem Kopieren geändert haben
    kopie.opacity = mat.opacity;
    kopie.transparent = mat.transparent;
    kopie.depthWrite = mat.depthWrite;
    kopie.clippingPlanes = mat.clippingPlanes;
    kopie.clipShadows = mat.clipShadows;
    return kopie;
  };

  // Alle Netze auf ihr eigenes Material zurück, dann gewählt/schwebend neu
  Auswahl.prototype.leuchten = function () {
    this.getauscht.forEach(function (n) {
      n.material = n.userData.eigenesMaterial;
    });
    this.getauscht = [];

    var self = this;
    [[this.gewaehlt, 'gewaehlt'], [this.schwebt, 'schweben']].forEach(function (paar) {
      if (!paar[0]) return;
      self.o.wurzeln().forEach(function (w) {
        w.traverse(function (n) {
          if (!n.isMesh || n.userData.teil !== paar[0] || self.getauscht.indexOf(n) >= 0) return;
          n.userData.eigenesMaterial = n.material;
          n.material = self.kopie(n.material, paar[1]);
          self.getauscht.push(n);
        });
      });
    });
    this.buehne.zeichneBald();
  };

  // Nach einer Änderung an den eigenen Materialien (Ansicht.js) die
  // Leucht-Kopien angleichen
  Auswahl.prototype.angleichen = function () {
    var self = this;
    this.getauscht.forEach(function (n) {
      var art = n.material === self.kopien[n.userData.eigenesMaterial.uuid + 'gewaehlt'] ? 'gewaehlt' : 'schweben';
      n.material = self.kopie(n.userData.eigenesMaterial, art);
    });
  };

  // Das Teleskop wurde neu gebaut: Leucht-Kopien gehören zu alten
  // Materialien und werden freigegeben. Die Wahl bleibt (gleicher Name),
  // das neue Teil leuchtet gleich wieder.
  Auswahl.prototype.neuesTeleskop = function () {
    var k = this.kopien;
    Object.keys(k).forEach(function (s) { k[s].dispose(); });
    this.kopien = {};
    this.getauscht = [];
    this.schwebt = null;
    this.leuchten();
  };

  O.Auswahl = Auswahl;
})(globalThis.OPTIK = globalThis.OPTIK || {});
