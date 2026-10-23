/*
  Ein Mensch zum Größenvergleich: 1,75 m. Auf der Erde ein junger Mann in
  Jacke und Jeans (MakeHuman, js/daten/modell-mensch.js), bei den
  Weltraumteleskopen ein Astronaut im Raumanzug (Modell der NASA,
  js/daten/modell-astronaut.js). Beide schauen nach +z.

  Er steht neben dem Teleskop auf der Seite, die man beim Start sieht,
  und rückt mit, wenn das Teleskop größer wird.
*/
(function (O) {
  'use strict';

  var GROESSE_MM = 1750;
  var AUGENHOEHE_MM = 1630;
  // Vom Startblick aus rechts neben dem Teleskop und etwas dahinter
  // (siehe START_RICHTUNG in main.js)
  var SEITE = new THREE.Vector3(-0.62, 0, 0.85).normalize();
  var HINTEN = new THREE.Vector3(0.85, 0, 0.62).normalize();

  // Oberfläche je Art des Teils; die Farbe kommt aus der Textur
  var ART = {
    haut: { roughness: 0.62 },
    stoff: { roughness: 0.92 },
    haar: { roughness: 0.8, alphaTest: 0.45, side: THREE.DoubleSide },
    auge: { roughness: 0.25 },
    anzug: { roughness: 0.85 },
    visier: { roughness: 0.3, metalness: 0.2, envMapIntensity: 1.6 }
  };

  function bytes(b64) {
    var s = atob(b64);
    var a = new Uint8Array(s.length);
    for (var i = 0; i < s.length; i++) a[i] = s.charCodeAt(i);
    return a.buffer;
  }

  // Textur aus einer data:-Adresse; ist sie geladen, neu zeichnen
  function textur(uri) {
    var t = new THREE.TextureLoader().load(uri, function () {
      if (O.buehne) O.buehne.zeichneBald();
    });
    t.encoding = THREE.sRGBEncoding;
    t.anisotropy = 4;
    return t;
  }

  // Ein Modell aus js/daten/modell-*.js als Gruppe von Netzen
  function ausModell(daten, teil) {
    var g = new THREE.Group();
    g.userData.teil = teil;
    daten.teile.forEach(function (d) {
      var geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(new Int16Array(bytes(d.pos)), 3));
      geo.setAttribute('normal', new THREE.BufferAttribute(new Int8Array(bytes(d.nor)), 3, true));
      geo.setAttribute('uv', new THREE.BufferAttribute(new Uint16Array(bytes(d.uv)), 2, true));
      var idx = bytes(d.idx);
      geo.setIndex(new THREE.BufferAttribute(d.idx32 ? new Uint32Array(idx) : new Uint16Array(idx), 1));
      var mat = new THREE.MeshStandardMaterial(Object.assign({ map: textur(d.textur), metalness: 0 }, ART[d.art]));
      var n = new THREE.Mesh(geo, mat);
      n.castShadow = true;
      n.receiveShadow = true;
      n.userData.teil = teil;
      g.add(n);
    });
    return g;
  }

  O.Mensch = {
    GROESSE_MM: GROESSE_MM,
    AUGENHOEHE_MM: AUGENHOEHE_MM,

    // Eine Gruppe, in der immer eine der beiden Figuren steckt
    erzeuge: function () {
      var g = new THREE.Group();
      g.userData.teil = 'mensch';
      g.userData.figuren = {
        erde: ausModell(O.MODELLE.mensch, 'mensch'),
        weltall: ausModell(O.MODELLE.astronaut, 'astronaut')
      };
      g.add(g.userData.figuren.erde);
      return g;
    },

    // Neben das Teleskop stellen, Blick zum Teleskop. Berühmte Teleskope
    // sagen selbst, wo er stehen soll (teleskop.mensch). Im Weltall trägt
    // er den Raumanzug.
    stelle: function (mensch, teleskop) {
      var figuren = mensch.userData.figuren;
      var jetzt = teleskop.weltall ? figuren.weltall : figuren.erde;
      if (jetzt.parent !== mensch) {
        mensch.remove(figuren.erde, figuren.weltall);
        mensch.add(jetzt);
      }
      mensch.userData.teil = jetzt.userData.teil;
      if (teleskop.mensch) {
        mensch.position.copy(teleskop.mensch);
      } else {
        var huelle = O.Dobson.huelle(teleskop);
        var abstand = Math.max(900, huelle.radius * 0.7 + 250);
        mensch.position.copy(SEITE).multiplyScalar(abstand).addScaledVector(HINTEN, abstand * 0.35);
      }
      mensch.rotation.y = Math.atan2(-mensch.position.x, -mensch.position.z);
    }
  };
})(globalThis.OPTIK = globalThis.OPTIK || {});
