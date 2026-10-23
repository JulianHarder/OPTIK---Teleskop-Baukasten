/*
  Berühmte Teleskope: Steckbriefe mit nachgesehenen Zahlen.

  oeffnungMm ist die wirksame Öffnung – damit rechnet der Vergleich mit
  dem eigenen Teleskop („sammelt so viel Licht wie …“).

  Quellen:
  - Galilei: Museo Galileo, Florenz, Inv. 2428
    (brunelleschi.imss.fi.it/pencil/eng/html/Tools/01 Cannocchiale.htm,
    catalogue.museogalileo.it/object/GalileosTelescope.html)
  - Newton: en.wikipedia.org/wiki/Newton%27s_reflector (Maße aus Newtons
    „Opticks“: Spiegel ca. 1,3 Zoll, Brennweite 6,25 Zoll, 35-fach);
    Rohrdurchmesser 2,25 Zoll vom zweiten Teleskop (1671) übernommen
  - Yerkes: en.wikipedia.org/wiki/Yerkes_Observatory (102 cm, f = 19,3 m,
    225 kg), forgottenfutures.com/library/telescope/telescope.htm (Artikel
    von 1897: Rohr 4 ft 2 in Ø in der Mitte, 6 t, Kuppel 90 ft, Hebeboden
    75 ft, 23 ft Hub), scopeviews.co.uk/YerkesVisit.htm (Säule 40 ft)
*/
(function (O) {
  'use strict';

  O.TELESKOPE = {
    liste: ['galilei', 'newton', 'yerkes'],

    galilei: {
      name: 'Galileis Fernrohr',
      kurz: 'Galilei',
      jahr: '1609/10',
      oeffnungMm: 15,
      zeile: 'Linsenfernrohr · 15 mm Öffnung · 21-fach',
      daten: [
        ['Gebaut', 'Ende 1609 / Anfang 1610, Padua'],
        ['Länge', '98 cm'],
        ['Objektiv', 'eine Linse, 37 mm – abgeblendet auf 15 mm'],
        ['Brennweite', '980 mm'],
        ['Okular', 'Zerstreuungslinse, −47,5 mm'],
        ['Vergrößerung', '21-fach'],
        ['Himmelsausschnitt', '15′ – ein halber Vollmond'],
        ['Heute', 'Museo Galileo, Florenz']
      ],
      text: 'Galilei hörte 1609 von einem holländischen „Fernrohr“ und baute ' +
        'sich selbst eines – und dann immer bessere. Er schliff die Linsen ' +
        'eigenhändig. Mit Fernrohren wie diesem sah er im Januar 1610 vier ' +
        'Monde um Jupiter kreisen: Nicht alles am Himmel dreht sich um die Erde.',
      okular: 'So sah Galilei den Himmel: 21-fach, nur 15 mm Öffnung, ein Feld ' +
        'von einem halben Vollmond – und das Bild steht aufrecht. Saturn hielt ' +
        'er 1610 für drei Körper. Dass es Ringe sind, erkannte erst Christiaan ' +
        'Huygens 1659.',
      fakt: 'Das Okular ist eine Zerstreuungslinse. Deshalb steht das Bild ' +
        'aufrecht – aber man sieht nur einen winzigen Ausschnitt. Das Okular ' +
        'dieses Fernrohrs ist ein Ersatz aus dem 19. Jahrhundert.'
    },

    newton: {
      name: 'Newtons Spiegelteleskop',
      kurz: 'Newton',
      jahr: '1668',
      oeffnungMm: 33,
      zeile: 'Spiegelteleskop · 33 mm Spiegel · 35-fach',
      daten: [
        ['Gebaut', '1668, Cambridge'],
        ['Länge', 'etwa 16 cm'],
        ['Spiegel', '33 mm, aus Spiegelmetall'],
        ['Brennweite', '158 mm'],
        ['Vergrößerung', '35-fach'],
        ['Montierung', 'Kugelgelenk'],
        ['Heute', 'verschollen – es gibt Nachbauten']
      ],
      text: 'Newton hatte entdeckt, dass weißes Licht aus Farben besteht – und ' +
        'dass Linsen jede Farbe verschieden stark brechen. Für ihn hieß das: ' +
        'Linsenfernrohre bekommen nie ein farbreines Bild. Also nahm er ' +
        'einen Spiegel. Der wirft alle Farben gleich zurück.',
      okular: 'Newton sah damit die vier Jupitermonde und die Sichel der Venus. ' +
        'Kein Farbsaum – aber nur ein 33-mm-Spiegel. Wie viel Himmel sein ' +
        'Okular zeigte, ist nicht überliefert; angenommen sind 30°.',
      fakt: 'Mit dem Farbsaum hatte Newton recht, mit dem „nie“ nicht: ' +
        'Zwei Linsen aus verschiedenem Glas heben ihn fast auf – der Achromat, ' +
        'den du im Linsenfernrohr bauen kannst, kam erst Jahrzehnte später.'
    },

    yerkes: {
      name: 'Yerkes-Refraktor',
      kurz: 'Yerkes',
      jahr: '1897',
      oeffnungMm: 1020,
      zeile: 'Linsenfernrohr · 102 cm Öffnung · f/19',
      daten: [
        ['Gebaut', '1897, Williams Bay (Wisconsin, USA)'],
        ['Objektiv', '102 cm Achromat, 225 kg'],
        ['Brennweite', '19,3 m'],
        ['Rohr', '19 m lang, 6 Tonnen'],
        ['Säule', '12 m, Gusseisen'],
        ['Kuppel', '27 m Durchmesser'],
        ['Boden', 'ein Aufzug: 23 m breit, 7 m Hub']
      ],
      text: 'Es gilt als größtes Linsenfernrohr, das je für die Sternforschung ' +
        'gebaut wurde. Damit der Beobachter immer ans Okular kam, ist der ganze ' +
        'Boden der Kuppel ein Aufzug – er fährt bis zu 7 m hoch.',
      okular: '480-fach mit einem 40-mm-Okular wie heute üblich (angenommen). ' +
        'Die Linse könnte viel feiner zeigen, als die Luft meist erlaubt – ' +
        'probier ruhige und unruhige Luft. Der violette Saum kommt vom ' +
        'Achromaten: Gelbgrün und Rot-Blau treffen sich nicht ganz.',
      fakt: 'Größer geht es mit Linsen kaum: Eine Linse kann man nur am Rand ' +
        'halten, und eine noch größere biegt sich unter ihrem eigenen Gewicht ' +
        'durch. Spiegel kann man von hinten stützen – darum sind alle ' +
        'großen Teleskope danach Spiegelteleskope.'
    }
  };
})(globalThis.OPTIK = globalThis.OPTIK || {});
