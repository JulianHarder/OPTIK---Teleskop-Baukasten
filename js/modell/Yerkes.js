/*
  Der Yerkes-Refraktor (1897): Objektiv 102 cm (Achromat, 225 kg),
  Brennweite 19,3 m, Rohr 19 m lang und in der Mitte 1,27 m dick, auf
  einer deutschen Montierung von Warner & Swasey, die auf einer 12 m
  hohen Säule aus Gusseisen sitzt. Maße: js/daten/teleskope.js.

  Die Montierung ist äquatorial: Die Polachse zeigt zum Himmelspol und
  steht um die geographische Breite von Williams Bay (42,6°) geneigt. Die
  Gruppen heißen trotzdem wie beim Dobson, damit Ansicht und Zerlegen
  sie finden:
    azimut   dreht sich um die Polachse (Stundenachse)
    hoehe    dreht sich um die Deklinationsachse, trägt Rohr und Gegengewicht
    tubus    das Rohr, z = optische Achse, Licht von +z, Okularende bei z = 0

  Formen von Säule, Montierung und Okularende sind vereinfacht – die
  Hauptmaße stimmen.
*/
(function (O) {
  'use strict';

  var T = O.Teile;

  var L = 19200;                 // Rohrlänge (63 Fuß)
  var D = 1020;                  // Objektiv (40 Zoll)
  var R_MITTE = 635;             // 4 ft 2 in Durchmesser in der Mitte
  var R_ENDE = 520;
  var SAEULE = 12200;            // 40 Fuß
  var BREITE_GRAD = 42.57;       // Williams Bay, Wisconsin
  var Z_BALANCE = 10300;         // Drehpunkt: etwas zum schweren Objektiv hin
  var ROHR_X = 2290;             // Rohrachse neben der Polachse (auf der Deklinationsachse)
  // Himmelsnorden auf der Wiese – so gewählt, dass die Startkamera die
  // geneigte Polachse von der Seite sieht
  var NORD = new THREE.Vector3(-0.62, 0, 0.85).normalize();
  var OPTIK_Y = O.Historisch.yerkes();   // Objektiv, Brennpunkt (z = −620)

  function rohrRadius(z) {
    return R_ENDE + (R_MITTE - R_ENDE) * Math.sin(Math.PI * Math.max(0, Math.min(L, z)) / L);
  }

  function rohr(M) {
    var g = new THREE.Group();
    var aussen = [];
    var innen = [];
    for (var i = 0; i <= 24; i++) {
      var z = L * i / 24;
      aussen.push([rohrRadius(z), z]);
      innen.push([rohrRadius(z) - 8, z]);
    }
    [[aussen, M.lackGrau], [innen, M.innen]].forEach(function (p) {
      var geo = T.drehteil(p[0], 96, false);
      geo.rotateX(Math.PI / 2);
      g.add(T.netz(geo, p[1]));
    });
    // Flansche an den Stößen der Rohrstücke
    for (var k = 1; k < 6; k++) {
      var zk = L * k / 6;
      g.add(T.netz(T.ringZ(rohrRadius(zk) - 2, rohrRadius(zk) + 16, zk - 30, zk + 30, 96), M.eisen));
    }
    return T.benenne(g, 'yerkesRohr');
  }

  // Objektiv: beide Linsen mit genau den Radien aus dem Strahlverfolger
  // (physik/Historisch.js), in einer kräftigen Zelle
  function objektiv(M) {
    var g = new THREE.Group();
    var fl = OPTIK_Y.objektiv.flaechen;
    var z0 = OPTIK_Y.zObjektiv;
    var hinten = z0 + fl[2].z;
    g.add(T.netz(T.ringZ(D / 2 - 6, rohrRadius(z0) + 40, hinten - 80, z0 + 80, 96), M.eisen));
    g.add(O.Refraktor.linse(z0 + fl[0].z, fl[0].R, z0 + fl[1].z, fl[1].R, D / 2, M.kronglas, 'yerkesObjektiv'));
    g.add(O.Refraktor.linse(z0 + fl[1].z, fl[1].R, z0 + fl[2].z, fl[2].R, D / 2, M.flintglas, 'yerkesObjektiv'));
    return T.benenne(g, 'yerkesObjektiv');
  }

  function okularende(M) {
    var g = new THREE.Group();
    g.add(T.netz(T.zylinderZ(R_ENDE + 20, -60, 0, 96), M.eisen));
    var rahmen = T.netz(new THREE.BoxGeometry(760, 760, 480), M.eisen);
    rahmen.position.z = -300;
    g.add(rahmen);
    // Auszug mit Okular: der Brennpunkt liegt im Auszug, die Okularlinse
    // eine Okularbrennweite dahinter
    var zOk = OPTIK_Y.zFokus - OPTIK_Y.fOkular;
    g.add(T.netz(T.ringZ(70, 80, zOk - 20, -540, 32), M.messing));
    g.add(T.netz(T.ringZ(28, 36, zOk - 160, zOk - 20, 24), M.gummi));
    // Handräder links und rechts am Rahmen
    [-1, 1].forEach(function (s) {
      var rad = T.netz(new THREE.TorusGeometry(140, 14, 10, 32), M.messing);
      rad.rotation.y = Math.PI / 2;
      rad.position.set(s * 430, 0, -300);
      g.add(rad);
    });
    // Zwei Sucherfernrohre längs des Rohrs, mit Haltern
    [Math.PI * 0.3, Math.PI * 0.7].forEach(function (w, i) {
      var lang = i === 0 ? 3600 : 2400;
      var rs = i === 0 ? 95 : 70;
      var abstand = R_ENDE + 160 + rs;
      var x = Math.cos(w) * abstand;
      var y = Math.sin(w) * abstand;
      var sucher = T.netz(T.zylinderZ(rs, -400, lang - 400, 32), M.lackGrau);
      sucher.position.set(x, y, 0);
      g.add(sucher);
      [0, lang - 900].forEach(function (z) {
        var halter = T.netz(new THREE.BoxGeometry(40, abstand - rohrRadius(z) + 20, 60), M.eisen);
        halter.position.set(Math.cos(w) * (abstand + rohrRadius(z)) / 2, Math.sin(w) * (abstand + rohrRadius(z)) / 2, z);
        halter.rotation.z = w - Math.PI / 2;
        g.add(halter);
      });
    });
    return T.benenne(g, 'yerkesOkularende');
  }

  function saeule(M) {
    var g = new THREE.Group();
    var sockel = T.netz(new THREE.BoxGeometry(3600, 400, 3600), M.eisen);
    sockel.position.y = 200;
    g.add(sockel);
    // vier Stücke, nach oben schlanker, mit Flanschen dazwischen
    var hoch = (SAEULE - 400) / 4;
    for (var k = 0; k < 4; k++) {
      var y0 = 400 + k * hoch;
      var rUnten = 1500 - k * 160;
      var rOben = rUnten - 160;
      var stueck = T.netz(new THREE.CylinderGeometry(rOben, rUnten, hoch, 8), M.eisen);
      stueck.position.y = y0 + hoch / 2;
      stueck.rotation.y = Math.PI / 8;
      g.add(stueck);
      var flansch = T.netz(new THREE.CylinderGeometry(rUnten + 60, rUnten + 60, 80, 8), M.eisen);
      flansch.position.y = y0 + 40;
      flansch.rotation.y = Math.PI / 8;
      g.add(flansch);
    }
    return T.benenne(g, 'yerkesSaeule');
  }

  function erzeuge(winkel) {
    var M = O.Material.alle();
    var wurzel = new THREE.Group();
    var azimut = new THREE.Group();
    var hoehe = new THREE.Group();
    var tubus = new THREE.Group();

    // ---------- fest: Säule und Kopf ----------
    var teile = { saeule: saeule(M) };
    wurzel.add(teile.saeule);
    var kopf = new THREE.Group();
    var block = T.netz(new THREE.BoxGeometry(1700, 900, 1700), M.eisen);
    block.position.y = SAEULE + 450;
    kopf.add(block);
    wurzel.add(T.benenne(kopf, 'yerkesMontierung'));

    // ---------- Polachse: zeigt nach Norden, um die Breite geneigt ----------
    var b = BREITE_GRAD * Math.PI / 180;
    var pol = NORD.clone().multiplyScalar(Math.cos(b)).setY(Math.sin(b));
    wurzel.add(azimut);
    azimut.position.y = SAEULE + 900;
    azimut.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), pol);
    var stunde = new THREE.Group();          // Drehung um die Polachse
    azimut.add(stunde);
    var polGehaeuse = new THREE.Group();
    var pg = T.netz(new THREE.CylinderGeometry(380, 460, 2800, 32), M.eisen);
    pg.position.y = -200;
    polGehaeuse.add(pg);
    stunde.add(T.benenne(polGehaeuse, 'yerkesMontierung'));

    // ---------- Deklinationsachse am oberen Ende der Polachse ----------
    stunde.add(hoehe);
    hoehe.position.y = 1500;
    var dek = new THREE.Group();
    var dg = T.netz(new THREE.CylinderGeometry(330, 330, 3300, 32), M.eisen);
    dg.rotation.z = Math.PI / 2;
    dg.position.x = -100;
    dek.add(dg);
    var sattel = T.netz(new THREE.BoxGeometry(260, 3200, 900), M.eisen);
    sattel.position.x = ROHR_X - R_MITTE - 110;
    dek.add(sattel);
    hoehe.add(T.benenne(dek, 'yerkesMontierung'));

    var gewicht = new THREE.Group();
    var stange = T.netz(new THREE.CylinderGeometry(130, 130, 1800, 24), M.eisen);
    stange.rotation.z = Math.PI / 2;
    stange.position.x = -2400;
    gewicht.add(stange);
    var klotz = T.netz(new THREE.CylinderGeometry(700, 700, 1000, 32), M.eisen);
    klotz.rotation.z = Math.PI / 2;
    klotz.position.x = -3100;
    gewicht.add(klotz);
    teile.gegengewicht = T.benenne(gewicht, 'yerkesGegengewicht');
    hoehe.add(teile.gegengewicht);

    // ---------- Rohr ----------
    teile.rohr = rohr(M);
    teile.objektiv = objektiv(M);
    teile.okularende = okularende(M);
    tubus.add(teile.rohr);
    tubus.add(teile.objektiv);
    tubus.add(teile.okularende);
    hoehe.add(tubus);
    tubus.rotation.x = -Math.PI / 2;             // Rohrachse (+z) entlang der Gruppen-y-Achse
    tubus.position.set(ROHR_X, -Z_BALANCE, 0);
    teile.montierung = polGehaeuse;
    teile.okularende.userData.anker = new THREE.Vector3(0, 0, -300);    // der Rahmen, nicht die Sucher

    // Wohin es zeigt: Stundenwinkel und Abstand vom Pol. So steht das Rohr
    // 32° hoch, von der Startkamera aus quer nach links, vor der Säule.
    var w = winkel || { stunde: 140, polabstand: 105 };
    stunde.rotation.y = w.stunde * Math.PI / 180;
    hoehe.rotation.x = w.polabstand * Math.PI / 180;

    return O.Beruehmt.teleskop({
      id: 'yerkes',
      wurzel: wurzel,
      azimut: stunde,
      hoehe: hoehe,
      tubus: tubus,
      teile: teile,
      masse: { D: D, zHinten: -840, zVorne: L, rAussen: R_MITTE, laenge: L },
      randschicht: ['yerkesRohr', 'yerkesOkularende'],
      // Ins Okular schaut man längs des Rohrs, von hinten
      auge: function () {
        return {
          punkt: tubus.localToWorld(new THREE.Vector3(0, 0, OPTIK_Y.zFokus - OPTIK_Y.fOkular - 160)),
          achse: new THREE.Vector3(0, 0, -1).transformDirection(tubus.matrixWorld)
        };
      },
      licht: function () { return O.Historisch.lichtYerkes(L); },
      lichtMassstab: 6,
      mensch: new THREE.Vector3(-1700, 0, 2600),
      ziele: function () {
        function z(dz) { return new THREE.Vector3(0, 0, dz); }
        return [
          { objekt: tubus, versatz: new THREE.Vector3(2600, 0, 0) },
          { objekt: teile.objektiv, versatz: z(3200) },
          { objekt: teile.okularende, versatz: z(-2600) },
          { objekt: teile.gegengewicht, versatz: new THREE.Vector3(-2200, 0, 0) }
        ];
      }
    });
  }

  O.Beruehmt.melde('yerkes', function () { return erzeuge(); });
  O.Yerkes = { erzeuge: erzeuge };      // mit eigenen Winkeln, zum Ausprobieren
})(globalThis.OPTIK = globalThis.OPTIK || {});
