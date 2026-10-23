/*
  Zahlenprüfungen der Physik – ohne Browser:

      node pruefungen/strahlen-test.js

  Die Physik-Dateien hängen sich an globalThis.OPTIK und laufen deshalb
  im Browser und in node gleich. Jede Etappe ergänzt hier ihre Prüfwerte.
*/
'use strict';

var pfad = require('path');
var wurzel = pfad.join(__dirname, '..');

[
  'js/kern/Vektor.js',
  'js/physik/Paraxial.js',
  'js/physik/Strahlverfolger.js',
  'js/physik/Glas.js',
  'js/physik/Flaeche.js',
  'js/physik/Optik.js',
  'js/physik/Linsenoptik.js',
  'js/physik/Historisch.js',
  'js/physik/Kennzahlen.js',
  'js/physik/Sehen.js',
  'js/daten/himmel.js',
  'js/daten/bauarten.js'
].forEach(function (datei) {
  require(pfad.join(wurzel, datei));
});

var O = globalThis.OPTIK;
var V = O.Vektor;
var fehler = 0;

function pruefe(name, ok, info) {
  console.log((ok ? '  ok    ' : '  FEHLER ') + name + (info ? '  (' + info + ')' : ''));
  if (!ok) fehler++;
}

function nah(a, b, tol) {
  return Math.abs(a - b) <= tol;
}

// Bündel achsparalleler Strahlen (Ebene x = 0) durch eine ideale Linse
function kreuzung(linse, anzahl, breiteMm) {
  var element = O.IdealeLinse(linse);
  var pfade = [];
  for (var i = 0; i < anzahl; i++) {
    var y = -breiteMm / 2 + (breiteMm * i) / (anzahl - 1);
    pfade.push(O.Strahlverfolger.verfolge(
      { p: V.v(0, y, -100), d: V.v(0, 0, 1) }, [element], { zMin: -100, zMax: 3000 }));
  }
  return { pfade: pfade, messung: O.Strahlverfolger.achsenKreuzung(pfade) };
}

console.log('Ideale Linse');

(function () {
  var m = kreuzung({ posMm: 0, fMm: 500, durchmesserMm: 80 }, 41, 78).messung;
  pruefe('f = 500: alle 40 seitlichen Strahlen kreuzen die Achse', m && m.anzahl === 40);
  pruefe('f = 500: Kreuzungspunkt bei 500,000 mm',
    m && nah(m.zMin, 500, 1e-9) && nah(m.zMax, 500, 1e-9),
    m && 'min ' + m.zMin.toFixed(12) + ', max ' + m.zMax.toFixed(12));
})();

(function () {
  var m = kreuzung({ posMm: 333, fMm: 250, durchmesserMm: 60 }, 15, 50).messung;
  pruefe('Linse bei 333 mm, f = 250: Kreuzung bei 583 mm',
    m && nah(m.zMin, 583, 1e-9) && nah(m.zMax, 583, 1e-9), m && m.zMittel.toFixed(12));
})();

(function () {
  var r = kreuzung({ posMm: 100, fMm: 300, durchmesserMm: 40 }, 3, 100);
  pruefe('Strahl neben der Linse läuft geradeaus',
    r.pfade[0].punkte.length === 2 && r.pfade[0].ende.d.y === 0);
  pruefe('Mittelstrahl bleibt auf der Achse', nah(r.pfade[1].ende.d.y, 0, 1e-15));
})();

(function () {
  var linse = O.IdealeLinse({ posMm: 500, fMm: 200, durchmesserMm: 80 });
  var e = O.Strahlverfolger.verfolge(
    { p: V.v(0, 20, 1000), d: V.v(0, 0, -1) }, [linse], { zMin: 0, zMax: 1000 });
  var zKreuz = e.ende.p.z + (-e.ende.p.y / e.ende.d.y) * e.ende.d.z;
  pruefe('Licht von rechts: Kreuzung bei 300 mm', nah(zKreuz, 300, 1e-9), zKreuz.toFixed(12));
})();

console.log('\nMaße des Newton-Teleskops');

