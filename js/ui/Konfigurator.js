/*
  „Selbst bauen“: Bauart (Spiegel oder Linse), beim Linsenfernrohr das
  Objektiv, Regler für Öffnung, Brennweite und Okular, dazu Vorlagen.
  Jede Änderung geht über beiAenderung(art):
    art = 'form'   → Spiegel oder Brennweite: Teleskop wird neu gebaut
    art = 'okular' → nur das Okular: Licht und Datenblatt neu
  Beim Loslassen eines Reglers kommt zusätzlich beiLoslassen() – dann
  darf die Kamera nachziehen (während des Ziehens nicht, sonst wackelt
  das Bild unter der Maus).
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

  // Daten der gerade gewählten Bauart
  function bauart() {
    return O.BAUARTEN[O.zustand.bauart];
  }

  // Erlaubter Brennweitenbereich für eine Öffnung
  function brennweiteGrenzen(D) {
    var B = bauart();
    var N = B.oeffnungsverhaeltnis;
    return { min: Math.round(D * N.min), max: Math.min(B.brennweiteMax, Math.round(D * N.max)) };
  }

  function Konfigurator(leiste, beiAenderung, beiLoslassen) {
    T = O.TEXTE.bauen;
    this.leiste = leiste;
    this.beiAenderung = beiAenderung;
    this.beiLoslassen = beiLoslassen;
    this.baue();
    this.auffrischen();
  }

  Konfigurator.prototype.regler = function (name, min, max, schritt, setze) {
    var wurzel = el('label', 'bau-regler');
    var kopf = el('span', 'bau-regler-kopf');
    var nameEl = el('span', 'bau-regler-name', name);
    kopf.appendChild(nameEl);
    var wert = el('span', 'bau-regler-wert');
    kopf.appendChild(wert);
    wurzel.appendChild(kopf);

    var schieber = el('input');
    schieber.type = 'range';
    schieber.min = min;
    schieber.max = max;
    schieber.step = schritt;
    schieber.setAttribute('aria-label', name);
    schieber.addEventListener('input', function () { setze(parseFloat(schieber.value)); });
    var self = this;
    schieber.addEventListener('change', function () { self.beiLoslassen(); });
    wurzel.appendChild(schieber);

    var zusatz = el('span', 'bau-regler-zusatz');
    wurzel.appendChild(zusatz);
    this.leiste.appendChild(wurzel);
    return { schieber: schieber, wert: wert, zusatz: zusatz, name: nameEl };
  };

  // Zwei oder mehr Knöpfe, von denen einer gewählt ist
  Konfigurator.prototype.umschalter = function (titel, eintraege, beiWahl) {
    var wurzel = el('div', 'umschalter');
    wurzel.appendChild(el('span', 'umschalter-titel', titel));
    var reihe = el('div', 'umschalter-knoepfe');
    eintraege.forEach(function (e) {
      var k = el('button', 'umschalter-knopf', e.text);
      k.type = 'button';
      k.dataset.wert = e.id;
      k.addEventListener('click', function () { beiWahl(e.id); });
      reihe.appendChild(k);
    });
    wurzel.appendChild(reihe);
    this.leiste.appendChild(wurzel);
    return wurzel;
  };

  // Eine Vorlage übernehmen (Öffnung, Brennweite, beim Refraktor das Objektiv)
  Konfigurator.prototype.nimmVorlage = function (v) {
    var z = O.zustand;
    z.oeffnungMm = v.oeffnungMm;
    z.brennweiteMm = v.brennweiteMm;
    if (v.objektiv) z.objektiv = v.objektiv;
    this.auffrischen();
    this.beiAenderung('form');
    this.beiLoslassen();
  };

  Konfigurator.prototype.baueVorlagen = function () {
    var self = this;
    var reihe = this.vorlagenReihe;
    reihe.textContent = '';
    bauart().vorlagen.forEach(function (v) {
      var k = el('button', 'vorlage');
      k.type = 'button';
      k.title = v.oeffnungMm + '/' + v.brennweiteMm + ' – ' + v.text;
      k.appendChild(el('span', 'vorlage-name', v.name));
      k.appendChild(el('span', 'vorlage-mass', v.oeffnungMm + '/' + v.brennweiteMm));
      k.addEventListener('click', function () { self.nimmVorlage(v); });
      reihe.appendChild(k);
    });
  };

  Konfigurator.prototype.baue = function () {
    var self = this;
    var z = O.zustand;
    this.leiste.appendChild(el('h2', 'leiste-titel', T.titel));

    this.bauartWahl = this.umschalter(T.bauart, [
      { id: 'dobson', text: T.bauartSpiegel },
      { id: 'refraktor', text: T.bauartLinse }
    ], function (id) {
      if (z.bauart === id) return;
      z.bauart = id;
      self.baueVorlagen();
      self.nimmVorlage(bauart().vorlagen[0]);
    });
    this.objektivWahl = this.umschalter(T.objektiv, [
      { id: 'achromat', text: T.objektivAchromat },
      { id: 'einzel', text: T.objektivEinzel }
    ], function (id) {
      z.objektiv = id;
      self.auffrischen();
      self.beiAenderung('form');
    });

    // Vorlagen (hängen von der Bauart ab)
    this.vorlagenReihe = el('div', 'vorlagen');
    this.vorlagenReihe.setAttribute('role', 'group');
    this.vorlagenReihe.setAttribute('aria-label', T.vorlagen);
    this.leiste.appendChild(this.vorlagenReihe);
    this.baueVorlagen();

    var B = bauart();
    this.oeffnung = this.regler(T.oeffnung, B.oeffnung.min, B.oeffnung.max, B.oeffnung.schritt, function (v) {
      z.oeffnungMm = v;
      var g = brennweiteGrenzen(v);
      z.brennweiteMm = Math.min(g.max, Math.max(g.min, z.brennweiteMm));
      self.auffrischen();
      self.beiAenderung('form');
    });

    this.brennweite = this.regler(T.brennweite, 400, 3000, 10, function (v) {
      z.brennweiteMm = v;
      self.auffrischen();
      self.beiAenderung('form');
    });

    // Okular: Regler über die Liste handelsüblicher Brennweiten
    this.okular = this.regler(T.okular, 0, B.okulare.length - 1, 1, function (i) {
      z.okularMm = bauart().okulare[Math.round(i)];
      self.auffrischen();
      self.beiAenderung('okular');
    });

    this.leiste.appendChild(el('p', 'bau-hinweis', T.hinweis));
  };

  // Regler und Anzeigen auf den Zustand setzen
  Konfigurator.prototype.auffrischen = function () {
    var z = O.zustand;
    var F = O.Format;
    var B = bauart();
    var g = brennweiteGrenzen(z.oeffnungMm);

    if (this.vorlagenBauart !== z.bauart) {
      this.vorlagenBauart = z.bauart;
      this.baueVorlagen();
      this.oeffnung.name.textContent = z.bauart === 'refraktor' ? T.oeffnungLinse : T.oeffnung;
    }
    markiere(this.bauartWahl, z.bauart);
    markiere(this.objektivWahl, z.objektiv);
    this.objektivWahl.hidden = z.bauart !== 'refraktor';
    this.oeffnung.schieber.min = B.oeffnung.min;
    this.oeffnung.schieber.max = B.oeffnung.max;
    this.oeffnung.schieber.value = z.oeffnungMm;
    this.oeffnung.wert.textContent = F.mm(z.oeffnungMm);
    this.oeffnung.zusatz.textContent = T.zoll.replace('{zoll}', F.zahl(z.oeffnungMm / 25.4, 1));

    this.brennweite.schieber.min = g.min;
    this.brennweite.schieber.max = g.max;
    this.brennweite.schieber.value = z.brennweiteMm;
    this.brennweite.wert.textContent = F.mm(z.brennweiteMm);
    this.brennweite.zusatz.textContent = T.fZahl.replace('{N}', F.zahl(z.brennweiteMm / z.oeffnungMm, 1));

    var i = B.okulare.indexOf(z.okularMm);
    this.okular.schieber.value = i < 0 ? 2 : i;
    this.okular.wert.textContent = F.mm(z.okularMm);
    this.okular.zusatz.textContent = T.fach.replace('{V}', F.zahl(z.brennweiteMm / z.okularMm, 0));

    var self = this;
    this.leiste.querySelectorAll('.vorlage').forEach(function (k, n) {
      var v = B.vorlagen[n];
      if (!v) return;
      var gleich = v.oeffnungMm === z.oeffnungMm && v.brennweiteMm === z.brennweiteMm &&
        (!v.objektiv || v.objektiv === z.objektiv);
      k.setAttribute('aria-pressed', gleich ? 'true' : 'false');
    });
    return self;
  };

  function markiere(wurzel, wert) {
    wurzel.querySelectorAll('.umschalter-knopf').forEach(function (k) {
      k.setAttribute('aria-pressed', k.dataset.wert === wert ? 'true' : 'false');
    });
  }

  O.Konfigurator = Konfigurator;
})(globalThis.OPTIK = globalThis.OPTIK || {});
