/*
  Das James-Webb-Weltraumteleskop (2021): ein Hauptspiegel aus 18 goldenen
  Sechsecken (je 1,32 m, zusammen 6,5 m), davor auf drei Streben der
  Fangspiegel (0,74 m), dahinter die Instrumente. Darunter der
  Sonnenschild aus fünf Lagen Folie, 21,2 × 14,2 m, und ganz unten auf der
  warmen Seite das Raumfahrzeug mit Solarflügel und Antenne.

  Tubus-System wie überall: z = optische Achse, Scheitel des Hauptspiegels
  bei z = 0, Licht von +z. Die Segmente sitzen auf der Fläche des
  Hauptspiegels (R = 15,88 m) und sind zu ihr hin gekippt; Spiegelabstand
  und Brennpunkt aus physik/Weltraumoptik.js. Formen von Rückwand,
  Instrumenten, Raumfahrzeug und Solarflügel sind vereinfacht und
  geschätzt, ebenso der Abstand der Schild-Lagen.

  Webb steht im tiefen All (weltall: 'tief'), die Sonne scheint von unten
  auf den Schild – das Teleskop liegt immer im Schatten.
*/
(function (O) {
  'use strict';

  var T = O.Teile;
  var W = O.Weltraumoptik.WEBB;

  var SEGMENT = 1320;           // von Kante zu Kante
  var FUGE = 10;
  var SCHILD_Y = 2000;          // unterste Lage
  var LAGEN_ABSTAND = 220;
  var ACHSE_Y = 6300;

  // Mitten der 18 Segmente: zwei Ringe um die freie Mitte (Sechseckgitter)
  function segmentMitten() {
    var a = SEGMENT + FUGE;
    var m = [];
    for (var k = 0; k < 6; k++) {
      var w = k * Math.PI / 3;
      m.push([Math.cos(w) * a, Math.sin(w) * a]);
      m.push([Math.cos(w) * 2 * a, Math.sin(w) * 2 * a]);
      var w2 = w + Math.PI / 6;
      m.push([Math.cos(w2) * a * Math.sqrt(3), Math.sin(w2) * a * Math.sqrt(3)]);
    }
    return m;
  }

  // Drehteil um die z-Achse aus einem Profil [[r, z], …]
  function profilZ(punkte, seg) {
    var g = T.drehteil(punkte, seg || 64, false);
    g.rotateX(Math.PI / 2);
    return g;
  }

  // 18 Segmente mit gefasten Kanten, jedes auf der Spiegelfläche sitzend
  // und zu ihr gekippt; dahinter eine flache, dunkle Rückwand
  function hauptspiegel(M) {
    var g = new THREE.Group();
    var geo = T.sechseck(SEGMENT / Math.sqrt(3), 70, 14);
    var Z = new THREE.Vector3(0, 0, 1);
    segmentMitten().forEach(function (c) {
      var seg = T.netz(geo, M.goldSpiegel);
      var rho2 = c[0] * c[0] + c[1] * c[1];
      seg.position.set(c[0], c[1], rho2 / (2 * W.R1));
      seg.quaternion.setFromUnitVectors(Z, new THREE.Vector3(-c[0] / W.R1, -c[1] / W.R1, 1).normalize());
      g.add(seg);
    });
    var wand = T.netz(T.sechseck(3150, 300, 50), M.kunststoff);
    wand.position.z = -80;
    g.add(wand);
    return T.benenne(g, 'webbSegmente');
  }

  // Fangspiegel (leicht gewölbt) in seiner Fassung, auf drei Streben:
  // eine von unten, zwei von den Seiten
  function fangspiegel(M) {
    var g = new THREE.Group();
    var z = W.abstand;
    var r = W.sekD / 2;
    // Spiegel: Rückseite flach, Vorderseite nach außen gewölbt (Radius aus
    // der Optik); gebaut mit der Vorderseite nach +z, dann umgedreht
    var p = [[0, -40], [r, -40]];
    for (var i = 8; i >= 0; i--) {
      var q = r * i / 8;
      p.push([q, -q * q / (2 * W.R2)]);
    }
    var spiegel = T.netz(profilZ(p), M.goldSpiegel);
    spiegel.rotation.y = Math.PI;                     // Spiegelseite nach −z
    spiegel.position.z = z;
    g.add(spiegel);
    var fassung = [[r + 5, z - 10], [r + 30, z - 10], [r + 60, z + 20], [r + 60, z + 190], [r + 30, z + 230], [0, z + 230]];
    g.add(T.netz(profilZ(fassung), M.kunststoff));
    [-Math.PI / 2, Math.PI / 12, Math.PI - Math.PI / 12].forEach(function (w) {
      var unten = new THREE.Vector3(Math.cos(w) * 3250, Math.sin(w) * 3250, -250);
      var oben = new THREE.Vector3(Math.cos(w) * (r + 60), Math.sin(w) * (r + 60), z + 120);
      var strebe = T.netz(new THREE.CylinderGeometry(38, 38, unten.distanceTo(oben), 16), M.kunststoff);
      strebe.position.copy(unten).lerp(oben, 0.5);
      T.richte(strebe, oben.clone().sub(unten));
      g.add(strebe);
      var fuss = T.netz(new THREE.SphereGeometry(80, 16, 12), M.eloxiert);
      fuss.position.copy(unten);
      g.add(fuss);
    });
    return T.benenne(g, 'webbFangspiegel');
  }

  // Hilfsoptik (rund, mit Haube) in der Mitte des Spiegels und der
  // Instrumentenkasten mit gerundeten Kanten dahinter
  function instrumente(M) {
    var g = new THREE.Group();
    g.add(T.netz(profilZ([[0, -150], [380, -150], [380, 520], [330, 620], [200, 660], [0, 670]]), M.kunststoff));
    var kasten = T.netz(T.kasten(2300, 2300, 2000, 140), M.folie);
    kasten.position.z = -1700;
    g.add(kasten);
    return T.benenne(g, 'webbInstrumente');
  }

  // Eine Lage des Schilds: langgezogenes Sechseck, in Ringen um die Mitte
  // aufgeteilt. Die Lagen liegen in der Mitte dicht beieinander und
  // spreizen sich nach außen auf – so kann die Wärme zur Seite wegstrahlen.
  function schildLage(M, nummer, schrumpf) {
    var l = 10598 * schrumpf;
    var b = 7081 * schrumpf;
    var e = 4200 * schrumpf;
    var ecken = [[l, 0], [e, b], [-e, b], [-l, 0], [-e, -b], [e, -b]];
    var RINGE = 10;
    var JE_KANTE = 12;
    var rund = 6 * JE_KANTE;
    function hoehe(t) { return nummer * (LAGEN_ABSTAND * 0.5 + LAGEN_ABSTAND * 1.5 * t * t); }
    var pos = [0, hoehe(0), 0];
    var index = [];
    for (var r = 1; r <= RINGE; r++) {
      var t = r / RINGE;
      for (var k = 0; k < 6; k++) {
        var a = ecken[k];
        var c = ecken[(k + 1) % 6];
        for (var j = 0; j < JE_KANTE; j++) {
          var u = j / JE_KANTE;
          pos.push((a[0] + (c[0] - a[0]) * u) * t, hoehe(t), (a[1] + (c[1] - a[1]) * u) * t);
        }
      }
      var start = 1 + (r - 1) * rund;
      for (var m = 0; m < rund; m++) {
        var m2 = (m + 1) % rund;
        if (r === 1) {
          index.push(0, start + m2, start + m);
        } else {
          var innen = start - rund;
          index.push(innen + m, innen + m2, start + m2, innen + m, start + m2, start + m);
        }
      }
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setIndex(index);
    geo.computeVertexNormals();
    var lage = T.netz(geo, M.kapton);
    lage.position.y = SCHILD_Y;
    return lage;
  }

  function sonnenschild(M) {
    var g = new THREE.Group();
    var lagen = [];
    for (var i = 0; i < 5; i++) {
      var lage = schildLage(M, i, 1 - i * 0.02);
      g.add(lage);
      lagen.push(lage);
    }
    // Ausleger quer unter dem Schild und die Trimmklappe am Ende
    var ausleger = T.netz(T.zylinderZ(70, -7100, 7100, 16), M.alu);
    ausleger.position.y = SCHILD_Y - 80;
    g.add(ausleger);
    var klappe = T.netz(T.kasten(40, 1600, 2400, 15), M.kapton);
    klappe.position.set(10900, SCHILD_Y + 500, 0);
    klappe.rotation.z = -0.5;
    g.add(klappe);
    T.benenne(g, 'webbSonnenschild');
    return { gruppe: g, lagen: lagen };
  }

  // Unter dem Schild: Kasten mit gerundeten Kanten, Turm zum Teleskop,
  // Solarflügel mit Zellen und eine Antennenschüssel nach unten
  function raumfahrzeug(M, solar) {
    var g = new THREE.Group();
    var kasten = T.netz(T.kasten(3000, 1500, 3000, 120), M.folie);
    kasten.position.y = 1000;
    g.add(kasten);
    var fluegel = new THREE.Group();
    fluegel.position.set(-4400, 300, 0);
    fluegel.rotation.z = 0.25;
    fluegel.add(T.netz(new THREE.BoxGeometry(5800, 30, 1700), solar));
    var holm = T.netz(T.kasten(5860, 50, 70, 20), M.alu);
    fluegel.add(holm);
    g.add(fluegel);
    var schuessel = new THREE.Group();
    schuessel.position.set(900, 150, 900);
    schuessel.rotation.x = Math.PI;                   // hohl nach unten, zur Erde
    schuessel.add(T.netz(T.schale(450, 120, 40), M.folie));
    g.add(schuessel);
    return T.benenne(g, 'webbBus');
  }

  function erzeuge() {
    var M = O.Material.alle();
    var wurzel = new THREE.Group();
    var azimut = new THREE.Group();
    var hoehe = new THREE.Group();
    var tubus = new THREE.Group();

    var schild = sonnenschild(M);
    var teile = {
      hauptspiegel: hauptspiegel(M),
      fangspiegel: fangspiegel(M),
      instrumente: instrumente(M),
      sonnenschild: schild.gruppe,
      raumfahrzeug: raumfahrzeug(M, O.Material.solarzellen(4))
    };
    ['hauptspiegel', 'fangspiegel', 'instrumente'].forEach(function (k) { tubus.add(teile[k]); });
    wurzel.add(teile.sonnenschild);
    wurzel.add(teile.raumfahrzeug);
    wurzel.add(azimut);
    azimut.add(hoehe);
    hoehe.position.y = ACHSE_Y;
    hoehe.add(tubus);
    tubus.rotation.y = Math.PI;
    tubus.position.z = -400;          // Drehpunkt an der Rückwand
    hoehe.rotation.x = 35 * Math.PI / 180;
    azimut.rotation.y = 35 * Math.PI / 180;      // Spiegel schräg zur Startkamera

    // Schilder an Stellen, die man sieht
    // Turm vom Raumfahrzeug durch den Schild bis unter den Instrumentenkasten
    wurzel.updateMatrixWorld(true);
    var unten = new THREE.Vector3(0, 1750, 0);
    var oben = tubus.localToWorld(new THREE.Vector3(0, -1100, -1700));
    var turm = T.netz(new THREE.CylinderGeometry(240, 300, unten.distanceTo(oben), 32), M.kunststoff);
    turm.position.copy(unten).lerp(oben, 0.5);
    T.richte(turm, oben.clone().sub(unten));
    turm.userData.teil = 'webbBus';
    teile.raumfahrzeug.add(turm);

    teile.sonnenschild.userData.anker = new THREE.Vector3(-6000, SCHILD_Y + 2 * LAGEN_ABSTAND, -2500);
    teile.raumfahrzeug.userData.anker = new THREE.Vector3(0, 1000, -1500);
    teile.hauptspiegel.userData.anker = new THREE.Vector3(0, -2600, 220);
    teile.fangspiegel.userData.anker = new THREE.Vector3(0, 0, W.abstand);
    teile.instrumente.userData.anker = new THREE.Vector3(0, 0, 600);      // die Hilfsoptik in der Spiegelmitte

    return O.Beruehmt.teleskop({
      id: 'webb',
      wurzel: wurzel,
      azimut: azimut,
      hoehe: hoehe,
      tubus: tubus,
      teile: teile,
      masse: { D: W.D, zHinten: -2700, zVorne: W.abstand + 220, rAussen: 3550, laenge: W.abstand + 2920 },
      randschicht: [],
      weltall: 'tief',
      sonne: new THREE.Vector3(0.35, -0.9, 0.3),
      // Der Mensch schwebt vor dem Schild, auf der Seite zur Startkamera
      mensch: new THREE.Vector3(-2500, SCHILD_Y - 600, -8600),
      licht: function () { return O.Weltraumoptik.lichtWebb(W.abstand + 220); },
      lichtMassstab: 6,
      okularOptik: null,
      ziele: function () {
        var liste = [
          { objekt: hoehe, versatz: new THREE.Vector3(0, 6500, 0) },
          { objekt: teile.fangspiegel, versatz: new THREE.Vector3(0, 0, 2800) },
          // nach hinten unten aus dem Spiegel heraus, sonst verdeckt ihn die Rückwand
          { objekt: teile.instrumente, versatz: new THREE.Vector3(0, -2600, -2600) },
          { objekt: teile.raumfahrzeug, versatz: new THREE.Vector3(0, -2600, 0) }
        ];
        schild.lagen.forEach(function (lage, i) {
          liste.push({ objekt: lage, versatz: new THREE.Vector3(0, i * 900, 0) });
        });
        return liste;
      }
    });
  }

  O.Beruehmt.melde('webb', erzeuge);
})(globalThis.OPTIK = globalThis.OPTIK || {});
