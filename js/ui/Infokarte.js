/*
  Infokarte zu einem Bauteil: Name, wozu, woraus, ein Fakt und Zahlen zum
  aktuellen Teleskop. Dazu das kleine Namensschild, das beim Darüberfahren
  neben dem Mauszeiger erscheint.
*/
(function (O) {
  'use strict';

  function el(tag, klasse, text) {
    var e = document.createElement(tag);
    if (klasse) e.className = klasse;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  // karte = <aside>, hinweis = schwebendes Namensschild, beiSchliessen()
  function Infokarte(karte, hinweis, beiSchliessen) {
    this.karte = karte;
    this.hinweis = hinweis;
    this.beiSchliessen = beiSchliessen;
    this.teil = null;
  }

  Infokarte.prototype.zeige = function (teil, teleskop, zustand) {
    var masse = teleskop.masse;
    var info = O.TEILE[teil];
    if (!info) {
      this.schliesse();
      return;
    }
    this.teil = teil;
    var k = this.karte;
    k.textContent = '';

    var kopf = el('div', 'karte-kopf');
    kopf.appendChild(el('h2', 'karte-name', info.name));
    var zu = el('button', 'karte-zu', '×');
    zu.type = 'button';
    zu.setAttribute('aria-label', 'Karte schließen');
    var self = this;
    zu.addEventListener('click', function () { self.beiSchliessen(); });
    kopf.appendChild(zu);
    k.appendChild(kopf);

    k.appendChild(el('p', 'karte-wozu', info.wozu));

    if (info.werte) {
      var dl = el('dl', 'karte-werte');
      info.werte(masse, zustand, teleskop).forEach(function (w) {
        dl.appendChild(el('dt', null, w[0]));
        dl.appendChild(el('dd', null, w[1]));
      });
      k.appendChild(dl);
    }

    var woraus = el('p', 'karte-woraus');
    woraus.appendChild(el('strong', null, O.TEXTE.karte.woraus + ' '));
    woraus.appendChild(document.createTextNode(info.woraus));
    k.appendChild(woraus);

    var fakt = el('div', 'karte-fakt');
    fakt.appendChild(el('strong', null, O.TEXTE.karte.fakt));
    fakt.appendChild(el('p', null, info.fakt));
    k.appendChild(fakt);

    k.hidden = false;
  };

  Infokarte.prototype.schliesse = function () {
    this.teil = null;
    this.karte.hidden = true;
  };

  // Namensschild am Mauszeiger (x, y = Bildschirmkoordinaten)
  Infokarte.prototype.schwebe = function (teil, x, y) {
    var info = teil && O.TEILE[teil];
    if (!info || teil === this.teil) {
      this.hinweis.hidden = true;
      return;
    }
    this.hinweis.textContent = info.name;
    this.hinweis.style.transform = 'translate(' + (x + 14) + 'px,' + (y + 16) + 'px)';
    this.hinweis.hidden = false;
  };

  O.Infokarte = Infokarte;
})(globalThis.OPTIK = globalThis.OPTIK || {});
