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
      ['F', 'ganzes Teleskop'],
      ['P', 'Bildrate']
    ],

    // Beschriftung auf dem Tubus
    tubusSchrift: 'OPTIK',
    tubusZusatz: 'N {D}/{f}'
  };
})(globalThis.OPTIK = globalThis.OPTIK || {});
