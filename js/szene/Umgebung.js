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
  var NEBEL = { nah: 5000, fern: 26000 };
  var WIESE_RADIUS = 100000;      // groß genug für das 19-m-Rohr in Yerkes
  var MOND_RICHTUNG = new THREE.Vector3(-2600, 3800, 1900).normalize();

  function licht(szene) {
    var himmel = new THREE.HemisphereLight(0x7d8fbf, 0x1b2416, 0.75);
    szene.add(himmel);

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
  }

  function wiese(szene) {
    var boden = new THREE.Mesh(
      new THREE.CircleGeometry(WIESE_RADIUS, 96),
      O.Material.alle().wiese
    );
    boden.rotation.x = -Math.PI / 2;
    boden.receiveShadow = true;
    szene.add(boden);
    szene.fog = new THREE.Fog(O.Himmel.FARBEN.huegel, NEBEL.nah, NEBEL.fern);
  }

  // Dunst nach der Größe des Teleskops: Bei einem 19-m-Rohr steht die
  // Kamera 40 m weit weg – mit dem Dunst für einen Dobson wäre es grau.
  // Spätestens am Rand der Wiese ist alles im Dunst verschwunden.
  function nebelFuer(szene, huelle) {
    var s = Math.max(1, huelle.radius / 2000);
    szene.fog.near = NEBEL.nah * s;
    szene.fog.far = Math.min(WIESE_RADIUS * 0.95, NEBEL.fern * s);
  }

  // Weiche Umgebung für Spiegelungen (equirektangular, 512 × 256)
  function spiegelUmgebung(renderer) {
    var b = 512;
    var h = 256;
    var c = document.createElement('canvas');
    c.width = b;
    c.height = h;
    var ctx = c.getContext('2d');

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
    mond.position.copy(huelle.center).addScaledVector(MOND_RICHTUNG, r * 3);
    k.left = k.bottom = -r;
    k.right = k.top = r;
    k.near = r;
    k.far = r * 5;
    k.updateProjectionMatrix();
  }

  O.Umgebung = {
    schattenFuer: schattenFuer,
    nebelFuer: nebelFuer,

    erzeuge: function (szene, renderer) {
      licht(szene);
      wiese(szene);
      szene.environment = spiegelUmgebung(renderer);
    }
  };
})(globalThis.OPTIK = globalThis.OPTIK || {});
