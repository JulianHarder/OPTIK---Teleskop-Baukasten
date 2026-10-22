/*
  Lichtpulse: kleine leuchtende Punkte, die mit gleichmäßiger
  Geschwindigkeit die Strahlen entlangwandern – hinunter zum Spiegel,
  zurück nach oben, zur Seite ins Okular. So sieht man, in welche Richtung
  das Licht läuft und dass es im Tubus umkehrt.

  Stark verlangsamt: echtes Licht bräuchte für den Weg durch den Tubus
  rund 4 Milliardstel Sekunden.
*/
(function (O) {
  'use strict';

  var TEMPO_MM_S = 650;
  var GROESSE_MM = 11;

  // Pfad vorbereiten: Punkte als Vektoren und Weglänge bis zu jedem Punkt
  function strecke(pfad) {
    var p = pfad.punkte.map(function (q) { return new THREE.Vector3(q.x, q.y, q.z); });
    var bis = [0];
    for (var i = 1; i < p.length; i++) bis.push(bis[i - 1] + p[i].distanceTo(p[i - 1]));
    return { punkte: p, bis: bis, laenge: bis[bis.length - 1], geschluckt: pfad.geschluckt, farbe: pfad.farbe };
  }

  // Ort nach Weg s; dazu die Helligkeit (am Anfang und freien Ende verblassen)
  function ortBei(st, s, ziel) {
    var i = 1;
    while (i < st.bis.length - 1 && st.bis[i] < s) i++;
    var a = st.bis[i - 1];
    var t = (s - a) / Math.max(1e-9, st.bis[i] - a);
    ziel.lerpVectors(st.punkte[i - 1], st.punkte[i], t);
    if (i === 1) return t;                                             // vom Himmel her einblenden
    if (i === st.bis.length - 1 && !st.geschluckt) return 1 - t;       // ins Freie ausblenden
    return 1;
  }

  // pfade = Liste aus dem Strahlverfolger, jeProPfad = Pulse pro Strahl
  function Lichtpulse(pfade, jeProPfad) {
    var self = this;
    this.strecken = [];
    pfade.forEach(function (p, i) {
      var st = strecke(p);
      for (var k = 0; k < jeProPfad; k++) {
        // versetzt starten, damit nicht alle Pulse gleichzeitig ankommen
        self.strecken.push({ st: st, versatz: (k / jeProPfad + i * 0.137) % 1 });
      }
    });

    var n = this.strecken.length;
    var g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(n * 3), 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(n * 3), 3));
    this.punkte = new THREE.Points(g, new THREE.PointsMaterial({
      map: O.Strahlenbild.fleck(), size: GROESSE_MM, sizeAttenuation: true,
      vertexColors: true, blending: THREE.AdditiveBlending,
      transparent: true, depthWrite: false, toneMapped: false
    }));
    this.punkte.frustumCulled = false;
    this.punkte.renderOrder = 6;
    this.hilf = new THREE.Vector3();
  }

  // Neue Lage aller Pulse zur Zeit zeit (ms)
  Lichtpulse.prototype.setze = function (zeit) {
    var pos = this.punkte.geometry.attributes.position;
    var farbe = this.punkte.geometry.attributes.color;
    var f = O.Strahlenbild.FARBE;
    var weg = zeit / 1000 * TEMPO_MM_S;
    var hilf = this.hilf;

    this.strecken.forEach(function (e, i) {
      var L = e.st.laenge;
      var s = ((weg + e.versatz * L) % L + L) % L;
      var h = ortBei(e.st, s, hilf);
      var c = e.st.farbe;
      pos.setXYZ(i, hilf.x, hilf.y, hilf.z);
      if (c) farbe.setXYZ(i, c[0] * h, c[1] * h, c[2] * h);
      else farbe.setXYZ(i, f.r * h, f.g * h, f.b * h);
    });
    pos.needsUpdate = true;
    farbe.needsUpdate = true;
  };

  Lichtpulse.prototype.entsorge = function () {
    this.punkte.geometry.dispose();
    this.punkte.material.dispose();
  };

  O.Lichtpulse = Lichtpulse;
})(globalThis.OPTIK = globalThis.OPTIK || {});
