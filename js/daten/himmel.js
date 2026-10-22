/*
  Himmelsobjekte für den Blick durchs Okular – mit echten Winkelgrößen.

  Winkel in Bogensekunden (″), Helligkeit in Größenklassen (mag; kleiner
  = heller). Alle Werte nachgesehen, Quellen jeweils daneben (Stand
  22.10.2026).

  hoehe / azimut: wohin das Teleskop in der Szene schwenkt. Das ist kein
  echter Himmelsort zu einer echten Uhrzeit, sondern nur eine Richtung,
  damit das Teleskop sichtbar zielt. Sie steht so auch auf der Seite.

  achte: was man im Okular suchen soll (der Lerninhalt des Objekts).
*/
(function (O) {
  'use strict';

  O.HIMMEL = {
    // Typische Luftunruhe (Seeing), Halbwertsbreite eines Sterns in ″
    luft: [
      { id: 'ruhig', name: 'Ruhige Luft', bs: 0.8 },
      { id: 'normal', name: 'Normale Nacht', bs: 1.5 },
      { id: 'unruhig', name: 'Unruhige Luft', bs: 3.0 }
    ],

    objekte: [
      {
        id: 'saturn',
        name: 'Saturn',
        art: 'Planet',
        hoehe: 30, azimut: -70,
        // NASA Saturn Fact Sheet: Äquatorradius 60 268 km, Polradius 54 364 km,
        // scheinbarer Durchmesser 14,5″–19,9″
        durchmesserBs: 18,
        abplattung: 54364 / 60268,
        // NASA Saturnian Rings Fact Sheet, Radien in km
        ringeKm: { C: [74658, 91975], B: [91975, 117507], cassini: [117507, 122340], A: [122340, 136780] },
        aequatorKm: 60268,
        // Die Ringneigung wechselt im Lauf von etwa 15 Jahren zwischen 0°
        // und rund 27°. Hier fest gewählt, damit man die Ringe gut sieht.
        ringneigungGrad: 20,
        text: 'Ein Gasplanet mit Ringen aus Eis und Gestein, rund 1,3 ' +
          'Milliarden Kilometer entfernt.',
        achte: 'Die dunkle Lücke im Ring ist die Cassini-Teilung – 4.800 km ' +
          'breit, von hier aus nur 0,7″. Ob du sie siehst, entscheiden ' +
          'Öffnung, Vergrößerung und die Luft.'
      },
      {
        id: 'jupiter',
        name: 'Jupiter',
        art: 'Planet',
        hoehe: 40, azimut: -82,
        // NASA Jupiter Fact Sheet: 71 492 / 66 854 km, scheinbar 30,5″–50,1″
        durchmesserBs: 45,
        abplattung: 66854 / 71492,
        // Abstand der vier großen Monde in Jupiterradien (Io 5,9, Europa
        // 9,4, Ganymed 15,0, Kallisto 26,4) – hier eine mögliche Stellung
        monde: [
          { name: 'Io', abstand: -5.1, durchmesserBs: 1.2 },
          { name: 'Europa', abstand: 8.3, durchmesserBs: 1.0 },
          { name: 'Ganymed', abstand: -13.6, durchmesserBs: 1.7 },
          { name: 'Kallisto', abstand: 22.0, durchmesserBs: 1.6 }
        ],
        text: 'Der größte Planet. Seine vier großen Monde hat Galilei 1610 ' +
          'mit einem kleinen Fernrohr entdeckt.',
        achte: 'Die dunklen Wolkenbänder und die vier Monde in einer Reihe. ' +
          'Mit mehr Vergrößerung werden die Bänder deutlicher.'
      },
      {
        id: 'mond',
        name: 'Mond',
        art: 'Mond',
        hoehe: 22, azimut: -58,
        // NASA Moon Fact Sheet: scheinbarer Durchmesser 29,3′–34,1′
        durchmesserBs: 1865,
        text: 'Halbmond. An der Grenze zwischen Tag und Nacht (dem ' +
          'Terminator) werfen Kraterränder lange Schatten.',
        achte: 'Bei kleiner Vergrößerung passt der ganze Mond ins Bild, bei ' +
          'großer nur noch ein Stück vom Terminator – dafür mit Kratern. ' +
          'Und: Der Mond ist im Teleskop richtig hell.'
      },
      {
        id: 'albireo',
        name: 'Albireo',
        art: 'Doppelstern',
        hoehe: 58, azimut: -90,
        // 3,1 und 5,1 mag, Abstand 34,3″–34,7″, Positionswinkel 55°
        // (astronomynow.com, freestarcharts.com)
        sterne: [
          { x: 0, y: 0, mag: 3.1, farbe: [1.0, 0.78, 0.45] },
          { pa: 55, abstand: 34.5, mag: 5.1, farbe: [0.62, 0.76, 1.0] }
        ],
        text: 'Ein Doppelstern im Schwan: ein goldener und ein blauer Stern.',
        achte: 'Die Farben! Der helle ist kühl und gelborange, der schwache ' +
          'heiß und blau. Getrennt sind sie mit jedem Teleskop.'
      },
      {
        id: 'epsilonlyrae',
        name: 'Epsilon Lyrae',
        art: 'Doppel-Doppelstern',
        hoehe: 66, azimut: -74,
        // Wikipedia „Epsilon Lyrae“: AB–CD 208,2″ bei 172°,
        // ε1 2,3″ bei 347°, ε2 2,4″ bei 79°
        paare: [
          { x: 0, y: 0, abstand: 2.3, pa: 347, mag: [5.0, 6.1] },
          { pa: 172, entfernung: 208.2, abstand: 2.4, pa2: 79, mag: [5.2, 5.4] }
        ],
        text: 'Mit bloßem Auge ein Stern, im Fernglas zwei – und im Teleskop ' +
          'wird jeder davon noch einmal zu zwei Sternen.',
        achte: 'Die zwei Paare stehen nur 2,3″ und 2,4″ auseinander. Sie ' +
          'trennen sich erst mit genug Öffnung, genug Vergrößerung und ' +
          'ruhiger Luft – der klassische Test für ein Teleskop.'
      },
      {
        id: 'm13',
        name: 'M13',
        art: 'Kugelsternhaufen',
        hoehe: 50, azimut: -62,
        // Wikipedia „Messier 13“: Durchmesser rund 20′, Gesamthelligkeit
        // 5,8 mag, hellste Sterne um 11,9 mag
        durchmesserBs: 1200,
        hellsterMag: 11.9,
        text: 'Rund 300.000 Sterne in einer Kugel, 22.000 Lichtjahre ' +
          'entfernt.',
        achte: 'Mit kleiner Öffnung ein Nebelfleck. Je größer der Spiegel, ' +
          'desto mehr einzelne Sterne lösen sich aus dem Nebel – bis er ' +
          'wie Zuckerkristalle funkelt.'
      }
    ]
  };
})(globalThis.OPTIK = globalThis.OPTIK || {});
