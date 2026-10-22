/*
  Die Dobson-Montierung: eine Holzkiste (Rockerbox), in der der Tubus auf
  zwei Höhenrädern liegt, auf einer runden Bodenplatte drehbar.

  Ergebnis von erzeuge(): die Gruppen unten plus teile = { Name: Bauteil-
  Gruppe } für Zerlegen, Beschriftung und Infokarten.

  Aufbau der Gruppen (von außen nach innen):
    wurzel      steht auf der Wiese, Bodenplatte
    azimut      dreht sich um die senkrechte Achse (Rockerbox)
    hoehe       Drehpunkt in Höhe der Höhenräder, neigt sich um x
    tubus       der Newton-Tubus aus Newton.js, so gedreht, dass seine
                optische Achse (z) bei Höhe 0° waagerecht nach −z zeigt

  Dobsons Idee (1960er): Holz, Teflon und Schwerkraft statt teurer
  Mechanik – deshalb sind große Spiegel für Amateure bezahlbar geworden.
*/
(function (O) {
  'use strict';

  var T = O.Teile;
  var BRETT = 18;            // Sperrholz, mm
  var FUESSE = 30;           // Höhe der Füße unter der Bodenplatte
  var LUFT = 6;              // Teflon-Gleitlager zwischen Bodenplatte und Kiste

  // Seitenwand mit halbrunder Aussparung, in der das Höhenrad liegt.
  // Gebaut als Umriss in (Breite, Höhe) und dann ausgeformt.
  function seitenwand(breite, hoeheMitte, rRad, M) {
    var s = new THREE.Shape();
    var oben = hoeheMitte + rRad * 0.35;
    var schulter = breite / 2 - 40;
    s.moveTo(-breite / 2, 0);
    s.lineTo(breite / 2, 0);
    s.lineTo(breite / 2, oben - 50);
    s.quadraticCurveTo(breite / 2, oben, schulter, oben);
    s.lineTo(rRad + 2, oben);
    s.absarc(0, hoeheMitte, rRad + 2, Math.asin(Math.min(1, (oben - hoeheMitte) / (rRad + 2))),
      Math.PI - Math.asin(Math.min(1, (oben - hoeheMitte) / (rRad + 2))), true);
    s.lineTo(-schulter, oben);
    s.quadraticCurveTo(-breite / 2, oben, -breite / 2, oben - 50);
    s.lineTo(-breite / 2, 0);

    var g = new THREE.ExtrudeGeometry(s, {
      depth: BRETT, bevelEnabled: true, bevelThickness: 1.5, bevelSize: 1.5, bevelSegments: 1
    });
    g.translate(0, 0, -BRETT / 2);
    return T.netz(g, M.holzMm);
  }

  function rockerbox(m, H, M) {
    var g = new THREE.Group();
    var lagerX = O.Newton.lagerX(m);
    var rRad = O.Newton.lagerRadius(m);
    var breite = 2 * rRad + 170;              // Tiefe der Kiste entlang z
    var boden = FUESSE + BRETT + LUFT;        // Oberkante Bodenplatte + Luft
    var innen = boden + BRETT;                // Oberkante Kistenboden

    // Kistenboden
    var platte = T.netz(new THREE.BoxGeometry(2 * lagerX + BRETT + 24, BRETT, breite), M.holz);
    platte.position.y = boden + BRETT / 2;
    g.add(platte);

    // Seitenwände (Ebene y-z), Höhenrad-Mitte liegt H über dem Kistenboden
    [-1, 1].forEach(function (s) {
      var wand = seitenwand(breite, H, rRad, M);
      wand.rotation.y = -Math.PI / 2;
      wand.position.set(s * lagerX, innen, 0);
      g.add(wand);

      // zwei Teflonklötze in der Aussparung, auf denen das Rad gleitet
      [-0.75, 0.75].forEach(function (w) {
        var klotz = T.netz(new THREE.BoxGeometry(BRETT + 4, 6, 30), M.teflon);
        klotz.position.set(s * lagerX, innen + H - Math.cos(w) * (rRad + 3), Math.sin(w) * (rRad + 3));
        klotz.rotation.x = -w;
        g.add(klotz);
      });
    });

    // Frontbrett – niedrig, damit der Tubus beim Kippen frei schwingt
    var hFront = H * 0.42;
    var front = T.netz(new THREE.BoxGeometry(2 * lagerX - BRETT, hFront, BRETT), M.holz);
    front.position.set(0, innen + hFront / 2, -breite / 2 + BRETT / 2);
    g.add(front);

    // Okularablage außen am Frontbrett, mit drei Okularen
    var ablage = T.netz(new THREE.BoxGeometry(200, 14, 70), M.holz);
    ablage.position.set(0, innen + hFront - 30, -breite / 2 - 35);
    g.add(ablage);
    [-60, 0, 60].forEach(function (x, i) {
      var ok = T.okular(M);
      ok.scale.setScalar(0.92 - i * 0.06);
      ok.position.set(x, innen + hFront - 23, -breite / 2 - 35);
      ok.traverse(function (o) { if (o.isMesh) o.userData.teil = 'ablage'; });
      g.add(ok);
    });

    // Tragegriff an der rechten Wand
    var griff = new THREE.Group();
    [-50, 50].forEach(function (z) {
      var stuetze = T.netz(new THREE.CylinderGeometry(7, 7, 34, 12), M.kunststoff);
      stuetze.rotation.z = Math.PI / 2;
      stuetze.position.set(17, 0, z);
      griff.add(stuetze);
    });
    var stange = T.netz(T.zylinderZ(10, -62, 62, 16), M.kunststoff);
    stange.position.x = 34;
    griff.add(stange);
    griff.position.set(lagerX + BRETT / 2, innen + H * 0.55, 0);
    g.add(griff);

    return T.benenne(g, 'rockerbox');
  }

  function bodenplatte(m, M, radius) {
    var g = new THREE.Group();
    var platte = T.netz(new THREE.CylinderGeometry(radius, radius, BRETT, 72), M.holz);
    platte.position.y = FUESSE + BRETT / 2;
    g.add(platte);
    for (var k = 0; k < 3; k++) {
      var w = k * Math.PI * 2 / 3 + Math.PI / 6;
      var fuss = T.netz(new THREE.CylinderGeometry(22, 26, FUESSE, 20), M.gummi);
      fuss.position.set(Math.cos(w) * radius * 0.82, FUESSE / 2, Math.sin(w) * radius * 0.82);
      g.add(fuss);
    }
    var bolzen = T.netz(new THREE.CylinderGeometry(14, 14, LUFT + 4, 16), M.alu);
    bolzen.position.y = FUESSE + BRETT + LUFT / 2;
    g.add(bolzen);
    return T.benenne(g, 'bodenplatte');
  }

  O.Dobson = {
    // Baut das ganze Teleskop. Ergebnis:
    //   { wurzel, azimut, hoehe, tubus, masse, drehpunktY, mitte, radius }
    erzeuge: function (zustand) {
      var M = O.Material.alle();
      var m = O.Optik.masseNewton(zustand);

      // Drehpunkt so hoch, dass das Tubusende bei 90° (Zenit) knapp über
      // dem Kistenboden bleibt
      var H = (m.zBalance - m.zHinten) + 45;
      var innen = FUESSE + BRETT + LUFT + BRETT;
      var drehpunktY = innen + H;

      var wurzel = new THREE.Group();
      var azimut = new THREE.Group();
      var hoehe = new THREE.Group();
      var tubus = O.Newton.erzeuge(m);

      // Bodenplatte etwas größer als die Ecken der Kiste
      var rRad = O.Newton.lagerRadius(m);
      var radius = Math.hypot(O.Newton.lagerX(m) + BRETT + 12, rRad + 85) + 15;
      var platte = bodenplatte(m, M, radius);
      var kiste = rockerbox(m, H, M);
      wurzel.add(platte);
      wurzel.add(azimut);
      azimut.add(kiste);
      azimut.add(hoehe);
      hoehe.position.y = drehpunktY;
      hoehe.add(tubus);

      // Tubus: Schwerpunkt auf den Drehpunkt, optische Achse nach −z
      tubus.rotation.y = Math.PI;
      tubus.position.z = m.zBalance;

      // alle Bauteile mit Ankerpunkt für ihre Beschriftung
      wurzel.updateMatrixWorld(true);
      var teile = Object.assign({}, tubus.userData.teile, { rockerbox: kiste, bodenplatte: platte });
      kiste.userData.anker = T.anker(kiste);
      platte.userData.anker = new THREE.Vector3(radius * 0.7, FUESSE + BRETT, radius * 0.3);

      var ergebnis = {
        teile: teile,
        wurzel: wurzel,
        azimut: azimut,
        hoehe: hoehe,
        tubus: tubus,
        masse: m,
        drehpunktY: drehpunktY
      };
      O.Dobson.richte(ergebnis, zustand.hoeheGrad, zustand.azimutGrad);

      // Wie hoch liegt das Okular über dem Boden? (für das Datenblatt)
      wurzel.updateMatrixWorld(true);
      ergebnis.okularHoeheMm = teile.okular.localToWorld(new THREE.Vector3(0, 50, 0)).y;
      return ergebnis;
    },

    // Teleskop auf Höhe (über dem Horizont) und Azimut drehen
    richte: function (t, hoeheGrad, azimutGrad) {
      t.hoehe.rotation.x = hoeheGrad * Math.PI / 180;
      t.azimut.rotation.y = azimutGrad * Math.PI / 180;
    },

    // Wohin fährt jedes Teil in der Ansicht „zerlegt“? Versatz im
    // Koordinatensystem seiner Elterngruppe (für Tubusteile: z = Achse).
    // Reihenfolge wie beim echten Auseinanderbauen: Tubus aus der Kiste
    // heben, Räder ab, Spiegel hinten heraus, Fangspiegel vorne heraus.
    zerlegeZiele: function (t) {
      var m = t.masse;
      var teile = t.teile;
      function z(dz) { return new THREE.Vector3(0, 0, dz); }
      return [
        { objekt: t.hoehe, versatz: new THREE.Vector3(0, 420, 0) },
        { objekt: teile.hoehenradLinks, versatz: new THREE.Vector3(-200, 0, 0) },
        { objekt: teile.hoehenradRechts, versatz: new THREE.Vector3(200, 0, 0) },
        { objekt: teile.spiegelzelle, versatz: z(-540) },
        { objekt: teile.hauptspiegel, versatz: z(-270) },
        { objekt: teile.fangspiegel, versatz: z(420) },
        { objekt: teile.spinne, versatz: z(170) },
        { objekt: teile.okularauszug, versatz: T.quer(m.fokusWinkel).multiplyScalar(170) },
        { objekt: teile.okular, versatz: new THREE.Vector3(0, 130, 0) },
        { objekt: teile.sucher, versatz: T.quer(m.fokusWinkel + 1.0).multiplyScalar(200) }
      ];
    },

    // Alles freigeben, was nur zu diesem Teleskop gehört: Geometrien,
    // eigene Materialien (Schnitt-Kopien, Beschriftung) und deren Texturen.
    // Geteilte Materialien aus Material.alle() bleiben.
    entsorge: function (t) {
      t.wurzel.traverse(function (o) {
        if (o.geometry) o.geometry.dispose();
        var mat = o.material;
        if (mat && !mat.userData.geteilt) {
          if (mat.map) mat.map.dispose();
          mat.dispose();
        }
      });
    },

    // Kugel, die das ganze Teleskop umschließt (für die Kamera)
    huelle: function (t) {
      var box = new THREE.Box3().setFromObject(t.wurzel);
      var kugel = new THREE.Sphere();
      box.getBoundingSphere(kugel);
      return kugel;
    }
  };
})(globalThis.OPTIK = globalThis.OPTIK || {});
