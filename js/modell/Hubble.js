/*
  Das Hubble-Weltraumteleskop (1990): 13,2 m lang, 4,2 m dick. Vorne das
  Rohr mit Lichtschutz und Klappe, darin Haupt- (2,4 m) und Fangspiegel,
  dahinter ein Ring aus Gerätefächern und das dicke Heck mit den
  Instrumenten. Seitlich zwei Solarflügel, oben und unten Antennen.

  Tubus-System wie überall: z = optische Achse, Scheitel des Hauptspiegels
  bei z = 0, Licht von +z. Spiegelmaße und Brennpunkt (1,5 m hinter dem
  Spiegel) kommen aus physik/Weltraumoptik.js. Die Hülle ist vereinfacht;
  Durchmesser von Rohr und Antennen und die Form der Solarflügel sind
  geschätzt (die Flügel haben ein Drittel weniger Fläche als die alten
  mit 2,4 × 12,1 m).

  Hubble schwebt im All über der Erde (weltall: 'erde').
*/
(function (O) {
  'use strict';

  var T = O.Teile;
  var H = O.Weltraumoptik.HUBBLE;

  var R_ROHR = 1530;           // vorderes Rohr (geschätzt)
  var R_HECK = 2100;           // 4,2 m
  var Z_VORNE = 9300;
  var Z_HINTEN = -3900;        // 13,2 m insgesamt
  var ACHSE_Y = 4600;          // so hoch schwebt die Achse über dem Nullpunkt

  // Drehteil um die z-Achse aus einem Profil [[r, z], …] (gegen den
  // Uhrzeigersinn: r nach rechts, z nach oben)
  function profilZ(punkte, seg) {
    var g = T.drehteil(punkte, seg || 96, false);
    g.rotateX(Math.PI / 2);
    return g;
  }

  // Rohr mit Lichtschutz: Folie mit Feldern, vorne ein gerundeter Rand
  function huelle(M, folie) {
    var g = new THREE.Group();
    g.add(T.netz(T.zylinderZ(R_ROHR, 1450, Z_VORNE - 60, 96, true), folie));
    g.add(T.netz(T.zylinderZ(R_ROHR - 6, 0, Z_VORNE, 96, true), M.innen));
    // gerundeter Rand vorne
    var rand = [];
    for (var i = 0; i <= 8; i++) {
      var w = -Math.PI / 2 + Math.PI * i / 8;
      rand.push([R_ROHR - 10 + Math.cos(w) * 40, Z_VORNE - 40 + Math.sin(w) * 40]);
    }
    g.add(T.netz(profilZ(rand), M.eloxiert));
    // Ringe im Lichtschutz gegen Streulicht
    [5600, 7000, 8400].forEach(function (z) {
      g.add(T.netz(T.ringZ(R_ROHR - 230, R_ROHR - 6, z, z + 20, 96), M.kunststoff));
    });
    // Handläufe für die Astronauten
    [0.3, 2.8].forEach(function (w) {
      var lauf = T.netz(T.zylinderZ(18, 1700, 8800, 12), M.gold);
      lauf.position.set(Math.cos(w) * (R_ROHR + 60), Math.sin(w) * (R_ROHR + 60), 0);
      g.add(lauf);
    });
    return T.benenne(g, 'hubbleHuelle');
  }

  // Klappe vorne: gerundete Scheibe am Scharnier oben, weit aufgeklappt
  function deckel(M) {
    var g = new THREE.Group();
    g.position.set(0, R_ROHR + 20, Z_VORNE + 40);
    var R = R_ROHR + 30;
    var platte = T.netz(profilZ([[0, -40], [R - 40, -40], [R - 8, -28], [R, 0], [R - 8, 28], [R - 40, 40], [0, 40]]), M.folie);
    platte.position.y = -(R_ROHR + 20);
    g.add(platte);
    var scharnier = T.netz(new THREE.CylinderGeometry(45, 45, 900, 24), M.eloxiert);
    scharnier.rotation.z = Math.PI / 2;
    g.add(scharnier);
    g.rotation.x = -105 * Math.PI / 180;
    return T.benenne(g, 'hubbleDeckel');
  }

  // Hauptspiegel: Ring von 0,3 bis 1,2 m Radius, Vorderseite hohl
  function hauptspiegel(M) {
    var g = new THREE.Group();
    var p = [[H.loch, -300], [H.D / 2, -300]];
    for (var i = 8; i >= 0; i--) {
      var r = H.loch + (H.D / 2 - H.loch) * i / 8;
      p.push([r, r * r / (2 * H.R1)]);
    }
    var geo = T.drehteil(p, 96, false);
    geo.rotateX(Math.PI / 2);
    g.add(T.netz(geo, M.spiegel));
    // Haltering hinter dem Spiegel
    g.add(T.netz(T.ringZ(H.D / 2 - 40, R_ROHR - 10, -420, -60, 64), M.eloxiert));
    return T.benenne(g, 'hubbleHauptspiegel');
  }

  // Fangspiegel in seiner Fassung, gehalten von vier Streben (45°)
  function fangspiegel(M) {
    var g = new THREE.Group();
    var z = H.abstand;
    var spiegel = T.netz(new THREE.CircleGeometry(H.sekD / 2, 40), M.spiegel);
    spiegel.rotation.y = Math.PI;                    // schaut nach −z, zum Hauptspiegel
    spiegel.position.z = z - 1;
    g.add(spiegel);
    g.add(T.netz(T.zylinderZ(H.sekD / 2 + 20, z, z + 260, 40), M.kunststoff));
    for (var k = 0; k < 4; k++) {
      var w = Math.PI / 4 + k * Math.PI / 2;
      var lang = R_ROHR - H.sekD / 2 - 20;
      var strebe = T.netz(new THREE.BoxGeometry(lang, 8, 90), M.kunststoff);
      strebe.position.set(Math.cos(w) * (H.sekD / 2 + 20 + lang / 2), Math.sin(w) * (H.sekD / 2 + 20 + lang / 2), z + 130);
      strebe.rotation.z = w;
      g.add(strebe);
    }
    return T.benenne(g, 'hubbleFangspiegel');
  }

  // Heck: Gerätering und das dicke Ende mit den Instrumenten – eine
  // durchgehende Haut mit gerundeten Kanten, vorne ein Kragen zum Rohr
  function heck(M, folie) {
    var g = new THREE.Group();
    var p = [[0, Z_HINTEN], [900, Z_HINTEN + 15], [1500, Z_HINTEN + 45], [1850, Z_HINTEN + 90]];
    for (var i = 0; i <= 6; i++) {
      var w = -Math.PI / 2 + (Math.PI / 2) * i / 6;
      p.push([R_HECK - 160 + Math.cos(w) * 160, Z_HINTEN + 250 + Math.sin(w) * 160]);
    }
    for (var j = 0; j <= 6; j++) {
      var w2 = (Math.PI / 2) * j / 6;
      p.push([R_HECK - 160 + Math.cos(w2) * 160, 1250 + Math.sin(w2) * 160]);
    }
    p.push([R_ROHR + 120, 1440], [R_ROHR + 20, 1470], [R_ROHR, 1500]);
    g.add(T.netz(profilZ(p), folie));
    // Innenseite (nur im aufgeschnittenen Heck zu sehen)
    var innen = p.slice(0, p.length - 3).map(function (q) { return [Math.max(0, q[0] - 10), q[1] + 10]; });
    g.add(T.netz(profilZ(innen), M.innen));
    // Instrumente in ihren Schränken, um den Brennpunkt herum
    for (var k = 0; k < 4; k++) {
      var w3 = Math.PI / 4 + k * Math.PI / 2;
      var kasten = T.netz(T.kasten(900, 900, 2300, 60), k % 2 ? M.eloxiert : M.folie);
      kasten.position.set(Math.cos(w3) * 1150, Math.sin(w3) * 1150, -2350);
      g.add(kasten);
    }
    return T.benenne(g, 'hubbleHeck');
  }

  // Solarflügel: Mast mit Gelenk, Platte mit Zellen, Rahmen und Mittelholm
  function solarFluegel(M, solar, seite) {
    var g = new THREE.Group();
    var mast = T.netz(new THREE.CylinderGeometry(55, 55, 900, 20), M.alu);
    mast.rotation.z = Math.PI / 2;
    mast.position.set(seite * (R_HECK + 450), 0, 300);
    g.add(mast);
    var gelenk = T.netz(new THREE.SphereGeometry(110, 24, 16), M.eloxiert);
    gelenk.position.set(seite * (R_HECK + 900), 0, 300);
    g.add(gelenk);
    var platte = new THREE.Group();
    platte.position.set(seite * (R_HECK + 900 + 3700), 0, 300);
    platte.rotation.x = 0.35;                         // zur Sonne gedreht
    platte.add(T.netz(new THREE.BoxGeometry(7300, 20, 2650), solar));
    [[7300, 60, 0, 1325], [7300, 60, 0, -1325], [60, 2650, 3650, 0], [60, 2650, -3650, 0], [7300, 90, 0, 0]].forEach(function (b) {
      var holm = T.netz(T.kasten(b[0] + 40, 46, b[1], 18), M.alu);
      holm.position.set(b[2], 0, b[3]);
      platte.add(holm);
    });
    g.add(platte);
    return T.benenne(g, 'hubbleSolar');
  }

  // Zwei Parabolantennen an Auslegern, oben und unten
  function antennen(M) {
    var g = new THREE.Group();
    [-1, 1].forEach(function (s) {
      var arm = T.netz(new THREE.CylinderGeometry(40, 40, 2300, 16), M.alu);
      arm.position.set(0, s * (R_ROHR + 1150), 2600);
      g.add(arm);
      var gelenk = T.netz(new THREE.SphereGeometry(90, 20, 14), M.eloxiert);
      gelenk.position.set(0, s * (R_ROHR + 2300), 2600);
      g.add(gelenk);
      var antenne = new THREE.Group();
      antenne.position.set(0, s * (R_ROHR + 2380), 2600);
      if (s < 0) antenne.rotation.x = Math.PI;
      antenne.rotation.z = 0.25;                      // zur Erde geneigt
      antenne.add(T.netz(T.schale(650, 170, 48), M.folie));
      var speiser = T.netz(new THREE.CylinderGeometry(22, 30, 420, 12), M.eloxiert);
      speiser.position.y = 210;
      antenne.add(speiser);
      g.add(antenne);
    });
    return T.benenne(g, 'hubbleAntenne');
  }

  function erzeuge() {
    var M = O.Material.alle();
    var solar = O.Material.solarzellen(3);
    var folie = O.Material.folienFelder(16, 6);

    var wurzel = new THREE.Group();
    var azimut = new THREE.Group();
    var hoehe = new THREE.Group();
    var tubus = new THREE.Group();

    var teile = {
      huelle: huelle(M, folie),
      deckel: deckel(M),
      hauptspiegel: hauptspiegel(M),
      fangspiegel: fangspiegel(M),
      heck: heck(M, folie),
      solarRechts: solarFluegel(M, solar, 1),
      solarLinks: solarFluegel(M, solar, -1),
      antennen: antennen(M)
    };
    teile.solarLinks.userData.keinSchild = true;
    // Schild an die obere Schüssel, nicht in die Mitte (dort steckt das Rohr)
    teile.antennen.userData.anker = new THREE.Vector3(0, R_ROHR + 2600, 2600);
    Object.keys(teile).forEach(function (k) { tubus.add(teile[k]); });

    wurzel.add(azimut);
    azimut.add(hoehe);
    hoehe.position.y = ACHSE_Y;
    hoehe.add(tubus);
    tubus.rotation.y = Math.PI;
    tubus.position.z = (Z_VORNE + Z_HINTEN) / 2;
    hoehe.rotation.x = 12 * Math.PI / 180;
    azimut.rotation.y = -55 * Math.PI / 180;

    // Der Mensch schwebt unter dem Heck – außerhalb, auch beim Zerlegen
    // (die Teile fahren entlang der Achse auseinander, nicht nach unten)
    wurzel.updateMatrixWorld(true);
    var menschOrt = tubus.localToWorld(new THREE.Vector3(0, -R_HECK - 1500, -2000));
    menschOrt.y -= 900;

    var fehler = !!O.zustand.hubble1990;
    var teleskop = O.Beruehmt.teleskop({
      id: 'hubble',
      wurzel: wurzel,
      azimut: azimut,
      hoehe: hoehe,
      tubus: tubus,
      teile: teile,
      masse: { D: H.D, zHinten: Z_HINTEN, zVorne: Z_VORNE, rAussen: R_ROHR, laenge: Z_VORNE - Z_HINTEN },
      randschicht: ['hubbleHuelle', 'hubbleHeck'],
      weltall: 'erde',
      sonne: new THREE.Vector3(-0.45, 0.8, -0.4),
      mensch: menschOrt,
      licht: function () { return O.Weltraumoptik.lichtHubble(Z_VORNE, O.zustand.hubble1990); },
      lichtMassstab: 3,
      okularOptik: O.Weltraumoptik.okularHubble(fehler),
      // Kein Okular: Der Blick geht hinten an die Kamera
      auge: function () {
        return {
          punkt: tubus.localToWorld(new THREE.Vector3(0, 0, Z_HINTEN)),
          achse: new THREE.Vector3(0, 0, -1).transformDirection(tubus.matrixWorld)
        };
      },
      ziele: function () {
        function z(dz) { return new THREE.Vector3(0, 0, dz); }
        return [
          { objekt: teile.deckel, versatz: z(1800) },
          { objekt: teile.fangspiegel, versatz: z(6200) },
          { objekt: teile.hauptspiegel, versatz: z(-1800) },
          { objekt: teile.heck, versatz: z(-5200) },
          { objekt: teile.solarRechts, versatz: new THREE.Vector3(2500, 0, 0) },
          { objekt: teile.solarLinks, versatz: new THREE.Vector3(-2500, 0, 0) },
          { objekt: teile.antennen, versatz: new THREE.Vector3(0, 0, 1200) }
        ];
      }
    });
    return teleskop;
  }

  O.Beruehmt.melde('hubble', erzeuge);
})(globalThis.OPTIK = globalThis.OPTIK || {});