(function () {
  var m = O.Optik.masseNewton({ oeffnungMm: 200, brennweiteMm: 1200 });

  // Fangspiegel + Abstand zum Brennpunkt ergeben genau die Brennweite
  pruefe('Fangspiegel bei f − seitlich: Lichtweg Spiegel → Fokus = f',
    nah(m.zFang + m.seitlich, m.f, 1e-9), 'zFang ' + m.zFang.toFixed(1) + ' + ' + m.seitlich.toFixed(1));

  // Lichtkegel am Fangspiegel: D · seitlich / f – der Spiegel muss größer sein
  pruefe('Fangspiegel schneidet den Lichtkegel nicht an',
    m.fang >= m.D * m.seitlich / m.f, m.fang + ' mm ≥ ' + m.fangNoetig.toFixed(1) + ' mm');
  pruefe('Fangspiegel ist ein handelsübliches Maß', O.Optik.FANGSPIEGEL_MM.indexOf(m.fang) >= 0);

  pruefe('Brennpunkt liegt außerhalb des Tubus', m.seitlich > m.rAussen);
  pruefe('Tubus reicht über den Fangspiegel hinaus', m.zVorne > m.zFang + m.fang);
  pruefe('Tubuslänge realistisch (200/1200 ≈ 1,2 m)',
    m.laenge > 1100 && m.laenge < 1300, m.laenge.toFixed(0) + ' mm');
  pruefe('Parabel: Tiefe am Rand r²/4f ≈ 2,08 mm',
    nah(m.sag(100), 100 * 100 / 4800, 1e-12), m.sag(100).toFixed(3) + ' mm');

  // kleines und großes Teleskop: Maße bleiben stimmig
  [[76, 300], [114, 900], [300, 1500], [400, 1800]].forEach(function (p) {
    var k = O.Optik.masseNewton({ oeffnungMm: p[0], brennweiteMm: p[1] });
    pruefe(p[0] + '/' + p[1] + ': Fangspiegel passt, Fokus außen',
      k.fang >= k.fangNoetig && k.seitlich > k.rAussen && k.zFang > 0,
      'Fangspiegel ' + k.fang + ' mm, Tubus ' + k.laenge.toFixed(0) + ' mm');
  });
})();


console.log('\nSpiegel (Kegelschnitt-Flächen)');

// Ein Spiegel in Grundstellung (Scheitel im Ursprung, hohl nach +z)
function spiegel(c, k, r, name) {
  return O.Flaeche.imRahmen(
    new O.Lage(V.v(0, 0, 0), V.v(1, 0, 0), V.v(0, 1, 0), V.v(0, 0, 1)),
    O.Flaeche.Kegelschnitt(c, k, { r: r }), name || 'spiegel');
}

// Wo kommt ein von oben (−z) einfallender Strahl nach der Reflexion der
// Achse am nächsten? (in 3D, auch für schräge Strahlen außerhalb der Ebene)
function naechsterAchsenpunkt(e) {
  var p = e.ende.p;
  var d = e.ende.d;
  // Abstand zur z-Achse minimieren: |(p + t·d)_xy|² → t = −(p·d)_xy / |d_xy|²
  var t = -(p.x * d.x + p.y * d.y) / (d.x * d.x + d.y * d.y);
  var q = V.auf(p, d, t);
  return { z: q.z, abstand: Math.hypot(q.x, q.y) };
}

(function () {
  var f = 1200;
  var para = spiegel(1 / (2 * f), -1, 100);
  var schlimmste = 0;
  var anzahl = 0;
  for (var ix = -10; ix <= 10; ix++) {
    for (var iy = -10; iy <= 10; iy++) {
      var x = ix * 10;
      var y = iy * 10;
      if (x * x + y * y > 100 * 100 || (x === 0 && y === 0)) continue;
      var e = O.Strahlverfolger.verfolge({ p: V.v(x, y, 2000), d: V.v(0, 0, -1) }, [para], { auslaufMm: 10 });
      var a = naechsterAchsenpunkt(e);
      schlimmste = Math.max(schlimmste, Math.abs(a.z - f), a.abstand);
      anzahl++;
    }
  }
  pruefe('Parabolspiegel f = 1200: ' + anzahl + ' Strahlen über die ganze Fläche treffen den Brennpunkt',
    schlimmste < 1e-9, 'größte Abweichung ' + schlimmste.toExponential(2) + ' mm');
})();

