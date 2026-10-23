/*
  Das Sternlicht als 3D-Bild: leuchtende Linien für jeden Strahl, ein
  halbdurchsichtiger Lichtkegel aus dem Strahlenring und ein Glühen im
  Brennpunkt.

  Alles kommt aus dem Strahlverfolger (physik/Optik.licht) – hier
  wird nichts gerechnet, nur gezeichnet. Die Gruppe hängt im Tubus und
  liegt deshalb im selben Koordinatensystem wie die Physik.

  Additive Mischung: wo sich Strahlen überlagern, wird es heller. Der
  Brennpunkt wird so von selbst zum hellsten Fleck. Verblassen am Anfang
  und Ende über die Eckfarben (schwarz = unsichtbar bei additiver Mischung).
*/
(function (O) {
  'use strict';

  var FARBE = new THREE.Color(0xffcf73);   // warmes Sternlicht

  // Helligkeit eines Pfadpunkts: Anfang (am Himmel) und freies Ende
  // verblassen, ein Ende an einem Hindernis bleibt hell
  function helligkeit(pfad, i) {
    if (i === 0) return 0;
    if (i === pfad.punkte.length - 1 && !pfad.geschluckt) return 0;
    return 1;
  }

  // Farbe eines Pfads: eigene (Refraktor: rot, gelb, blau) oder Sternlicht
  function farbeVon(pfad) {
    return pfad.farbe ? { r: pfad.farbe[0], g: pfad.farbe[1], b: pfad.farbe[2] } : FARBE;
  }

  function linien(pfade, staerke) {
    var pos = [];
    var farbe = [];
    pfade.forEach(function (pfad) {
      var f = farbeVon(pfad);
      for (var i = 0; i < pfad.punkte.length - 1; i++) {
        [i, i + 1].forEach(function (j) {
          var p = pfad.punkte[j];
          var h = helligkeit(pfad, j) * staerke * (i === 0 ? 0.6 : 1);
          pos.push(p.x, p.y, p.z);
          farbe.push(f.r * h, f.g * h, f.b * h);
        });
      }
    });
    var g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(farbe, 3));
    return new THREE.LineSegments(g, new THREE.LineBasicMaterial({
      vertexColors: true, blending: THREE.AdditiveBlending,
      transparent: true, depthWrite: false, toneMapped: false
    }));
  }

  // Lichtkegel: Flächen zwischen benachbarten Strahlen des Rings, Abschnitt
  // für Abschnitt – aber nur, wo beide Strahlen denselben Weg genommen haben
  function kegel(ring, deckkraft) {
    var pos = [];
    var farbe = [];
    function ecke(pfad, j, staerke) {
      var p = pfad.punkte[j];
      var h = helligkeit(pfad, j) * staerke;
      var f = farbeVon(pfad);
      pos.push(p.x, p.y, p.z);
      farbe.push(f.r * h, f.g * h, f.b * h);
    }
    for (var i = 0; i < ring.length; i++) {
      var a = ring[i];
      var b = ring[(i + 1) % ring.length];
      var n = Math.min(a.punkte.length, b.punkte.length) - 1;
      for (var j = 0; j < n; j++) {
        if (a.getroffen[j] !== b.getroffen[j]) break;
        var staerke = j === 0 ? 0.3 : 1;       // die Lichtsäule vom Himmel zarter
        ecke(a, j, staerke); ecke(b, j, staerke); ecke(b, j + 1, staerke);
        ecke(a, j, staerke); ecke(b, j + 1, staerke); ecke(a, j + 1, staerke);
      }
    }
    var g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(farbe, 3));
    return new THREE.Mesh(g, new THREE.MeshBasicMaterial({
      vertexColors: true, blending: THREE.AdditiveBlending, transparent: true,
      opacity: deckkraft, depthWrite: false, side: THREE.DoubleSide, toneMapped: false
    }));
  }

  // weicher Lichtfleck als Textur (für Brennpunkt und Lichtpulse)
  var fleckTextur = null;
  function fleck() {
    if (fleckTextur) return fleckTextur;
    var c = document.createElement('canvas');
    c.width = c.height = 64;
    var ctx = c.getContext('2d');
    var v = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    v.addColorStop(0, 'rgba(255,255,255,1)');
    v.addColorStop(0.25, 'rgba(255,255,255,0.55)');
    v.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, 64, 64);
    fleckTextur = new THREE.CanvasTexture(c);
    return fleckTextur;
  }

  // Wo bündeln sich die Strahlen? Mittel der Trefferpunkte an der Feldblende
  function brennfleck(pfade, massstab) {
    var summe = new THREE.Vector3();
    var n = 0;
    pfade.forEach(function (p) {
      var i = p.getroffen.indexOf('feldblende');
      if (i < 0) return;
      var q = p.punkte[i + 1];
      summe.add(new THREE.Vector3(q.x, q.y, q.z));
      n++;
    });
    if (!n) return null;
    var s = new THREE.Sprite(new THREE.SpriteMaterial({
      map: fleck(), color: FARBE, blending: THREE.AdditiveBlending,
      depthWrite: false, depthTest: false, toneMapped: false
    }));
    s.position.copy(summe.multiplyScalar(1 / n));
    s.scale.setScalar(34 * massstab);
    s.renderOrder = 5;
    return s;
  }

  O.Strahlenbild = {
    FARBE: FARBE,
    fleck: fleck,

    // licht = Ergebnis von Optik.licht → THREE.Group;
    // massstab = Größe des Brennflecks (1 = für Teleskope um einen Meter)
    erzeuge: function (licht, massstab) {
      var g = new THREE.Group();
      // Mehrere Farben (Refraktor): jeder Kegel zarter, damit es zusammen
      // nicht heller wird als ein Kegel beim Spiegel
      // licht.dichte: lange, dichte Bündel (Yerkes, 19 m) würden sonst ganz weiß
      var dichte = licht.dichte || 1;
      var deck = 0.075 / Math.sqrt(licht.ringe.length) * dichte;
      var alleRinge = [];
      licht.ringe.forEach(function (r) {
        g.add(kegel(r.pfade, deck));
        g.add(linien(r.pfade, 0.18 * dichte));
        alleRinge = alleRinge.concat(r.pfade);
      });
      g.add(linien(licht.faecher, (licht.ringe.length > 1 ? 0.6 : 0.85) * dichte));
      var bf = brennfleck(licht.faecher.concat(alleRinge), massstab || 1);
      if (bf) g.add(bf);
      g.traverse(function (o) { o.renderOrder = Math.max(o.renderOrder, 4); });
      return g;
    },

    // Geometrien und Materialien freigeben (die geteilte Textur nicht)
    entsorge: function (gruppe) {
      gruppe.traverse(function (o) {
        if (o.geometry) o.geometry.dispose();
        if (o.material) o.material.dispose();
      });
    }
  };
})(globalThis.OPTIK = globalThis.OPTIK || {});
