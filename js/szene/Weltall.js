/*
  Das Weltall für Hubble und Webb: schwarzer Himmel mit Sternen rundum,
  eine Sonne als heller Fleck und – unter Hubble – die Erde.

  Hubble kreist rund 500 km über der Erde. Von dort füllt die Erde fast
  die ganze untere Hälfte des Blicks: Ihr Rand liegt etwa 22° unter der
  Waagerechten (sin 67° = 6371 / (6371 + 540)). Die Erde hängt deshalb
  wie die Sterne am Himmel (Himmel.js), nicht in der Welt – sie ist
  unendlich weit weg und kommt beim Zoomen nicht näher.

  Ihre Oberfläche ist ausgedacht (Rauschen statt Landkarte, es soll nur
  nach Erde aussehen): Meer, Land, Eis an den Polen, Wolken, ein blauer
  Saum Atmosphäre. Gerechnet wird sie erst, wenn Hubble sie braucht.
*/
(function (O) {
  'use strict';

  var ABSTAND = 40000;                      // Erdmitte unter der Kamera (Himmelseinheiten)
  var RAND_GRAD = 67.2;                     // halber Winkel, den die Erde einnimmt
  var RADIUS = ABSTAND * Math.sin(RAND_GRAD * Math.PI / 180);

  // ---------- Rauschen auf der Kugel ----------

  function rauschen3(seed) {
    function hash(x, y, z) {
      var h = (x * 374761393 + y * 668265263 + z * 2147483647 + seed * 144269) | 0;
      h = (h ^ (h >>> 13)) * 1274126177 | 0;
      return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
    }
    function glatt(t) { return t * t * (3 - 2 * t); }
    return function (x, y, z) {
      var x0 = Math.floor(x), y0 = Math.floor(y), z0 = Math.floor(z);
      var tx = glatt(x - x0), ty = glatt(y - y0), tz = glatt(z - z0);
      var s = 0;
      for (var i = 0; i < 8; i++) {
        var dx = i & 1, dy = (i >> 1) & 1, dz = (i >> 2) & 1;
        s += hash(x0 + dx, y0 + dy, z0 + dz) *
          (dx ? tx : 1 - tx) * (dy ? ty : 1 - ty) * (dz ? tz : 1 - tz);
      }
      return s;
    };
  }

  function fbm(n, x, y, z, oktaven) {
    var s = 0, a = 0.5, f = 1, norm = 0;
    for (var o = 0; o < oktaven; o++) {
      s += a * n(x * f, y * f, z * f);
      norm += a;
      a *= 0.5;
      f *= 2.03;
    }
    return s / norm;
  }

  function erdTextur() {
    var b = 768, h = 384;
    var c = document.createElement('canvas');
    c.width = b;
    c.height = h;
    var ctx = c.getContext('2d');
    var bild = ctx.createImageData(b, h);
    var land = rauschen3(3);
    var wolke = rauschen3(9);
    for (var y = 0; y < h; y++) {
      var breite = (0.5 - (y + 0.5) / h) * Math.PI;
      for (var x = 0; x < b; x++) {
        var laenge = (x + 0.5) / b * Math.PI * 2;
        var px = Math.cos(breite) * Math.cos(laenge), py = Math.sin(breite), pz = Math.cos(breite) * Math.sin(laenge);
        var l = fbm(land, px * 2.2 + 10, py * 2.2 + 10, pz * 2.2 + 10, 5);
        var w = fbm(wolke, px * 3.5 + 20, py * 6 + 20, pz * 3.5 + 20, 5);
        var r, g, bl;
        if (l > 0.53) {                                   // Land: grün bis wüstenbraun
          var trocken = Math.min(1, Math.max(0, (fbm(land, px * 5, py * 5, pz * 5, 3) - 0.4) * 3));
          r = 60 + trocken * 110; g = 88 + trocken * 60; bl = 44 + trocken * 30;
        } else {                                          // Meer: tiefer = dunkler
          var tiefe = Math.min(1, (0.53 - l) * 6);
          r = 18 - tiefe * 8; g = 62 - tiefe * 20; bl = 120 - tiefe * 30;
        }
        if (Math.abs(breite) > 1.2 + (l - 0.5) * 0.6) { r = 228; g = 236; bl = 242; }    // Polkappen
        var wolken = Math.max(0, Math.min(1, (w - 0.5) * 3.2));
        r += (240 - r) * wolken; g += (244 - g) * wolken; bl += (250 - bl) * wolken;
        var i = (y * b + x) * 4;
        bild.data[i] = r; bild.data[i + 1] = g; bild.data[i + 2] = bl; bild.data[i + 3] = 255;
      }
    }
    ctx.putImageData(bild, 0, 0);
    var t = new THREE.CanvasTexture(c);
    t.encoding = THREE.sRGBEncoding;
    return t;
  }

  // Tag- und Nachtseite nach der Sonne, am Rand ein blauer Saum
  function erdMaterial(sonne) {
    return new THREE.ShaderMaterial({
      uniforms: { karte: { value: erdTextur() }, sonne: { value: sonne } },
      vertexShader: [
        'varying vec2 vUv; varying vec3 vNormale; varying vec3 vBlick;',
        'void main() {',
        '  vUv = uv;',
        '  vNormale = normalize(mat3(modelMatrix) * normal);',
        '  vec4 welt = modelMatrix * vec4(position, 1.0);',
        '  vBlick = normalize(cameraPosition - welt.xyz);',
        '  gl_Position = projectionMatrix * viewMatrix * welt;',
        '}'
      ].join('\n'),
      fragmentShader: [
        'uniform sampler2D karte; uniform vec3 sonne;',
        'varying vec2 vUv; varying vec3 vNormale; varying vec3 vBlick;',
        'void main() {',
        '  vec3 farbe = texture2D(karte, vUv).rgb;',
        '  farbe = pow(farbe, vec3(2.2));',
        '  float licht = max(dot(vNormale, sonne), 0.0);',
        '  float rand = pow(1.0 - max(dot(vNormale, vBlick), 0.0), 3.0);',
        '  vec3 luft = vec3(0.30, 0.55, 1.0) * rand * (0.25 + licht);',
        '  vec3 f = farbe * (0.03 + 1.1 * licht) + luft;',
        '  gl_FragColor = vec4(pow(f, vec3(1.0 / 2.2)), 1.0);',
        '}'
      ].join('\n'),
      depthWrite: false,
      depthTest: false
    });
  }

  var erde = null;
  var sonne = null;

  function sonnenFleck() {
    var s = new THREE.Sprite(new THREE.SpriteMaterial({
      map: O.Strahlenbild.fleck(), color: 0xfff6e0, blending: THREE.AdditiveBlending,
      depthWrite: false, depthTest: false, toneMapped: false
    }));
    s.scale.setScalar(5500);
    s.renderOrder = 3;
    return s;
  }

  O.Weltall = {
    // ort = 'wiese' oder 'weltall'; mitErde: Hubble; richtung: zur Sonne (Welt)
    zeige: function (himmel, ort, mitErde, richtung) {
      var weltall = ort === 'weltall';
      if (!sonne) {
        sonne = sonnenFleck();
        himmel.gruppe.add(sonne);
      }
      sonne.visible = weltall;
      sonne.position.copy(richtung).normalize().multiplyScalar(45000);

      if (weltall && mitErde && !erde) {
        erde = new THREE.Mesh(new THREE.SphereGeometry(RADIUS, 96, 64), erdMaterial(richtung.clone().normalize()));
        erde.position.y = -ABSTAND;
        erde.rotation.z = 0.4;                // etwas schräg: kein Äquator quer durchs Bild
        erde.renderOrder = 2;
        erde.frustumCulled = false;
        himmel.gruppe.add(erde);
      }
      if (erde) {
        erde.visible = weltall && !!mitErde;
        erde.material.uniforms.sonne.value.copy(richtung).normalize();
      }
    }
  };
})(globalThis.OPTIK = globalThis.OPTIK || {});
