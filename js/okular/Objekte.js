/*
  Die Himmelsobjekte, gezeichnet in echter Winkelgröße.

  Jede Zeichenfunktion bekommt einen Canvas-Kontext, der schon so
  verschoben und skaliert ist, dass 1 Einheit = 1 Bogensekunde ist,
  Ursprung = Bildmitte, Norden oben (die Drehung um 180°, die ein Newton
  macht, kommt danach in Okularblick.js).

  ausgedehnt: Flächen (Planetenscheiben, Ringe, Mond, Nebel des Haufens)
  sterne:     Punkte { x, y (″), mag, farbe [r, g, b] } – die zeichnet
              Okularblick.js selbst, weil ihre Größe von der Optik abhängt.
  hell:       wie hell die Fläche ist (Flächenhelligkeit, Mond = sehr hell)
*/
(function (O) {
  'use strict';

  function rgb(r, g, b, a) {
    return 'rgba(' + r + ',' + g + ',' + b + ',' + (a === undefined ? 1 : a) + ')';
  }

  // ---------- Jupiters Monde ----------

  // Mond, Jupiter und Saturn selbst zeichnen Mond.js und Planeten.js
  function jupiterMonde(o) {
    var R = o.durchmesserBs / 2;
    var helligkeit = { Io: 5.0, Europa: 5.3, Ganymed: 4.6, Kallisto: 5.7 };
    return o.monde.map(function (m) {
      return { x: m.abstand * R, y: 0, mag: helligkeit[m.name], farbe: [1, 0.96, 0.88] };
    });
  }

  // ---------- Doppelsterne ----------

  // Positionswinkel: 0° = Norden (oben), 90° = Osten (links am Himmel)
  function versatz(pa, abstand) {
    var w = pa * Math.PI / 180;
    return { x: -Math.sin(w) * abstand, y: -Math.cos(w) * abstand };
  }

  function albireo(o) {
    var b = o.sterne[1];
    var v = versatz(b.pa, b.abstand);
    // Schwerpunkt ungefähr in die Mitte
    return [
      { x: -v.x / 2, y: -v.y / 2, mag: o.sterne[0].mag, farbe: o.sterne[0].farbe },
      { x: v.x / 2, y: v.y / 2, mag: b.mag, farbe: b.farbe }
    ];
  }

  function epsilonLyrae(o) {
    var weiss = [0.92, 0.95, 1.0];
    var p1 = o.paare[0];
    var p2 = o.paare[1];
    var mitte2 = versatz(p2.pa, p2.entfernung);
    var mitteAlle = { x: mitte2.x / 2, y: mitte2.y / 2 };
    var liste = [];
    [[{ x: 0, y: 0 }, p1.pa, p1.abstand, p1.mag], [mitte2, p2.pa2, p2.abstand, p2.mag]].forEach(function (p) {
      var d = versatz(p[1], p[2] / 2);
      liste.push({ x: p[0].x - d.x - mitteAlle.x, y: p[0].y - d.y - mitteAlle.y, mag: p[3][0], farbe: weiss });
      liste.push({ x: p[0].x + d.x - mitteAlle.x, y: p[0].y + d.y - mitteAlle.y, mag: p[3][1], farbe: weiss });
    });
    return liste;
  }

  // ---------- Kugelsternhaufen ----------

  var haufenSterne = null;

  // Sterne nach Plummer-Verteilung (dicht in der Mitte), Helligkeiten so,
  // dass es viel mehr schwache als helle gibt. Einmal gewürfelt, fester Startwert.
  function m13Sterne(o) {
    if (haufenSterne) return haufenSterne;
    var z = O.Zufall(13);
    var a = 75;                         // Kernradius ″
    var rMax = o.durchmesserBs / 2;
    var liste = [];
    while (liste.length < 3500) {
      var u = Math.max(1e-6, z());
      var r = a / Math.sqrt(Math.pow(u, -2 / 3) - 1);
      if (r > rMax) continue;
      var w = z() * Math.PI * 2;
      // Anzahl wächst mit 10^(0,35·m): Umkehrfunktion über [11,9; 19]
      var m0 = o.hellsterMag;
      var spanne = Math.pow(10, 0.35 * (19 - m0)) - 1;
      var mag = m0 + Math.log10(1 + z() * spanne) / 0.35;
      var gelb = z() < 0.3;
      liste.push({ x: Math.cos(w) * r, y: Math.sin(w) * r, mag: mag,
        farbe: gelb ? [1, 0.88, 0.7] : [0.9, 0.93, 1] });
    }
    haufenSterne = liste;
    return liste;
  }

  // Der Nebel aus all den Sternen, die zu schwach sind, um einzeln
  // gesehen zu werden: je mehr Sterne aufgelöst sind, desto weniger Nebel.
  function m13Nebel(ctx, o, grenz) {
    var aufgeloest = Math.min(1, Math.max(0, (grenz - o.hellsterMag) / 6));
    var g = ctx.createRadialGradient(0, 0, 0, 0, 0, o.durchmesserBs / 2);
    var h = 0.55 * (1 - aufgeloest * 0.6);
    g.addColorStop(0, rgb(230, 228, 220, h));
    g.addColorStop(0.08, rgb(220, 218, 210, h * 0.75));
    g.addColorStop(0.3, rgb(200, 200, 195, h * 0.25));
    g.addColorStop(1, rgb(200, 200, 195, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, o.durchmesserBs / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // ---------- Verteiler ----------

  // Wohin die Lupe schaut (Himmelskoordinaten in ″, vor der Drehung)
  function lupenMitte(o) {
    if (o.id === 'epsilonlyrae') {
      var s = epsilonLyrae(o);
      return { x: (s[0].x + s[1].x) / 2, y: (s[0].y + s[1].y) / 2 };    // das Paar ε1
    }
    if (o.id === 'mond') return O.Mond.lupenMitte(o);
    return { x: 0, y: 0 };
  }

  O.Objekte = {
    lupenMitte: lupenMitte,

    // Flächenhelligkeit relativ zueinander (Mond ≫ Jupiter > Saturn > Haufen)
    // (Der Mond wäre eigentlich noch 4-mal heller als Jupiter – das würde
    // jede Einzelheit überstrahlen, die ein Bildschirm zeigen kann.)
    hell: { saturn: 1, jupiter: 1.8, mond: 1.7, m13: 0.6, albireo: 0, epsilonlyrae: 0 },

    ausgedehnt: function (ctx, o, grenz) {
      if (o.id === 'saturn') O.Planeten.saturn(ctx, o);
      else if (o.id === 'jupiter') O.Planeten.jupiter(ctx, o);
      else if (o.id === 'mond') O.Mond.zeichne(ctx, o);
      else if (o.id === 'm13') m13Nebel(ctx, o, grenz);
    },

    sterne: function (o) {
      if (o.id === 'albireo') return albireo(o);
      if (o.id === 'epsilonlyrae') return epsilonLyrae(o);
      if (o.id === 'jupiter') return jupiterMonde(o);
      if (o.id === 'm13') return m13Sterne(o);
      return [];
    }
  };
})(globalThis.OPTIK = globalThis.OPTIK || {});