(function () {
  // Kugelspiegel R = 2400: achsnah f = 1200, Randstrahlen kürzer (sphärische Aberration)
  var kugel = spiegel(1 / 2400, 0, 100);
  function fokus(h) {
    var e = O.Strahlverfolger.verfolge({ p: V.v(0, h, 2000), d: V.v(0, 0, -1) }, [kugel], { auslaufMm: 10 });
    return naechsterAchsenpunkt(e).z;
  }
  var nah = fokus(0.5);
  var rand = fokus(100);
  pruefe('Kugelspiegel R = 2400: achsnah Brennpunkt bei 1200 mm', Math.abs(nah - 1200) < 0.001, nah.toFixed(4));
  pruefe('Kugelspiegel: Randstrahl trifft zu früh (sphärische Aberration)',
    rand < nah - 1, 'Rand ' + rand.toFixed(2) + ' mm, ' + (nah - rand).toFixed(2) + ' mm zu kurz');
  // Längsfehler eines Kugelspiegels: etwa h² / 4R = 100² / 9600 ≈ 1,04 mm
  pruefe('… um etwa h² / 4R = 1,04 mm', Math.abs((nah - rand) - 100 * 100 / 9600) < 0.01);
})();

(function () {
  var para = spiegel(1 / 2400, -1, 100);
  var e = O.Strahlverfolger.verfolge({ p: V.v(0, 50, -300), d: V.v(0, 0, 1) }, [para], { auslaufMm: 10 });
  pruefe('Licht von hinten trifft die Rückseite und wird geschluckt', e.geschluckt);
})();

(function () {
  // Hyperboloid, gewölbt (c < 0) – wie der Fangspiegel eines Cassegrain.
  // Genauer geprüft wird er in Etappe 7, wenn Hubble ihn braucht.
  var hyp = spiegel(1 / -500, -4, 60);
  var strahl = { p: V.v(0, 40, 400), d: V.norm(V.v(0, -0.05, -1)) };
  var r = O.Strahlverfolger.verfolge(strahl, [hyp], { auslaufMm: 10 });
  pruefe('Hyperbolischer Spiegel wird getroffen und spiegelt', r.getroffen[0] === 'spiegel' && !r.geschluckt);
})();

console.log('\nDas ganze Newton-Teleskop 200/1200');

(function () {
  var zustand = { oeffnungMm: 200, brennweiteMm: 1200, okularMm: 25 };
  var m = O.Optik.masseNewton(zustand);
  var el = O.Optik.elementeNewton(m, zustand).slice(0, 2);   // nur die beiden Spiegel
  var F = O.Optik.brennpunkt(m);
  var start = O.Optik.sternStrahlen(m, 0, 41, 64);
  var schlimmste = 0;
  var gezaehlt = 0;
  start.faecher.concat(start.ring).forEach(function (s) {
    var e = O.Strahlverfolger.verfolge(s, el, { auslaufMm: 10 });
    if (e.geschluckt) return;
    // Abstand des Strahls nach dem Fangspiegel vom Brennpunkt
    var p = e.ende.p;
    var d = e.ende.d;
    var t = V.punkt(V.minus(F, p), d);
    schlimmste = Math.max(schlimmste, V.laenge(V.minus(V.auf(p, d, t), F)));
    gezaehlt++;
  });
  pruefe('Spiegel + Fangspiegel: alle ' + gezaehlt + ' Strahlen laufen durch den Brennpunkt im Auszug',
    schlimmste < 1e-6, 'größte Abweichung ' + schlimmste.toExponential(2) + ' mm');
})();

(function () {
  // Abschattung: Anteil der Strahlen, die auf die Rückseite des Fangspiegels fallen
  var zustand = { oeffnungMm: 200, brennweiteMm: 1200, okularMm: 25 };
  var m = O.Optik.masseNewton(zustand);
  var el = O.Optik.elementeNewton(m, zustand);
  var gesamt = 0;
  var schatten = 0;
  for (var x = -99.5; x < 100; x += 1) {
    for (var y = -99.5; y < 100; y += 1) {
      if (x * x + y * y > 100 * 100) continue;
      gesamt++;
      var e = O.Strahlverfolger.verfolge({ p: V.v(x, y, 2000), d: V.v(0, 0, -1) }, el, { auslaufMm: 10 });
      if (e.getroffen[0] === 'fangspiegel') schatten++;
    }
  }
  var erwartet = (m.fang / m.D) * (m.fang / m.D);
  pruefe('Fangspiegel schattet (kleine Achse / D)² der Fläche ab',
    Math.abs(schatten / gesamt - erwartet) < 0.002,
    (schatten / gesamt * 100).toFixed(2) + ' % gemessen, ' + (erwartet * 100).toFixed(2) + ' % erwartet');
})();

