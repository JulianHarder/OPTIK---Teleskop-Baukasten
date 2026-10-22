/*
  Der Newton-Tubus: Rohr, Spiegelzelle mit Hauptspiegel, Spinne mit
  Fangspiegel. Was außen am Rohr sitzt (Okularauszug, Sucher, Höhenräder),
  steht in Anbauteile.js.

  Gebaut im Tubus-Koordinatensystem aus physik/Optik.js:
  z = optische Achse, Hauptspiegel-Scheitel bei z = 0, Öffnung bei +z.
  Alle Maße kommen aus Optik.masseNewton() – das Modell rechnet nichts
  selbst aus, was die Optik bestimmt.
*/
(function (O) {
  'use strict';

  var T = O.Teile;
  var Z = new THREE.Vector3(0, 0, 1);
  var quer = T.quer;

  // ---------- Rohr ----------

  function rohr(m, M) {
    var g = new THREE.Group();
    g.add(T.netz(T.zylinderZ(m.rAussen, m.zHinten + 8, m.zVorne - 4, 96, true), M.lack, 'tubus'));
    g.add(T.netz(T.zylinderZ(m.rAussen - 1.8, m.zHinten + 8, m.zVorne - 4, 96, true), M.innen, 'tubus'));
    // Tubusring vorne
    g.add(T.netz(T.ringZ(m.rInnen - 3, m.rAussen + 3, m.zVorne - 28, m.zVorne, 96), M.kunststoff, 'tubus'));
    // blauer Zierstreifen und Beschriftung
    g.add(T.netz(T.ringZ(m.rAussen, m.rAussen + 0.6, m.zVorne - 70, m.zVorne - 58, 96), M.akzent, 'tubus'));
    g.add(beschriftung(m));
    return T.benenne(g, 'tubus');
  }

  // Schriftzug längs des Tubus, als Textur auf einem dünnen Mantel
  function beschriftung(m) {
    var c = document.createElement('canvas');
    c.width = 1024;
    c.height = 512;
    var ctx = c.getContext('2d');
    var D = Math.round(m.D);
    var f = Math.round(m.f);

    // Die Mitte des Schriftzugs liegt bei u = 0,25 – das ist auf dem
    // Mantel die Richtung +x im Tubus, die Seite zum Betrachter.
    // Gelesen wird von der Öffnung zum Spiegel hin – zeigt der Tubus nach
    // links oben, steht die Schrift damit richtig herum.
    ctx.translate(256, 256);
    ctx.rotate(Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#1b2a44';
    ctx.font = '700 64px system-ui, sans-serif';
    ctx.fillText(O.TEXTE.tubusSchrift.split('').join(' '), 0, -26);
    ctx.font = '500 34px system-ui, sans-serif';
    ctx.fillText(O.TEXTE.tubusZusatz.replace('{D}', D).replace('{f}', f), 0, 34);

    var t = new THREE.CanvasTexture(c);
    t.encoding = THREE.sRGBEncoding;
    t.anisotropy = 8;
    var hoehe = 360;
    var g = new THREE.CylinderGeometry(m.rAussen + 0.4, m.rAussen + 0.4, hoehe, 96, 1, true);
    g.rotateX(Math.PI / 2);
    var mantel = new THREE.Mesh(g, new THREE.MeshStandardMaterial({
      map: t, transparent: true, roughness: 0.4, depthWrite: false
    }));
    mantel.position.z = m.zVorne - 110 - hoehe / 2;
    mantel.userData.teil = 'tubus';
    return mantel;
  }

  // ---------- Hauptspiegel und Zelle ----------

  function hauptspiegel(m, M) {
    var g = new THREE.Group();
    var R = m.D / 2;

    // Spiegelfläche: echte Parabel, Tiefe r² / 4f (bei 200/1200 ≈ 2 mm am Rand)
    var profil = [];
    for (var i = 24; i >= 0; i--) {
      var r = R * i / 24;
      profil.push([r, m.sag(r)]);
    }
    var flaeche = T.drehteil(profil, 96, false);
    flaeche.rotateX(Math.PI / 2);
    g.add(T.netz(flaeche, M.spiegel));

    // Glaskörper
    g.add(T.netz(T.zylinderZ(R, -m.spiegelDicke, -0.3, 96), M.glasKante));

    // drei Spiegelklammern am Rand
    for (var k = 0; k < 3; k++) {
      var w = Math.PI / 2 + k * Math.PI * 2 / 3;
      var klammer = T.netz(new THREE.BoxGeometry(14, 5, 10), M.kunststoff);
      klammer.position.copy(quer(w).multiplyScalar(R - 2)).setZ(m.sag(R) + 2);
      klammer.rotation.z = w + Math.PI / 2;
      g.add(klammer);
    }
    return T.benenne(g, 'hauptspiegel');
  }

  function spiegelzelle(m, M) {
    var g = new THREE.Group();
    var R = m.D / 2;
    g.add(T.netz(T.ringZ(m.rInnen - 3, m.rAussen + 3, m.zHinten, m.zHinten + 32, 96), M.kunststoff));
    g.add(T.netz(T.zylinderZ(m.rAussen + 3, m.zHinten, m.zHinten + 8, 96), M.kunststoff));
    g.add(T.netz(T.zylinderZ(R * 0.8, -m.spiegelDicke - 8, -m.spiegelDicke, 64), M.kunststoff));

    // drei Justierschrauben (große Rändel) und drei Konterschrauben hinten
    for (var k = 0; k < 3; k++) {
      var w = Math.PI / 2 + k * Math.PI * 2 / 3;
      var knopf = T.netz(T.raendel(15, 16, 20), M.raendel);
      knopf.rotation.x = -Math.PI / 2;               // y-Achse → −z, nach hinten
      knopf.position.copy(quer(w).multiplyScalar(R * 0.58)).setZ(m.zHinten);
      g.add(knopf);

      var konter = T.netz(T.raendel(6, 12, 6), M.alu);
      konter.rotation.x = -Math.PI / 2;
      konter.position.copy(quer(w + Math.PI / 3).multiplyScalar(R * 0.58)).setZ(m.zHinten);
      g.add(konter);
    }
    return T.benenne(g, 'spiegelzelle');
  }

  // ---------- Fangspiegel und Spinne ----------

  function fangspiegel(m, M) {
    var g = new THREE.Group();
    var a = m.fang;                         // kleine Achse
    var u = quer(m.fokusWinkel);            // Richtung zum Okularauszug

    // Spiegelfläche: Ellipse a × a·√2 unter 45°. Normale zeigt zum
    // Hauptspiegel (−z) und zum Okularauszug (u).
    var n = u.clone().sub(Z).normalize();
    var lang = u.clone().add(Z).normalize();
    var basis = new THREE.Matrix4().makeBasis(new THREE.Vector3().crossVectors(lang, n), lang, n);
    var ellipse = new THREE.CircleGeometry(a / 2, 48);
    ellipse.scale(1, Math.SQRT2, 1);
    var spiegel = T.netz(ellipse, M.spiegel);
    spiegel.quaternion.setFromRotationMatrix(basis);
    spiegel.position.set(0, 0, m.zFang).addScaledVector(n, 0.3);
    g.add(spiegel);

    // Halter: Zylinder, unten genau unter 45° abgeschnitten
    var oben = m.zFang + a / 2 + 24;
    var halter = new THREE.CylinderGeometry(a / 2, a / 2, 1, 40, 1, true);
    halter.rotateX(Math.PI / 2);
    var p = halter.attributes.position;
    for (var i = 0; i < p.count; i++) {
      var x = p.getX(i);
      var y = p.getY(i);
      // Schnittebene: z = zFang + x·cos + y·sin
      p.setZ(i, p.getZ(i) > 0 ? oben : m.zFang + x * u.x + y * u.y);
    }
    halter.computeVertexNormals();
    g.add(T.netz(halter, M.kunststoff));
    var deckel = T.netz(new THREE.CircleGeometry(a / 2, 40), M.kunststoff);
    deckel.position.z = oben;
    g.add(deckel);

    // Nabe mit Justierschraube
    g.add(T.netz(T.zylinderZ(a / 2 + 3, oben, oben + 14, 40), M.eloxiert));
    var schraube = T.netz(T.raendel(4, 12, 8), M.alu);
    schraube.rotation.x = Math.PI / 2;
    schraube.position.z = oben + 14;
    g.add(schraube);

    T.benenne(g, 'fangspiegel');
    g.add(spinne(m, M, oben + 7, a / 2 + 3));
    return g;
  }

  // Vier dünne Streben halten den Fangspiegel. Sie erzeugen später im
  // Okular die vier Zacken an hellen Sternen.
  function spinne(m, M, z, rNabe) {
    var g = new THREE.Group();
    var rWand = m.rAussen - 1.8;
    var laenge = rWand - rNabe;
    for (var k = 0; k < 4; k++) {
      var w = m.fokusWinkel + k * Math.PI / 2;
      var dir = quer(w);
      var strebe = T.netz(new THREE.BoxGeometry(laenge, 1, 22), M.kunststoff);
      strebe.position.copy(dir).multiplyScalar(rNabe + laenge / 2).setZ(z);
      strebe.rotation.z = w;
      g.add(strebe);

      // Halteschraube außen am Tubus
      var halt = T.aufRohr(dir, m.rAussen, z);
      halt.add(T.netz(T.raendel(7, 9, 12), M.raendel));
      g.add(halt);
    }
    return T.benenne(g, 'spinne');
  }

  O.Newton = {
    // x-Abstand der Höhenräder von der Achse (die Rockerbox richtet sich danach)
    lagerX: function (m) { return m.rAussen + 62; },
    lagerRadius: function (m) { return m.rAussen * 0.92; },

    // Der ganze Tubus als Gruppe im Tubus-Koordinatensystem.
    // gruppe.userData.teile = { schluessel: Bauteil-Gruppe } für Zerlegen,
    // Beschriftung und Infokarten. Jede Bauteil-Gruppe trägt in
    // userData.anker den Punkt, an dem ihre Beschriftung hängt.
    erzeuge: function (m) {
      var M = O.Material.alle();
      var g = new THREE.Group();
      var teile = {
        tubus: rohr(m, M),
        spiegelzelle: spiegelzelle(m, M),
        hauptspiegel: hauptspiegel(m, M),
        fangspiegel: fangspiegel(m, M),
        okularauszug: O.Anbauteile.okularauszug(m, M),
        sucher: O.Anbauteile.sucher(m, M),
        hoehenradLinks: O.Anbauteile.hoehenrad(m, M, -1),
        hoehenradRechts: O.Anbauteile.hoehenrad(m, M, 1)
      };
      Object.keys(teile).forEach(function (k) { g.add(teile[k]); });
      g.updateMatrixWorld(true);

      // Unterteile mit eigenem Namen
      teile.okular = teile.okularauszug.children.find(function (c) { return c.userData.teil === 'okular'; });
      teile.spinne = teile.fangspiegel.children.find(function (c) { return c.userData.teil === 'spinne'; });

      Object.keys(teile).forEach(function (k) {
        teile[k].userData.anker = T.anker(teile[k]);
      });
      // Die Spinne sitzt mitten auf dem Fangspiegel – ihr Schild an eine Strebe
      var strebe = quer(m.fokusWinkel + Math.PI).multiplyScalar(m.rInnen * 0.7);
      teile.spinne.userData.anker = strebe.setZ(m.zFang + m.fang / 2 + 31);

      g.userData.teile = teile;
      return g;
    }
  };
})(globalThis.OPTIK = globalThis.OPTIK || {});
