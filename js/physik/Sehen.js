/*
  Was das Auge am Okular sieht – die Zahlen hinter dem Okular-Blick.

    Unschärfe   Ein Stern wird nie ein Punkt: Beugung an der Öffnung
                (Airy-Scheibchen, Halbwertsbreite 1,03·λ/D) und die
                Luftunruhe (Seeing) verschmieren ihn. Beides zusammen wird
                hier als Gaußglocke genähert: σ² = σ_Beugung² + σ_Luft².
    Flächen     Planeten und Mond werden mit mehr Vergrößerung dunkler.
                Die Flächenhelligkeit geht mit dem Quadrat der
                Austrittspupille (bis zur Augenpupille, darüber geht Licht
                verloren).
    Sterne      Punkte werden mit mehr Öffnung heller (D²). Sichtbar ist,
                was heller ist als die Grenzgröße (Faustformel).

  Das sind Näherungen – gut genug, um Teleskope zu vergleichen, nicht für
  Messungen. So steht es auch auf der Seite.
*/
(function (O) {
  'use strict';

  var GRUEN_MM = 550e-6;
  var BS_PRO_RAD = 206264.8;
  var FWHM_ZU_SIGMA = 1 / (2 * Math.sqrt(2 * Math.log(2)));   // 1 / 2,355
  var AUGE_MM = 7;

  // Halbwertsbreite des Beugungsscheibchens in ″ (≈ 116″ / D)
  function beugungFwhmBs(D) {
    return 1.029 * GRUEN_MM / D * BS_PRO_RAD;
  }

  // Gesamte Unschärfe als σ der Gaußglocke in ″
  function sigmaBs(D, luftBs) {
    var b = beugungFwhmBs(D) * FWHM_ZU_SIGMA;
    var l = luftBs * FWHM_ZU_SIGMA;
    return Math.sqrt(b * b + l * l);
  }

  // Flächenhelligkeit im Okular, relativ zum bloßen Auge (= 1 bei AP 7 mm)
  function flaechenhelligkeit(ap) {
    var wirksam = Math.min(ap, AUGE_MM);
    return (wirksam / AUGE_MM) * (wirksam / AUGE_MM);
  }

  // Schwächste noch sichtbare Sterne (Faustformel, dunkler Himmel)
  function grenzgroesse(D) {
    return 2.7 + 5 * Math.log10(D);
  }

  O.Sehen = {
    beugungFwhmBs: beugungFwhmBs,
    sigmaBs: sigmaBs,
    flaechenhelligkeit: flaechenhelligkeit,
    grenzgroesse: grenzgroesse
  };
})(globalThis.OPTIK = globalThis.OPTIK || {});
