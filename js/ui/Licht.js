/*
  Sternlicht an und aus, und wie weit der Stern neben der Blickrichtung
  steht. Baut das Lichtbild (Strahlenbild + Lichtpulse) im Tubus auf und
  zeigt unten rechts, ob der Stern im Okular zu sehen ist.

  Im Modus „ganz“ verschwindet das Licht im undurchsichtigen Rohr –
  beim Einschalten wechselt die Ansicht deshalb auf „aufgeschnitten“
  (vor der dunklen Innenwand leuchtet das Licht am deutlichsten). Beim Zerlegen
  passt der Lichtweg nicht mehr zu den Teilen; dann ist das Licht aus.
*/
(function (O) {
  'use strict';

  var T = null;   // O.TEXTE.licht, beim Bauen gesetzt

  function el(tag, klasse, text) {
    var e = document.createElement(tag);
    if (klasse) e.className = klasse;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function Licht(buehne, teleskop, ansicht, leiste, nav) {
    T = O.TEXTE.licht;
    this.buehne = buehne;
    this.t = teleskop;
    this.ansicht = ansicht;
    this.leiste = leiste;
    this.gruppe = null;
    this.pulse = null;
    this.baueKnopf(nav);
    this.baueLeiste();

    var self = this;
    O.Ereignisse.an('ansicht-geaendert', function () { self.sichtbarkeit(); });
  }

  // ---------- Oberfläche ----------

  Licht.prototype.baueKnopf = function (nav) {
    nav.appendChild(el('span', 'ansicht-trenner'));
    var k = el('button', 'ansicht-knopf licht-knopf');
    k.type = 'button';
    k.setAttribute('aria-pressed', 'false');
    k.appendChild(el('kbd', null, 'L'));
    k.appendChild(document.createTextNode(' ' + T.knopf));
    var self = this;
    k.addEventListener('click', function () { self.umschalten(); });
    nav.appendChild(k);
    this.knopf = k;
  };

  Licht.prototype.baueLeiste = function () {
    var l = this.leiste;
    l.appendChild(el('h2', 'licht-titel', T.titel));

    var regler = el('label', 'licht-regler');
    var kopf = el('span', 'licht-regler-kopf');
    kopf.appendChild(el('span', null, T.versatz));
    this.wert = el('span', 'licht-wert');
    kopf.appendChild(this.wert);
    regler.appendChild(kopf);
    var schieber = el('input');
    schieber.type = 'range';
    schieber.min = 0;
    schieber.max = 1.5;
    schieber.step = 0.02;
    schieber.value = O.zustand.sternVersatzGrad;
    var self = this;
    schieber.addEventListener('input', function () {
      O.zustand.sternVersatzGrad = parseFloat(schieber.value);
      self.baue();
    });
    regler.appendChild(schieber);
    l.appendChild(regler);

    this.feld = el('p', 'licht-feld');
    l.appendChild(this.feld);
    this.status = el('p', 'licht-status');
    l.appendChild(this.status);
  };

  Licht.prototype.zeigeStatus = function (licht) {
    var z = O.zustand;
    var feld = O.Optik.wahresFeldGrad(this.t.masse, z.okularMm);
    this.wert.textContent = O.Format.zahl(z.sternVersatzGrad, 2) + '°';
    this.feld.textContent = T.feld
      .replace('{feld}', O.Format.zahl(feld, 2))
      .replace('{mond}', O.Format.zahl(feld / 0.52, 1));

    var art = licht.imBild >= 0.999 ? 'mitte' : licht.imBild > 0 ? 'rand' : 'daneben';
    this.status.textContent = T[art].replace('{anteil}', Math.round(licht.imBild * 100));
    this.status.className = 'licht-status ' + { mitte: 'gut', rand: 'warnung', daneben: 'schlecht' }[art];
  };

  // ---------- An und aus ----------

  Licht.prototype.umschalten = function () {
    this.setze(!O.zustand.lichtAn);
  };

  Licht.prototype.setze = function (an) {
    O.zustand.lichtAn = an;
    this.knopf.setAttribute('aria-pressed', an ? 'true' : 'false');
    document.body.classList.toggle('licht-an', an);
    this.leiste.hidden = !an;
    if (an) {
      this.baue();
      var modus = this.ansicht.modus;
      if (modus === 'ganz' || modus === 'zerlegt') this.ansicht.setze('aufgeschnitten');
    }
    this.sichtbarkeit();
  };

  // Lichtbild neu rechnen und aufbauen (beim Einschalten und wenn der
  // Stern verschoben wird)
  Licht.prototype.baue = function () {
    this.abbauen();
    var licht = O.Optik.lichtNewton(this.t.masse, O.zustand, O.zustand.sternVersatzGrad);
    this.gruppe = O.Strahlenbild.erzeuge(licht);
    this.pulse = new O.Lichtpulse(licht.faecher, 2);
    this.gruppe.add(this.pulse.punkte);
    this.ringPulse = new O.Lichtpulse(licht.ring, 1);
    this.gruppe.add(this.ringPulse.punkte);
    this.t.tubus.add(this.gruppe);
    this.pulse.setze(performance.now());        // nicht alle im Ursprung starten
    this.ringPulse.setze(performance.now());
    this.zeigeStatus(licht);
    this.sichtbarkeit();
  };

  Licht.prototype.abbauen = function () {
    if (!this.gruppe) return;
    if (this.gruppe.parent) this.gruppe.parent.remove(this.gruppe);
    this.pulse.entsorge();
    this.ringPulse.entsorge();
    O.Strahlenbild.entsorge(this.gruppe);
    this.gruppe = null;
  };

  // Teleskop wurde umgebaut (oder nur das Okular gewechselt): Licht neu
  Licht.prototype.neuesTeleskop = function (teleskop, ansicht) {
    if (this.gruppe && this.gruppe.parent) this.gruppe.parent.remove(this.gruppe);
    this.abbauen();
    this.t = teleskop;
    this.ansicht = ansicht;
    if (O.zustand.lichtAn) this.baue();
    else this.sichtbarkeit();
  };

  // Sichtbar, wenn an und nicht zerlegt; nur dann laufen die Pulse
  Licht.prototype.sichtbarkeit = function () {
    var zeigen = O.zustand.lichtAn && this.gruppe && this.ansicht.modus !== 'zerlegt';
    if (this.gruppe) this.gruppe.visible = !!zeigen;
    var self = this;
    this.buehne.dauerlauf('lichtpulse', zeigen ? function (zeit) {
      self.pulse.setze(zeit);
      self.ringPulse.setze(zeit);
    } : null);
  };

  O.Licht = Licht;
})(globalThis.OPTIK = globalThis.OPTIK || {});
