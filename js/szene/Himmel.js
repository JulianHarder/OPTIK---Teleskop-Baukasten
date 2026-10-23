/*
  Der Nachthimmel: Farbverlauf, Sterne, Milchstraße und eine Kette dunkler
  Hügel am Horizont.

  Der Himmel ist eine eigene Szene, die bei jedem Bild auf die Kamera
  geschoben wird. Er hat damit keine Tiefe, kommt nie näher und wird nie
  abgeschnitten – egal wie weit man zoomt.

  Die Sterne sind zufällig, aber mit festem Startwert und mit einer
  echten Helligkeitsverteilung: wenige helle, sehr viele schwache.
*/
(function (O) {
  'use strict';

  var RADIUS = 50000;   // mm – nur wichtig: kleiner als kamera.far
  var FARBEN = {
    zenit: new THREE.Color(0x03060f),
    mitte: new THREE.Color(0x0a1428),
    horizont: new THREE.Color(0x1f2d4a),   // leichter Lichtschein der Stadt
    huegel: new THREE.Color(0x070b12)
  };

  // Sternfarben von heiß (blau) bis kühl (orange)
  var STERNFARBEN = [
    [0.70, 0.80, 1.00], [0.85, 0.90, 1.00], [1.00, 1.00, 1.00],
    [1.00, 0.96, 0.86], [1.00, 0.87, 0.70], [1.00, 0.76, 0.56]
  ];

  // ---------- Farbverlauf ----------

  function verlauf() {
    var mat = new THREE.ShaderMaterial({
      uniforms: {
        zenit: { value: FARBEN.zenit },
        mitte: { value: FARBEN.mitte },
        horizont: { value: FARBEN.horizont }
      },
      vertexShader: [
        'varying vec3 vRichtung;',
        'void main() {',
        '  vRichtung = normalize(position);',
        '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
        '}'
      ].join('\n'),
      fragmentShader: [
        'uniform vec3 zenit; uniform vec3 mitte; uniform vec3 horizont;',
        'varying vec3 vRichtung;',
        'void main() {',
        '  float h = max(vRichtung.y, 0.0);',
        '  vec3 f = mix(horizont, mitte, smoothstep(0.0, 0.22, h));',
        '  f = mix(f, zenit, smoothstep(0.22, 0.9, h));',
        '  gl_FragColor = vec4(f, 1.0);',
        '}'
      ].join('\n'),
      side: THREE.BackSide,
      depthWrite: false,
      depthTest: false,
      toneMapped: false
    });
    var kugel = new THREE.Mesh(new THREE.SphereGeometry(RADIUS, 48, 24), mat);
    kugel.renderOrder = 0;
    return kugel;
  }

  // ---------- Sterne ----------

  function sternMaterial() {
    return new THREE.ShaderMaterial({
      uniforms: { pixel: { value: Math.min(2, window.devicePixelRatio || 1) } },
      vertexShader: [
        'attribute float groesse;',
        'attribute vec3 farbe;',
        'uniform float pixel;',
        'varying vec3 vFarbe;',
        'void main() {',
        '  vFarbe = farbe;',
        '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
        '  gl_PointSize = groesse * pixel;',
        '}'
      ].join('\n'),
      fragmentShader: [
        'varying vec3 vFarbe;',
        'void main() {',
        '  float d = length(gl_PointCoord - 0.5) * 2.0;',
        '  float a = 1.0 - smoothstep(0.0, 1.0, d);',
        '  a *= a;',
        '  gl_FragColor = vec4(vFarbe * a, 1.0);',
        '}'
      ].join('\n'),
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      toneMapped: false
    });
  }

  // Zufällige Richtung auf der Himmelskugel (gleichmäßig verteilt)
  function richtung(z) {
    var u = z() * 2 - 1;
    var phi = z() * Math.PI * 2;
    var s = Math.sqrt(1 - u * u);
    return new THREE.Vector3(s * Math.cos(phi), u, s * Math.sin(phi));
  }

  // unten = false: der Himmel über dem Horizont (immer zu sehen);
  // unten = true: der Rest der Kugel – nur im Weltall, sonst liegt dort die Wiese
  function sterne(z, unten) {
    var pos = [];
    var farbe = [];
    var groesse = [];

    function stern(dir, hell, punkt, f) {
      pos.push(dir.x * RADIUS * 0.95, dir.y * RADIUS * 0.95, dir.z * RADIUS * 0.95);
      farbe.push(f[0] * hell, f[1] * hell, f[2] * hell);
      groesse.push(punkt);
    }

    // Feldsterne: Helligkeit nach Potenzgesetz – wenige helle, viele schwache
    for (var i = 0; i < 4200; i++) {
      var d = richtung(z);
      if ((d.y < -0.08) !== !!unten) continue;
      var r = z();
      var hell = 0.18 + Math.pow(r, 9) * 1.6;
      var f = STERNFARBEN[Math.floor(z() * STERNFARBEN.length)];
      stern(d, Math.min(1.6, hell), 2.2 + Math.pow(r, 12) * 6, f);
    }

    // Milchstraße: Band um einen geneigten Großkreis, viele schwache Sterne
    var normale = new THREE.Vector3(0.45, 0.55, -0.7).normalize();
    var a = new THREE.Vector3().crossVectors(normale, new THREE.Vector3(0, 1, 0)).normalize();
    var b = new THREE.Vector3().crossVectors(normale, a).normalize();
    for (var k = 0; k < 9000; k++) {
      var t = z() * Math.PI * 2;
      var breite = (z() + z() + z() - 1.5) * 0.16;   // ungefähr glockenförmig
      var dir = a.clone().multiplyScalar(Math.cos(t))
        .addScaledVector(b, Math.sin(t))
        .addScaledVector(normale, breite)
        .normalize();
      if ((dir.y < -0.08) !== !!unten) continue;
      var dichte = 1 - Math.abs(breite) / 0.24;
      stern(dir, 0.08 + z() * 0.22 * dichte, 1.6 + z() * 1.4, [0.85, 0.88, 1.0]);
    }

    var g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('farbe', new THREE.Float32BufferAttribute(farbe, 3));
    g.setAttribute('groesse', new THREE.Float32BufferAttribute(groesse, 1));
    var punkte = new THREE.Points(g, sternMaterial());
    punkte.renderOrder = 1;
    punkte.frustumCulled = false;
    return punkte;
  }

  // ---------- Hügel ----------

  // Ein Ring aus dunklen Hügeln mit ein paar Baumspitzen. Er verdeckt
  // die Kante, an der die Wiese im Dunst verschwindet.
  function huegel(z) {
    var n = 360;
    var r = RADIUS * 0.8;
    var welle = [];
    for (var i = 0; i < 12; i++) welle.push({ f: 1 + Math.floor(z() * 9), p: z() * 6.3, a: z() });

    var pos = [];
    var index = [];
    for (var s = 0; s <= n; s++) {
      var w = (s / n) * Math.PI * 2;
      var h = 0;
      welle.forEach(function (q) { h += Math.sin(w * q.f + q.p) * q.a; });
      h = 300 + (h + 3) * 170;
      if (z() < 0.12) h += 120 + z() * 260;    // einzelne Baumspitzen
      // Unterkante weit unter dem Horizont: Steht die Kamera hoch (Yerkes:
      // 40 m weit weg, über 10 m hoch), liegt der Rand der Wiese tief unter
      // der Augenhöhe – dazwischen darf kein Himmel durchscheinen
      pos.push(Math.cos(w) * r, -r * 0.6, Math.sin(w) * r);
      pos.push(Math.cos(w) * r, h, Math.sin(w) * r);
      if (s < n) {
        var o = s * 2;
        index.push(o, o + 1, o + 2, o + 1, o + 3, o + 2);
      }
    }
    var g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(index);
    // Farbe vorab in den linearen Raum: Basic-Materialien werden bei der
    // Ausgabe nach sRGB umgerechnet, der Nebel über der Wiese nicht. Ohne
    // das stünden die Hügel als heller Streifen über dem dunklen Dunst.
    var m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({
      color: FARBEN.huegel.clone().convertSRGBToLinear(), side: THREE.DoubleSide,
      depthWrite: false, depthTest: false, toneMapped: false
    }));
    m.renderOrder = 2;
    m.frustumCulled = false;
    return m;
  }

  O.Himmel = {
    FARBEN: FARBEN,

    erzeuge: function () {
      var z = O.Zufall(2026);
      var szene = new THREE.Scene();
      var gruppe = new THREE.Group();
      var v = verlauf();
      var h;
      gruppe.add(v);
      gruppe.add(sterne(z));
      gruppe.add(h = huegel(z));
      // eigener Startwert: Die Sterne oben bleiben, wie sie immer waren
      var u = sterne(O.Zufall(2027), true);
      u.visible = false;
      gruppe.add(u);
      szene.add(gruppe);
      return { szene: szene, gruppe: gruppe, verlauf: v, huegel: h, sterneUnten: u };
    }
  };
})(globalThis.OPTIK = globalThis.OPTIK || {});
