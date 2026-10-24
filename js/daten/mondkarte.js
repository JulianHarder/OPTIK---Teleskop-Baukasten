/*
  Die Mondkarte für den Blick durchs Okular: Mare, große Krater und
  Gebirge an ihren echten Orten.

  Selenografische Koordinaten in Grad: Breite (Norden +), Länge (Osten +,
  Osten ist die Seite mit dem Mare Crisium – am Himmel rechts).
  Durchmesser in km. Nachgesehen am 24.10.2026:
    Mare:    Wikipedia, „List of maria on the Moon“ (Mitte und Durchmesser)
    Krater:  Wikipedia, „List of craters on the Moon: A–B … T–Z“
    Gebirge: Wikipedia, „Montes Apenninus“, „Montes Caucasus“,
             „Montes Alpes“, „Promontorium Fresnel“

  Zwischen den benannten Kratern würfelt Mond.js viele kleine dazu – mit
  festem Startwert, also bei jedem Laden gleich.
*/
(function (O) {
  'use strict';

  O.MONDKARTE = {
    // Mondradius (NASA Moon Fact Sheet: 1 737,4 km)
    radiusKm: 1737.4,

    // [Breite, Länge, Durchmesser km, Dunkelheit 0..1]
    // Die Mare sind als Kreise eingetragen; ihre Ränder verbiegt Mond.js
    // mit Rauschen. Oceanus Procellarum und Mare Frigoris sind zu
    // unregelmäßig für einen Kreis – sie sind aus mehreren Kreisen grob
    // nachgebaut (eigene Näherung nach der Mondkarte, nicht nachgemessen).
    mare: [
      [34.72, -14.91, 1146, 1],     // Mare Imbrium
      [27.29, 18.36, 674, 1],       // Mare Serenitatis
      [8.35, 30.83, 700, 1],        // Mare Tranquillitatis (876 km, unregelmäßig:
      [14, 24, 300, 1], [2, 37, 330, 1], [-2, 25, 230, 1],   //   Lappen grob nachgebaut)
      [16.18, 59.10, 556, 1],       // Mare Crisium
      [-7.83, 53.67, 560, 0.95],    // Mare Fecunditatis (840 km, von Nord nach Süd
      [-1, 51, 380, 0.95], [-16, 52, 360, 0.95],              //   gestreckt, grob nachgebaut)
      [-15.19, 34.60, 339, 1],      // Mare Nectaris
      [-20.59, -17.29, 714, 0.9],   // Mare Nubium
      [-10.53, -22.31, 350, 0.9],   // Mare Cognitum
      [-24.48, -38.57, 420, 1],     // Mare Humorum
      [7.79, -30.64, 512, 0.9],     // Mare Insularum
      [13.20, 4.09, 242, 0.95],     // Mare Vaporum
      [12.10, -8.34, 316, 0.85],    // Sinus Aestuum
      [1.63, 1.03, 287, 0.8],       // Sinus Medii
      [45.01, -31.67, 249, 1],      // Sinus Iridum
      [50.26, -50.86, 195, 0.9],    // Sinus Roris
      [-5.41, 27.49, 219, 0.85],    // Sinus Asperitatis
      [10.98, 42.47, 159, 0.8],     // Sinus Concordiae
      [19.92, 37.29, 189, 0.8],     // Sinus Amoris
      [11.72, 17.87, 112, 0.8],     // Sinus Honoris
      [27.36, 0.00, 180, 0.9],      // Palus Putredinis
      [13.69, 44.72, 163, 0.75],    // Palus Somni
      [-32.00, -27.54, 300, 0.8],   // Palus Epidemiarum
      [37.56, 30.80, 425, 0.75],    // Lacus Somniorum
      [45.13, 27.32, 159, 0.85],    // Lacus Mortis
      [-39.42, -27.95, 154, 0.7],   // Lacus Timoris
      [7.49, 68.66, 245, 0.8],      // Mare Undarum
      [22.43, 67.58, 146, 0.8],     // Mare Anguis
      [1.30, 65.30, 143, 0.8],      // Mare Spumans
      [12.70, 86.52, 358, 0.8],     // Mare Marginis
      [-1.71, 87.05, 374, 0.8],     // Mare Smythii
      [56.92, 81.54, 231, 0.8],     // Mare Humboldtianum
      // Oceanus Procellarum (Mitte 20,7° N, 56,7° W, 2 592 km) aus Kreisen
      [42, -58, 520, 0.95], [28, -58, 700, 0.95], [14, -52, 700, 0.95],
      [0, -48, 560, 0.95], [-12, -50, 420, 0.95], [22, -42, 420, 0.95],
      [6, -66, 500, 0.95], [32, -72, 400, 0.9],
      // Mare Frigoris (Mitte 57,6° N, 0,0°, 1 446 km lang) als Band
      [56, -42, 230, 0.9], [56, -28, 240, 0.9], [56, -14, 240, 0.9],
      [56, 0, 240, 0.9], [57, 14, 240, 0.9], [58, 28, 220, 0.9], [59, 40, 180, 0.85],
      // dunkle, mit Lava gefüllte Kraterböden
      [51.62, -9.38, 78, 1],        // Plato
      [-5.38, -68.36, 120, 1],      // Grimaldi
      [29.72, -3.99, 66, 0.8],      // Archimedes
      [-9.16, -1.84, 120, 0.35],    // Ptolemaeus (heller Boden)
      [-17.55, -39.96, 80, 0.4],    // Gassendi
      [-44.38, -55.11, 150, 0.35],  // Schickard
      [9.17, 15.21, 70, 0.45]       // Julius Caesar
    ],

    // [Name, Breite, Länge, Durchmesser km, Art]
    // Art: 'jung' = scharf, mit Zentralberg und hellem Hof
    //      'flach' = Boden mit Lava gefüllt, flach, kein Zentralberg
    //      'alt' = abgetragen, flacher Wall, kaum Tiefe
    //      '' = gewöhnlich
    krater: [
      ['Copernicus', 9.62, -20.08, 96.07, 'jung'],
      ['Tycho', -43.30, -11.22, 85.29, 'jung'],
      ['Kepler', 8.12, -38.01, 29.49, 'jung'],
      ['Aristarchus', 23.73, -47.49, 39.99, 'jung'],
      ['Proclus', 16.09, 46.89, 26.91, 'jung'],
      ['Menelaus', 16.26, 15.93, 27.13, 'jung'],
      ['Theophilus', -11.45, 26.28, 98.59, 'jung'],
      ['Eratosthenes', 14.47, -11.32, 58.77, 'jung'],
      ['Aristillus', 33.88, 1.21, 54.37, 'jung'],
      ['Autolycus', 30.68, 1.49, 38.88, ''],
      ['Bullialdus', -20.75, -22.26, 60.72, 'jung'],
      ['Langrenus', -8.86, 61.04, 131.98, 'jung'],
      ['Aristoteles', 50.24, 17.32, 87.57, ''],
      ['Eudoxus', 44.27, 16.23, 70.16, ''],
      ['Arzachel', -18.26, -1.93, 96.99, ''],
      ['Alphonsus', -13.39, -2.85, 110.54, ''],
      ['Alpetragius', -16.05, -4.51, 40.02, 'jung'],
      ['Ptolemaeus', -9.16, -1.84, 153.67, 'flach'],
      ['Herschel', -5.69, -2.09, 39.09, ''],
      ['Albategnius', -11.24, 4.01, 130.84, 'flach'],
      ['Hipparchus', -5.36, 4.91, 143.95, 'alt'],
      ['Thebit', -22.01, -4.02, 54.64, ''],
      ['Purbach', -25.51, -2.03, 114.97, 'alt'],
      ['Regiomontanus', -28.28, -1.09, 126.64, 'alt'],
      ['Walther', -33.25, 0.62, 134.23, 'alt'],
      ['Werner', -28.03, 3.29, 70.59, ''],
      ['Deslandres', -32.55, -5.57, 227.02, 'alt'],
      ['Pitatus', -29.88, -13.53, 100.63, 'flach'],
      ['Stöfler', -41.24, 5.93, 129.87, 'flach'],
      ['Maurolycus', -41.77, 13.92, 115.35, 'alt'],
      ['Maginus', -50.03, -5.98, 155.58, 'alt'],
      ['Clavius', -58.62, -14.73, 230.77, 'alt'],
      ['Longomontanus', -49.55, -21.88, 145.5, 'alt'],
      ['Blancanus', -63.77, -21.63, 105.82, ''],
      ['Scheiner', -60.35, -27.81, 110.07, ''],
      ['Plato', 51.62, -9.38, 100.68, 'flach'],
      ['Archimedes', 29.72, -3.99, 81.04, 'flach'],
      ['Cassini', 40.25, 4.64, 56.88, 'flach'],
      ['Timocharis', 26.72, -13.10, 34.14, ''],
      ['Manilius', 14.45, 9.07, 38.34, 'jung'],
      ['Agrippa', 4.10, 10.47, 43.75, ''],
      ['Godin', 1.82, 10.16, 34.25, 'jung'],
      ['Julius Caesar', 9.17, 15.21, 84.72, 'alt'],
      ['Delambre', -1.94, 17.39, 51.49, ''],
      ['Abulfeda', -13.87, 13.91, 62.23, ''],
      ['Sacrobosco', -23.75, 16.64, 97.67, 'alt'],
      ['Cyrillus', -13.29, 24.07, 98.09, ''],
      ['Catharina', -17.98, 23.55, 98.77, 'alt'],
      ['Fracastorius', -21.36, 33.07, 120.58, 'flach'],
      ['Janssen', -44.96, 40.82, 200.65, 'alt'],
      ['Petavius', -25.39, 60.78, 184.06, ''],
      ['Posidonius', 31.88, 29.99, 95.06, 'flach'],
      ['Atlas', 46.74, 44.38, 88.12, ''],
      ['Hercules', 46.82, 39.21, 68.32, ''],
      ['Gassendi', -17.55, -39.96, 111.39, 'flach'],
      ['Schickard', -44.38, -55.11, 212.18, 'flach'],
      ['Grimaldi', -5.38, -68.36, 173.49, 'flach']
    ],

    // Gebirge als Linie über die Karte: Punkte [Breite, Länge], Höhe der
    // höchsten Gipfel, Breite des Gebirgszugs (km, geschätzt)
    gebirge: [
      // Montes Apenninus: 600 km, Gipfel bis 5 km, von westlich Eratosthenes
      // bis Promontorium Fresnel (28,63° N, 4,75° O). Zwischenpunkte geschätzt.
      { name: 'Apenninus', hoeheKm: 4.5, breiteKm: 45,
        punkte: [[14.6, -13.5], [17.5, -8], [20.5, -3.5], [24.5, 0.5], [28.63, 4.75]] },
      // Montes Caucasus: Mitte 38,4° N, 10,0° O, 445 km, Gipfel bis 6 km
      { name: 'Caucasus', hoeheKm: 4, breiteKm: 40,
        punkte: [[34.5, 8.6], [38.4, 10.0], [42.5, 9.2]] },
      // Montes Alpes: 42,0° bis 52,8° N, 5,6° W bis 3,2° O, 280 km lang,
      // meist 1,8–2,4 km hoch (Mons Blanc 3,6 km)
      { name: 'Alpes', hoeheKm: 2.4, breiteKm: 50,
        punkte: [[42.0, 3.2], [46.5, 0.5], [49.5, -2.5], [52.8, -5.6]] }
    ]
  };
})(globalThis.OPTIK = globalThis.OPTIK || {});
