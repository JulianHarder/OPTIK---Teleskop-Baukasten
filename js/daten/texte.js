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

    karte: {
      woraus: 'Woraus:',
      fakt: 'Schon gewusst?'
    },

    // Beschriftung auf dem Tubus
    tubusSchrift: 'OPTIK',
    tubusZusatz: 'N {D}/{f}'
  };
})(globalThis.OPTIK = globalThis.OPTIK || {});
