/*
  Was außen am Newton-Tubus sitzt: Okularauszug mit Okular, Sucherfernrohr
  und die beiden Höhenräder. Gebaut im Tubus-Koordinatensystem wie
  Newton.js (z = optische Achse, Hauptspiegel bei z = 0).
*/
(function (O) {
  'use strict';

  var T = O.Teile;
  var quer = T.quer;
  var aufRohr = T.aufRohr;

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
  // s = −1 links, +1 rechts – jedes Rad eine eigene Gruppe, damit sie
  // beim Zerlegen auseinanderfahren können
  function hoehenrad(m, M, s) {
    var g = new THREE.Group();
    var rRad = m.rAussen * 0.92;
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
    return T.benenne(g, 'hoehenrad');
  }

  O.Anbauteile = {
    okularauszug: okularauszug,
    sucher: sucher,
    hoehenrad: hoehenrad
  };
})(globalThis.OPTIK = globalThis.OPTIK || {});
