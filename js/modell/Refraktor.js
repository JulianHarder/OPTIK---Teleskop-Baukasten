/*
  Das Linsenfernrohr: Rohr mit Taukappe, Objektiv (eine oder zwei Linsen
  in echter Form), Zahntrieb-Auszug, Zenitspiegel mit Okular, Sucher und
  Rohrschellen auf einer Prismenschiene.

  Gebaut im Tubus-System aus physik/Linsenoptik.js: z = optische Achse,
  das Licht kommt von +z, der Zenitspiegel sitzt bei z = 0 und schickt
  das Licht nach +y zum Okular hinauf. Alle Maße kommen aus der Optik –
  die Linsen haben genau die Radien, mit denen das Licht gerechnet wird.

  Die Montierung (Stativ.js) setzt das Rohr dann aufs Stativ.
*/
(function (O) {
  'use strict';

  var T = O.Teile;

  // Höhe einer Linsenfläche bei Radius r (Optiker-Vorzeichen, Licht nach −z)
  function flaechenZ(zScheitel, R, r) {
    var a = Math.abs(R);
    return zScheitel - Math.sign(R) * (a - Math.sqrt(Math.max(0, a * a - r * r)));
  }

  // Eine Linse als Drehteil aus Vorder- und Rückfläche
  function linse(zVorn, R1, zHinten, R2, rand, mat, teil) {
    var p = [];
    var n = 24;
    for (var i = 0; i <= n; i++) p.push([rand * i / n, flaechenZ(zHinten, R2, rand * i / n)]);
    for (var j = n; j >= 0; j--) p.push([rand * j / n, flaechenZ(zVorn, R1, rand * j / n)]);
    var g = T.drehteil(p, 64, false);
    g.rotateX(Math.PI / 2);
    var netz = T.netz(g, mat, teil);
    netz.castShadow = false;
    netz.renderOrder = 2;
    return netz;
  }

  // ---------- Rohr und Taukappe ----------

  function rohr(m, M) {
    var g = new THREE.Group();
    g.add(T.netz(T.zylinderZ(m.rAussen, m.zRohrHinten, m.zVorneRohr, 96, true), M.lackBlau));
    g.add(T.netz(T.zylinderZ(m.rAussen - 1.5, m.zRohrHinten, m.zVorneRohr, 96, true), M.innen));
    // Rückwand mit Loch für den Auszug
    g.add(T.netz(T.ringZ(30, m.rAussen + 2, m.zRohrHinten - 12, m.zRohrHinten, 96), M.kunststoff));
    g.add(O.Newton.beschriftung(m, (m.zRohrHinten + m.zVorneRohr) / 2 - m.D * 0.6, '#e9eef5', 'R'));
    return T.benenne(g, 'tubus');
  }

  function taukappe(m, M) {
    var g = new THREE.Group();
    var r = m.rAussen + 6;
    g.add(T.netz(T.zylinderZ(r, m.zVorneRohr - 30, m.zVorne, 96, true), M.lackBlau));
    g.add(T.netz(T.zylinderZ(r - 1.5, m.zVorneRohr - 30, m.zVorne, 96, true), M.innen));
    g.add(T.netz(T.ringZ(r - 2, r + 1.5, m.zVorne - 10, m.zVorne, 96), M.kunststoff));
    return T.benenne(g, 'taukappe');
  }

  // ---------- Objektiv ----------

  function objektiv(m, M) {
    var g = new THREE.Group();
    var rand = m.D / 2;
    var fl = m.objektivFlaechen.flaechen;
    var z0 = m.zObjektiv;

    // Fassung: Ring um die Linsen
    var hinten = z0 + fl[fl.length - 1].z - 6;
    g.add(T.netz(T.ringZ(rand - 2, m.rAussen + 3, hinten, z0 + 10, 96), M.kunststoff));
    T.benenne(g, 'objektiv');

    var krone = linse(z0 + fl[0].z, fl[0].R, z0 + fl[1].z, fl[1].R, rand, M.kronglas, 'kronlinse');
    g.add(krone);
    var flint = null;
    if (fl.length === 3) {
      // Flintlinse als eigene Gruppe, damit sie beim Zerlegen herausfahren kann
      flint = new THREE.Group();
      flint.add(linse(z0 + fl[1].z, fl[1].R, z0 + fl[2].z, fl[2].R, rand, M.flintglas, 'flintlinse'));
      flint.userData.teil = 'flintlinse';
      g.add(flint);
    }
    return { gruppe: g, flint: flint, krone: krone };
  }

  // ---------- Auszug, Zenitspiegel, Okular ----------

  // Zahntrieb-Auszug hinten am Rohr: das Auszugsrohr ragt bis zum Zenitspiegel
  function okularauszug(m, M) {
    var g = new THREE.Group();
    g.add(T.netz(T.zylinderZ(27, 28, m.zRohrHinten + 10, 96), M.alu));
    var gehaeuse = T.netz(new THREE.BoxGeometry(56, 40, 70), M.eloxiert);
    gehaeuse.position.set(0, -m.rAussen * 0.15 - 20, m.zRohrHinten - 40);
    g.add(gehaeuse);
    [-1, 1].forEach(function (s) {
      var knopf = T.netz(T.raendel(15, 12, 24), M.raendel);
      knopf.rotation.z = -s * Math.PI / 2;
      knopf.position.set(s * 30, -m.rAussen * 0.15 - 28, m.zRohrHinten - 50);
      g.add(knopf);
    });
    return T.benenne(g, 'okularauszug');
  }

  // Zenitspiegel: Gehäuse mit 45°-Spiegel; das Okular steckt oben drin
  function zenitspiegel(m, M) {
    var g = new THREE.Group();
    var w = 46;
    var gehaeuse = T.netz(new THREE.BoxGeometry(w, w, w), M.kunststoff);
    gehaeuse.rotation.x = -Math.PI / 4;
    gehaeuse.scale.set(1, 1, 0.75);
    g.add(gehaeuse);
    g.add(T.netz(T.zylinderZ(16, 18, 34, 32), M.chrom));            // Steckhülse in den Auszug
    // der Spiegel selbst: Ellipse unter 45°, Normale nach +z und +y
    var spiegel = T.netz(new THREE.CircleGeometry(17, 40), M.spiegel);
    spiegel.scale.set(1, Math.SQRT2, 1);
    spiegel.rotation.x = -Math.PI / 4;
    g.add(spiegel);
    var halter = T.netz(T.drehteil([[16, 0], [21, 0], [21, m.seitlich - 18], [16, m.seitlich - 18]], 40, true), M.kunststoff);
    halter.position.y = 18;
    g.add(halter);
    T.benenne(g, 'zenitspiegel');

    var ok = T.okular(M);
    ok.position.y = m.seitlich;
    g.add(ok);
    return { gruppe: g, okular: ok };
  }

  // ---------- Rohrschellen und Prismenschiene ----------

  // Zwei Schellen um das Rohr, verbunden durch eine Schiene auf der Seite
  // (−x im Tubus): dort greift die Montierung an.
  function rohrschellen(m, M) {
    var g = new THREE.Group();
    var abstand = Math.max(90, m.D * 1.2);
    [-1, 1].forEach(function (s) {
      var z = m.zBalance + s * abstand;
      g.add(T.netz(T.ringZ(m.rAussen, m.rAussen + 7, z - 11, z + 11, 64), M.kunststoff));
      var schraube = T.netz(T.raendel(8, 14, 12), M.raendel);
      schraube.position.set(0, m.rAussen + 7, z);
      g.add(schraube);
      var fuss = T.netz(new THREE.BoxGeometry(22, 30, 26), M.kunststoff);
      fuss.position.set(-(m.rAussen + 12), 0, z);
      g.add(fuss);
    });
    var schiene = T.netz(new THREE.BoxGeometry(14, 44, abstand * 2 + 80), M.alu);
    schiene.position.set(-(m.rAussen + 27), 0, m.zBalance);
    g.add(schiene);
    return T.benenne(g, 'rohrschellen');
  }

  O.Refraktor = {
    linse: linse,       // auch für den Yerkes-Refraktor
    // Der ganze Tubus im Tubus-System. userData.teile wie bei Newton.js
    erzeuge: function (m) {
      var M = O.Material.alle();
      var g = new THREE.Group();
      var obj = objektiv(m, M);
      var zen = zenitspiegel(m, M);
      var teile = {
        tubus: rohr(m, M),
        taukappe: taukappe(m, M),
        objektiv: obj.gruppe,
        okularauszug: okularauszug(m, M),
        zenitspiegel: zen.gruppe,
        sucher: O.Anbauteile.sucher(m, M, m.zVorneRohr - 140),
        rohrschellen: rohrschellen(m, M)
      };
      Object.keys(teile).forEach(function (k) { g.add(teile[k]); });
      teile.okular = zen.okular;
      teile.kronlinse = obj.krone;
      if (obj.flint) teile.flintlinse = obj.flint;
      g.updateMatrixWorld(true);
      Object.keys(teile).forEach(function (k) {
        teile[k].userData.anker = T.anker(teile[k]);
      });
      // Schild der Fassung an den Rand, nicht mitten auf die Linse
      teile.objektiv.userData.anker = new THREE.Vector3(0, m.rAussen + 4, m.zObjektiv);
      g.userData.teile = teile;
      return g;
    }
  };
})(globalThis.OPTIK = globalThis.OPTIK || {});
