/*
  Strahlverfolger, nichtsequentiell.

  In jedem Schritt wird gegen ALLE Elemente geprüft, und das nächste
  gewinnt. So muss niemand eine Reihenfolge festlegen – Bauteile lassen
  sich frei verschieben, auch aneinander vorbei. Nach MAX_STOESSE
  Treffern ist Schluss (Schutz gegen Strahlen, die zwischen zwei Spiegeln
  pendeln – ab Etappe 4).

  Ein Strahl ist { p: Startpunkt, d: Richtung (Länge 1) }, alles in mm.
*/
(function (O) {
  'use strict';

  var V = O.Vektor;
  var MAX_STOESSE = 50;
  var AUSLAUF_MM = 1e4;   // falls ein Strahl quer zur Achse läuft

  // Verfolgt einen Strahl durch alle Elemente.
  // grenzen = { zMin, zMax }: bis dahin wird der letzte Abschnitt verlängert,
  //   oder { auslaufMm }: so weit geht es nach dem letzten Treffer weiter.
  // Ergebnis: { punkte: [...], ende: letzter Strahl, geschluckt: bool,
  //             getroffen: [Namen der getroffenen Elemente] }
  function verfolge(strahl, elemente, grenzen) {
    var punkte = [strahl.p];
    var getroffen = [];

    for (var stoss = 0; stoss < MAX_STOESSE; stoss++) {
      var bestT = Infinity;
      var bestEl = null;

      for (var i = 0; i < elemente.length; i++) {
        var t = elemente[i].schnitt(strahl);
        if (t !== null && t < bestT) {
          bestT = t;
          bestEl = elemente[i];
        }
      }

      if (!bestEl) break;

      var q = V.auf(strahl.p, strahl.d, bestT);
      punkte.push(q);
      getroffen.push(bestEl.name);
      var neu = bestEl.wirke(strahl, q);
      if (neu && neu.lambda === undefined) neu.lambda = strahl.lambda;   // Farbe bleibt
      if (!neu) return { punkte: punkte, ende: strahl, geschluckt: true, getroffen: getroffen };
      strahl = neu;
    }

    punkte.push(auslauf(strahl, grenzen));
    return { punkte: punkte, ende: strahl, geschluckt: false, getroffen: getroffen };
  }

  // Letzter Abschnitt: feste Länge oder bis zum Rand der Bank verlängern.
  function auslauf(strahl, grenzen) {
    if (grenzen.auslaufMm !== undefined) return V.auf(strahl.p, strahl.d, grenzen.auslaufMm);
    var dz = strahl.d.z;
    var t = AUSLAUF_MM;
    if (dz > 1e-12) t = (grenzen.zMax - strahl.p.z) / dz;
    else if (dz < -1e-12) t = (grenzen.zMin - strahl.p.z) / dz;
    return V.auf(strahl.p, strahl.d, Math.max(t, 0));
  }

  // Wo kreuzen die Strahlen nach dem letzten Element die Achse?
  // Gemessen am letzten Abschnitt jedes Strahls in der Zeichenebene (x = 0).
  // Strahlen auf der Achse und solche, die parallel zu ihr laufen, zählen
  // nicht – sie kreuzen nirgends.
  // Ergebnis: { zMittel, zMin, zMax, anzahl, virtuell } oder null.
  // virtuell = der Kreuzungspunkt liegt hinter dem Strahl (Zerstreuungslinse).
  function achsenKreuzung(ergebnisse) {
    var zs = [];
    var virtuell = false;

    ergebnisse.forEach(function (e) {
      if (e.geschluckt || e.punkte.length < 3) return;   // nie abgelenkt
      var p = e.ende.p;
      var d = e.ende.d;
      if (Math.abs(p.y) < 1e-12 || Math.abs(d.y) < 1e-15) return;
      var t = -p.y / d.y;
      if (t < 0) virtuell = true;
      zs.push(p.z + t * d.z);
    });

    if (!zs.length) return null;

    var summe = 0;
    var zMin = Infinity;
    var zMax = -Infinity;
    zs.forEach(function (z) {
      summe += z;
      zMin = Math.min(zMin, z);
      zMax = Math.max(zMax, z);
    });

    return {
      zMittel: summe / zs.length,
      zMin: zMin,
      zMax: zMax,
      anzahl: zs.length,
      virtuell: virtuell
    };
  }

  O.Strahlverfolger = {
    verfolge: verfolge,
    achsenKreuzung: achsenKreuzung
  };
})(globalThis.OPTIK = globalThis.OPTIK || {});