(function () {
  var zustand = { oeffnungMm: 200, brennweiteMm: 1200, okularMm: 25 };
  var m = O.Optik.masseNewton(zustand);
  var licht = O.Optik.lichtNewton(m, zustand, 0);
  var durch = licht.faecher.concat(licht.ring).filter(function (p) { return p.getroffen.indexOf('okular') >= 0; });
  var u = V.v(Math.cos(m.fokusWinkel), Math.sin(m.fokusWinkel), 0);
  var parallel = durch.every(function (p) { return V.punkt(p.ende.d, u) > 1 - 1e-12; });
  pruefe('Stern in der Mitte: alles eingefangene Licht kommt durchs Okular', licht.imBild === 1);
  pruefe('Nach dem Okular laufen die Strahlen parallel (das Auge sieht einen Punkt)', parallel);

  // Austrittspupille: Breite des Bündels hinter dem Okular = D / V
  var quer = V.kreuz(V.v(0, 0, 1), u);
  var lagen = durch.map(function (p) { return V.punkt(p.ende.p, quer); });
  var ap = Math.max.apply(null, lagen) - Math.min.apply(null, lagen);
  // Ring bei 93 % des Radius. Die Parabel lenkt einen Strahl in Höhe h
  // um 2·atan(h / 2f) ab (nicht atan(h / f)), das Okular macht daraus
  // wieder die Höhe f_ok·tan(Winkel). Für kleine h ist das D/V.
  var h = 0.93 * m.D / 2;
  var erwartet = 2 * zustand.okularMm * Math.tan(2 * Math.atan(h / (2 * m.f)));
  pruefe('Bündel hinter dem Okular ist D / V schmal (Austrittspupille)',
    Math.abs(ap - erwartet) < 1e-9, ap.toFixed(4) + ' mm, Formel ' + erwartet.toFixed(4) +
    ' mm (ganze Öffnung: ' + (m.D * zustand.okularMm / m.f).toFixed(2) + ' mm)');

  // Die Feldblende sitzt im Brennpunkt, das Sternbild ist dort ein Punkt:
  // knapp außerhalb des Feldes kommt nichts mehr durch. Zum Rand hin
  // verfehlt ein Teil des Lichts schon vorher den Fangspiegel – der
  // Bildrand wird dunkler (Vignettierung), wie bei echten Newtons.
  var halbesFeld = O.Optik.wahresFeldGrad(m, 25) / 2;
  var mitte = O.Optik.lichtNewton(m, zustand, halbesFeld * 0.6);
  var innen = O.Optik.lichtNewton(m, zustand, halbesFeld * 0.95);
  var aussen = O.Optik.lichtNewton(m, zustand, halbesFeld * 1.05);
  pruefe('Stern bei 60 % des Feldradius: noch voll ausgeleuchtet', mitte.imBild === 1);
  pruefe('Stern am Feldrand: dunkler, weil Licht den Fangspiegel verfehlt',
    innen.imBild > 0.5 && innen.imBild < 1, Math.round(innen.imBild * 100) + ' % kommen an');
  pruefe('Stern knapp außerhalb: nichts – die Feldblende ist eine scharfe Kante', aussen.imBild === 0);
  pruefe('Stern 1° daneben: kein Licht im Okular', O.Optik.lichtNewton(m, zustand, 1.0).imBild === 0);
  pruefe('Wahres Gesichtsfeld 25 mm-Okular ≈ 52° / 48', Math.abs(O.Optik.wahresFeldGrad(m, 25) - 1.16) < 0.02,
    O.Optik.wahresFeldGrad(m, 25).toFixed(3) + '°');
})();

console.log('\nKennzahlen fürs Datenblatt');

