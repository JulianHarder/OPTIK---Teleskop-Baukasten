/*
  Kleine 3D-Vektorrechnung.

  Achsen wie in der Optik üblich: z läuft entlang der optischen Achse
  (Licht kommt von links, z wächst nach rechts), y ist die Höhe über der
  Achse, x steht senkrecht auf der Zeichenebene. Gezeichnet wird nur der
  Schnitt x = 0; gerechnet wird in 3D, weil Etappe 5 (Spot-Diagramm)
  Strahlen über die ganze Öffnung braucht.

  Vektoren sind schlichte Objekte {x, y, z}. Alle Funktionen geben neue
  Objekte zurück und ändern ihre Eingaben nicht.
*/
(function (O) {
  'use strict';

  O.Vektor = {
    v: function (x, y, z) {
      return { x: x, y: y, z: z };
    },

    plus: function (a, b) {
      return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
    },

    minus: function (a, b) {
      return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
    },

    mal: function (a, s) {
      return { x: a.x * s, y: a.y * s, z: a.z * s };
    },

    punkt: function (a, b) {
      return a.x * b.x + a.y * b.y + a.z * b.z;
    },

    laenge: function (a) {
      return Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z);
    },

    norm: function (a) {
      var l = Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z);
      return { x: a.x / l, y: a.y / l, z: a.z / l };
    },

    // Punkt auf dem Strahl p + t·d
    auf: function (p, d, t) {
      return { x: p.x + d.x * t, y: p.y + d.y * t, z: p.z + d.z * t };
    }
  };
})(globalThis.OPTIK = globalThis.OPTIK || {});
