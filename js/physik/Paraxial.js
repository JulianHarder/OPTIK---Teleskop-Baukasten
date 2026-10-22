/*
  Die ideale dünne Linse.

  Sie ist unendlich dünn und knickt jeden Strahl so, dass seine Steigung
  sich um −h/f ändert (h = Höhe über der Achse, f = Brennweite):

      u' = u − h / f          u = Steigung dy/dz bzw. dx/dz

  Für einen achsparallelen Strahl (u = 0) heißt das: nach genau f
  Millimetern ist er bei h − f·h/f = 0, also auf der Achse. Darum treffen
  sich alle parallelen Strahlen im Brennpunkt – ohne jeden Fehler. Echte
  Linsen weichen davon ab (Etappe 3), und genau diese Abweichung nennt man
  Abbildungsfehler.

  Ein Element für den Strahlverfolger hat zwei Methoden:
    schnitt(strahl) → Abstand t bis zum Treffer oder null
    wirke(strahl, q) → neuer Strahl ab Trefferpunkt q oder null (geschluckt)
*/
(function (O) {
  'use strict';

  var V = O.Vektor;
  var EPS = 1e-9;   // mm – kleiner als jeder sinnvolle Abstand auf der Bank

  O.IdealeLinse = function (teil) {
    return {
      teil: teil,

      schnitt: function (strahl) {
        var dz = strahl.d.z;
        if (Math.abs(dz) < 1e-15) return null;          // läuft parallel zur Linse

        var t = (teil.posMm - strahl.p.z) / dz;
        if (t <= EPS) return null;                       // hinter dem Strahl oder schon getroffen

        var q = V.auf(strahl.p, strahl.d, t);
        var r = teil.durchmesserMm / 2;
        if (q.x * q.x + q.y * q.y > r * r) return null;  // geht an der Linse vorbei
        return t;
      },

      wirke: function (strahl, q) {
        // Läuft der Strahl rückwärts (dz < 0), dreht sich das Vorzeichen,
        // damit die Linse auch von rechts sammelt.
        var s = strahl.d.z > 0 ? 1 : -1;
        var ux = strahl.d.x / strahl.d.z - s * q.x / teil.fMm;
        var uy = strahl.d.y / strahl.d.z - s * q.y / teil.fMm;
        return { p: q, d: V.norm(V.v(ux * s, uy * s, s)) };
      }
    };
  };
})(globalThis.OPTIK = globalThis.OPTIK || {});
