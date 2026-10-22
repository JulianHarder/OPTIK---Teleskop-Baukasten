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

  // ---------- Saturn ----------

  function saturn(ctx, o) {
    var R = o.durchmesserBs / 2;
    var Rp = R * o.abplattung;
    var k = R / o.aequatorKm;                 // ″ pro km
    var s = Math.sin(o.ringneigungGrad * Math.PI / 180);
    var ringe = [
      { r: o.ringeKm.C, farbe: rgb(120, 108, 92, 0.55) },
      { r: o.ringeKm.B, farbe: rgb(236, 222, 190) },
      { r: o.ringeKm.cassini, farbe: rgb(25, 22, 18, 0.9) },
      { r: o.ringeKm.A, farbe: rgb(205, 190, 160) }
    ];

    function zeichneRinge() {
      ringe.forEach(function (ring) {
        ctx.beginPath();
        ctx.ellipse(0, 0, ring.r[1] * k, ring.r[1] * k * s, 0, 0, Math.PI * 2);
        ctx.ellipse(0, 0, ring.r[0] * k, ring.r[0] * k * s, 0, 0, Math.PI * 2);
        ctx.fillStyle = ring.farbe;
        ctx.fill('evenodd');
      });
    }

    function haelfte(oben) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(-3 * R, oben ? -3 * R : 0, 6 * R, 3 * R);
      ctx.clip();
      zeichneRinge();
      ctx.restore();
    }

    // hinterer Teil der Ringe (oben), dann die Kugel, dann der vordere Teil
    haelfte(true);

    ctx.save();
    ctx.beginPath();
    ctx.ellipse(0, 0, R, Rp, 0, 0, Math.PI * 2);
    ctx.clip();
    var baender = ctx.createLinearGradient(0, -Rp, 0, Rp);
    [[0, rgb(150, 150, 135)], [0.18, rgb(200, 185, 145)], [0.3, rgb(225, 205, 160)],
      [0.42, rgb(196, 168, 120)], [0.5, rgb(238, 220, 175)], [0.6, rgb(190, 160, 115)],
      [0.72, rgb(222, 200, 155)], [0.86, rgb(180, 165, 130)], [1, rgb(140, 140, 125)]]
      .forEach(function (h) { baender.addColorStop(h[0], h[1]); });
    ctx.fillStyle = baender;
    ctx.fillRect(-R, -Rp, 2 * R, 2 * Rp);
    randAbdunkeln(ctx, R, Rp);
    // Schatten der Ringe auf der Kugel: ein schmales Band knapp unter dem Ring
    ctx.fillStyle = rgb(40, 32, 22, 0.55);
    ctx.beginPath();
    ctx.ellipse(0, Rp * 0.06, o.ringeKm.B[1] * k, o.ringeKm.B[1] * k * s * 1.02, 0, 0, Math.PI);
    ctx.ellipse(0, Rp * 0.06, o.ringeKm.B[1] * k, o.ringeKm.B[1] * k * s * 0.8, 0, Math.PI, 0, true);
    ctx.fill();
    ctx.restore();

    haelfte(false);
  }

  // Planeten sind am Rand dunkler als in der Mitte
  function randAbdunkeln(ctx, R, Rp) {
    ctx.save();
    ctx.scale(1, Rp / R);
    var g = ctx.createRadialGradient(0, 0, R * 0.45, 0, 0, R);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,0,0.5)');
    ctx.fillStyle = g;
    ctx.fillRect(-R, -R, 2 * R, 2 * R);
    ctx.restore();
  }

  // ---------- Jupiter ----------

  function jupiter(ctx, o) {
    var R = o.durchmesserBs / 2;
    var Rp = R * o.abplattung;
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(0, 0, R, Rp, 0, 0, Math.PI * 2);
    ctx.clip();
    // Zonen hell, Bänder braun (Norden oben)
    var g = ctx.createLinearGradient(0, -Rp, 0, Rp);
    [[0, rgb(150, 140, 125)], [0.14, rgb(190, 175, 150)], [0.2, rgb(150, 115, 85)],
      [0.24, rgb(215, 200, 170)], [0.33, rgb(160, 110, 75)], [0.42, rgb(150, 100, 70)],
      [0.46, rgb(235, 225, 200)], [0.55, rgb(232, 220, 195)], [0.58, rgb(165, 115, 80)],
      [0.68, rgb(150, 105, 75)], [0.72, rgb(220, 205, 175)], [0.8, rgb(170, 140, 110)],
      [0.86, rgb(200, 185, 160)], [1, rgb(140, 132, 120)]]
      .forEach(function (h) { g.addColorStop(h[0], h[1]); });
    ctx.fillStyle = g;
    ctx.fillRect(-R, -Rp, 2 * R, 2 * Rp);
    // Großer Roter Fleck am Südrand des südlichen Bandes
    ctx.fillStyle = rgb(190, 110, 80, 0.85);
    ctx.beginPath();
    ctx.ellipse(R * 0.3, Rp * 0.42, R * 0.16, Rp * 0.09, 0, 0, Math.PI * 2);
    ctx.fill();
    randAbdunkeln(ctx, R, Rp);
    ctx.restore();
  }

  function jupiterMonde(o) {
    var R = o.durchmesserBs / 2;
    var helligkeit = { Io: 5.0, Europa: 5.3, Ganymed: 4.6, Kallisto: 5.7 };
    return o.monde.map(function (m) {
      return { x: m.abstand * R, y: 0, mag: helligkeit[m.name], farbe: [1, 0.96, 0.88] };
    });
  }

  // ---------- Mond ----------

  // Halbmond, etwas mehr als halb beleuchtet. Die Bildmitte liegt auf dem
  // Terminator – dort sind die Krater am schönsten.
  var TERMINATOR = -0.12;      // Lage des Terminators in Mondradien (links von der Mitte)

  function mond(ctx, o) {
    var R = o.durchmesserBs / 2;
    var z = O.Zufall(1610);
    ctx.save();
    ctx.translate(-TERMINATOR * R, 0);

    // Erdschein auf der Nachtseite: kaum zu ahnen (die Fläche wird später
    // stark aufgehellt, deshalb hier fast schwarz)
    ctx.fillStyle = rgb(2, 2, 3);
    ctx.beginPath();
    ctx.arc(0, 0, R, 0, Math.PI * 2);
    ctx.fill();

    // beleuchteter Teil: rechte Hälfte + Halbellipse bis zum Terminator
    ctx.beginPath();
    ctx.arc(0, 0, R, -Math.PI / 2, Math.PI / 2, false);
    ctx.ellipse(0, 0, Math.abs(TERMINATOR) * R, R, 0, Math.PI / 2, -Math.PI / 2, false);
    ctx.closePath();
    ctx.save();
    ctx.clip();
    ctx.fillStyle = rgb(178, 174, 166);
    ctx.fillRect(-R, -R, 2 * R, 2 * R);

    // Mare: große dunkle Flecken
    for (var i = 0; i < 14; i++) {
      var w = z() * Math.PI * 2;
      var a = Math.sqrt(z()) * R * 0.75;
      ctx.fillStyle = rgb(95, 95, 98, 0.35 + z() * 0.25);
      ctx.beginPath();
      ctx.ellipse(Math.cos(w) * a, Math.sin(w) * a, R * (0.08 + z() * 0.16), R * (0.06 + z() * 0.12), z() * 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Krater: viele kleine, wenige große. Licht kommt von rechts – je näher
    // am Terminator, desto tiefer steht die Sonne und desto länger der Schatten.
    // 650 über den ganzen Mond, dazu 2500 kleine um die Bildmitte am
    // Terminator – dort schaut die Lupe hin
    for (var k = 0; k < 3150; k++) {
      var nah = k >= 650;
      var r = nah ? 1.5 + Math.pow(z(), 5) * 22 : 3 + Math.pow(z(), 6) * 75;
      var x = nah ? TERMINATOR * R + (z() * 2 - 1) * R * 0.35 : (z() * 2 - 1) * R;
      var y = nah ? (z() * 2 - 1) * R * 0.35 : (z() * 2 - 1) * R;
      if (x * x + y * y > (R - r) * (R - r)) continue;
      var sonne = Math.max(0, (x / R - TERMINATOR) / (1 - TERMINATOR));   // 0 am Terminator
      var schatten = r * 0.9 * Math.max(0.15, 1 - sonne * 2.5);
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.clip();
      ctx.fillStyle = rgb(45, 45, 48, 0.85);
      ctx.fill();
      ctx.fillStyle = rgb(165, 161, 154);
      ctx.beginPath();
      ctx.arc(x - schatten, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      // heller Rand auf der Sonnenseite
      ctx.strokeStyle = rgb(225, 222, 214, 0.7);
      ctx.lineWidth = Math.max(0.6, r * 0.12);
      ctx.beginPath();
      ctx.arc(x, y, r, -Math.PI * 0.45, Math.PI * 0.45);
      ctx.stroke();
    }

    // Zum Terminator hin dunkler (flaches Licht)
    var t = ctx.createLinearGradient(TERMINATOR * R, 0, TERMINATOR * R + R * 0.45, 0);
    t.addColorStop(0, 'rgba(0,0,0,0.65)');
    t.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = t;
    ctx.fillRect(-R, -R, 2 * R, 2 * R);
    ctx.restore();
    ctx.restore();
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
    return { x: 0, y: 0 };
  }

  O.Objekte = {
    lupenMitte: lupenMitte,

    // Flächenhelligkeit relativ zueinander (Mond ≫ Jupiter > Saturn > Haufen)
    // (Der Mond wäre eigentlich noch 4-mal heller als Jupiter – das würde
    // jede Einzelheit überstrahlen, die ein Bildschirm zeigen kann.)
    hell: { saturn: 1, jupiter: 1.8, mond: 1.7, m13: 0.6, albireo: 0, epsilonlyrae: 0 },

    ausgedehnt: function (ctx, o, grenz) {
      if (o.id === 'saturn') saturn(ctx, o);
      else if (o.id === 'jupiter') jupiter(ctx, o);
      else if (o.id === 'mond') mond(ctx, o);
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
