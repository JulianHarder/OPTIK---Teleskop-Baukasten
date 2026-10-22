/*
  Der Newton-Tubus: Rohr, Spiegelzelle mit Hauptspiegel, Spinne mit
  Fangspiegel, Okularauszug mit Okular, Sucherfernrohr, Höhenräder.

  Gebaut im Tubus-Koordinatensystem aus physik/Optik.js:
  z = optische Achse, Hauptspiegel-Scheitel bei z = 0, Öffnung bei +z.
  Alle Maße kommen aus Optik.masseNewton() – das Modell rechnet nichts
  selbst aus, was die Optik bestimmt.
*/
(function (O) {
  'use strict';

  var T = O.Teile;
  var Z = new THREE.Vector3(0, 0, 1);

  // Einheitsvektor quer zur Achse unter dem Winkel w (von +x nach +y)
  function quer(w) {
    return new THREE.Vector3(Math.cos(w), Math.sin(w), 0);
  }

  // Gruppe, deren y-Achse nach außen (dir) und deren z-Achse entlang des
  // Tubus zeigt – für alles, was außen auf dem Rohr sitzt.
  function aufRohr(dir, radius, z) {
    var g = new THREE.Group();
    var x = new THREE.Vector3().crossVectors(dir, Z);
    g.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, dir, Z));
    g.position.copy(dir).multiplyScalar(radius).setZ(z);
    return g;
  }

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
      var halt = aufRohr(dir, m.rAussen, z);
      halt.add(T.netz(T.raendel(7, 9, 12), M.raendel));
      g.add(halt);
    }
    return T.benenne(g, 'spinne');
  }

  // ---------- Okularauszug ----------

  // Gebogene Grundplatte, die genau auf dem runden Rohr aufliegt:
  // ein Ringstück (Radius r bis r + dicke) über die Breite, ausgeformt
  // entlang der Tubusachse. Im Koordinatensystem von aufRohr() liegt die
  // Tubusmitte bei y = −r.
  function sattel(r, dicke, breite, laenge) {
    var w = Math.asin(breite / 2 / (r + dicke));
    var s = new THREE.Shape();
    s.absarc(0, -r, r + dicke, Math.PI / 2 - w, Math.PI / 2 + w, false);
    s.absarc(0, -r, r - 0.5, Math.PI / 2 + w, Math.PI / 2 - w, true);
    var g = new THREE.ExtrudeGeometry(s, {
      depth: laenge, bevelEnabled: true, bevelThickness: 2, bevelSize: 2, bevelSegments: 2,
      curveSegments: 24
    });
    g.translate(0, 0, -laenge / 2);
    return g;
  }

  function okularauszug(m, M) {
    var u = quer(m.fokusWinkel);
    var g = aufRohr(u, m.rAussen, m.zFang);
    var h = m.auszugHoehe;     // y = h ist der Brennpunkt

    g.add(T.netz(sattel(m.rAussen, 12, 76, 112), M.eloxiert));
    var koerper = T.netz(new THREE.BoxGeometry(62, 38, 86), M.eloxiert);
    koerper.position.y = 26;
    g.add(koerper);

    // Fokussierknöpfe links und rechts, Achse quer zum Tubus
    [-1, 1].forEach(function (s) {
      var welle = T.netz(new THREE.CylinderGeometry(4, 4, 18, 12), M.alu);
      welle.rotation.z = Math.PI / 2;
      welle.position.set(s * 40, 28, 0);
      g.add(welle);
      var knopf = T.netz(T.raendel(17, 14, 28), M.raendel);
      knopf.rotation.z = -s * Math.PI / 2;
      knopf.position.set(s * 46, 28, 0);
      g.add(knopf);
    });

    // Auszugsrohr (2 Zoll) und Klemmring für 1¼-Zoll-Okulare
    var rohr = T.netz(new THREE.CylinderGeometry(28, 28, h - 30, 48), M.alu);
    rohr.position.y = 30 + (h - 30) / 2;
    g.add(rohr);
    var klemme = T.netz(T.drehteil([[16, 0], [30, 0], [30, 12], [16, 12]], 48, true), M.kunststoff);
    klemme.position.y = h - 12;
    g.add(klemme);
    var schraube = T.netz(T.raendel(6, 10, 10), M.raendel);
    schraube.rotation.z = -Math.PI / 2;
    schraube.position.set(30, h - 6, 0);
    g.add(schraube);

    T.benenne(g, 'okularauszug');

    var ok = O.Teile.okular(M);
    ok.position.y = h;
    g.add(ok);
    return g;
  }

  // ---------- Sucherfernrohr ----------

  function sucher(m, M) {
    var dir = quer(m.fokusWinkel + 1.0);
    var g = aufRohr(dir, m.rAussen, m.zVorne - 260);
    var y = 70;     // Höhe der Sucherachse über dem Tubus

    var fuss = T.netz(new THREE.BoxGeometry(32, 10, 110), M.kunststoff);
    fuss.position.y = 2;
    g.add(fuss);
    [-34, 34].forEach(function (z) {
      var stuetze = T.netz(new THREE.BoxGeometry(20, y - 28, 16), M.kunststoff);
      stuetze.position.set(0, (y - 28) / 2 + 6, z);
      g.add(stuetze);
      var ring = T.netz(T.ringZ(28, 34, z - 6, z + 6, 48), M.kunststoff);
      ring.position.y = y;
      g.add(ring);
      for (var k = 0; k < 3; k++) {
        var w = Math.PI / 2 + k * Math.PI * 2 / 3;
        var s = T.netz(T.raendel(4, 9, 8), M.alu);
        T.richte(s, quer(w));
        s.position.set(Math.cos(w) * 33, y + Math.sin(w) * 33, z);
        g.add(s);
      }
    });

    var koerper = new THREE.Group();
    koerper.position.y = y;
    koerper.add(T.netz(T.zylinderZ(26, -70, 95, 40), M.lack));
    koerper.add(T.netz(T.zylinderZ(31, 95, 150, 40, true), M.kunststoff));
    koerper.add(T.netz(T.zylinderZ(29, 95, 150, 40, true), M.innen));
    var objektiv = T.netz(new THREE.CircleGeometry(26, 32), M.linse);
    objektiv.position.z = 112;
    koerper.add(objektiv);
    koerper.add(T.netz(T.zylinderZ(13, -118, -70, 24), M.kunststoff));
    koerper.add(T.netz(T.zylinderZ(16, -132, -118, 24), M.gummi));
    g.add(koerper);

    return T.benenne(g, 'sucher');
  }

  // ---------- Höhenräder ----------

  // Zwei große Scheiben links und rechts am Schwerpunkt. Auf ihnen
  // liegt der Tubus in der Rockerbox und lässt sich auf und ab neigen.
  function hoehenraeder(m, M) {
    var g = new THREE.Group();
    var rRad = m.rAussen * 0.92;
    [-1, 1].forEach(function (s) {
      var block = T.netz(new THREE.BoxGeometry(30, 110, 130), M.kunststoff);
      block.position.set(s * (m.rAussen + 12), 0, m.zBalance);
      g.add(block);
      var achse = T.netz(new THREE.CylinderGeometry(22, 22, 30, 24), M.eloxiert);
      achse.rotation.z = Math.PI / 2;
      achse.position.set(s * (m.rAussen + 38), 0, m.zBalance);
      g.add(achse);
      var rad = T.netz(new THREE.CylinderGeometry(rRad, rRad, 28, 96), M.kunststoff);
      rad.rotation.z = Math.PI / 2;
      rad.position.set(s * O.Newton.lagerX(m), 0, m.zBalance);
      g.add(rad);
      var kappe = T.netz(T.raendel(34, 22, 24), M.raendel);
      kappe.rotation.z = -s * Math.PI / 2;
      kappe.position.set(s * (O.Newton.lagerX(m) + 14), 0, m.zBalance);
      g.add(kappe);
    });
    return T.benenne(g, 'hoehenrad');
  }

  O.Newton = {
    // x-Abstand der Höhenräder von der Achse (die Rockerbox richtet sich danach)
    lagerX: function (m) { return m.rAussen + 62; },
    lagerRadius: function (m) { return m.rAussen * 0.92; },

    // Der ganze Tubus als Gruppe im Tubus-Koordinatensystem
    erzeuge: function (m) {
      var M = O.Material.alle();
      var g = new THREE.Group();
      g.add(rohr(m, M));
      g.add(spiegelzelle(m, M));
      g.add(hauptspiegel(m, M));
      g.add(fangspiegel(m, M));
      g.add(okularauszug(m, M));
      g.add(sucher(m, M));
      g.add(hoehenraeder(m, M));
      return g;
    }
  };
})(globalThis.OPTIK = globalThis.OPTIK || {});
