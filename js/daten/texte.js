/*
  Texte der Oberfläche. Inhalte stehen hier, nicht im Code.
*/
(function (O) {
  'use strict';

  O.TEXTE = {
    bauarten: {
      dobson: 'Dobson'
    },

    // Untertitel unter dem Namen, {D} {f} {N} werden ersetzt
    teleskopZeile: '{bauart} {D}/{f} · Öffnungsverhältnis f/{N}',

    fehlerWebgl:
      'Dein Browser kann hier kein 3D zeichnen (WebGL fehlt oder ist ' +
      'abgeschaltet). OPTIK braucht WebGL – versuch es mit einem aktuellen ' +
      'Firefox, Chrome oder Edge.',

    fuss: [
      ['Ziehen', 'drehen'],
      ['Mausrad', 'zoomen'],
      ['Rechts ziehen', 'verschieben'],
      ['Klick', 'Teil erklären'],
      ['L', 'Sternlicht'],
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
      mitte: 'Der Stern steht im Bild. Sein ganzes Licht, das der Spiegel ' +
        'einfängt, kommt im Okular an.',
      rand: 'Der Stern steht am Bildrand: nur {anteil} % seines Lichts kommen ' +
        'an, der Rest verfehlt den Fangspiegel. Der Rand wirkt dunkler.',
      daneben: 'Der Stern ist nicht im Bild – sein Licht landet neben der ' +
        'Öffnung des Okulars. Genau dafür hat das Teleskop den Sucher.'
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
