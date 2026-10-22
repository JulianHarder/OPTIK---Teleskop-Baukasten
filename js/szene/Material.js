/*
  Materialien des Teleskops und die Texturen dazu.

  Die Texturen (Holzmaserung, Wiese) werden beim Start auf einem Canvas
  gerechnet – es gibt keine Bilddateien. Der Zufall hat einen festen
  Startwert, damit das Holz bei jedem Laden gleich aussieht.

  Materialien werden einmal angelegt und von allen Teilen geteilt.
*/
(function (O) {
  'use strict';

  var cache = null;

  // ---------- Texturen ----------

  function leinwand(b, h) {
    var c = document.createElement('canvas');
    c.width = b;
    c.height = h;
    return c;
  }

  // Glatter Wertrausch-Verlauf für Maserung und Wiese
  function rauschen(zufall, n) {
    var werte = [];
    for (var i = 0; i < n; i++) werte.push(zufall());
    return function (x) {
      var i0 = Math.floor(x);
      var t = x - i0;
      var a = werte[((i0 % n) + n) % n];
      var b = werte[(((i0 + 1) % n) + n) % n];
      t = t * t * (3 - 2 * t);
      return a + (b - a) * t;
    };
  }

  // Birkensperrholz: helle Grundfarbe, feine, leicht gewellte Jahresringe
  function holzTextur() {
    var g = 512;
    var c = leinwand(g, g);
    var ctx = c.getContext('2d');
    var bild = ctx.createImageData(g, g);
    var z = O.Zufall(7);
    var welle = rauschen(z, 64);
    var flecken = rauschen(z, 97);

    for (var y = 0; y < g; y++) {
      for (var x = 0; x < g; x++) {
        var w = welle(x / 55) * 26 + welle(x / 11 + 30) * 2.5;
        // zwei überlagerte Ringabstände, damit es nicht wie ein Muster aussieht
        var ring = Math.sin((y + w) * 0.45) * 0.5 + 0.5;
        var breit = Math.sin((y + w * 1.3) * 0.13) * 0.5 + 0.5;
        ring = Math.pow(ring, 8) * (0.4 + 0.6 * breit);
        var fleck = flecken((x + y * 0.3) / 23) * 0.08;
        var hell = 1 - ring * 0.13 - breit * 0.05 - fleck;
        var i = (y * g + x) * 4;
        bild.data[i] = 214 * hell;
        bild.data[i + 1] = 176 * hell;
        bild.data[i + 2] = 124 * hell;
        bild.data[i + 3] = 255;
      }
    }
    ctx.putImageData(bild, 0, 0);
    return c;
  }

  // Wiese bei Nacht: dunkles Grün mit Flecken
  function wieseTextur() {
    var g = 256;
    var c = leinwand(g, g);
    var ctx = c.getContext('2d');
    var bild = ctx.createImageData(g, g);
    var z = O.Zufall(11);

    for (var i = 0; i < g * g; i++) {
      var r = z();
      var hell = 0.75 + r * 0.5;
      bild.data[i * 4] = 46 * hell;
      bild.data[i * 4 + 1] = 66 * hell;
      bild.data[i * 4 + 2] = 44 * hell;
      bild.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(bild, 0, 0);

    // größere Flecken darüber, damit die Fläche nicht wie Rauschen aussieht
    for (var k = 0; k < 160; k++) {
      ctx.fillStyle = z() < 0.5 ? 'rgba(20, 30, 18, 0.18)' : 'rgba(90, 110, 70, 0.10)';
      ctx.beginPath();
      ctx.arc(z() * g, z() * g, 4 + z() * 18, 0, Math.PI * 2);
      ctx.fill();
    }
    return c;
  }

  function alsTextur(canvas, wiederholen) {
    var t = new THREE.CanvasTexture(canvas);
    t.encoding = THREE.sRGBEncoding;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    if (wiederholen) t.repeat.set(wiederholen, wiederholen);
    t.anisotropy = 4;
    return t;
  }

  // ---------- Materialien ----------

  function erzeuge() {
    var holz = alsTextur(holzTextur());
    // ExtrudeGeometry hat UV-Koordinaten in mm → eine Kachel = 400 mm
    var holzMm = holz.clone();
    holzMm.needsUpdate = true;
    holzMm.repeat.set(1 / 400, 1 / 400);

    return {
      // weiß lackierter Tubus, mit Klarlack-Glanz
      lack: new THREE.MeshPhysicalMaterial({
        color: 0xe9edf1, roughness: 0.38, metalness: 0,
        clearcoat: 0.6, clearcoatRoughness: 0.25
      }),
      // Innenseite: mattschwarz gegen Streulicht – ein Hauch heller als
      // ganz schwarz, damit man im aufgeschnittenen Tubus die Rundung sieht
      innen: new THREE.MeshStandardMaterial({
        color: 0x1b1f26, roughness: 1, metalness: 0, side: THREE.BackSide
      }),
      // dunkelblau lackiert – klassische Farbe von Linsenfernrohren
      lackBlau: new THREE.MeshPhysicalMaterial({
        color: 0x1d3a66, roughness: 0.35, metalness: 0.1,
        clearcoat: 0.7, clearcoatRoughness: 0.2
      }),
      // Linsen: Kronglas leicht bläulich, Flintglas (mit Blei) leicht gelblich
      kronglas: new THREE.MeshPhysicalMaterial({
        color: 0xcfeaff, roughness: 0.04, metalness: 0, transparent: true, opacity: 0.38,
        envMapIntensity: 1.6, side: THREE.DoubleSide, depthWrite: false
      }),
      flintglas: new THREE.MeshPhysicalMaterial({
        color: 0xf1ecd2, roughness: 0.04, metalness: 0, transparent: true, opacity: 0.45,
        envMapIntensity: 1.6, side: THREE.DoubleSide, depthWrite: false
      }),
      kunststoff: new THREE.MeshStandardMaterial({ color: 0x18191c, roughness: 0.55, metalness: 0 }),
      eloxiert: new THREE.MeshStandardMaterial({ color: 0x25272b, roughness: 0.4, metalness: 0.6 }),
      gummi: new THREE.MeshStandardMaterial({ color: 0x101113, roughness: 0.9, metalness: 0 }),
      alu: new THREE.MeshStandardMaterial({ color: 0xb9bec4, roughness: 0.35, metalness: 1 }),
      chrom: new THREE.MeshStandardMaterial({ color: 0xe4e8ec, roughness: 0.12, metalness: 1 }),
      // Rändelung: harte Kanten statt glatter Rundung
      raendel: new THREE.MeshStandardMaterial({
        color: 0x1d1f22, roughness: 0.45, metalness: 0.5, flatShading: true
      }),
      // Spiegel: Aluminium aufgedampft, spiegelt die Umgebung
      spiegel: new THREE.MeshStandardMaterial({
        color: 0xffffff, roughness: 0.03, metalness: 1, envMapIntensity: 1.4,
        side: THREE.DoubleSide
      }),
      glasKante: new THREE.MeshStandardMaterial({
        color: 0x9fc6b8, roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.85
      }),
      // vergütete Linse: dunkel mit bläulichem Schimmer
      linse: new THREE.MeshStandardMaterial({
        color: 0x0b1a33, roughness: 0.05, metalness: 0.9, envMapIntensity: 1.6
      }),
      holz: new THREE.MeshStandardMaterial({ map: holz, roughness: 0.7, metalness: 0 }),
      holzMm: new THREE.MeshStandardMaterial({ map: holzMm, roughness: 0.7, metalness: 0 }),
      teflon: new THREE.MeshStandardMaterial({ color: 0xf2f2ee, roughness: 0.5, metalness: 0 }),
      akzent: new THREE.MeshStandardMaterial({ color: 0x2f6fd0, roughness: 0.35, metalness: 0.3 }),
      gold: new THREE.MeshStandardMaterial({ color: 0xd6a740, roughness: 0.3, metalness: 1 }),
      wiese: new THREE.MeshStandardMaterial({
        map: alsTextur(wieseTextur(), 60), roughness: 1, metalness: 0
      })
    };
  }

  O.Material = {
    // alle Materialien – beim ersten Aufruf angelegt
    alle: function () {
      if (!cache) {
        cache = erzeuge();
        // Geteilt = gehört keinem einzelnen Teleskop, wird beim Umbauen
        // nicht freigegeben (Dobson.entsorge). Kopien (clone) erben die
        // Markierung – wer kopiert, muss userData selbst neu setzen.
        Object.keys(cache).forEach(function (k) { cache[k].userData.geteilt = true; });
      }
      return cache;
    }
  };
})(globalThis.OPTIK = globalThis.OPTIK || {});