(function () {
  var z = { oeffnungMm: 200, brennweiteMm: 1200, okularMm: 25 };
  var k = O.Kennzahlen.berechne(O.Optik.masseNewton(z), z);
  pruefe('200/1200 + 25 mm: 48-fach', Math.abs(k.vergroesserung.wert - 48) < 1e-12);
  pruefe('Austrittspupille D / V = 4,17 mm', Math.abs(k.austrittspupille.wert - 200 / 48) < 1e-12);
  pruefe('Auflösung ≈ 138″ / D = 0,69″', Math.abs(k.aufloesung.wert - 138.4 / 200) < 0.005, k.aufloesung.wert.toFixed(3) + '″');
  pruefe('Lichtsammeln (200 / 7)² ≈ 816-mal das Auge', Math.round(k.lichtsammeln.wert) === 816);
  pruefe('Ampeln im grünen Bereich', k.vergroesserung.ampel[0] === 'gut' && k.austrittspupille.ampel[0] === 'gut');

  var z4 = { oeffnungMm: 200, brennweiteMm: 1200, okularMm: 4 };
  pruefe('4-mm-Okular: 300-fach ist noch erlaubt (≤ 2·D)',
    O.Kennzahlen.berechne(O.Optik.masseNewton(z4), z4).vergroesserung.ampel[0] === 'gut');
  var klein = { oeffnungMm: 100, brennweiteMm: 900, okularMm: 4 };
  var kk = O.Kennzahlen.berechne(O.Optik.masseNewton(klein), klein);
  pruefe('100/900 + 4 mm: 225-fach ist leere Vergrößerung', kk.vergroesserung.ampel[0] === 'schlecht');
  pruefe('… und die Austrittspupille (0,44 mm) zu klein', kk.austrittspupille.ampel[0] === 'schlecht');
  var hell = { oeffnungMm: 300, brennweiteMm: 1200, okularMm: 40 };
  pruefe('300/1200 + 40 mm: Austrittspupille 10 mm > Augenpupille',
    O.Kennzahlen.berechne(O.Optik.masseNewton(hell), hell).austrittspupille.ampel[1] === 'zuBreit');
})();

(function () {
  // Über den ganzen Bereich des Konfigurators: Maße bleiben stimmig
  var B = O.BAUARTEN.dobson;
  var fehlerhaft = [];
  for (var D = B.oeffnung.min; D <= B.oeffnung.max; D += 10) {
    for (var N = B.oeffnungsverhaeltnis.min; N <= B.oeffnungsverhaeltnis.max; N += 0.5) {
      var f = Math.min(D * N, B.brennweiteMax);
      var m = O.Optik.masseNewton({ oeffnungMm: D, brennweiteMm: f });
      var licht = O.Optik.lichtNewton(m, { oeffnungMm: D, brennweiteMm: f, okularMm: 25 }, 0);
      if (!(m.fang >= m.fangNoetig && m.zFang > m.D && licht.imBild === 1)) fehlerhaft.push(D + '/' + f);
    }
  }
  pruefe('Ganzer Bereich 100–400 mm, f/4–f/10: Fangspiegel passt, Licht kommt im Okular an',
    fehlerhaft.length === 0, fehlerhaft.length ? 'Probleme bei ' + fehlerhaft.slice(0, 5).join(', ') : '');
})();

console.log('\nSehen am Okular');

(function () {
  var S = O.Sehen;
  pruefe('Beugungsscheibchen 200 mm: Halbwertsbreite ≈ 116″ / D = 0,58″',
    Math.abs(S.beugungFwhmBs(200) - 0.5836) < 0.001, S.beugungFwhmBs(200).toFixed(4) + '″');
  pruefe('Ohne Luft: Unschärfe = reine Beugung',
    Math.abs(S.sigmaBs(200, 0) * 2 * Math.sqrt(2 * Math.log(2)) - S.beugungFwhmBs(200)) < 1e-12);
  pruefe('Bei unruhiger Luft (3″) macht die Öffnung kaum noch einen Unterschied',
    S.sigmaBs(100, 3) / S.sigmaBs(400, 3) < 1.1, (S.sigmaBs(100, 3) / S.sigmaBs(400, 3)).toFixed(3));
  pruefe('Flächenhelligkeit: halbe Austrittspupille = ein Viertel so hell',
    Math.abs(S.flaechenhelligkeit(2) / S.flaechenhelligkeit(4) - 0.25) < 1e-12);
  pruefe('… über 7 mm nicht heller (Licht geht neben die Pupille)',
    S.flaechenhelligkeit(10) === S.flaechenhelligkeit(7));

  // Daten: Cassini-Teilung ≈ 0,72″ breit, Epsilon Lyrae enger als Albireo
  var saturn = O.HIMMEL.objekte.find(function (o) { return o.id === 'saturn'; });
  var bsProKm = saturn.durchmesserBs / (2 * saturn.aequatorKm);
  var cassini = (saturn.ringeKm.cassini[1] - saturn.ringeKm.cassini[0]) * bsProKm;
  pruefe('Cassini-Teilung bei 18″ Saturn: rund 0,7″', Math.abs(cassini - 0.72) < 0.02, cassini.toFixed(3) + '″');
  pruefe('Epsilon Lyrae (2,3″) ist mit 100 mm gerade trennbar (Rayleigh 1,38″), mit Luft 1,5″ knapp',
    S.sigmaBs(100, 1.5) * 2.3548 < 2.3, 'Halbwertsbreite ' + (S.sigmaBs(100, 1.5) * 2.3548).toFixed(2) + '″');
})();

