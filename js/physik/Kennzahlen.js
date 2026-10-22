/*
  Kennzahlen eines Teleskops für das Datenblatt – reine Rechnung, ohne
  Oberfläche (läuft auch in node, siehe pruefungen/).

  Jede Kennzahl hat eine Ampel: 'gut', 'warnung', 'schlecht' oder null
  (keine Bewertung). Der Grund steht in grund (Schlüssel für die Texte in
  js/daten/texte.js → datenblatt.gruende).

  Faustformeln sind als solche markiert (faustformel: true) – die Seite
  sagt das dazu.
*/
(function (O) {
  'use strict';

  var AUGENPUPILLE_MM = 7;          // jung und dunkeladaptiert
  var LUFTUNRUHE_BS = 1.5;          // typisches Seeing in Mitteleuropa
  var BS_PRO_RAD = 206264.8;
  var GRUEN_MM = 550e-6;            // Wellenlänge, auf die das Auge am empfindlichsten ist

  function berechne(m, zustand) {
    var D = m.D;
    var f = m.f;
    var fOk = zustand.okularMm;
    var V = f / fOk;
    var ap = D / V;
    var N = f / D;
    var aufloesung = 1.22 * GRUEN_MM / D * BS_PRO_RAD;   // Rayleigh, ≈ 138″ / D
    var abschattung = m.fang / D;      // Mittenabschattung, wie üblich als Durchmesser-Anteil

    function ampelV() {
      if (V > 2 * D) return ['schlecht', 'leer'];
      return ['gut', null];
    }
    function ampelAP() {
      if (ap < 0.5) return ['schlecht', 'zuDunkel'];
      if (ap < 1) return ['warnung', 'dunkel'];
      if (ap > AUGENPUPILLE_MM) return ['warnung', 'zuBreit'];
      return ['gut', null];
    }

    return {
      vergroesserung: { wert: V, ampel: ampelV() },
      austrittspupille: { wert: ap, ampel: ampelAP() },
      oeffnungsverhaeltnis: {
        wert: N,
        ampel: N < 4.5 ? ['warnung', 'kurz'] : [null, null]
      },
      aufloesung: {
        wert: aufloesung,
        ampel: aufloesung < LUFTUNRUHE_BS ? ['warnung', 'luft'] : [null, null]
      },
      lichtsammeln: { wert: (D / AUGENPUPILLE_MM) * (D / AUGENPUPILLE_MM), ampel: [null, null] },
      grenzgroesse: { wert: 2.7 + 5 * Math.log10(D), ampel: [null, null], faustformel: true },
      gesichtsfeld: { wert: O.Optik.wahresFeldGrad(m, fOk), ampel: [null, null] },
      abschattung: {
        wert: abschattung,
        ampel: abschattung > 0.35 ? ['warnung', 'grossesLoch'] : [null, null]
      },
      maxVergroesserung: { wert: 2 * D, ampel: [null, null], faustformel: true }
    };
  }

  O.Kennzahlen = {
    AUGENPUPILLE_MM: AUGENPUPILLE_MM,
    LUFTUNRUHE_BS: LUFTUNRUHE_BS,
    berechne: berechne
  };
})(globalThis.OPTIK = globalThis.OPTIK || {});
