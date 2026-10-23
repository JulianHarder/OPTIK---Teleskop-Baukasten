/*
  Wiese, Licht und Spiegelungen.

  Stimmung: Nacht, aber nicht stockdunkel. Kühles Mondlicht von der Seite
  wirft Schatten, schwaches Himmelslicht hellt von oben auf. Die Wiese
  verschwindet in der Ferne im Dunst in der Farbe der Hügel.

  Damit Spiegel und Chrom nach Metall aussehen, brauchen sie etwas zum
  Spiegeln. Der echte Nachthimmel wäre fast schwarz – deshalb bekommen sie
  eine eigene, weiche Umgebung: dunkler Himmel, heller Horizontstreifen,
  ein Mondfleck.
*/
(function (O) {
  'use strict';

  var mond = null;
  var himmelLicht = null;
  var gegenLicht = null;
  var boden = null;
  var nebel = null;
  var renderer = null;
  var umgebungen = {};          // Spiegel-Umgebung je Ort, beim ersten Bedarf
  var lichtRichtung = null;     // zum Mond bzw. zur Sonne
  var NEBEL = { nah: 5000, fern: 26000 };
  var WIESE_RADIUS = 100000;      // groß genug für das 19-m-Rohr in Yerkes
  var MOND_RICHTUNG = new THREE.Vector3(-2600, 3800, 1900).normalize();

  function licht(szene) {
    var himmel = new THREE.HemisphereLight(0x7d8fbf, 0x1b2416, 0.75);
    szene.add(himmel);
    himmelLicht = himmel;

    mond = new THREE.DirectionalLight(0xc6d4ff, 1.35);
    mond.position.set(-2600, 3800, 1900);
    mond.target.position.set(0, 500, 0);
    mond.castShadow = true;
    mond.shadow.mapSize.set(2048, 2048);
    var k = mond.shadow.camera;
    k.left = -1400;
    k.right = 1400;
    k.top = 1600;
    k.bottom = -1000;
    k.near = 1000;
    k.far = 9000;
    mond.shadow.bias = -0.0004;
    mond.shadow.normalBias = 1.5;
    szene.add(mond);
    szene.add(mond.target);

    // schwaches warmes Gegenlicht, damit die Schattenseite nicht absäuft
    var gegen = new THREE.DirectionalLight(0xffd9b0, 0.25);
    gegen.position.set(2500, 900, -1500);
    szene.add(gegen);
    gegenLicht = gegen;
  }

  function wiese(szene) {
    boden = new THREE.Mesh(
      new THREE.CircleGeometry(WIESE_RADIUS, 96),
      O.Material.alle().wiese
    );
    boden.rotation.x = -Math.PI / 2;
    boden.receiveShadow = true;
    szene.add(boden);
    nebel = new THREE.Fog(O.Himmel.FARBEN.huegel, NEBEL.nah, NEBEL.fern);
    szene.fog = nebel;
  }

  // Dunst nach der Größe des Teleskops: Bei einem 19-m-Rohr steht die
  // Kamera 40 m weit weg – mit dem Dunst für einen Dobson wäre es grau.
  // Spätestens am Rand der Wiese ist alles im Dunst verschwunden.
  function nebelFuer(szene, huelle) {
    if (!szene.fog) return;
    var s = Math.max(1, huelle.radius / 2000);
    szene.fog.near = NEBEL.nah * s;
    szene.fog.far = Math.min(WIESE_RADIUS * 0.95, NEBEL.fern * s);
  }

  // Weiche Umgebung für Spiegelungen (equirektangular, 512 × 256).
  // art = 'wiese' (Nachthimmel mit Mond), 'weltall' (schwarz, Sonne) oder
  // 'erde' (schwarz, Sonne, unten das blaue Leuchten der Erde)
  function spiegelUmgebung(renderer, art) {
    var b = 512;
    var h = 256;
    var c = document.createElement('canvas');
    c.width = b;
    c.height = h;
    var ctx = c.getContext('2d');
    if (art !== 'wiese') return alsUmgebung(renderer, weltallBild(c, ctx, art === 'erde'));

    var v = ctx.createLinearGradient(0, 0, 0, h);
    v.addColorStop(0.0, '#0b1426');
    v.addColorStop(0.42, '#273a5e');
    v.addColorStop(0.5, '#7a8db0');     // heller Horizont
    v.addColorStop(0.53, '#2a3326');
    v.addColorStop(1.0, '#0c100b');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, b, h);

    // Mondfleck
    var m = ctx.createRadialGradient(150, 60, 0, 150, 60, 60);
    m.addColorStop(0, 'rgba(235, 242, 255, 1)');
    m.addColorStop(0.25, 'rgba(200, 215, 255, 0.5)');
    m.addColorStop(1, 'rgba(200, 215, 255, 0)');
    ctx.fillStyle = m;
    ctx.fillRect(0, 0, b, h);
    return alsUmgebung(renderer, c);
  }

  // Weltall: fast schwarz, eine grelle Sonne, ein paar Sterne
  function weltallBild(c, ctx, mitErde) {
    var b = c.width;
    var h = c.height;
    ctx.fillStyle = '#020306';
    ctx.fillRect(0, 0, b, h);
    if (mitErde) {
      var e = ctx.createLinearGradient(0, h * 0.55, 0, h);
      e.addColorStop(0, '#2c5c9e');
      e.addColorStop(0.15, '#1d4378');
      e.addColorStop(1, '#0d2442');
      ctx.fillStyle = e;
      ctx.fillRect(0, h * 0.62, b, h * 0.38);
    }
    var z = O.Zufall(5);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    for (var i = 0; i < 300; i++) ctx.fillRect(z() * b, z() * h * 0.6, 1, 1);
    var s = ctx.createRadialGradient(150, 70, 0, 150, 70, 46);
    s.addColorStop(0, 'rgba(255, 252, 240, 1)');
    s.addColorStop(0.2, 'rgba(255, 245, 220, 0.6)');
    s.addColorStop(1, 'rgba(255, 245, 220, 0)');
    ctx.fillStyle = s;
    ctx.fillRect(0, 0, b, h);
    return c;
  }

  function alsUmgebung(renderer, c) {
    var t = new THREE.CanvasTexture(c);
    t.mapping = THREE.EquirectangularReflectionMapping;
    t.encoding = THREE.sRGBEncoding;

    var pmrem = new THREE.PMREMGenerator(renderer);
    var ziel = pmrem.fromEquirectangular(t);
    pmrem.dispose();
    t.dispose();
    return ziel.texture;
  }

  // Die Schattenkamera des Monds so legen, dass das ganze Teleskop
  // (huelle = Kugel) hineinpasst – ein großer Dobson wirft sonst einen
  // abgeschnittenen Schatten.
  function schattenFuer(huelle) {
    var r = huelle.radius * 1.6 + 300;     // der Schatten fällt schräg, also weiter als das Teleskop reicht
    var k = mond.shadow.camera;
    mond.target.position.copy(huelle.center);
    mond.position.copy(huelle.center).addScaledVector(lichtRichtung, r * 3);
    k.left = k.bottom = -r;
    k.right = k.top = r;
    k.near = r;
    k.far = r * 5;
    k.updateProjectionMatrix();
  }

  // Ort wechseln: Wiese bei Nacht oder Weltall (Hubble, Webb).
  // o = { erde: Hubble über der Erde, sonne: Richtung zur Sonne (Welt) }
  // Im Weltall: kein Boden, kein Dunst, keine Hügel, schwarzer Himmel mit
  // Sternen auch unten, hartes Sonnenlicht und fast kein Streulicht –
  // und die Kamera darf auch von unten schauen.
  var SCHWARZ = new THREE.Color(0x000000);

  function ort(name, szene, himmel, steuerung, o) {
    var weltall = name === 'weltall';
    o = o || {};
    boden.visible = !weltall;
    szene.fog = weltall ? null : nebel;
    himmel.huegel.visible = !weltall;
    himmel.sterneUnten.visible = weltall;
    var u = himmel.verlauf.material.uniforms;
    var F = O.Himmel.FARBEN;
    u.zenit.value = weltall ? SCHWARZ : F.zenit;
    u.mitte.value = weltall ? SCHWARZ : F.mitte;
    u.horizont.value = weltall ? SCHWARZ : F.horizont;

    lichtRichtung = weltall && o.sonne ? o.sonne.clone().normalize() : MOND_RICHTUNG;
    mond.color.set(weltall ? 0xfff4e2 : 0xc6d4ff);
    mond.intensity = weltall ? 3.2 : 1.35;
    himmelLicht.intensity = weltall ? 0.22 : 0.75;
    himmelLicht.color.set(weltall ? 0x8a96b0 : 0x7d8fbf);
    himmelLicht.groundColor.set(weltall ? (o.erde ? 0x274a7a : 0x10131a) : 0x1b2416);
    // Aufhellung von der Kamera-Seite. Bei Webb kräftig: Dort liegt das
    // Teleskop in Wirklichkeit immer im Schatten des Schilds – ganz ohne
    // Aufhellung sähe man vom goldenen Spiegel nichts.
    gegenLicht.intensity = weltall ? (o.erde ? 0.35 : 1.3) : 0.25;
    if (weltall) gegenLicht.position.set(-2600, 2200, -1800);
    else gegenLicht.position.set(2500, 900, -1500);

    var art = weltall ? (o.erde ? 'erde' : 'weltall') : 'wiese';
    if (!umgebungen[art]) umgebungen[art] = spiegelUmgebung(renderer, art);
    szene.environment = umgebungen[art];

    steuerung.maxPolarAngle = weltall ? Math.PI : Math.PI / 2 - 0.03;
    O.Weltall.zeige(himmel, name, o.erde, lichtRichtung);
  }

  O.Umgebung = {
    schattenFuer: schattenFuer,
    // die Wiese, solange sie zu sehen ist (für den Zoom zur Maus)
    boden: function () { return boden && boden.visible ? boden : null; },
    nebelFuer: nebelFuer,
    ort: ort,

    erzeuge: function (szene, r) {
      renderer = r;
      licht(szene);
      wiese(szene);
      lichtRichtung = MOND_RICHTUNG;
      umgebungen.wiese = spiegelUmgebung(r, 'wiese');
      szene.environment = umgebungen.wiese;
    }
  };
})(globalThis.OPTIK = globalThis.OPTIK || {});