console.log('\nGlas und Brechung');

(function () {
  var G = O.Glas;
  pruefe('Sellmeier BK7 bei 587,6 nm: n = 1,5168', Math.abs(G.brechzahl('BK7', 587.56) - 1.5168) < 1e-4,
    G.brechzahl('BK7', 587.56).toFixed(5));
  pruefe('Sellmeier F2 bei 587,6 nm: n = 1,6200', Math.abs(G.brechzahl('F2', 587.56) - 1.62) < 1e-4,
    G.brechzahl('F2', 587.56).toFixed(5));
  pruefe('Abbe-Zahlen BK7 ≈ 64,2 und F2 ≈ 36,4',
    Math.abs(G.abbe('BK7') - 64.17) < 0.2 && Math.abs(G.abbe('F2') - 36.37) < 0.2,
    G.abbe('BK7').toFixed(2) + ' / ' + G.abbe('F2').toFixed(2));
  pruefe('Blau wird stärker gebrochen als Rot', G.brechzahl('BK7', 486) > G.brechzahl('BK7', 656));

  function platte(nPlus, nMinus) {
    return O.Flaeche.imRahmen(new O.Lage(V.v(0, 0, 0), V.v(1, 0, 0), V.v(0, 1, 0), V.v(0, 0, 1)),
      O.Flaeche.Brechend(0, 0, { r: 1000 }, nPlus, nMinus), 'flaeche');
  }
  var glas = G.funktion('BK7');
  var luft = G.funktion(null);
  // Snellius: Luft → Glas unter 30°
  var e = O.Strahlverfolger.verfolge({ p: V.v(0, 0, 10), d: V.v(0, Math.sin(Math.PI / 6), -Math.cos(Math.PI / 6)) },
    [platte(luft, glas)], { auslaufMm: 1 });
  var sinNach = e.ende.d.y;
  pruefe('Snellius: sin 30° = n · sin β', Math.abs(0.5 - G.brechzahl('BK7', 587.56) * sinNach) < 1e-12);
  // Glas → Luft unter 45°: Grenzwinkel ist ≈ 41,2° → Totalreflexion
  var t = O.Strahlverfolger.verfolge({ p: V.v(0, 0, 10), d: V.norm(V.v(0, 1, -1)) },
    [platte(glas, luft)], { auslaufMm: 1 });
  pruefe('Glas → Luft unter 45°: Totalreflexion (Grenzwinkel 41,2°)', t.ende.d.z > 0);
})();

console.log('\nLinsenfernrohr 80/600');

(function () {
  var LO = O.Linsenoptik;
  var einzel = LO.masseRefraktor({ oeffnungMm: 80, brennweiteMm: 600, objektiv: 'einzel' });
  var achro = LO.masseRefraktor({ oeffnungMm: 80, brennweiteMm: 600, objektiv: 'achromat' });
  var dE = Math.abs(einzel.farbFokus.F - einzel.farbFokus.C);
  var dA = Math.abs(achro.farbFokus.F - achro.farbFokus.C);
  pruefe('Einzellinse: Blau und Rot liegen ≈ f / V auseinander (9,4 mm)', Math.abs(dE - 600 / O.Glas.abbe('BK7')) < 0.3,
    dE.toFixed(2) + ' mm');
  pruefe('Blauer Brennpunkt liegt näher am Objektiv', einzel.farbFokus.F > 0 && einzel.farbFokus.C < 0);
  pruefe('Achromat: Rot und Blau fast im selben Punkt (< 0,3 mm)', dA < 0.3, dA.toFixed(3) + ' mm');
  var sekundaer = Math.abs((achro.farbFokus.F + achro.farbFokus.C) / 2);
  pruefe('Achromat: Gelb liegt etwas daneben – sekundäres Spektrum (≈ f / 2000)',
    sekundaer > 0.1 && sekundaer < 0.6, sekundaer.toFixed(3) + ' mm, f / 2000 = 0,30 mm');

  ['einzel', 'achromat'].forEach(function (art) {
    var z = { oeffnungMm: 80, brennweiteMm: 600, okularMm: 25, objektiv: art };
    var m = LO.masseRefraktor(z);
    var l = LO.lichtRefraktor(m, z, 0);
    pruefe(art + ': Stern in der Mitte – alles Licht im Okular', l.imBild === 1);
    var aussen = LO.lichtRefraktor(m, z, O.Optik.wahresFeldGrad(m, 25) / 2 * 1.05);
    pruefe(art + ': knapp außerhalb des Felds – nichts', aussen.imBild === 0);
  });
  pruefe('Farbsaum Einzellinse viel größer als Achromat',
    LO.farbfehler(einzel).saumBs > 10 * LO.farbfehler(achro).saumBs,
    LO.farbfehler(einzel).saumBs.toFixed(0) + '″ gegen ' + LO.farbfehler(achro).saumBs.toFixed(1) + '″');
})();

