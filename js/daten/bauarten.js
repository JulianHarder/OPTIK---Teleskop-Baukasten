/*
  Was man im Konfigurator einstellen kann: Grenzen der Regler, die
  Okulare zur Auswahl und fertige Vorlagen.

  Dobson: kürzer als f/4 braucht teure Okulare und genaues Justieren,
  länger als f/10 wird der Tubus unhandlich lang.
*/
(function (O) {
  'use strict';

  O.BAUARTEN = {
    dobson: {
      oeffnung: { min: 100, max: 400, schritt: 2 },
      oeffnungsverhaeltnis: { min: 4, max: 10 },
      brennweiteMax: 3000,

      // Brennweiten handelsüblicher Okulare in mm, von wenig zu viel Vergrößerung
      okulare: [40, 32, 25, 20, 15, 12, 10, 8, 6, 5, 4],

      vorlagen: [
        { name: 'Klein', oeffnungMm: 130, brennweiteMm: 650, text: 'handlich, passt in jedes Auto' },
        { name: 'Klassiker', oeffnungMm: 200, brennweiteMm: 1200, text: 'der beliebteste Dobson' },
        { name: 'Groß', oeffnungMm: 300, brennweiteMm: 1500, text: 'zeigt viele Galaxien' },
        { name: 'Riese', oeffnungMm: 400, brennweiteMm: 1800, text: 'nur noch mit Leiter' }
      ]
    },

    // Linsenfernrohr: kleinere Öffnungen (große Linsen sind teuer und
    // schwer), dafür längere Brennweiten – lange Achromate zeigen weniger
    // Farbsaum
    refraktor: {
      oeffnung: { min: 60, max: 150, schritt: 2 },
      oeffnungsverhaeltnis: { min: 5, max: 15 },
      brennweiteMax: 2000,
      okulare: [40, 32, 25, 20, 15, 12, 10, 8, 6, 5, 4],
      vorlagen: [
        { name: 'Einsteiger', oeffnungMm: 70, brennweiteMm: 700, objektiv: 'achromat', text: 'das klassische erste Fernrohr' },
        { name: 'Reise', oeffnungMm: 80, brennweiteMm: 480, objektiv: 'achromat', text: 'kurz und handlich – mit Farbsaum' },
        { name: 'Groß', oeffnungMm: 120, brennweiteMm: 1000, objektiv: 'achromat', text: 'schwer, aber eindrucksvoll' },
        { name: 'Eine Linse', oeffnungMm: 70, brennweiteMm: 700, objektiv: 'einzel', text: 'wie vor 400 Jahren: nur eine Linse' }
      ]
    }
  };
})(globalThis.OPTIK = globalThis.OPTIK || {});
