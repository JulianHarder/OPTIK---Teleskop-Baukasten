/*
  Texte der Oberfläche. Inhalte stehen hier, nicht im Code.
*/
(function (O) {
  'use strict';

  O.TEXTE = {
    bauarten: {
      dobson: 'Dobson',
      refraktor: 'Linsenfernrohr'
    },
    objektive: {
      achromat: 'Achromat',
      einzel: 'eine Linse'
    },

    // Untertitel unter dem Namen, {D} {f} {N} werden ersetzt
    teleskopZeile: '{bauart} {D}/{f} · Öffnungsverhältnis f/{N}',

    fehlerWebgl:
      'Dein Browser kann hier kein 3D zeichnen (WebGL fehlt oder ist ' +
      'abgeschaltet). OPTIK braucht WebGL – versuch es mit einem aktuellen ' +
      'Firefox, Chrome oder Edge.',

    fuss: [
      ['Ziehen', 'drehen'],
      ['Mausrad', 'zur Maus hin zoomen'],
      ['Rechts ziehen', 'verschieben'],
      ['Klick', 'Teil erklären'],
      ['L', 'Sternlicht'],
      ['O', 'durchs Okular schauen'],
      ['F', 'ganzes Teleskop'],
      ['P', 'Bildrate']
    ],

    // Ansicht-Schalter unten; Taste = Ziffer davor
    ansichten: [
      { id: 'ganz', name: 'Ganz' },
      { id: 'aufgeschnitten', name: 'Aufgeschnitten' },
      { id: 'zerlegt', name: 'Zerlegt' },
      { id: 'roentgen', name: 'Röntgen' }
    ],

    licht: {
      knopf: 'Licht',
      titel: 'Sternlicht',
      versatz: 'Stern neben der Mitte',
      feld: 'Dieses Okular zeigt {feld}° Himmel – so breit wie {mond} Vollmonde.',
      mitte: 'Der Stern steht im Bild. Alles Licht, das das Teleskop ' +
        'einfängt, kommt im Okular an.',
      rand: 'Der Stern steht am Bildrand: nur {anteil} % seines Lichts kommen ' +
        'an, der Rest geht unterwegs verloren. Der Rand wirkt dunkler.',
      daneben: 'Der Stern ist nicht im Bild – sein Licht landet neben der ' +
        'Öffnung des Okulars. Genau dafür hat das Teleskop den Sucher.'
    },

    bauen: {
      titel: 'Selbst bauen',
      bauart: 'Bauart',
      bauartSpiegel: 'Spiegel (Dobson)',
      bauartLinse: 'Linse (Refraktor)',
      objektiv: 'Objektiv',
      objektivAchromat: 'Achromat (2 Linsen)',
      objektivEinzel: 'Eine Linse',
      vorlagen: 'Vorlagen',
      oeffnung: 'Öffnung (Spiegel)',
      oeffnungLinse: 'Öffnung (Linse)',
      brennweite: 'Brennweite',
      okular: 'Okular',
      zoll: '{zoll} Zoll',
      fZahl: 'f/{N}',
      fach: '{V}-fach',
      knopfHandy: 'Menü',
      hinweis: 'Ziehen verändert das Teleskop sofort – der Spiegel, das Rohr ' +
        'und das Licht rechnen sich neu.'
    },

    datenblatt: {
      titel: 'Datenblatt',
      faustformel: 'Faustformel',
      zeilen: [
        { id: 'vergroesserung', name: 'Vergrößerung',
          erklaerung: 'Brennweite des Teleskops geteilt durch die des Okulars. ' +
            'Mehr als das Doppelte der Öffnung in mm bringt nichts: Das Bild ' +
            'wird nur größer, nicht schärfer.' },
        { id: 'austrittspupille', name: 'Austrittspupille',
          erklaerung: 'So breit ist das Lichtbündel, das aus dem Okular ins ' +
            'Auge fällt. Zwischen 1 und 7 mm ist gut – weiter als etwa 7 mm ' +
            'öffnet sich deine Pupille auch nachts nicht.' },
        { id: 'oeffnungsverhaeltnis', name: 'Öffnungsverhältnis',
          erklaerung: 'Brennweite geteilt durch Öffnung. Kurze Teleskope ' +
            '(kleine Zahl) zeigen mehr Himmel auf einmal, lange sind ' +
            'gutmütiger bei hoher Vergrößerung.' },
        { id: 'aufloesung', name: 'Auflösung',
          erklaerung: 'Zwei Sterne, die enger beisammenstehen, verschmelzen zu ' +
            'einem. Je größer der Spiegel, desto feiner (″ = Bogensekunde, ' +
            'ein 3600stel Grad).' },
        { id: 'lichtsammeln', name: 'Lichtsammeln',
          erklaerung: 'So viel mehr Licht fängt der Spiegel ein als dein Auge. ' +
            'Deshalb sieht man Sterne, die mit bloßem Auge unsichtbar sind.' },
        { id: 'grenzgroesse', name: 'Schwächste Sterne',
          erklaerung: 'Helligkeit der schwächsten Sterne, die man unter dunklem ' +
            'Himmel noch sieht – in Größenklassen: höher heißt schwächer, mit ' +
            'bloßem Auge schafft man etwa 6.' },
        { id: 'gesichtsfeld', name: 'Himmelsausschnitt',
          erklaerung: 'So viel Himmel zeigt das Okular auf einmal. Der Vollmond ' +
            'ist ungefähr 0,5° groß.' },
        { id: 'abschattung', name: 'Fangspiegel-Schatten',
          erklaerung: 'Der Fangspiegel verdeckt die Mitte des Hauptspiegels – ' +
            'hier als Anteil am Durchmesser. Kurze Teleskope brauchen größere ' +
            'Fangspiegel.' },
        { id: 'maxVergroesserung', name: 'Höchste sinnvolle Vergrößerung',
          erklaerung: 'Zweimal die Öffnung in mm. Darüber zeigt das Bild keine ' +
            'neuen Einzelheiten mehr.' },
        { id: 'tubuslaenge', name: 'Tubuslänge',
          erklaerung: 'Etwa so lang wie die Brennweite – das Licht läuft einmal ' +
            'hinunter zum Spiegel und fast ganz wieder hinauf.' },
        { id: 'farbfehler', name: 'Farbsaum',
          erklaerung: 'Linsen brechen Blau stärker als Rot – die Farben haben ' +
            'verschiedene Brennpunkte. Ein Stern bekommt dann einen bunten Rand ' +
            'dieser Größe. Spiegel haben das nicht.' },
        { id: 'okularhoehe', name: 'Okular über dem Boden',
          erklaerung: 'Bei der jetzigen Neigung. Liegt es höher als deine ' +
            'Augen, brauchst du einen Hocker oder eine Leiter.' }
      ],
      gruende: {
        leer: 'Leere Vergrößerung – größer, aber nicht schärfer.',
        zuDunkel: 'Viel zu dunkel und verwaschen.',
        dunkel: 'Sehr dunkel – nur für helle Planeten und Doppelsterne.',
        zuBreit: 'Breiter als deine Pupille – ein Teil des Lichts geht verloren.',
        kurz: 'Sehr kurz – braucht gute Okulare und genaues Justieren.',
        luft: 'Feiner, als die Luft meist erlaubt (Luftunruhe meist um 1,5″).',
        grossesLoch: 'Großer Fangspiegel – Planeten zeigen etwas weniger Kontrast.',
        leiter: 'Höher als deine Augen – du brauchst eine Leiter.',
        farbeLeicht: 'Leichter Farbsaum an hellen Objekten wie Mond und Jupiter.',
        farbeStark: 'Starke Farbsäume – jedes helle Objekt hat einen bunten Rand.'
      }
    },

    beobachten: {
      titel: 'Beobachten',
      luft: 'Luft',
      zielen: 'Anklicken: Das Teleskop schwenkt hin.',
      zieltAuf: 'zielt auf {name}',
      ort: 'Die Richtungen am Himmel sind ausgedacht – sie zeigen nur, wie das ' +
        'Teleskop zielt, nicht wo das Objekt heute Nacht steht.',
      durchschauen: 'Durchschauen',
      zurueck: 'Zurück',
      okular: 'Okular',
      lupe: 'Lupe: so fein sieht dein Auge',
      lupeKamera: 'Lupe: so fein sieht Hubble',
      lupeLang: 'Ein Bildschirm hat zu wenig Bildpunkte für das, was das Auge im ' +
        'Okular erkennt. Die Lupe zeigt die Mitte so fein, wie dein Auge sie sieht.',
      zahlen: '{V}-fach · zeigt {feld}° · Austrittspupille {ap} mm',
      kameraZahlen: 'Kamerabild · Ausschnitt {feld}′ · keine Luft',
      achte: 'Achte auf',
      ehrlich: 'Simulation: Sie vergleicht Teleskope richtig. So hell und so fein ' +
        'wie ein echtes Okular ist aber kein Bildschirm.'
    },

    beruehmt: {
      titel: 'Berühmte Teleskope',
      mein: 'Meins',
      meinZusatz: 'selbst gebaut',
      teleskopZeile: '{name} · {jahr}',
      mehrLicht: 'Dein Teleskop ({D} mm) sammelt {x}-mal so viel Licht wie dieses.',
      wenigerLicht: 'Es sammelt {x}-mal so viel Licht wie dein Teleskop ({D} mm).',
      fehler1990: 'Spiegel wie 1990 (mit Fehler)',
      fehler1990Text: 'Zeigt Licht und Kamerabild mit dem falsch geschliffenen ' +
        'Spiegel. Heute gleichen Korrekturoptiken den Fehler aus.'
    },

    karte: {
      woraus: 'Woraus:',
      fakt: 'Schon gewusst?'
    },

    // Beschriftung auf dem Tubus
    tubusSchrift: 'OPTIK',
    tubusZusatz: 'N {D}/{f}'
  };
})(globalThis.OPTIK = globalThis.OPTIK || {});