console.log('\nBerühmte Teleskope');

(function () {
  var H = O.Historisch;
  function gelb(l) { return l.faecher.filter(function (p) { return p.linie === 'd'; }); }
  function durchs(pfade, name) { return pfade.filter(function (p) { return p.getroffen.indexOf(name) >= 0; }); }

  // Galilei: nur die Mitte kommt durch die Blende, hinter dem Okular laufen
  // die Strahlen wieder parallel (das Auge sieht ein Bild im Unendlichen)
  var g = gelb(H.lichtGalilei(1000));
  var durch = durchs(g, 'okular');
  pruefe('Galilei: die Blende lässt nur die Mitte durch', durch.length === 5 && g.length === 13,
    durch.length + ' von ' + g.length + ' Strahlen');
  var schief = Math.max.apply(null, durch.map(function (p) { return Math.abs(p.ende.d.y); }));
  pruefe('Galilei: hinter dem Okular wieder parallel (< 0,05°)', schief < Math.sin(0.05 * Math.PI / 180),
    (Math.asin(schief) * 180 / Math.PI * 3600).toFixed(1) + '″');
  var gal = H.galilei();
  pruefe('Galilei: Linsen 932,5 mm auseinander (± 2 mm)', Math.abs(gal.zObjektiv - gal.zOkular - 932.5) < 2,
    (gal.zObjektiv - gal.zOkular).toFixed(1) + ' mm');

  // Newton: Kugelspiegel bündelt bei f/4,8 fast so gut wie eine Parabel
  var n = H.lichtNewton(200);
  var anBlende = n.faecher.filter(function (p) { return p.getroffen.indexOf('feldblende') >= 0; });
  var ys = anBlende.map(function (p) { return p.punkte[p.getroffen.indexOf('feldblende') + 1].z; });
  var breite = Math.max.apply(null, ys) - Math.min.apply(null, ys);
  var amSpiegel = n.faecher.filter(function (p) { return p.getroffen[0] === 'hauptspiegel'; });
  pruefe('Newton: jeder Strahl am Fangspiegel vorbei landet im Okular',
    amSpiegel.length === 10 && durchs(amSpiegel, 'okular').length === amSpiegel.length,
    durchs(amSpiegel, 'okular').length + ' von ' + amSpiegel.length + ', 3 im Schatten des Fangspiegels');
  pruefe('Newton: Brennfleck kleiner als 0,1 mm (Kugel statt Parabel)', breite < 0.1, breite.toFixed(4) + ' mm');

  // Yerkes: der gelbe Brennpunkt liegt im Okularende
  var y = H.lichtYerkes(20000);
  var yg = durchs(gelb(y), 'okular');
  pruefe('Yerkes: alles gelbe Licht kommt durchs Okular', yg.length === 13, yg.length + ' von 13');
  var ys2 = gelb(y).map(function (p) { return p.punkte[p.getroffen.indexOf('feldblende') + 1]; });
  var rand = Math.max.apply(null, ys2.map(function (q) { return Math.hypot(q.x, q.y); }));
  pruefe('Yerkes: gelber Brennfleck kleiner als 0,5 mm', rand < 0.5, (2 * rand).toFixed(3) + ' mm');
})();

console.log(fehler ? '\n' + fehler + ' Prüfung(en) fehlgeschlagen.' : '\nAlles grün.');
process.exit(fehler ? 1 : 0);
