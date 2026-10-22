/*
  „Selbst bauen“: Regler für Öffnung, Brennweite und Okular, dazu
  Vorlagen. Jede Änderung geht über beiAenderung(art):
    art = 'form'   → Spiegel oder Brennweite: Teleskop wird neu gebaut
    art = 'okular' → nur das Okular: Licht und Datenblatt neu
  Beim Loslassen eines Reglers kommt zusätzlich beiLoslassen() – dann
  darf die Kamera nachziehen (während des Ziehens nicht, sonst wackelt
  das Bild unter der Maus).
*/
(function (O) {
  'use strict';

  var T;
  var B;

  function el(tag, klasse, text) {
    var e = document.createElement(tag);
    if (klasse) e.className = klasse;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  // Erlaubter Brennweitenbereich für eine Öffnung
  function brennweiteGrenzen(D) {
    var N = B.oeffnungsverhaeltnis;
    return { min: Math.round(D * N.min), max: Math.min(B.brennweiteMax, Math.round(D * N.max)) };
  }

  function Konfigurator(leiste, beiAenderung, beiLoslassen) {
    T = O.TEXTE.bauen;
    B = O.BAUARTEN.dobson;
    this.leiste = leiste;
    this.beiAenderung = beiAenderung;
    this.beiLoslassen = beiLoslassen;
    this.baue();
    this.auffrischen();
  }

  Konfigurator.prototype.regler = function (name, min, max, schritt, setze) {
    var wurzel = el('label', 'bau-regler');
    var kopf = el('span', 'bau-regler-kopf');
    kopf.appendChild(el('span', 'bau-regler-name', name));
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
    return { schieber: schieber, wert: wert, zusatz: zusatz };
  };

  Konfigurator.prototype.baue = function () {
    var self = this;
    var z = O.zustand;
    this.leiste.appendChild(el('h2', 'leiste-titel', T.titel));

    // Vorlagen
    var reihe = el('div', 'vorlagen');
    reihe.setAttribute('role', 'group');
    reihe.setAttribute('aria-label', T.vorlagen);
    B.vorlagen.forEach(function (v) {
      var k = el('button', 'vorlage');
      k.type = 'button';
      k.title = v.oeffnungMm + '/' + v.brennweiteMm + ' – ' + v.text;
      k.appendChild(el('span', 'vorlage-name', v.name));
      k.appendChild(el('span', 'vorlage-mass', v.oeffnungMm + '/' + v.brennweiteMm));
      k.addEventListener('click', function () {
        z.oeffnungMm = v.oeffnungMm;
        z.brennweiteMm = v.brennweiteMm;
        self.auffrischen();
        self.beiAenderung('form');
        self.beiLoslassen();
      });
      reihe.appendChild(k);
    });
    this.leiste.appendChild(reihe);

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
      z.okularMm = B.okulare[Math.round(i)];
      self.auffrischen();
      self.beiAenderung('okular');
    });

    this.leiste.appendChild(el('p', 'bau-hinweis', T.hinweis));
  };

  // Regler und Anzeigen auf den Zustand setzen
  Konfigurator.prototype.auffrischen = function () {
    var z = O.zustand;
    var F = O.Format;
    var g = brennweiteGrenzen(z.oeffnungMm);

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
      k.setAttribute('aria-pressed', v.oeffnungMm === z.oeffnungMm && v.brennweiteMm === z.brennweiteMm ? 'true' : 'false');
    });
    return self;
  };

  O.Konfigurator = Konfigurator;
})(globalThis.OPTIK = globalThis.OPTIK || {});
