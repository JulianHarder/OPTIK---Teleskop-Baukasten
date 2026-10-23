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
  - Hubble: en.wikipedia.org/wiki/Hubble_Space_Telescope (13,2 × 4,2 m,
    11 110 kg, 2,4 m, f = 57,6 m, Start 24.4.1990, 94 min, Spiegel am Rand
    2,2 µm zu flach), NASA (Spiegel 828 kg), Physics Today „Hubble's blurry
    years“ (70 % in 0,1″ geplant), astrosociety.org (1990 nur ~15 %)
  - Webb: en.wikipedia.org/wiki/James_Webb_Space_Telescope (6,5 m, 25,4 m²,
    f = 131,4 m, f/20,2, Sonnenschild 21,197 × 14,162 m, 6 500 kg,
    Start 25.12.2021, unter 50 K, 0,6–28,5 µm), jwst.nasa.gov/mirrors.html
    (18 Segmente, 1,32 m, je ~20 kg, Beryllium mit Gold)
  - Yerkes: en.wikipedia.org/wiki/Yerkes_Observatory (102 cm, f = 19,3 m,
    225 kg), forgottenfutures.com/library/telescope/telescope.htm (Artikel
    von 1897: Rohr 4 ft 2 in Ø in der Mitte, 6 t, Kuppel 90 ft, Hebeboden
    75 ft, 23 ft Hub), scopeviews.co.uk/YerkesVisit.htm (Säule 40 ft)
*/
(function (O) {
  'use strict';

  O.TELESKOPE = {
    liste: ['galilei', 'newton', 'yerkes', 'hubble', 'webb'],

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
    },

    hubble: {
      name: 'Hubble-Weltraumteleskop',
      kurz: 'Hubble',
      jahr: '1990',
      oeffnungMm: 2400,
      zeile: 'Spiegelteleskop im All · 2,4 m Spiegel · f/24',
      daten: [
        ['Gestartet', '24. April 1990, mit der Raumfähre Discovery'],
        ['Bahn', 'rund 500 km über der Erde, 94 Minuten pro Runde'],
        ['Größe', '13,2 m lang, 4,2 m dick, 11 Tonnen'],
        ['Hauptspiegel', '2,4 m, 828 kg, aus Glas'],
        ['Brennweite', '57,6 m (f/24)'],
        ['Bauart', 'Ritchey-Chrétien: zwei hyperbolische Spiegel'],
        ['Besuche', 'fünfmal repariert und erneuert, 1993 bis 2009']
      ],
      text: 'Über der Luft flimmert nichts: Hubble sieht so scharf, wie sein ' +
        'Spiegel es erlaubt. Doch die ersten Bilder 1990 waren verschwommen. ' +
        'Der Spiegel war am Rand um 2,2 Tausendstel Millimeter zu flach ' +
        'geschliffen – ein Prüfgerät war falsch zusammengebaut.',
      okular: 'Hubble hat kein Okular – das ist das Bild seiner Kamera, ein ' +
        'Ausschnitt von 2,7′. Ohne Luft darüber ist es so scharf, wie der ' +
        'Spiegel erlaubt; die vier Zacken machen die Streben des Fangspiegels. ' +
        'Schalte im Steckbrief den Spiegel von 1990 ein: Dann liegt nur noch ' +
        'ein kleiner Teil des Lichts im scharfen Kern.',
      fakt: 'Im Dezember 1993 setzten Astronauten Korrekturoptiken ein – eine ' +
        'Brille für Hubble. Seitdem sind die Bilder gestochen scharf.'
    },

    webb: {
      name: 'James-Webb-Weltraumteleskop',
      kurz: 'Webb',
      jahr: '2021',
      oeffnungMm: 6500,
      zeile: 'Spiegelteleskop im All · 6,5 m · Infrarot',
      daten: [
        ['Gestartet', '25. Dezember 2021'],
        ['Ort', 'bei L2, 1,5 Millionen km von der Erde'],
        ['Hauptspiegel', '6,5 m aus 18 Sechsecken, je 1,32 m'],
        ['Spiegel aus', 'Beryllium, mit Gold beschichtet'],
        ['Brennweite', '131,4 m (f/20)'],
        ['Sonnenschild', '21,2 × 14,2 m, fünf Lagen'],
        ['Kälte', 'unter 50 K (−223 °C)'],
        ['Licht', 'Infrarot, 0,6 bis 28,5 µm']
      ],
      text: 'Webb sieht Wärmestrahlung (Infrarot). Das Licht der ersten ' +
        'Galaxien ist auf dem langen Weg zu uns ins Infrarote gerutscht. ' +
        'Damit das Teleskop nicht selbst strahlt, muss es eiskalt sein: Ein ' +
        'Sonnenschild so groß wie ein Tennisplatz hält Sonne, Erde und Mond ab.',
      fakt: 'Durchschauen geht bei Webb nicht: Es hat kein Okular, und sein ' +
        'Licht kann das Auge gar nicht sehen. Die bunten Webb-Bilder sind ' +
        'übersetzt – jede Infrarot-Farbe bekommt eine sichtbare.'
    }
  };
})(globalThis.OPTIK = globalThis.OPTIK || {});
