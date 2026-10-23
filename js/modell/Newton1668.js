/*
  Newtons erstes Spiegelteleskop (1668): ein Rohr von 16 cm, hinten ein
  Hohlspiegel aus Spiegelmetall (33 mm, f = 158 mm, kugelförmig), vorne
  ein kleiner flacher Spiegel unter 45°, der das Licht seitlich zum
  Okular lenkt → 35-fach. Das Rohr sitzt auf einem Kugelgelenk.
  Maße: js/daten/teleskope.js (Rohrdurchmesser vom zweiten Teleskop, 1671).

  Tubus-System wie beim Dobson (physik/Optik.js): z = optische Achse,
  Spiegelscheitel bei z = 0, Öffnung bei +z, Okular nach +y.

  Das Original ist verschollen – gebaut ist es so, wie die Nachbauten
  aussehen, vereinfacht. Der Tisch ist nur zum Draufstellen da.
*/
(function (O) {
  'use strict';

  var T = O.Teile;

  var N = O.Historisch.NEWTON;     // Maße aus der Optik
  var D = N.D;
  var R_AUSSEN = N.rAussen;       // 2,25 Zoll Durchmesser
  var Z_HINTEN = -12;
  var Z_VORNE = 160;
  var SEITLICH = N.seitlich;      // Brennpunkt so weit neben der Achse
  var Z_FANG = N.zFang;           // dort steht der Fangspiegel
  var TISCH_Y = 750;
  var KUGEL_R = 15;
  var KUGEL_Y = TISCH_Y + 150;    // Mitte der Kugel über dem Boden
  var STIEL = R_AUSSEN + 34;      // Kugelmitte → Rohrachse

  function rohr(M) {
    var g = new THREE.Group();
    g.add(T.netz(T.zylinderZ(R_AUSSEN, Z_HINTEN, Z_VORNE, 64, true), M.holzAlt));
    g.add(T.netz(T.zylinderZ(R_AUSSEN - 1.5, Z_HINTEN, Z_VORNE, 64, true), M.innen));
    // Boden und Messingringe an beiden Enden
    g.add(T.netz(T.zylinderZ(R_AUSSEN + 1, Z_HINTEN - 4, Z_HINTEN, 64), M.messing));
    g.add(T.netz(T.ringZ(R_AUSSEN - 1, R_AUSSEN + 1.5, Z_VORNE - 6, Z_VORNE, 64), M.messing));
    g.add(T.netz(T.ringZ(R_AUSSEN - 0.5, R_AUSSEN + 1.2, Z_HINTEN, Z_HINTEN + 8, 64), M.messing));
    return T.benenne(g, 'newtonRohr');
  }

  function hauptspiegel(M) {
    var g = new THREE.Group();
    // Spiegelscheibe; die Mulde (0,4 mm tief) wäre nicht zu sehen
    g.add(T.netz(T.zylinderZ(D / 2, -6, 0, 48), M.speculum));
    g.add(T.netz(T.ringZ(D / 2, R_AUSSEN - 1.5, -8, 1, 48), M.messing));
    return T.benenne(g, 'newtonHauptspiegel');
  }

  // Fangspiegel: Ellipse unter 45° auf einem dünnen Arm, der von unten
  // (gegenüber dem Okular) durch die Rohrwand kommt
  function fangspiegel(M) {
    var g = new THREE.Group();
    var klein = N.fang;                     // Lichtkegel an dieser Stelle + Rand
    var spiegel = T.netz(new THREE.CircleGeometry(klein / 2, 32), M.speculum);
    spiegel.scale.set(1, Math.SQRT2, 1);
    // Normale zwischen −z (zum Hauptspiegel) und +y (zum Okular)
    spiegel.rotation.x = -3 * Math.PI / 4;
    spiegel.position.z = Z_FANG;
    g.add(spiegel);
    var ruecken = T.netz(new THREE.CylinderGeometry(klein / 2, klein / 2, 2, 32), M.messing);
    ruecken.scale.set(1, 1, Math.SQRT2);
    ruecken.rotation.x = -Math.PI / 4;              // Achse parallel zur Spiegelnormale
    ruecken.position.set(0, -0.8, Z_FANG + 0.8);    // hinter dem Spiegel
    g.add(ruecken);
    var arm = T.netz(new THREE.CylinderGeometry(1, 1, R_AUSSEN, 8), M.messing);
    arm.position.set(0, -R_AUSSEN / 2, Z_FANG + 2);
    g.add(arm);
    return T.benenne(g, 'newtonFangspiegel');
  }

  // Okular: kurze Messinghülse oben am Rohr, +y = Okularachse
  function okular(M) {
    var g = new THREE.Group();
    g.position.set(0, R_AUSSEN - 1, Z_FANG);
    g.add(T.netz(T.drehteil([[0, 0], [9, 0], [9, 3], [5.5, 4], [5.5, 14], [7, 14], [7, 18], [0, 18]], 32, true), M.messing));
    var linse = T.netz(new THREE.CircleGeometry(3, 24), M.linse);
    linse.rotation.x = -Math.PI / 2;
    linse.position.y = SEITLICH + N.fOkular - (R_AUSSEN - 1);   // eine Okularbrennweite über dem Brennpunkt
    g.add(linse);
    return T.benenne(g, 'newtonOkular');
  }

  // Schelle um das Rohr und Stiel hinunter zur Kugel (dreht mit dem Rohr)
  function halter(M) {
    var g = new THREE.Group();
    var zMitte = 70;
    g.add(T.netz(T.ringZ(R_AUSSEN, R_AUSSEN + 3, zMitte - 8, zMitte + 8, 48), M.messing));
    var stiel = T.netz(new THREE.CylinderGeometry(4, 5, STIEL - R_AUSSEN, 16), M.messing);
    stiel.position.set(0, -(R_AUSSEN + STIEL) / 2, zMitte);
    g.add(stiel);
    var kugel = T.netz(new THREE.SphereGeometry(KUGEL_R, 24, 16), M.holzAlt);
    kugel.position.set(0, -STIEL, zMitte);
    g.add(kugel);
    T.benenne(g, 'newtonKugelgelenk');
    return { gruppe: g, zMitte: zMitte };
  }

  // Pfanne auf einer gedrechselten Säule mit runder Fußplatte
  function fuss(M) {
    var g = new THREE.Group();
    var p = T.drehteil([
      [0, 0], [62, 0], [62, 12], [44, 18], [14, 26], [10, 70], [13, 100],
      [11, 118], [KUGEL_R + 5, 128], [KUGEL_R + 6, 142], [KUGEL_R - 2, 142], [0, 134]
    ], 40, false);
    var netz = T.netz(p, M.holzAlt);
    netz.position.y = TISCH_Y;
    g.add(netz);
    return T.benenne(g, 'newtonKugelgelenk');
  }

  function tisch(M) {
    var g = new THREE.Group();
    var platte = T.netz(new THREE.BoxGeometry(620, 30, 460), M.holzAlt);
    platte.position.y = TISCH_Y - 15;
    g.add(platte);
    [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(function (e) {
      var bein = T.netz(new THREE.BoxGeometry(40, TISCH_Y - 30, 40), M.holzAlt);
      bein.position.set(e[0] * 270, (TISCH_Y - 30) / 2, e[1] * 190);
      g.add(bein);
    });
    var zarge = T.netz(new THREE.BoxGeometry(560, 70, 400), M.holzAlt);
    zarge.position.y = TISCH_Y - 65;
    g.add(zarge);
    return T.benenne(g, 'newtonTisch');
  }

  function erzeuge() {
    var M = O.Material.alle();
    var wurzel = new THREE.Group();
    var azimut = new THREE.Group();
    var hoehe = new THREE.Group();
    var tubus = new THREE.Group();

    var h = halter(M);
    var teile = {
      rohr: rohr(M),
      hauptspiegel: hauptspiegel(M),
      fangspiegel: fangspiegel(M),
      okular: okular(M),
      kugelgelenk: fuss(M),
      tisch: tisch(M)
    };
    ['rohr', 'hauptspiegel', 'fangspiegel', 'okular'].forEach(function (k) { tubus.add(teile[k]); });
    tubus.add(h.gruppe);

    wurzel.add(teile.tisch);
    wurzel.add(teile.kugelgelenk);
    wurzel.add(azimut);
    azimut.position.y = KUGEL_Y;
    azimut.add(hoehe);
    hoehe.add(tubus);
    // Kugelmitte liegt im Drehpunkt; Achse bei 0° nach −z (wie beim Dobson)
    tubus.rotation.y = Math.PI;
    tubus.position.set(0, STIEL, h.zMitte);

    hoehe.rotation.x = 32 * Math.PI / 180;
    azimut.rotation.y = -45 * Math.PI / 180;

    // Schilder dorthin, wo nichts davorsteht: Tischkante zur Kamera, Rohr
    // vorne an der Seite (in der Mitte sitzt die Schelle), Fangspiegel
    // auf den Spiegel statt auf seinen Arm
    teile.tisch.userData.anker = new THREE.Vector3(-230, TISCH_Y, -180);
    teile.rohr.userData.anker = new THREE.Vector3(R_AUSSEN, 0, 135);
    teile.fangspiegel.userData.anker = new THREE.Vector3(0, 0, Z_FANG);
    teile.kugelgelenk.userData.anker = new THREE.Vector3(0, TISCH_Y + 80, 0);
    return O.Beruehmt.teleskop({
      id: 'newton',
      wurzel: wurzel,
      azimut: azimut,
      hoehe: hoehe,
      tubus: tubus,
      teile: teile,
      masse: { D: D, zHinten: Z_HINTEN, zVorne: Z_VORNE, rAussen: R_AUSSEN, laenge: Z_VORNE - Z_HINTEN },
      randschicht: ['newtonRohr', 'newtonOkular'],
      licht: function () { return O.Historisch.lichtNewton(Z_VORNE); },
      lichtMassstab: 0.3,
      // Der Mensch steht hinter dem Tisch
      mensch: new THREE.Vector3(-420, 0, 620),
      ziele: function () {
        function z(dz) { return new THREE.Vector3(0, 0, dz); }
        return [
          { objekt: hoehe, versatz: new THREE.Vector3(0, 120, 0) },
          { objekt: teile.hauptspiegel, versatz: z(-110) },
          { objekt: teile.fangspiegel, versatz: z(120) },
          { objekt: teile.okular, versatz: new THREE.Vector3(0, 70, 0) }
        ];
      }
    });
  }

  O.Beruehmt.melde('newton', erzeuge);
})(globalThis.OPTIK = globalThis.OPTIK || {});
