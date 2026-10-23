/*
  Durchschauen: die Kamera fliegt vor das Okular, das Bild wird schwarz,
  dann erscheint der Blick durchs Okular – das ganze Gesichtsfeld und
  daneben die Lupe (Bildmitte so fein, wie das Auge sie sieht).

  Im Okular lassen sich Okular, Luft und Objekt wechseln. Esc oder
  „Zurück“ fliegt wieder hinaus.

  Berühmte Teleskope bringen ihre Optik mit (teleskop.okularOptik, aus
  physik/Historisch.js) und haben ihr eigenes, festes Okular – dann fehlt
  die Okular-Reihe, und ein Satz zur Geschichte steht im Kopf. Wo das
  Feld so klein ist, dass das Auge nicht mehr erkennt als der Bildschirm
  zeigt (Galilei), fehlt auch die Lupe.

  bei = { okular(mm), luft(), objekt(id, fertig) } – Rückrufe an main.js
*/
(function (O) {
  'use strict';

  var FLUG_MS = 1200;
  var LUPE_AB_GRAD = 20;     // scheinbares Feld, ab dem die Lupe mehr zeigt als das Bild
  var DUNKEL_MS = 350;
  var T;

  function el(tag, klasse, text) {
    var e = document.createElement(tag);
    if (klasse) e.className = klasse;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function Okularansicht(buehne, huelle, beobachten, bei) {
    T = O.TEXTE.beobachten;
    this.buehne = buehne;
    this.huelle = huelle;            // <section id="okular-blick">
    this.beobachten = beobachten;
    this.bei = bei;
    this.offen = false;
    this.teleskop = null;
    this.baue();
  }

  Okularansicht.prototype.neuesTeleskop = function (teleskop) {
    this.teleskop = teleskop;
    if (this.offen) this.rendere();
  };

  // ---------- Aufbau ----------

  Okularansicht.prototype.baue = function () {
    var h = this.huelle;
    var self = this;

    var kopf = el('div', 'ok-kopf');
    this.name = el('h2', 'ok-name');
    this.art = el('p', 'ok-art');
    this.zahlen = el('p', 'ok-zahlen');
    kopf.appendChild(this.name);
    kopf.appendChild(this.art);
    kopf.appendChild(this.zahlen);
    this.historisch = el('p', 'ok-historisch');
    kopf.appendChild(this.historisch);
    var achte = el('div', 'ok-achte');
    achte.appendChild(el('strong', null, T.achte));
    this.achte = el('p');
    achte.appendChild(this.achte);
    kopf.appendChild(achte);
    h.appendChild(kopf);

    var feld = el('div', 'ok-feld');
    this.leinwand = el('canvas', 'ok-leinwand');
    feld.appendChild(this.leinwand);
    var lupe = el('figure', 'ok-lupe');
    this.lupenRahmen = lupe;
    this.lupe = el('canvas', 'ok-lupe-leinwand');
    lupe.appendChild(this.lupe);
    var lt = el('figcaption', null, T.lupe);
    this.lupenText = lt;
    lt.title = T.lupeLang;
    lupe.appendChild(lt);
    feld.appendChild(lupe);
    h.appendChild(feld);

    var unten = el('div', 'ok-unten');
    this.okularReihe = this.reihe(unten, T.okular, O.BAUARTEN.dobson.okulare.map(function (mm) {
      return { id: mm, text: mm + ' mm' };
    }), function (mm) { self.bei.okular(mm); self.rendere(); });
    this.luftReihe = this.reihe(unten, T.luft, O.HIMMEL.luft.map(function (l) {
      return { id: l.id, text: l.name };
    }), function (id) { O.zustand.luftId = id; self.bei.luft(); self.rendere(); });
    this.objektReihe = this.reihe(unten, T.titel, O.HIMMEL.objekte.map(function (o) {
      return { id: o.id, text: o.name };
    }), function (id) { self.bei.objekt(id); self.rendere(); });

    var zurueck = el('button', 'ok-zurueck');
    zurueck.type = 'button';
    zurueck.appendChild(el('kbd', null, 'Esc'));
    zurueck.appendChild(document.createTextNode(' ' + T.zurueck));
    zurueck.addEventListener('click', function () { self.schliesse(); });
    unten.appendChild(zurueck);
    unten.appendChild(el('p', 'ok-ehrlich', T.ehrlich));
    h.appendChild(unten);

    window.addEventListener('resize', function () { if (self.offen) self.rendere(); });
  };

  // Eine Reihe kleiner Knöpfe mit Überschrift
  Okularansicht.prototype.reihe = function (wurzel, titel, eintraege, beiWahl) {
    var r = el('div', 'ok-reihe');
    r.appendChild(el('span', 'ok-reihe-titel', titel));
    var knoepfe = el('div', 'ok-knoepfe');
    eintraege.forEach(function (e) {
      var k = el('button', 'ok-knopf', e.text);
      k.type = 'button';
      k.dataset.wert = String(e.id);
      k.addEventListener('click', function () { beiWahl(e.id); });
      knoepfe.appendChild(k);
    });
    r.appendChild(knoepfe);
    wurzel.appendChild(r);
    return knoepfe;
  };

  function markiere(reihe, wert) {
    reihe.querySelectorAll('.ok-knopf').forEach(function (k) {
      k.setAttribute('aria-pressed', k.dataset.wert === String(wert) ? 'true' : 'false');
    });
  }

  // ---------- Bild ----------

  Okularansicht.prototype.rendere = function () {
    var z = O.zustand;
    var o = this.beobachten.objekt();
    var t = this.teleskop;
    var optik = t.okularOptik || null;
    var mitLupe = !optik || optik.scheinbarGrad >= LUPE_AB_GRAD;
    this.lupenRahmen.hidden = !mitLupe;
    this.lupenText.textContent = optik && optik.kamera ? T.lupeKamera : T.lupe;
    this.okularReihe.parentElement.hidden = !!optik;
    // Im All gibt es keine Luft, die flimmert
    this.luftReihe.parentElement.hidden = !!(optik && optik.weltall);
    this.historisch.hidden = !t.beruehmt;
    this.historisch.textContent = t.beruehmt ? O.TELESKOPE[t.beruehmt].okular : '';
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var platz = this.leinwand.parentElement.getBoundingClientRect();
    // Feld und Lupe nebeneinander (breit) oder untereinander (Handy)
    var nebeneinander = platz.width > platz.height;
    var LUPE = mitLupe ? 0.55 : 0;
    var groesse = nebeneinander
      ? Math.min(platz.height, (platz.width - 30) / (1 + LUPE))
      : Math.min(platz.width, (platz.height - 40) / (1 + LUPE));
    groesse = Math.max(160, Math.floor(groesse));
    var n = Math.min(820, Math.round(groesse * dpr));
    this.leinwand.width = this.leinwand.height = n;
    this.leinwand.style.width = this.leinwand.style.height = groesse + 'px';
    var lupe = Math.round(groesse * LUPE);
    this.lupe.width = this.lupe.height = Math.min(480, Math.round(lupe * dpr));
    this.lupe.style.width = this.lupe.style.height = lupe + 'px';
    this.leinwand.parentElement.classList.toggle('untereinander', !nebeneinander);

    var p = optik ? { objekt: o, luftBs: optik.weltall ? 0 : this.beobachten.luftBs(), optik: optik } : {
      objekt: o,
      D: z.oeffnungMm,
      f: z.brennweiteMm,
      okularMm: z.okularMm,
      luftBs: this.beobachten.luftBs(),
      bauart: z.bauart,
      objektiv: z.objektiv
    };
    var e = O.Okularblick.rendere(this.leinwand, p);
    if (mitLupe) O.Okularblick.rendere(this.lupe, p, true);

    this.name.textContent = o.name;
    this.art.textContent = o.art + ' – ' + o.text;
    this.achte.textContent = o.achte;
    this.zahlen.textContent = optik && optik.kamera
      ? T.kameraZahlen.replace('{feld}', O.Format.zahl(e.feldGrad * 60, 1))
      : T.zahlen
        .replace('{V}', O.Format.zahl(e.vergroesserung, 0))
        .replace('{feld}', O.Format.zahl(e.feldGrad, 2))
        .replace('{ap}', O.Format.zahl(e.austrittspupille, 1));
    markiere(this.okularReihe, z.okularMm);
    markiere(this.luftReihe, z.luftId);
    markiere(this.objektReihe, z.objektId);
    this.letztes = e;
  };

  // ---------- Hinein und hinaus ----------

  Okularansicht.prototype.oeffne = function () {
    if (this.offen) return;
    var self = this;
    var b = this.buehne;
    var t = this.teleskop;
    t.wurzel.updateMatrixWorld(true);
    // Wo das Auge hinkommt: oben auf dem Okular (Achse +y) – oder, wo man
    // längs des Rohrs schaut (Galilei, Yerkes), so wie das Teleskop sagt
    var oben;
    var achse;
    if (t.auge) {
      var a = t.auge();
      oben = a.punkt;
      achse = a.achse;
    } else {
      var ok = t.teile.okular;
      oben = ok.localToWorld(new THREE.Vector3(0, 50, 0));
      achse = new THREE.Vector3(0, 1, 0).transformDirection(ok.matrixWorld);
    }

    this.vorher = { pos: b.kamera.position.clone(), ziel: b.steuerung.target.clone() };
    var nachPos = oben.clone().addScaledVector(achse, 110);
    var vonPos = this.vorher.pos.clone();
    var vonZiel = this.vorher.ziel.clone();
    b.steuerung.enabled = false;
    this.offen = true;
    document.body.classList.add('im-okular');

    b.animiere('kamera', FLUG_MS, function (s) {
      b.kamera.position.lerpVectors(vonPos, nachPos, s);
      b.steuerung.target.lerpVectors(vonZiel, oben, s);
      if (s === 1) {
        self.huelle.hidden = false;
        // erst schwarz, dann das Bild – das Rechnen darf einen Moment dauern.
        // (Timer statt requestAnimationFrame: das CSS braucht nur einen Takt
        // Abstand, und Timer laufen auch in verdeckten Fenstern.)
        setTimeout(function () {
          self.huelle.classList.add('an');
          setTimeout(function () { self.rendere(); self.huelle.classList.add('bild'); }, DUNKEL_MS);
        }, 20);
      }
    });
  };

  Okularansicht.prototype.schliesse = function () {
    if (!this.offen) return;
    var self = this;
    var b = this.buehne;
    this.huelle.classList.remove('an', 'bild');
    setTimeout(function () { self.huelle.hidden = true; }, DUNKEL_MS);
    var vonPos = b.kamera.position.clone();
    var vonZiel = b.steuerung.target.clone();
    var v = this.vorher;
    b.animiere('kamera', FLUG_MS, function (s) {
      b.kamera.position.lerpVectors(vonPos, v.pos, s);
      b.steuerung.target.lerpVectors(vonZiel, v.ziel, s);
      if (s === 1) {
        b.steuerung.enabled = true;
        self.offen = false;
        document.body.classList.remove('im-okular');
      }
    });
  };

  O.Okularansicht = Okularansicht;
})(globalThis.OPTIK = globalThis.OPTIK || {});
