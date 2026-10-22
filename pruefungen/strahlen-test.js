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
  'js/physik/Optik.js'
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

console.log(fehler ? '\n' + fehler + ' Prüfung(en) fehlgeschlagen.' : '\nAlles grün.');
process.exit(fehler ? 1 : 0);
