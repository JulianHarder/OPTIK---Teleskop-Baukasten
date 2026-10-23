/*
  Leiste „Berühmte Teleskope“: oben in der linken Spalte eine Reihe
  Knöpfe – das eigene Teleskop und die berühmten. Ist ein berühmtes
  gewählt, steht darunter sein Steckbrief (js/daten/teleskope.js), und
  Bauen, Datenblatt, Beobachten, Licht und Durchschauen treten zurück
  (body.zeigt-beruehmt, css/beruehmt.css).

  beiWahl(id | null) – main.js baut dann das Teleskop neu.
*/
(function (O) {
  'use strict';

  var T;

  function el(tag, klasse, text) {
    var e = document.createElement(tag);
    if (klasse) e.className = klasse;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function BeruehmtLeiste(leiste, beiWahl) {
    T = O.TEXTE.beruehmt;
    this.leiste = leiste;
    this.beiWahl = beiWahl;
    this.baue();
    this.zeige();
  }

  BeruehmtLeiste.prototype.knopf = function (id, name, zusatz) {
    var k = el('button', 'beruehmt-knopf');
    k.type = 'button';
    k.dataset.id = id || '';
    k.appendChild(el('span', 'beruehmt-name', name));
    k.appendChild(el('span', 'beruehmt-jahr', zusatz));
    var self = this;
    k.addEventListener('click', function () {
      if ((O.zustand.beruehmt || null) !== (id || null)) self.beiWahl(id || null);
    });
    return k;
  };

  BeruehmtLeiste.prototype.baue = function () {
    var l = this.leiste;
    l.appendChild(el('h2', 'leiste-titel', T.titel));
    var reihe = el('div', 'beruehmt-knoepfe');
    reihe.setAttribute('role', 'group');
    reihe.setAttribute('aria-label', T.titel);
    reihe.appendChild(this.knopf(null, T.mein, T.meinZusatz));
    var self = this;
    O.TELESKOPE.liste.forEach(function (id) {
      var d = O.TELESKOPE[id];
      reihe.appendChild(self.knopf(id, d.kurz, d.jahr));
    });
    l.appendChild(reihe);
    this.steckbrief = el('div', 'steckbrief');
    l.appendChild(this.steckbrief);
  };

  // Knöpfe markieren und Steckbrief füllen – nach jedem Wechsel und wenn
  // sich das eigene Teleskop ändert (wegen des Licht-Vergleichs)
  BeruehmtLeiste.prototype.zeige = function () {
    var id = O.zustand.beruehmt || '';
    this.leiste.querySelectorAll('.beruehmt-knopf').forEach(function (k) {
      k.setAttribute('aria-pressed', k.dataset.id === id ? 'true' : 'false');
    });
    document.body.classList.toggle('zeigt-beruehmt', !!id);

    var s = this.steckbrief;
    s.textContent = '';
    s.hidden = !id;
    if (!id) return;
    var d = O.TELESKOPE[id];

    s.appendChild(el('h3', 'steckbrief-name', d.name));
    s.appendChild(el('p', 'steckbrief-zeile', d.zeile));
    var dl = el('dl', 'steckbrief-daten');
    d.daten.forEach(function (z) {
      dl.appendChild(el('dt', null, z[0]));
      dl.appendChild(el('dd', null, z[1]));
    });
    s.appendChild(dl);
    s.appendChild(el('p', 'steckbrief-text', d.text));
    s.appendChild(el('p', 'steckbrief-vergleich', vergleich(d)));

    var fakt = el('div', 'karte-fakt');
    fakt.appendChild(el('strong', null, O.TEXTE.karte.fakt));
    fakt.appendChild(el('p', null, d.fakt));
    s.appendChild(fakt);
  };

  // Lichtsammeln im Vergleich zum eigenen Teleskop – die Öffnung zählt
  function vergleich(d) {
    var eigen = O.zustand.oeffnungMm;
    var x = (eigen / d.oeffnungMm) * (eigen / d.oeffnungMm);
    var text = x >= 1 ? T.mehrLicht : T.wenigerLicht;
    var faktor = x >= 1 ? x : 1 / x;
    return text
      .replace('{x}', O.Format.zahl(faktor, faktor < 10 ? 1 : 0))
      .replace('{D}', eigen);
  }

  O.BeruehmtLeiste = BeruehmtLeiste;
})(globalThis.OPTIK = globalThis.OPTIK || {});
