/*
  „Beobachten“: Objekt am Himmel wählen, das Teleskop schwenkt hin.
  Dazu die Luft (ruhig, normal, unruhig) und der Knopf „Durchschauen“.

  Das gewählte Objekt bekommt am Himmel einen Ring mit Namen, damit man
  sieht, wohin das Teleskop zielt. Die Richtungen sind ausgedacht (siehe
  js/daten/himmel.js) – das sagt die Leiste auch.

  bei = { geschwenkt(), durchschauen() } – Rückrufe an main.js
*/
(function (O) {
  'use strict';

  var SCHWENK_MS = 1400;
  var T;

  function el(tag, klasse, text) {
    var e = document.createElement(tag);
    if (klasse) e.className = klasse;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function objekt(id) {
    return O.HIMMEL.objekte.find(function (o) { return o.id === id; });
  }

  // Ring als Textur für die Markierung am Himmel
  function ringTextur() {
    var c = document.createElement('canvas');
    c.width = c.height = 64;
    var ctx = c.getContext('2d');
    ctx.strokeStyle = 'rgba(232, 189, 90, 0.95)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(32, 32, 24, 0, Math.PI * 2);
    ctx.stroke();
    return new THREE.CanvasTexture(c);
  }

  function Beobachten(buehne, leiste, nav, bei) {
    T = O.TEXTE.beobachten;
    this.buehne = buehne;
    this.leiste = leiste;
    this.bei = bei;
    this.teleskop = null;
    this.ansicht = null;
    this.baueLeiste();
    this.baueKnopf(nav);
    this.baueMarke();
    this.auffrischen();
  }

  Beobachten.prototype.neuesTeleskop = function (teleskop, ansicht) {
    this.teleskop = teleskop;
    this.ansicht = ansicht;
  };

  // ---------- Oberfläche ----------

  Beobachten.prototype.baueLeiste = function () {
    var self = this;
    var l = this.leiste;
    l.appendChild(el('h2', 'leiste-titel', T.titel));

    var liste = el('div', 'objekte');
    O.HIMMEL.objekte.forEach(function (o) {
      var k = el('button', 'objekt');
      k.type = 'button';
      k.dataset.objekt = o.id;
      k.appendChild(el('span', 'objekt-name', o.name));
      k.appendChild(el('span', 'objekt-art', o.art));
      k.addEventListener('click', function () { self.waehle(o.id); });
      liste.appendChild(k);
    });
    l.appendChild(liste);
    l.appendChild(el('p', 'bau-hinweis', T.zielen));

    var luft = el('div', 'luft');
    luft.appendChild(el('span', 'luft-titel', T.luft));
    var knoepfe = el('div', 'luft-knoepfe');
    O.HIMMEL.luft.forEach(function (lu) {
      var k = el('button', 'luft-knopf', lu.name);
      k.type = 'button';
      k.dataset.luft = lu.id;
      k.title = 'Sterne flimmern auf etwa ' + O.Format.zahl(lu.bs, 1) + '″';
      k.addEventListener('click', function () {
        O.zustand.luftId = lu.id;
        self.auffrischen();
        if (self.bei.luftGeaendert) self.bei.luftGeaendert();
      });
      knoepfe.appendChild(k);
    });
    luft.appendChild(knoepfe);
    l.appendChild(luft);

    var los = el('button', 'durchschauen');
    los.type = 'button';
    los.appendChild(el('kbd', null, 'O'));
    los.appendChild(document.createTextNode(' ' + T.durchschauen));
    los.addEventListener('click', function () { self.bei.durchschauen(); });
    l.appendChild(los);

    l.appendChild(el('p', 'bau-hinweis klein', T.ort));
  };

  Beobachten.prototype.baueKnopf = function (nav) {
    var k = el('button', 'ansicht-knopf durchschauen-knopf');
    k.type = 'button';
    k.appendChild(el('kbd', null, 'O'));
    k.appendChild(document.createTextNode(' ' + T.durchschauen));
    var self = this;
    k.addEventListener('click', function () { self.bei.durchschauen(); });
    nav.appendChild(k);
  };

  Beobachten.prototype.auffrischen = function () {
    var z = O.zustand;
    this.leiste.querySelectorAll('.objekt').forEach(function (k) {
      k.setAttribute('aria-pressed', k.dataset.objekt === z.objektId ? 'true' : 'false');
    });
    this.leiste.querySelectorAll('.luft-knopf').forEach(function (k) {
      k.setAttribute('aria-pressed', k.dataset.luft === z.luftId ? 'true' : 'false');
    });
  };

  // ---------- Markierung am Himmel ----------

  Beobachten.prototype.baueMarke = function () {
    var s = new THREE.Sprite(new THREE.SpriteMaterial({
      map: ringTextur(), depthTest: false, depthWrite: false, toneMapped: false
    }));
    s.renderOrder = 3;
    s.visible = false;
    this.buehne.himmel.gruppe.add(s);
    this.marke = s;

    this.schild = el('div', 'himmel-schild');
    this.schild.hidden = true;
    document.getElementById('schilder').appendChild(this.schild);

    // Das Schild hängt vor der Tubusöffnung, in Schussrichtung – so sieht
    // man immer, wohin das Teleskop zeigt (der Ring am Himmel liegt oft
    // außerhalb des Bildes: was 30° hoch steht, passt nicht mit dem
    // Teleskop zusammen in den Blickwinkel)
    var self = this;
    var p = new THREE.Vector3();
    this.buehne.nachBild.push(function () {
      var t = self.teleskop;
      if (!self.marke.visible || !t || !O.zustand.zielt) {
        self.schild.hidden = true;
        return;
      }
      t.tubus.localToWorld(p.set(0, 0, t.masse.zVorne + t.masse.D * 1.5)).project(self.buehne.kamera);
      var sichtbar = p.z < 1 && Math.abs(p.x) < 1 && Math.abs(p.y) < 1;
      self.schild.hidden = !sichtbar;
      var c = self.buehne.renderer.domElement;
      self.schild.style.transform = 'translate(' + ((p.x + 1) / 2 * c.clientWidth).toFixed(1) + 'px,' +
        ((1 - p.y) / 2 * c.clientHeight).toFixed(1) + 'px) translate(-50%, -50%)';
    });
  };

  Beobachten.prototype.zeigeMarke = function (o) {
    var d = O.Dobson.richtung(o.hoehe, o.azimut);
    var r = 40000;        // Himmelskugel (Himmel.js) hat 50 000
    this.marke.position.copy(d).multiplyScalar(r);
    this.marke.scale.setScalar(r * 0.05);
    this.marke.visible = true;
    this.schild.textContent = T.zieltAuf.replace('{name}', o.name);
  };

  // ---------- Zielen ----------

  // Objekt wählen und hinschwenken; fertig() kommt, wenn das Teleskop steht.
  // Während des Schwenkens zielt es noch nicht – das Schild wartet.
  Beobachten.prototype.waehle = function (id, fertig) {
    var o = objekt(id);
    var z = O.zustand;
    var t = this.teleskop;
    var self = this;
    z.objektId = id;
    z.zielt = false;
    this.auffrischen();
    this.zeigeMarke(o);

    var vonH = z.hoeheGrad;
    var vonA = z.azimutGrad;
    // kürzester Weg rundherum
    var nachA = o.azimut;
    while (nachA - vonA > 180) nachA -= 360;
    while (nachA - vonA < -180) nachA += 360;

    if (Math.abs(o.hoehe - vonH) < 0.01 && Math.abs(nachA - vonA) < 0.01) {
      z.zielt = true;
      if (fertig) fertig();
      return;
    }

    this.buehne.animiere('schwenk', SCHWENK_MS, function (s) {
      z.hoeheGrad = vonH + (o.hoehe - vonH) * s;
      z.azimutGrad = vonA + (nachA - vonA) * s;
      O.Dobson.richte(t, z.hoeheGrad, z.azimutGrad);
      self.ansicht.anwenden();      // Schnittebene wandert mit dem Tubus
      if (s === 1) {
        z.zielt = true;
        t.okularHoeheMm = O.Dobson.okularHoehe(t);
        self.bei.geschwenkt();
        if (fertig) fertig();
      }
    });
  };

  Beobachten.prototype.objekt = function () {
    return objekt(O.zustand.objektId);
  };

  Beobachten.prototype.luftBs = function () {
    var z = O.zustand;
    return O.HIMMEL.luft.find(function (l) { return l.id === z.luftId; }).bs;
  };

  O.Beobachten = Beobachten;
})(globalThis.OPTIK = globalThis.OPTIK || {});
