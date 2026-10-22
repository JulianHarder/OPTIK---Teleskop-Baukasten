/*
  Schilder, die an 3D-Punkten hängen: kleine HTML-Etiketten mit dem Namen
  eines Bauteils, die nach jedem Bild an die richtige Bildschirmstelle
  geschoben werden.

  HTML statt 3D-Text: bleibt scharf, ist mit CSS gestaltet und lässt sich
  anklicken. Ein Punkt markiert die Stelle am Bauteil, das Schild steht
  leicht versetzt daneben.
*/
(function (O) {
  'use strict';

  var p = new THREE.Vector3();
  var RAND = 8;   // px Abstand zum Bildschirmrand

  function Beschriftung(buehne, ebene) {
    this.buehne = buehne;
    this.ebene = ebene;          // HTML-Container über der Bühne
    this.schilder = [];
    var self = this;
    buehne.nachBild.push(function () { self.verschiebe(); });
  }

  // objekt = Bauteil-Gruppe mit userData.anker, text = Beschriftung,
  // beiKlick(schluessel) beim Anklicken
  // links = Text links vom Punkt statt rechts
  Beschriftung.prototype.neu = function (schluessel, objekt, text, beiKlick, links) {
    var el = document.createElement('button');
    el.type = 'button';
    el.className = 'schild' + (links ? ' links' : '');
    el.innerHTML = '<span class="schild-punkt"></span><span class="schild-text"></span>';
    el.querySelector('.schild-text').textContent = text;
    el.addEventListener('click', function () { beiKlick(objekt.userData.teil); });
    this.ebene.appendChild(el);
    this.schilder.push({ schluessel: schluessel, objekt: objekt, el: el, an: false, links: !!links });
  };

  // zeigen(schild) → bool entscheidet je Schild, ob es sichtbar ist
  Beschriftung.prototype.zeige = function (zeigen) {
    this.schilder.forEach(function (s) {
      s.an = !!zeigen(s);
      s.el.classList.toggle('an', s.an);
    });
    this.verschiebe();
  };

  Beschriftung.prototype.verschiebe = function () {
    var k = this.buehne.kamera;
    var b = this.ebene.clientWidth;
    var h = this.ebene.clientHeight;
    this.schilder.forEach(function (s) {
      if (!s.an) return;
      s.objekt.localToWorld(p.copy(s.objekt.userData.anker));
      p.project(k);
      var hinter = p.z > 1;
      var x = (p.x + 1) / 2 * b;
      var y = (1 - p.y) / 2 * h;
      s.el.style.visibility = hinter ? 'hidden' : '';

      // Text auf die Seite, auf der Platz ist (wichtig auf dem Handy)
      if (!s.breite) s.breite = s.el.offsetWidth;
      var links = s.links ? x - s.breite >= RAND : x + s.breite > b - RAND;
      s.el.classList.toggle('links', links);

      // Punkt genau auf den Anker: senkrecht mittig, waagerecht am Rand
      s.el.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) ' +
        'translate(' + (links ? '-100%' : '0') + ', -50%)';
    });
  };

  O.Beschriftung = Beschriftung;
})(globalThis.OPTIK = globalThis.OPTIK || {});
