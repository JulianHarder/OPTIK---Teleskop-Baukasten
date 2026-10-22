/*
  Sternlicht an und aus, und wie weit der Stern neben der Blickrichtung
  steht. Baut das Lichtbild (Strahlenbild + Lichtpulse) im Tubus auf und
  zeigt unten rechts, ob der Stern im Okular zu sehen ist.

  Im Modus „ganz“ verschwindet das Licht im undurchsichtigen Rohr –
  beim Einschalten wechselt die Ansicht deshalb auf „aufgeschnitten“
  (vor der dunklen Innenwand leuchtet das Licht am deutlichsten). Beim Zerlegen
  passt der Lichtweg nicht mehr zu den Teilen; dann ist das Licht aus.
*/
(function (O) {
  'use strict';

  var T = null;   // O.TEXTE.licht, beim Bauen gesetzt

  function el(tag, klasse, text) {
    var e = document.createElement(tag);
    if (klasse) e.className = klasse;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  var LUPE_BREITE_MM = 30;     // so viel zeigt die Brennpunkt-Lupe

  function Licht(buehne, teleskop, ansicht, leiste, nav) {
    T = O.TEXTE.licht;
    this.buehne = buehne;
    this.t = teleskop;
    this.ansicht = ansicht;
    this.leiste = leiste;
    this.gruppe = null;
    this.pulse = null;
    this.baueKnopf(nav);
    this.baueLeiste();
    this.baueLupe();

    var self = this;
    O.Ereignisse.an('ansicht-geaendert', function () { self.sichtbarkeit(); });
  }

  // ---------- Oberfläche ----------

  Licht.prototype.baueKnopf = function (nav) {
    nav.appendChild(el('span', 'ansicht-trenner'));
    var k = el('button', 'ansicht-knopf licht-knopf');
    k.type = 'button';
    k.setAttribute('aria-pressed', 'false');
    k.appendChild(el('kbd', null, 'L'));
    k.appendChild(document.createTextNode(' ' + T.knopf));
    var self = this;
    k.addEventListener('click', function () { self.umschalten(); });
    nav.appendChild(k);
    this.knopf = k;
  };

  Licht.prototype.baueLeiste = function () {
    var l = this.leiste;
    l.appendChild(el('h2', 'licht-titel', T.titel));

    var regler = el('label', 'licht-regler');
    var kopf = el('span', 'licht-regler-kopf');
    kopf.appendChild(el('span', null, T.versatz));
    this.wert = el('span', 'licht-wert');
    kopf.appendChild(this.wert);
    regler.appendChild(kopf);
    var schieber = el('input');
    schieber.type = 'range';
    schieber.min = 0;
    schieber.max = 1.5;
    schieber.step = 0.02;
    schieber.value = O.zustand.sternVersatzGrad;
    var self = this;
    schieber.addEventListener('input', function () {
      O.zustand.sternVersatzGrad = parseFloat(schieber.value);
      self.baue();
    });
    regler.appendChild(schieber);
    l.appendChild(regler);

    this.feld = el('p', 'licht-feld');
    l.appendChild(this.feld);
    this.status = el('p', 'licht-status');
    l.appendChild(this.status);
  };

  Licht.prototype.zeigeStatus = function (licht) {
    var z = O.zustand;
    var feld = O.Optik.wahresFeldGrad(this.t.masse, z.okularMm);
    this.wert.textContent = O.Format.zahl(z.sternVersatzGrad, 2) + '°';
    this.feld.textContent = T.feld
      .replace('{feld}', O.Format.zahl(feld, 2))
      .replace('{mond}', O.Format.zahl(feld / 0.52, 1));

    var art = licht.imBild >= 0.999 ? 'mitte' : licht.imBild > 0 ? 'rand' : 'daneben';
    this.status.textContent = T[art].replace('{anteil}', Math.round(licht.imBild * 100));
    this.status.className = 'licht-status ' + { mitte: 'gut', rand: 'warnung', daneben: 'schlecht' }[art];
  };

  // ---------- Brennpunkt-Lupe ----------

  // Der Brennpunkt aus der Nähe: nur die Lichtstrahlen (Ebene 1), von der
  // Seite gesehen, 30 mm breit. Hier sieht man, ob sich alle Farben in
  // einem Punkt treffen.
  Licht.prototype.baueLupe = function () {
    var rahmen = el('figure', 'brennpunkt-lupe');
    rahmen.hidden = true;
    rahmen.appendChild(el('figcaption', null, T.lupe.replace('{mm}', LUPE_BREITE_MM)));
    document.body.appendChild(rahmen);
    this.lupenRahmen = rahmen;

    var kamera = new THREE.PerspectiveCamera(12, 1, 1, 2000);
    kamera.layers.set(2);
    var self = this;
    var F = new THREE.Vector3();
    var seite = new THREE.Vector3();
    this.buehne.lupe = {
      kamera: kamera,
      element: rahmen,
      stelle: function () {
        var t = self.t;
        var m = t.masse;
        var u = new THREE.Vector3(Math.cos(m.fokusWinkel), Math.sin(m.fokusWinkel), 0);
        var fLokal = u.clone().multiplyScalar(m.seitlich).setZ(m.zFang);
        t.tubus.localToWorld(F.copy(fLokal));
        // senkrecht auf die Ebene aus Achse und Auszug schauen
        var w = new THREE.Vector3(0, 0, 1).cross(u);
        seite.copy(w).transformDirection(t.tubus.matrixWorld);
        var abstand = LUPE_BREITE_MM / 2 / Math.tan(kamera.fov * Math.PI / 360);
        kamera.position.copy(F).addScaledVector(seite, abstand);
        kamera.up.set(0, 0, 1).transformDirection(t.tubus.matrixWorld);
        kamera.lookAt(F);
      }
    };
  };

  // Was die Lupe zeigt (Ebene 2, im Hauptbild unsichtbar): je Farbe nur
  // die zwei äußersten Strahlen des Fächers – wo sie sich kreuzen, liegt
  // der Brennpunkt dieser Farbe. Dazu ein grauer Strich: die Feldblende
  // des Okulars, auf die scharf gestellt ist.
  Licht.prototype.lupenBild = function (licht) {
    var gruppen = {};
    licht.faecher.forEach(function (p) {
      var k = p.linie || 'alle';
      (gruppen[k] = gruppen[k] || []).push(p);
    });
    var pos = [];
    var farbe = [];
    var standard = O.Strahlenbild.FARBE;
    Object.keys(gruppen).forEach(function (k) {
      var g = gruppen[k];
      [g[0], g[g.length - 1]].forEach(function (pfad) {
        var c = pfad.farbe || [standard.r, standard.g, standard.b];
        for (var i = 1; i < pfad.punkte.length - 1; i++) {
          [pfad.punkte[i], pfad.punkte[i + 1]].forEach(function (q) {
            pos.push(q.x, q.y, q.z);
            farbe.push(c[0], c[1], c[2]);
          });
        }
      });
    });
    // Feldblende: Strich quer zum Auszug im Brennpunkt
    var m = this.t.masse;
    var u = new THREE.Vector3(Math.cos(m.fokusWinkel), Math.sin(m.fokusWinkel), 0);
    var F = u.clone().multiplyScalar(m.seitlich).setZ(m.zFang);
    var r = O.Optik.feldblendeMm(O.zustand.okularMm) / 2;
    [F.clone().setZ(F.z - r), F.clone().setZ(F.z + r)].forEach(function (q) {
      pos.push(q.x, q.y, q.z);
      farbe.push(0.45, 0.5, 0.55);
    });
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(farbe, 3));
    var linien = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ vertexColors: true, toneMapped: false }));
    linien.layers.set(2);
    linien.frustumCulled = false;
    return linien;
  };

  // ---------- An und aus ----------

  Licht.prototype.umschalten = function () {
    this.setze(!O.zustand.lichtAn);
  };

  Licht.prototype.setze = function (an) {
    O.zustand.lichtAn = an;
    this.knopf.setAttribute('aria-pressed', an ? 'true' : 'false');
    document.body.classList.toggle('licht-an', an);
    this.leiste.hidden = !an;
    if (an) {
      this.baue();
      var modus = this.ansicht.modus;
      if (modus === 'ganz' || modus === 'zerlegt') this.ansicht.setze('aufgeschnitten');
    }
    this.sichtbarkeit();
  };

  // Lichtbild neu rechnen und aufbauen (beim Einschalten und wenn der
  // Stern verschoben wird)
  Licht.prototype.baue = function () {
    this.abbauen();
    var licht = O.Optik.licht(this.t.masse, O.zustand, O.zustand.sternVersatzGrad);
    var ringPfade = [];
    licht.ringe.forEach(function (r) { ringPfade = ringPfade.concat(r.pfade); });
    this.gruppe = O.Strahlenbild.erzeuge(licht);
    this.pulse = new O.Lichtpulse(licht.faecher, licht.ringe.length > 1 ? 1 : 2);
    this.gruppe.add(this.pulse.punkte);
    this.ringPulse = new O.Lichtpulse(ringPfade, 1);
    this.gruppe.add(this.ringPulse.punkte);
    this.t.tubus.add(this.gruppe);
    this.gruppe.add(this.lupenBild(licht));
    this.pulse.setze(performance.now());        // nicht alle im Ursprung starten
    this.ringPulse.setze(performance.now());
    this.zeigeStatus(licht);
    this.sichtbarkeit();
  };

  Licht.prototype.abbauen = function () {
    if (!this.gruppe) return;
    if (this.gruppe.parent) this.gruppe.parent.remove(this.gruppe);
    this.pulse.entsorge();
    this.ringPulse.entsorge();
    O.Strahlenbild.entsorge(this.gruppe);
    this.gruppe = null;
  };

  // Teleskop wurde umgebaut (oder nur das Okular gewechselt): Licht neu
  Licht.prototype.neuesTeleskop = function (teleskop, ansicht) {
    if (this.gruppe && this.gruppe.parent) this.gruppe.parent.remove(this.gruppe);
    this.abbauen();
    this.t = teleskop;
    this.ansicht = ansicht;
    if (O.zustand.lichtAn) this.baue();
    else this.sichtbarkeit();
  };

  // Sichtbar, wenn an und nicht zerlegt; nur dann laufen die Pulse
  Licht.prototype.sichtbarkeit = function () {
    var zeigen = O.zustand.lichtAn && this.gruppe && this.ansicht.modus !== 'zerlegt';
    if (this.gruppe) this.gruppe.visible = !!zeigen;
    this.lupenRahmen.hidden = !zeigen;
    var self = this;
    this.buehne.dauerlauf('lichtpulse', zeigen ? function (zeit) {
      self.pulse.setze(zeit);
      self.ringPulse.setze(zeit);
    } : null);
  };

  O.Licht = Licht;
})(globalThis.OPTIK = globalThis.OPTIK || {});
