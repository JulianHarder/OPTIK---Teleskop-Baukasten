/*
  Hilfe: eine kurze Führung in wenigen Schritten, gleich beim Start.

  Jeder Schritt ist eine Karte in der Mitte; ein Lichtkegel (ein Rahmen
  mit riesigem Schatten drumherum) hebt das Bedienteil hervor, um das es
  geht, der Rest wird dunkler. „Überspringen“ oder Esc schließt sofort.
  Wieder öffnen mit dem Knopf „?“ im Kopf oder Taste H.

  Solange die Hilfe offen ist, bekommt die Szene keine Klicks und keine
  Tasten (Fänger über allem, Tasten werden vor main.js abgefangen).
*/
(function (O) {
  'use strict';

  function el(tag, klasse, text) {
    var e = document.createElement(tag);
    if (klasse) e.className = klasse;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function knopf(klasse, text, beiKlick) {
    var k = el('button', klasse, text);
    k.type = 'button';
    k.addEventListener('click', beiKlick);
    return k;
  }

  function Hilfe() {
    var self = this;
    var T = O.TEXTE.hilfe;
    this.offen = false;
    this.nr = 0;

    this.faenger = el('div', 'hilfe-faenger');
    this.faenger.hidden = true;
    this.kegel = el('div', 'hilfe-kegel');
    this.faenger.appendChild(this.kegel);

    this.karte = el('section', 'hilfe-karte');
    this.karte.setAttribute('role', 'dialog');
    this.karte.setAttribute('aria-modal', 'true');
    this.karte.setAttribute('aria-labelledby', 'hilfe-titel');
    this.zaehler = el('p', 'hilfe-zaehler');
    this.titel = el('h2', 'hilfe-titel');
    this.titel.id = 'hilfe-titel';
    this.text = el('p', 'hilfe-text');
    this.punkte = el('div', 'hilfe-punkte');
    T.schritte.forEach(function () { self.punkte.appendChild(el('span', 'hilfe-punkt')); });
    var knoepfe = el('div', 'hilfe-knoepfe');
    this.ueberspringen = knopf('hilfe-ueberspringen', T.ueberspringen, function () { self.schliesse(); });
    this.zurueck = knopf('hilfe-zurueck', T.zurueck, function () { self.gehe(self.nr - 1); });
    this.weiter = knopf('hilfe-weiter', T.weiter, function () { self.gehe(self.nr + 1); });
    knoepfe.appendChild(this.ueberspringen);
    knoepfe.appendChild(this.zurueck);
    knoepfe.appendChild(this.weiter);
    [this.zaehler, this.titel, this.text, this.punkte, knoepfe].forEach(function (e) { self.karte.appendChild(e); });
    this.faenger.appendChild(this.karte);
    document.body.appendChild(this.faenger);

    // Knopf „?“ im Kopf
    var oeffner = knopf('hilfe-knopf', T.knopf, function () { self.zeige(); });
    oeffner.title = T.knopfTitel;
    oeffner.setAttribute('aria-label', T.knopfTitel);
    document.querySelector('.kopf').appendChild(oeffner);

    // Tasten fangen, bevor main.js sie sieht (Erfassen auf window)
    window.addEventListener('keydown', function (e) {
      if (!self.offen) return;
      if (e.key === 'Escape') self.schliesse();
      else if (e.key === 'ArrowRight' || e.key === 'Enter') self.gehe(self.nr + 1);
      else if (e.key === 'ArrowLeft') self.gehe(self.nr - 1);
      else if (e.key === 'Tab') return;                  // im Dialog weiterspringen
      e.preventDefault();
      e.stopImmediatePropagation();
    }, true);
    window.addEventListener('resize', function () { if (self.offen) self.richteKegel(); });
  }

  Hilfe.prototype.zeige = function () {
    this.offen = true;
    this.faenger.hidden = false;
    this.gehe(0);
  };

  Hilfe.prototype.schliesse = function () {
    this.offen = false;
    this.faenger.hidden = true;
  };

  Hilfe.prototype.gehe = function (nr) {
    var T = O.TEXTE.hilfe;
    var anzahl = T.schritte.length;
    if (nr >= anzahl) { this.schliesse(); return; }
    this.nr = Math.max(0, nr);
    var s = T.schritte[this.nr];
    this.zaehler.textContent = T.schritt.replace('{n}', this.nr + 1).replace('{gesamt}', anzahl);
    this.titel.textContent = s.titel;
    this.text.textContent = s.text;
    this.zurueck.hidden = this.nr === 0;
    this.weiter.textContent = this.nr === anzahl - 1 ? T.los : T.weiter;
    Array.prototype.forEach.call(this.punkte.children, function (p, i) {
      p.classList.toggle('an', i === this.nr);
    }, this);
    this.richteKegel();
    this.weiter.focus();
  };

  // Lichtkegel auf das erste sichtbare Ziel; ohne Ziel wird alles abgedunkelt
  Hilfe.prototype.richteKegel = function () {
    var ziele = O.TEXTE.hilfe.schritte[this.nr].ziel || [];
    var r = null;
    for (var i = 0; i < ziele.length && !r; i++) {
      var e = document.querySelector(ziele[i]);
      var b = e && e.getBoundingClientRect();
      if (b && b.width > 0 && b.height > 0 && !e.hidden) r = b;
    }
    var k = this.kegel.style;
    var rand = 6;
    if (r) {
      k.left = (r.left - rand) + 'px';
      k.top = (r.top - rand) + 'px';
      k.width = (r.width + 2 * rand) + 'px';
      k.height = (r.height + 2 * rand) + 'px';
    } else {
      k.left = '50%'; k.top = '50%'; k.width = '0px'; k.height = '0px';
    }
    this.kegel.classList.toggle('ohne-ziel', !r);
    // Auf schmalen Bildschirmen steht die Karte dort, wo das Ziel nicht ist
    var unten = !r || r.top + r.height / 2 < window.innerHeight / 2;
    this.karte.classList.toggle('oben', !unten);
  };

  O.Hilfe = Hilfe;
})(globalThis.OPTIK = globalThis.OPTIK || {});
