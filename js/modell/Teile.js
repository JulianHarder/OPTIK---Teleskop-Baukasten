/*
  Bausteine für die Teleskop-Modelle: Zylinder und Ringe entlang einer
  Achse, Drehteile aus einem Profil, Rändelknöpfe, das Okular.

  Konvention: Drehteile werden um die y-Achse gebaut (wie Three.js es
  tut). Die Funktionen mit „Z“ im Namen legen das Teil auf die z-Achse –
  die optische Achse im Tubus.

  Jedes Netz bekommt in userData.teil den Namen seines Bauteils. Etappe 2
  (Aufschrauben, Infokarten) braucht ihn, um zu wissen, was angeklickt wurde.
*/
(function (O) {
  'use strict';

  var Y = new THREE.Vector3(0, 1, 0);
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

  // Netz mit Schatten und Bauteil-Namen
  function netz(geo, mat, teil) {
    var m = new THREE.Mesh(geo, mat);
    m.castShadow = true;
    m.receiveShadow = true;
    if (teil) m.userData.teil = teil;
    return m;
  }

  // Alle Netze einer Gruppe einem Bauteil zuordnen
  function benenne(gruppe, teil) {
    gruppe.userData.teil = teil;
    gruppe.traverse(function (o) {
      if (o.isMesh && !o.userData.teil) o.userData.teil = teil;
    });
    return gruppe;
  }

  // Zylinder auf der z-Achse, von z0 bis z1
  function zylinderZ(r, z0, z1, seg, offen) {
    var g = new THREE.CylinderGeometry(r, r, z1 - z0, seg || 48, 1, !!offen);
    g.rotateX(Math.PI / 2);
    g.translate(0, 0, (z0 + z1) / 2);
    return g;
  }

  // Drehteil aus einem Profil [[r, y], …] um die y-Achse.
  // Profil gegen den Uhrzeigersinn (r nach rechts, y nach oben) ergibt
  // Flächen, die nach außen zeigen. scharf = jede Ecke bekommt eigene
  // Normalen (Kanten statt weicher Rundung).
  function drehteil(profil, seg, scharf) {
    var punkte = [];
    profil.forEach(function (p, i) {
      var v = new THREE.Vector2(p[0], p[1]);
      punkte.push(v);
      if (scharf && i > 0 && i < profil.length - 1) punkte.push(v.clone());
    });
    return new THREE.LatheGeometry(punkte, seg || 48);
  }

  // Ring (Rohr mit Wandstärke) auf der z-Achse, von z0 bis z1
  function ringZ(rInnen, rAussen, z0, z1, seg) {
    var h = z1 - z0;
    var g = drehteil([
      [rInnen, 0], [rAussen, 0], [rAussen, h], [rInnen, h], [rInnen, 0]
    ], seg || 64, true);
    g.rotateX(Math.PI / 2);
    g.translate(0, 0, z0);
    return g;
  }

  // Rändelknopf: viele flache Seiten mit harten Kanten (Material „raendel“)
  // Achse entlang y, von 0 bis h
  function raendel(r, h, zaehne) {
    var g = new THREE.CylinderGeometry(r, r, h, zaehne || 24, 1);
    g.translate(0, h / 2, 0);
    return g;
  }

  // Objekt so drehen, dass seine y-Achse in Richtung dir zeigt
  function richte(objekt, dir) {
    objekt.quaternion.setFromUnitVectors(Y, dir.clone().normalize());
    return objekt;
  }

  // Ankerpunkt eines Bauteils für seine Beschriftung: Mitte seiner eigenen
  // Netze (ohne Unterteile, die einen anderen Namen tragen), im
  // Koordinatensystem des Bauteils.
  function anker(objekt) {
    var box = new THREE.Box3();
    objekt.updateMatrixWorld(true);
    objekt.traverse(function (o) {
      if (o.isMesh && o.userData.teil === objekt.userData.teil) box.expandByObject(o);
    });
    return objekt.worldToLocal(box.getCenter(new THREE.Vector3()));
  }

  // Okular: Steckhülse (31,75 mm), gummierter Griff, Augenmuschel, Linse.
  // Achse entlang y, die Anlage (Schulter) liegt bei y = 0.
  function okular(M) {
    var g = new THREE.Group();

    var huelse = netz(new THREE.CylinderGeometry(15.9, 15.9, 28, 40, 1), M.chrom);
    huelse.position.y = -14;
    g.add(huelse);

    // Griff mit Rillen: Profil von unten nach oben
    var p = [[0, 0], [21, 0], [21, 6]];
    for (var y = 8; y < 34; y += 4) {
      p.push([20.2, y], [21, y + 2]);
    }
    p.push([21, 38], [19.5, 40], [19.5, 50], [17.5, 52], [11, 52], [11, 49]);
    var griff = netz(drehteil(p, 48, false), M.gummi);
    g.add(griff);

    var streifen = netz(drehteil([[21.1, 0], [21.3, 0], [21.3, 2], [21.1, 2]], 48, true), M.gold);
    streifen.position.y = 36;
    g.add(streifen);

    var linse = netz(new THREE.CircleGeometry(11, 32), M.linse);
    linse.rotation.x = -Math.PI / 2;
    linse.position.y = 49.5;
    g.add(linse);

    return benenne(g, 'okular');
  }

  // ---------- Runde Formen (Weltraumteleskope) ----------

  // Quader mit abgerundeten Kanten (Radius r), Mitte im Ursprung
  function kasten(b, h, t, r) {
    r = Math.min(r, b / 2 - 1, h / 2 - 1, t / 2 - 1);
    var s = new THREE.Shape();
    var x = b / 2 - r;
    var y = h / 2 - r;
    s.moveTo(-x, -h / 2 + r);
    s.lineTo(x, -h / 2 + r);
    s.lineTo(x, h / 2 - r);
    s.lineTo(-x, h / 2 - r);
    s.lineTo(-x, -h / 2 + r);
    var g = new THREE.ExtrudeGeometry(s, {
      depth: t - 2 * r, bevelEnabled: true, bevelThickness: r, bevelSize: r, bevelSegments: 4, curveSegments: 4
    });
    g.translate(0, 0, -(t - 2 * r) / 2);
    g.computeVertexNormals();
    return g;
  }

  // Sechseck mit gefasten Kanten (Spitzen bei ±y), Vorderseite bei z = 0
  function sechseck(rUm, dicke, fase) {
    var s = new THREE.Shape();
    var r = rUm - fase * 1.2;
    for (var k = 0; k <= 6; k++) {
      var w = Math.PI / 2 + k * Math.PI / 3;
      if (k === 0) s.moveTo(Math.cos(w) * r, Math.sin(w) * r);
      else s.lineTo(Math.cos(w) * r, Math.sin(w) * r);
    }
    var g = new THREE.ExtrudeGeometry(s, {
      depth: dicke - 2 * fase, bevelEnabled: true, bevelThickness: fase, bevelSize: fase, bevelSegments: 3
    });
    g.translate(0, 0, -dicke + fase);
    return g;
  }

  // Parabolantenne: Schüssel (Radius r, Tiefe t), hohl nach +y, mit
  // dünnem Rand und Rückseite; Scheitel bei y = 0
  function schale(r, t, seg) {
    var p = [];
    var n = 12;
    for (var i = 0; i <= n; i++) {                      // Rückseite, von innen nach außen
      var q = r * i / n;
      p.push([q, t * (q / r) * (q / r) - 12]);
    }
    p.push([r + 6, t]);
    for (var j = n; j >= 0; j--) {                      // Innenseite zurück zur Mitte
      var q2 = r * j / n;
      p.push([q2, t * (q2 / r) * (q2 / r)]);
    }
    return drehteil(p, seg || 48, false);
  }

  O.Teile = {
    kasten: kasten,
    sechseck: sechseck,
    schale: schale,
    netz: netz,
    benenne: benenne,
    zylinderZ: zylinderZ,
    drehteil: drehteil,
    ringZ: ringZ,
    raendel: raendel,
    richte: richte,
    quer: quer,
    aufRohr: aufRohr,
    anker: anker,
    okular: okular
  };
})(globalThis.OPTIK = globalThis.OPTIK || {});
