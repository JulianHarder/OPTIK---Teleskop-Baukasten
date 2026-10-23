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

  var BODEN_ABSTAND = 40;   // mm – so tief darf die Kamera über der Wiese
  var NAH_MM = 50;          // so nah rückt der Zoom an eine Fläche heran

  // Trifft der Mausstrahl etwas, das man sieht? Der Raycaster prüft
  // Sichtbarkeit nicht – ausgeschaltetes Licht im Rohr oder die
  // ausgeblendete Röntgen-Haut würden sonst wie eine Wand bremsen.
  function sichtbar(o) {
    if (!o.isMesh || (o.material && o.material.visible === false)) return false;
    for (; o; o = o.parent) if (!o.visible) return false;
    return true;
  }

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
    r.localClippingEnabled = true;   // für die Ansicht „aufgeschnitten“
    behaelter.appendChild(r.domElement);

    this.szene = new THREE.Scene();
    this.himmel = null;           // wird von main.js gesetzt (Himmel.js)
    this.kamera = new THREE.PerspectiveCamera(40, 1, 5, 120000);

    var s = new THREE.OrbitControls(this.kamera, r.domElement);
    s.enableDamping = true;
    s.dampingFactor = 0.08;
    s.screenSpacePanning = true;
    s.rotateSpeed = 0.5;   // halb so schnell wie üblich – sonst zu hektisch
    s.minDistance = 150;
    // Das Mausrad zoomt zur Maus, nicht zur Bildmitte (zoomZurMaus).
    // OrbitControls r128 kann das nicht; sein eigener Rad-Zoom bekommt das
    // Ereignis deshalb gar nicht erst – Kneifen mit zwei Fingern bleibt ihm.
    s.maxDistance = 9000;
    s.maxPolarAngle = Math.PI / 2 - 0.03;   // nicht unter die Wiese
    this.steuerung = s;

    this.linksBelegt = 314;  // px, Breite der Bedienspalte samt Rand (css/seite.css)
    this.bedarf = true;      // ein Bild ist bestellt
    this.laeuft = false;     // Schleife aktiv
    this.festhalten = false; // Maus gedrückt
    this.animationen = [];   // laufende Übergänge (siehe animiere)
    this.dauer = {};         // Dauerläufer, z. B. Lichtpulse (siehe dauerlauf)
    this.nachBild = [];      // Aufrufe nach jedem Bild (z. B. Beschriftungen)
    this.zaehler = { bilder: 0, seit: performance.now(), anzeige: null };

    this.zoomZiele = function () { return []; };   // setzt main.js
    this.zoomFilter = function () { return true; };
    this.zoomMitte = function () { return { drehpunkt: s.target.clone(), radius: 1000 }; };
    this.bodenDa = function () { return false; };

    var self = this;
    // Auch über den Schildern der Bauteile (die liegen über der Bühne)
    window.addEventListener('wheel', function (e) {
      var ueberSchild = e.target.closest && e.target.closest('.schilder');
      if ((e.target !== r.domElement && !ueberSchild) || !s.enabled || !s.enableZoom) return;
      e.preventDefault();
      e.stopPropagation();
      self.zoomZurMaus(e);
    }, { capture: true, passive: false });
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
    // Links liegt die Bedienspalte über der Bühne: Bildmitte um die halbe
    // Spaltenbreite nach rechts schieben, damit das Teleskop in der Mitte
    // des freien Bereichs steht (nicht auf schmalen Bildschirmen)
    var versatz = b > 900 ? this.linksBelegt / 2 : 0;
    if (versatz) this.kamera.setViewOffset(b, h, -versatz, 0, b, h);
    else this.kamera.clearViewOffset();
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

  Buehne.prototype.bild = function (zeit) {
    // update() meldet true, solange die Kamera noch nachgleitet
    var bewegt = this.steuerung.update();
    this.ueberDemBoden();
    var animiert = this.schritt(zeit);
    // Eine Kamerafahrt hat Position und Ziel gerade neu gesetzt – die
    // Blickrichtung jetzt nachziehen, sonst zeigt jedes Bild noch die des
    // vorigen (das ruckelt)
    if (animiert) this.steuerung.update();
    var dauernd = this.dauerSchritt(zeit);
    if (bewegt || animiert || dauernd || this.bedarf) this.zeichne();

    if ((bewegt || animiert || dauernd || this.festhalten) && !document.hidden) {
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
    for (var i = 0; i < this.nachBild.length; i++) this.nachBild[i]();
    this.zaehle();
  };

  // ---------- Übergänge ----------

  // Ruft fn(t) mit t von 0 bis 1 über dauerMs auf, sanft beschleunigt und
  // gebremst. Eine neue Animation mit demselben Namen ersetzt die alte –
  // so kann man mitten in einem Übergang umentscheiden.
  Buehne.prototype.animiere = function (name, dauerMs, fn) {
    if (name === 'kamera') this.ohneSchwung();
    this.animationen = this.animationen.filter(function (a) { return a.name !== name; });
    this.animationen.push({ name: name, dauer: dauerMs, fn: fn, start: null });
    this.zeichneBald();
  };

  // Den Nachschwung nach dem Drehen (Dämpfung von OrbitControls) beenden,
  // ohne dass die Kamera springt – sonst schiebt er eine Kamerafahrt in
  // jedem Bild ein Stück in die andere Richtung
  Buehne.prototype.ohneSchwung = function () {
    var s = this.steuerung;
    var pos = this.kamera.position.clone();
    var ziel = s.target.clone();
    s.enableDamping = false;
    s.update();                 // verbraucht den Rest des Schwungs …
    s.enableDamping = true;
    this.kamera.position.copy(pos);
    s.target.copy(ziel);
    s.update();                 // … und alles steht wieder, wo es war
  };

  // Schritt-Funktion für eine Kamerafahrt (für animiere): Das Ziel gleitet
  // geradeaus, die Kamera auf einem Bogen um das Ziel – Winkel und Abstand
  // wachsen gleichmäßig. Gerade Linien schnitten quer durch den Kreis ums
  // Teleskop: erst näher, dann wieder weg, die Blickrichtung drehte in der
  // Mitte ruckartig.
  Buehne.prototype.bogen = function (vonPos, vonZiel, nachPos, nachZiel) {
    var k = this.kamera;
    var s = this.steuerung;
    var a = new THREE.Spherical().setFromVector3(vonPos.clone().sub(vonZiel));
    var z = new THREE.Spherical().setFromVector3(nachPos.clone().sub(nachZiel));
    var dTheta = z.theta - a.theta;
    dTheta -= 2 * Math.PI * Math.round(dTheta / (2 * Math.PI));   // kürzerer Weg
    var kugel = new THREE.Spherical();
    return function (t) {
      s.target.lerpVectors(vonZiel, nachZiel, t);
      kugel.set(a.radius + (z.radius - a.radius) * t, a.phi + (z.phi - a.phi) * t, a.theta + dTheta * t);
      k.position.setFromSpherical(kugel).add(s.target);
    };
  };

  // Etwas, das in jedem Bild weiterläuft, solange es angemeldet ist
  // (fn(zeit)); fn = null meldet es ab. Nur für Dinge, die man wirklich
  // ständig sehen soll – solange ein Dauerläufer da ist, steht die
  // Schleife nie still.
  Buehne.prototype.dauerlauf = function (name, fn) {
    if (fn) this.dauer[name] = fn;
    else delete this.dauer[name];
    this.zeichneBald();
  };

  Buehne.prototype.dauerSchritt = function (zeit) {
    var namen = Object.keys(this.dauer);
    zeit = zeit || performance.now();
    for (var i = 0; i < namen.length; i++) this.dauer[namen[i]](zeit);
    return namen.length > 0;
  };

  // Laufende Animation abbrechen (wer sofort ans Ziel springt, braucht sie nicht mehr)
  Buehne.prototype.stoppe = function (name) {
    this.animationen = this.animationen.filter(function (a) { return a.name !== name; });
  };

  // Einen Schritt aller Animationen; true, solange noch eine läuft
  Buehne.prototype.schritt = function (zeit) {
    if (!this.animationen.length) return false;
    zeit = zeit || performance.now();
    // Über eine Kopie laufen: Eine Animation darf am Ende eine neue
    // starten (Schwenken → Flug ins Okular). Würde hier die Liste direkt
    // neu gefiltert, ginge die neue verloren.
    var fertig = [];
    this.animationen.slice().forEach(function (a) {
      if (a.start === null) a.start = zeit;
      var t = Math.min(1, (zeit - a.start) / a.dauer);
      if (t >= 1) fertig.push(a);
      a.fn(t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    });
    this.animationen = this.animationen.filter(function (a) { return fertig.indexOf(a) < 0; });
    return true;
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

  // Wie weit muss die Kamera weg, damit eine Kugel mit diesem Radius ganz
  // ins Bild passt? Maßgeblich ist der engere Blickwinkel – im Hochformat
  // (Handy) ist das der waagerechte.
  Buehne.prototype.abstandFuer = function (radius) {
    var k = this.kamera;
    var senkrecht = k.fov * Math.PI / 180;
    var waagerecht = 2 * Math.atan(Math.tan(senkrecht / 2) * k.aspect);
    return radius / Math.sin(Math.min(senkrecht, waagerecht) / 2);
  };

  // Mausrad: Die Kamera fährt auf dem Strahl durch die Maus – so bleibt,
  // was unter der Maus liegt, dort stehen, und die Blickrichtung ändert
  // sich nicht. Die Schrittweite ist immer 6 % pro Raste vom Abstand zur
  // Teleskopmitte (zoomMitte), egal ob die Maus auf dem Teleskop liegt
  // oder daneben (Julian: sonst mal langsam, mal schnell). Nur wenn eine
  // getroffene Fläche näher ist, zählt deren Abstand – sonst führe man
  // hindurch. Danach liegt der Drehpunkt wieder in der Tiefe des
  // Teleskops – sonst dreht man sich um einen Punkt davor.
  Buehne.prototype.zoomZurMaus = function (e) {
    var s = this.steuerung;
    var k = this.kamera;
    var delta = e.deltaY * (e.deltaMode === 1 ? 33 : e.deltaMode === 2 ? 800 : 1);
    // eine Raste (100) ≈ 6 %
    var f = Math.min(1.4, Math.max(0.7, Math.exp(delta * 0.0006)));

    var rect = this.renderer.domElement.getBoundingClientRect();
    var maus = new THREE.Vector2(
      (e.clientX - rect.left) / rect.width * 2 - 1,
      -(e.clientY - rect.top) / rect.height * 2 + 1);
    var strahl = new THREE.Raycaster();
    strahl.setFromCamera(maus, k);

    var flaeche = Infinity;
    var treffer = strahl.intersectObjects(this.zoomZiele().filter(Boolean), true);
    for (var i = 0; i < treffer.length; i++) {
      if (sichtbar(treffer[i].object) && this.zoomFilter(treffer[i])) {
        flaeche = treffer[i].distance;
        break;
      }
    }

    var m = this.zoomMitte();
    var blick = s.target.clone().sub(k.position).normalize();
    var basis = Math.max(s.minDistance, m.drehpunkt.clone().sub(k.position).dot(blick));
    basis = Math.min(basis, flaeche);
    var schritt = basis * (1 - f);              // > 0: hinein, < 0: hinaus
    // nicht näher als 5 cm an die Fläche unter der Maus
    if (schritt > 0) {
      schritt = Math.min(schritt, flaeche - NAH_MM);
      if (schritt <= 0.01) return;
    }
    var pos = k.position.clone().addScaledVector(strahl.ray.direction, schritt);

    // nicht weiter weg als doppelt so weit, wie es braucht, damit alles ins Bild passt
    var grenze = this.abstandFuer(m.radius) * 2;
    if (schritt < 0 && pos.distanceTo(m.drehpunkt) > grenze) {
      if (k.position.distanceTo(m.drehpunkt) >= grenze) return;
      pos.sub(m.drehpunkt).setLength(grenze).add(m.drehpunkt);
    }
    if (this.bodenDa() && pos.y < BODEN_ABSTAND) pos.y = BODEN_ABSTAND;
    k.position.copy(pos);

    // Drehpunkt auf der Blickachse, so tief wie die Mitte des Teleskops
    var tiefe = m.drehpunkt.clone().sub(pos).dot(blick);
    if (this.bodenDa() && blick.y < 0) tiefe = Math.min(tiefe, pos.y / -blick.y);
    tiefe = Math.min(s.maxDistance, Math.max(s.minDistance, tiefe));
    s.target.copy(pos).addScaledVector(blick, tiefe);
    s.update();
    this.zeichneBald();
  };

  // Kamera und Drehpunkt nie unter die Wiese (nach Drehen und Verschieben)
  Buehne.prototype.ueberDemBoden = function () {
    if (!this.bodenDa()) return;
    var s = this.steuerung;
    if (s.target.y < 0) s.target.y = 0;
    if (this.kamera.position.y < BODEN_ABSTAND) this.kamera.position.y = BODEN_ABSTAND;
  };

  // Kamera so setzen, dass ein Bereich (Mittelpunkt, Radius) ganz zu sehen ist
  Buehne.prototype.blickAuf = function (mitte, radius, richtung) {
    var k = this.kamera;
    var abstand = this.abstandFuer(radius) * 1.05;
    var dir = richtung.clone().normalize();
    k.position.copy(mitte).addScaledVector(dir, abstand);
    this.steuerung.target.copy(mitte);
    this.steuerung.update();
    this.zeichneBald();
  };

  O.Buehne = Buehne;
})(globalThis.OPTIK = globalThis.OPTIK || {});
