/*
  Galileis Fernrohr (Museo Galileo, Inv. 2428, Ende 1609 / Anfang 1610):
  ein 98 cm langes Rohr aus Holz, mit Leder bezogen und mit Gold
  verziert. Vorne eine Sammellinse (37 mm, f = 980 mm), abgeblendet auf
  15 mm, hinten eine Zerstreuungslinse (f = −47,5 mm) → 21-fach.
  Maße: js/daten/teleskope.js.

  Tubus-System wie beim Refraktor: z = optische Achse, das Licht kommt
  von +z. Das Auge sitzt bei z = 0. Wo die Linsen sitzen, rechnet
  physik/Historisch.js aus: Im Galilei-Fernrohr stehen sie etwa
  f_Objektiv + f_Okular = 980 − 47,5 = 932,5 mm auseinander.

  Der Ständer ist ausgedacht: Wie Galilei sein Fernrohr aufstellte, ist
  nicht überliefert (das sagt auch die Infokarte).
*/
(function (O) {
  'use strict';

  var T = O.Teile;

  var LAENGE = 980;
  var OPTIK_G = O.Historisch.galilei();       // Maße aus der Optik
  var Z_OKULAR = OPTIK_G.zOkular;             // Okularlinse, nah am Auge
  var Z_OBJEKTIV = OPTIK_G.zObjektiv;         // flache Seite der Objektivlinse
  var R_HINTEN = 21;                          // Rohr wird nach vorne dicker
  var R_VORNE = 26;
  var Z_ROHR = [70, 900];                     // Rohr zwischen Okular- und Objektivfassung
  var ACHSE_Y = 1400;                         // Höhe des Drehpunkts über der Wiese

  // Leder: braun (einst rot), schmale rote Bänder, Goldprägung.
  // u = rundherum, v = entlang des Rohrs.
  function lederTextur() {
    var b = 256;
    var h = 1024;
    var c = document.createElement('canvas');
    c.width = b;
    c.height = h;
    var ctx = c.getContext('2d');
    var z = O.Zufall(1610);

    ctx.fillStyle = '#5a3723';
    ctx.fillRect(0, 0, b, h);
    // Narben im Leder
    for (var i = 0; i < 2600; i++) {
      ctx.fillStyle = z() < 0.5 ? 'rgba(30, 16, 8, 0.18)' : 'rgba(140, 92, 58, 0.12)';
      ctx.fillRect(z() * b, z() * h, 1 + z() * 3, 1 + z() * 2);
    }

    function goldLinie(y) {
      ctx.fillStyle = '#d2a845';
      ctx.fillRect(0, y, b, 2);
    }
    // Rote Bänder mit Goldkanten und einer Reihe kleiner Rauten
    [0.04, 0.2, 0.36, 0.5, 0.64, 0.8, 0.96].forEach(function (v) {
      var y = (1 - v) * h;
      ctx.fillStyle = '#7a2c1e';
      ctx.fillRect(0, y - 14, b, 28);
      goldLinie(y - 16);
      goldLinie(y + 14);
      ctx.fillStyle = '#d9b04c';
      for (var x = 8; x < b; x += 16) {
        ctx.beginPath();
        ctx.moveTo(x, y - 6);
        ctx.lineTo(x + 5, y);
        ctx.lineTo(x, y + 6);
        ctx.lineTo(x - 5, y);
        ctx.fill();
      }
    });
    // Zwischen den Bändern: Ranken aus Goldpunkten
    ctx.fillStyle = 'rgba(214, 172, 72, 0.85)';
    for (var k = 0; k < 6; k++) {
      var y0 = (1 - (0.12 + k * 0.16)) * h;
      for (var s = 0; s < 4; s++) {
        var x0 = 32 + s * 64;
        for (var w = 0; w < Math.PI * 2; w += 0.5) {
          ctx.beginPath();
          ctx.arc(x0 + Math.cos(w) * 18, y0 + Math.sin(w) * 34, 1.6, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    var t = new THREE.CanvasTexture(c);
    t.encoding = THREE.sRGBEncoding;
    t.anisotropy = 4;
    return t;
  }

  // Kegelmantel von (r0, z0) bis (r1, z1) auf der z-Achse
  function kegelZ(r0, z0, r1, z1, seg) {
    var g = T.drehteil([[r0, 0], [r1, z1 - z0]], seg || 64, false);
    g.rotateX(Math.PI / 2);
    g.translate(0, 0, z0);
    return g;
  }

  function rohr(M, leder) {
    var g = new THREE.Group();
    g.add(T.netz(kegelZ(R_HINTEN, Z_ROHR[0], R_VORNE, Z_ROHR[1], 72), leder));
    g.add(T.netz(kegelZ(R_HINTEN - 1.5, Z_ROHR[0], R_VORNE - 1.5, Z_ROHR[1], 72), M.innen));
    // Objektivfassung vorne: ein etwas dickerer Ring, ebenfalls bezogen
    g.add(T.netz(T.ringZ(R_VORNE - 2, R_VORNE + 4, Z_ROHR[1], LAENGE, 72), leder));
    g.add(T.netz(T.zylinderZ(R_VORNE + 2.5, Z_ROHR[1], LAENGE, 72, true), M.innen));
    // Goldene Ringe an den Übergängen
    [Z_ROHR[1], LAENGE - 4].forEach(function (z) {
      g.add(T.netz(T.ringZ(R_VORNE + 3.5, R_VORNE + 5, z, z + 4, 72), M.gold));
    });
    return T.benenne(g, 'galileiRohr');
  }

  // Sammellinse: flach zum Auge, gewölbt nach vorne – Radius und Dicke
  // genau wie im Strahlverfolger
  function objektivLinse(M) {
    var R = OPTIK_G.R;
    var rand = OPTIK_G.D / 2;
    var d = OPTIK_G.dicke;
    var p = [[0, 0], [rand, 0]];
    for (var i = 8; i >= 0; i--) {
      var r = rand * i / 8;
      p.push([r, d - (R - Math.sqrt(R * R - r * r))]);
    }
    var g = T.drehteil(p, 48, false);
    g.rotateX(Math.PI / 2);
    g.translate(0, 0, Z_OBJEKTIV);
    var linse = T.netz(g, M.kronglas, 'galileiLinse');
    linse.castShadow = false;
    linse.renderOrder = 2;
    var gr = new THREE.Group();
    gr.add(linse);
    return T.benenne(gr, 'galileiLinse');
  }

  // Blende direkt hinter der Linse: nur 15 mm in der Mitte bleiben frei
  function blende(M) {
    var g = new THREE.Group();
    var z = OPTIK_G.zBlende;
    g.add(T.netz(T.ringZ(OPTIK_G.blende / 2, R_VORNE - 2, z - 0.75, z + 0.75, 48), M.kunststoff));
    return T.benenne(g, 'galileiBlende');
  }

  // Okular: kurze Fassung hinten mit der Zerstreuungslinse (22 mm)
  function okular(M, leder) {
    var g = new THREE.Group();
    g.add(T.netz(T.ringZ(11, 17, 0, Z_ROHR[0] + 25, 48), leder));
    g.add(T.netz(T.ringZ(16.5, 18.5, 0, 5, 48), M.gold));
    // Augenmuschel: Holzring
    g.add(T.netz(T.ringZ(6, 14, -6, 0, 48), M.holzAlt));
    // bikonkave Linse: am Rand dicker als in der Mitte
    var p = [[0, -0.8], [11, -1.8], [11, 1.8], [0, 0.8]];
    var lg = T.drehteil(p, 40, false);
    lg.rotateX(Math.PI / 2);
    lg.translate(0, 0, Z_OKULAR);
    var linse = T.netz(lg, M.kronglas);
    linse.castShadow = false;
    linse.renderOrder = 2;
    g.add(linse);
    return T.benenne(g, 'galileiOkular');
  }

  // Holzständer: drei Füße, gedrechselte Säule, oben eine Gabel mit
  // Drehzapfen. Säule und Füße stehen (wurzel), die Gabel dreht sich mit.
  function staender(M) {
    var g = new THREE.Group();
    var saeule = T.drehteil([
      [0, 160], [34, 160], [40, 190], [26, 230], [20, 600], [24, 640],
      [18, 700], [16, ACHSE_Y - 120], [22, ACHSE_Y - 100], [0, ACHSE_Y - 100]
    ], 32, false);
    g.add(T.netz(saeule, M.holzAlt));
    for (var k = 0; k < 3; k++) {
      var w = k * Math.PI * 2 / 3 + Math.PI / 6;
      var fuss = T.netz(new THREE.BoxGeometry(30, 34, 360), M.holzAlt);
      fuss.position.set(Math.cos(w) * 160, 120, Math.sin(w) * 160);
      fuss.rotation.order = 'YXZ';      // erst kippen, dann nach außen drehen
      fuss.rotation.y = Math.PI / 2 - w;
      fuss.rotation.x = 0.45;
      g.add(fuss);
    }
    return T.benenne(g, 'galileiStaender');
  }

  function gabel(M) {
    var g = new THREE.Group();
    var steg = T.netz(new THREE.BoxGeometry(2 * R_VORNE + 36, 16, 40), M.holzAlt);
    steg.position.y = ACHSE_Y - 92;
    g.add(steg);
    [-1, 1].forEach(function (s) {
      var wange = T.netz(new THREE.BoxGeometry(12, 100, 40), M.holzAlt);
      wange.position.set(s * (R_VORNE + 12), ACHSE_Y - 42, 0);
      g.add(wange);
      var zapfen = T.netz(new THREE.CylinderGeometry(6, 6, 16, 16), M.messing);
      zapfen.rotation.z = Math.PI / 2;
      zapfen.position.set(s * (R_VORNE + 4), ACHSE_Y, 0);
      g.add(zapfen);
    });
    return T.benenne(g, 'galileiStaender');
  }

  function erzeuge() {
    var M = O.Material.alle();
    var leder = new THREE.MeshStandardMaterial({ map: lederTextur(), roughness: 0.72, metalness: 0 });

    var wurzel = new THREE.Group();
    var azimut = new THREE.Group();
    var hoehe = new THREE.Group();
    var tubus = new THREE.Group();

    var teile = {
      rohr: rohr(M, leder),
      linse: objektivLinse(M),
      blende: blende(M),
      okular: okular(M, leder)
    };
    Object.keys(teile).forEach(function (k) { tubus.add(teile[k]); });
    teile.staender = staender(M);

    wurzel.add(teile.staender);
    wurzel.add(azimut);
    azimut.add(gabel(M));
    azimut.add(hoehe);
    hoehe.position.y = ACHSE_Y;
    hoehe.add(tubus);
    tubus.rotation.y = Math.PI;
    tubus.position.z = LAENGE * 0.55;      // Drehpunkt etwas vor der Mitte (schwere Linse vorne)

    // Blick schräg nach oben, von der Startkamera aus quer im Bild
    // (nach links, leicht von der Kamera weg)
    hoehe.rotation.x = 24 * Math.PI / 180;
    azimut.rotation.y = -45 * Math.PI / 180;

    teile.staender.userData.anker = new THREE.Vector3(0, ACHSE_Y * 0.45, 0);
    // Schild auf den Ring, nicht ins Loch in der Mitte
    teile.blende.userData.anker = new THREE.Vector3(0, 13, OPTIK_G.zBlende);
    var t = O.Beruehmt.teleskop({
      // Der Mensch steht rechts neben dem Ständer, auf gleicher Höhe im Bild
      mensch: new THREE.Vector3(-300, 0, 900),
      id: 'galilei',
      wurzel: wurzel,
      azimut: azimut,
      hoehe: hoehe,
      tubus: tubus,
      teile: teile,
      masse: { D: 37, zHinten: 0, zVorne: LAENGE, rAussen: R_VORNE + 4, laenge: LAENGE },
      randschicht: ['galileiRohr', 'galileiOkular'],
      // Ins Okular schaut man längs des Rohrs, von hinten
      auge: function () {
        return {
          punkt: tubus.localToWorld(new THREE.Vector3(0, 0, -6)),
          achse: new THREE.Vector3(0, 0, -1).transformDirection(tubus.matrixWorld)
        };
      },
      licht: function () { return O.Historisch.lichtGalilei(LAENGE); },
      lichtMassstab: 0.7,
      ziele: function () {
        function z(dz) { return new THREE.Vector3(0, 0, dz); }
        return [
          { objekt: hoehe, versatz: new THREE.Vector3(0, 220, 0) },
          { objekt: teile.okular, versatz: z(-180) },
          // Linse und Blende auch etwas zur Seite, sonst liegen ihre
          // Schilder im schrägen Blick übereinander
          { objekt: teile.blende, versatz: new THREE.Vector3(0, -60, 170) },
          { objekt: teile.linse, versatz: new THREE.Vector3(0, 70, 320) }
        ];
      }
    });
    return t;
  }

  O.Beruehmt.melde('galilei', erzeuge);
})(globalThis.OPTIK = globalThis.OPTIK || {});
