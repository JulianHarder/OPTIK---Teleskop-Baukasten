/*
  Das Linsenfernrohr auf seinem Stativ: drei Aluminiumbeine, eine
  Ablage dazwischen, darauf ein azimutaler Montierungskopf, an dem das
  Rohr seitlich auf der Prismenschiene hängt.

  Aufbau der Gruppen wie beim Dobson (damit Ansichten, Licht, Zielen und
  Durchschauen für beide gleich funktionieren):
    wurzel   Stativ, steht
    azimut   dreht sich um die Stativachse (Kopf und Rohr)
    hoehe    Drehpunkt auf Höhe der Rohrachse, neigt sich um x
    tubus    das Rohr aus Refraktor.js, Achse bei 0° nach −z

  Das Rohr sitzt neben der Stativachse – so stößt es beim Blick nach oben
  nicht an die Beine.
*/
(function (O) {
  'use strict';

  var T = O.Teile;
  var KOPF_HOEHE = 1000;      // Oberkante Stativ

  function stativ(M) {
    var g = new THREE.Group();
    var spreiz = 520;           // Fußkreis-Radius
    for (var k = 0; k < 3; k++) {
      var w = k * Math.PI * 2 / 3 + Math.PI / 2;
      var fuss = new THREE.Vector3(Math.cos(w) * spreiz, 0, Math.sin(w) * spreiz);
      var oben = new THREE.Vector3(Math.cos(w) * 60, KOPF_HOEHE - 40, Math.sin(w) * 60);
      var mitte = oben.clone().lerp(fuss, 0.5);
      [[oben, mitte, 17], [mitte, fuss, 12]].forEach(function (s) {
        var laenge = s[0].distanceTo(s[1]);
        var bein = T.netz(new THREE.CylinderGeometry(s[2], s[2], laenge, 16), M.alu);
        bein.position.copy(s[0]).lerp(s[1], 0.5);
        T.richte(bein, s[0].clone().sub(s[1]));
        g.add(bein);
      });
      var klemme = T.netz(new THREE.CylinderGeometry(22, 22, 40, 16), M.kunststoff);
      klemme.position.copy(mitte);
      T.richte(klemme, oben.clone().sub(fuss));
      g.add(klemme);
      var schuh = T.netz(new THREE.SphereGeometry(18, 12, 8), M.gummi);
      schuh.position.copy(fuss).setY(10);
      g.add(schuh);
    }
    // Ablage (Dreieck) auf halber Höhe – mit drei Okularen
    var ablage = T.netz(new THREE.CylinderGeometry(150, 150, 10, 3), M.kunststoff);
    ablage.position.y = KOPF_HOEHE * 0.45;
    g.add(ablage);
    var kopf = T.netz(new THREE.CylinderGeometry(80, 90, 50, 32), M.kunststoff);
    kopf.position.y = KOPF_HOEHE - 25;
    g.add(kopf);
    return T.benenne(g, 'stativ');
  }

  // Montierungskopf: drehbarer Teller, senkrechter Arm, Höhenachse mit
  // Klemme. schieneX = Außenkante der Prismenschiene (Welt-x); Lager und
  // Arm schließen dort an, das Rohr liegt auf der anderen Seite.
  function montierung(M, schieneX, achseY) {
    var armX = schieneX + 55;
    var g = new THREE.Group();
    var teller = T.netz(new THREE.CylinderGeometry(75, 75, 30, 32), M.eloxiert);
    teller.position.y = KOPF_HOEHE + 15;
    g.add(teller);
    var arm = T.netz(new THREE.BoxGeometry(70, achseY - KOPF_HOEHE + 40, 110), M.eloxiert);
    arm.position.set(armX, (KOPF_HOEHE + achseY + 40) / 2, 0);
    g.add(arm);
    var lager = T.netz(new THREE.CylinderGeometry(55, 55, 20, 32), M.eloxiert);
    lager.rotation.z = Math.PI / 2;
    lager.position.set(schieneX + 10, achseY, 0);
    g.add(lager);
    var klemme = T.netz(T.raendel(22, 30, 20), M.raendel);
    klemme.rotation.z = -Math.PI / 2;
    klemme.position.set(armX + 35, achseY, 0);
    g.add(klemme);
    return T.benenne(g, 'montierung');
  }

  O.Stativ = {
    erzeuge: function (zustand) {
      var M = O.Material.alle();
      var m = O.Linsenoptik.masseRefraktor(zustand);

      // Rohrachse über dem Stativkopf; Rohr seitlich neben der Achse
      var achseY = KOPF_HOEHE + 150;
      var versatz = m.rAussen + 85;           // Stativachse → Rohrachse

      var wurzel = new THREE.Group();
      var azimut = new THREE.Group();
      var hoehe = new THREE.Group();
      var tubus = O.Refraktor.erzeuge(m);
      var bein = stativ(M);
      // Schiene sitzt bei −x im Tubus = +x in der Welt (Rohr um 180° gedreht)
      var kopf = montierung(M, -versatz + m.rAussen + 34, achseY);

      wurzel.add(bein);
      wurzel.add(azimut);
      azimut.add(kopf);
      azimut.add(hoehe);
      hoehe.position.set(-versatz, achseY, 0);
      hoehe.add(tubus);
      tubus.rotation.y = Math.PI;
      tubus.position.z = m.zBalance;

      wurzel.updateMatrixWorld(true);
      var teile = Object.assign({}, tubus.userData.teile, { montierung: kopf, stativ: bein });
      kopf.userData.anker = T.anker(kopf);
      bein.userData.anker = new THREE.Vector3(0, KOPF_HOEHE * 0.45, 0);

      var t = {
        bauart: 'refraktor',
        teile: teile,
        wurzel: wurzel,
        azimut: azimut,
        hoehe: hoehe,
        tubus: tubus,
        masse: m,
        drehpunktY: achseY,
        // geschnitten / durchsichtig werden Rohr, Taukappe, Auszug und Zenitspiegel
        randschicht: ['tubus', 'taukappe', 'okularauszug', 'zenitspiegel'],
        zerlegeZiele: function () { return O.Stativ.zerlegeZiele(t); }
      };
      O.Dobson.richte(t, zustand.hoeheGrad, zustand.azimutGrad);
      t.okularHoeheMm = O.Dobson.okularHoehe(t);
      return t;
    },

    zerlegeZiele: function (t) {
      var m = t.masse;
      var teile = t.teile;
      function z(dz) { return new THREE.Vector3(0, 0, dz); }
      var liste = [
        { objekt: t.hoehe, versatz: new THREE.Vector3(0, 300, 0) },
        { objekt: teile.taukappe, versatz: z(m.D * 2.2 + 200) },
        { objekt: teile.objektiv, versatz: z(m.D * 1.2 + 160) },
        { objekt: teile.okularauszug, versatz: z(-180) },
        { objekt: teile.zenitspiegel, versatz: z(-380) },
        { objekt: teile.okular, versatz: new THREE.Vector3(0, 140, 0) },
        { objekt: teile.sucher, versatz: T.quer(m.fokusWinkel + 1.0).multiplyScalar(180) },
        { objekt: teile.rohrschellen, versatz: new THREE.Vector3(-150, 0, 0) },
        { objekt: teile.montierung, versatz: new THREE.Vector3(240, 0, 0) }
      ];
      if (teile.flintlinse) liste.push({ objekt: teile.flintlinse, versatz: z(-90) });
      return liste;
    }
  };
})(globalThis.OPTIK = globalThis.OPTIK || {});
