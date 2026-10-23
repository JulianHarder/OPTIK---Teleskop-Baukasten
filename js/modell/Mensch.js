/*
  Ein Mensch zum Größenvergleich: 1,75 m, schlicht aus Zylindern und
  einer Kugel, in dunklem Grau – ein Maßstab, keine Figur.

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

  function zylinder(rOben, rUnten, y0, y1, mat) {
    var g = new THREE.CylinderGeometry(rOben, rUnten, y1 - y0, 20);
    g.translate(0, (y0 + y1) / 2, 0);
    var m = new THREE.Mesh(g, mat);
    m.castShadow = true;
    m.receiveShadow = true;
    m.userData.teil = 'mensch';
    return m;
  }

  O.Mensch = {
    GROESSE_MM: GROESSE_MM,
    AUGENHOEHE_MM: AUGENHOEHE_MM,

    erzeuge: function () {
      var mat = new THREE.MeshStandardMaterial({ color: 0x1c222c, roughness: 1, metalness: 0 });
      var g = new THREE.Group();

      [-1, 1].forEach(function (s) {
        var bein = zylinder(78, 62, 0, 880, mat);
        bein.position.x = s * 92;
        g.add(bein);
        var fuss = zylinder(60, 64, 0, 40, mat);
        fuss.position.set(s * 92, 0, 40);
        fuss.scale.z = 1.6;
        g.add(fuss);
        var arm = zylinder(46, 40, 780, 1430, mat);
        arm.position.x = s * 250;
        arm.rotation.z = s * 0.08;
        g.add(arm);
      });

      var rumpf = zylinder(200, 165, 860, 1450, mat);
      rumpf.scale.z = 0.58;
      g.add(rumpf);
      g.add(zylinder(52, 58, 1440, 1520, mat));

      var kopf = new THREE.Mesh(new THREE.SphereGeometry(112, 24, 16), mat);
      kopf.position.y = GROESSE_MM - 112;
      kopf.scale.set(0.9, 1, 1);
      kopf.castShadow = true;
      kopf.userData.teil = 'mensch';
      g.add(kopf);

      g.userData.teil = 'mensch';
      return g;
    },

    // Neben das Teleskop stellen, Blick zum Teleskop. Berühmte Teleskope
    // sagen selbst, wo er stehen soll (teleskop.mensch).
    stelle: function (mensch, teleskop) {
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
