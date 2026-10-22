/*
  Die 3D-Bühne: Renderer, Kamera, Maussteuerung und die Bildschleife.

  Gezeichnet wird nur bei Bedarf (Lehre aus LANDFALL): wenn die Kamera
  sich bewegt, eine Animation läuft oder sich etwas ändert. Steht alles
  still, steht auch die Schleife – die Grafikkarte hat dann nichts zu tun.

  Zwei Szenen werden übereinander gezeichnet:
    1. der Himmel (folgt der Kamera, hat keine Tiefe – wird nie abgeschnitten)
    2. die Welt mit Wiese und Teleskop
  1 Einheit = 1 mm.
*/
(function (O) {
  'use strict';

  function Buehne(behaelter) {
    this.behaelter = behaelter;

    // Kann der Browser WebGL? Sonst klare Meldung statt schwarzer Fläche.
    try {
      this.renderer = new THREE.WebGLRenderer({ antialias: true });
    } catch (e) {
      this.renderer = null;
      return;
    }

    var r = this.renderer;
    r.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    r.outputEncoding = THREE.sRGBEncoding;
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.15;
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFSoftShadowMap;
    r.autoClear = false;
    behaelter.appendChild(r.domElement);

    this.szene = new THREE.Scene();
    this.himmel = null;           // wird von main.js gesetzt (Himmel.js)
    this.kamera = new THREE.PerspectiveCamera(40, 1, 5, 120000);

    var s = new THREE.OrbitControls(this.kamera, r.domElement);
    s.enableDamping = true;
    s.dampingFactor = 0.08;
    s.screenSpacePanning = true;
    s.minDistance = 150;
    s.maxDistance = 9000;
    s.maxPolarAngle = Math.PI / 2 - 0.03;   // nicht unter die Wiese
    this.steuerung = s;

    this.bedarf = true;      // ein Bild ist bestellt
    this.laeuft = false;     // Schleife aktiv
    this.festhalten = false; // Maus gedrückt
    this.zaehler = { bilder: 0, seit: performance.now(), anzeige: null };

    var self = this;
    s.addEventListener('start', function () { self.festhalten = true; self.starte(); });
    s.addEventListener('end', function () { self.festhalten = false; self.starte(); });
    s.addEventListener('change', function () { self.zeichneBald(); });

    new ResizeObserver(function () { self.groesse(); }).observe(behaelter);
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) self.zeichneBald();
    });
    this.groesse();
  }

  Buehne.prototype.ok = function () {
    return !!this.renderer;
  };

  Buehne.prototype.groesse = function () {
    var b = this.behaelter.clientWidth;
    var h = this.behaelter.clientHeight;
    if (b < 1 || h < 1) return;
    this.renderer.setSize(b, h);
    this.kamera.aspect = b / h;
    this.kamera.updateProjectionMatrix();
    this.zeichneBald();
  };

  // Ein Bild bestellen. Der Timer ist die Rückfallebene für verdeckte
  // Fenster, in denen requestAnimationFrame nicht läuft.
  Buehne.prototype.zeichneBald = function () {
    this.bedarf = true;
    this.starte();
    var self = this;
    clearTimeout(this.notfall);
    this.notfall = setTimeout(function () {
      if (self.bedarf) self.zeichne();
    }, 120);
  };

  Buehne.prototype.starte = function () {
    if (this.laeuft || document.hidden) return;
    this.laeuft = true;
    requestAnimationFrame(this.bild.bind(this));
  };

  Buehne.prototype.bild = function () {
    // update() meldet true, solange die Kamera noch nachgleitet
    var bewegt = this.steuerung.update();
    if (bewegt || this.bedarf) this.zeichne();

    if ((bewegt || this.festhalten) && !document.hidden) {
      requestAnimationFrame(this.bild.bind(this));
    } else {
      this.laeuft = false;
    }
  };

  Buehne.prototype.zeichne = function () {
    var r = this.renderer;
    this.bedarf = false;
    r.clear();
    if (this.himmel) {
      this.himmel.gruppe.position.copy(this.kamera.position);
      r.render(this.himmel.szene, this.kamera);
      r.clearDepth();
    }
    r.render(this.szene, this.kamera);
    this.zaehle();
  };

  // ---------- Bildrate (Taste P, nur zum Prüfen) ----------

  Buehne.prototype.zeigeBildrate = function (element) {
    this.zaehler.anzeige = element;
    var self = this;
    // Auch ohne neue Bilder einmal pro Sekunde auffrischen, sonst bliebe
    // im Stillstand die letzte Zahl stehen statt „0“.
    if (!this.zaehler.takt) {
      this.zaehler.takt = setInterval(function () { self.zaehle(true); }, 1000);
    }
  };

  Buehne.prototype.zaehle = function (nurPruefen) {
    var z = this.zaehler;
    if (!nurPruefen) z.bilder++;
    var jetzt = performance.now();
    if (jetzt - z.seit >= 1000) {
      if (z.anzeige) {
        z.anzeige.textContent = Math.round(z.bilder * 1000 / (jetzt - z.seit)) + ' Bilder/s';
      }
      z.bilder = 0;
      z.seit = jetzt;
    }
  };

  // ---------- Kamera ----------

  // Kamera so setzen, dass ein Bereich (Mittelpunkt, Radius) ganz zu sehen ist
  Buehne.prototype.blickAuf = function (mitte, radius, richtung) {
    var k = this.kamera;
    var abstand = radius / Math.sin((k.fov * Math.PI / 180) / 2) * 1.05;
    var dir = richtung.clone().normalize();
    k.position.copy(mitte).addScaledVector(dir, abstand);
    this.steuerung.target.copy(mitte);
    this.steuerung.update();
    this.zeichneBald();
  };

  O.Buehne = Buehne;
})(globalThis.OPTIK = globalThis.OPTIK || {});
