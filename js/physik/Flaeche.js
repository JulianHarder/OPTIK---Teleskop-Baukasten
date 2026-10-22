/*
  Optische Flächen für den Strahlverfolger: Spiegel mit Kegelschnitt-Form,
  Blenden, und ein Rahmen, der jedes Element an beliebiger Stelle und in
  beliebiger Drehung aufstellen kann.

  Jedes Element rechnet in seinem eigenen Koordinatensystem: Scheitel im
  Ursprung, Achse z. Die Lage (Lage) übersetzt Strahlen hinein und wieder
  heraus. So muss die Kegelschnitt-Formel nur einmal stimmen – egal ob der
  Spiegel unten im Tubus liegt oder unter 45° vorne im Rohr hängt.

  Kein DOM, kein THREE – läuft auch in node (pruefungen/).
*/
(function (O) {
  'use strict';

  var V = O.Vektor;
  var EPS = 1e-9;     // mm

  // ---------- Lage im Raum ----------

  // Ursprung und drei zueinander senkrechte Einheitsvektoren (rechtshändig)
  function Lage(ursprung, ex, ey, ez) {
    this.o = ursprung;
    this.ex = ex;
    this.ey = ey;
    this.ez = ez;
  }

  Lage.prototype.punktZuLokal = function (p) {
    var r = V.minus(p, this.o);
    return V.v(V.punkt(r, this.ex), V.punkt(r, this.ey), V.punkt(r, this.ez));
  };

  Lage.prototype.richtungZuLokal = function (d) {
    return V.v(V.punkt(d, this.ex), V.punkt(d, this.ey), V.punkt(d, this.ez));
  };

  Lage.prototype.richtungZuWelt = function (d) {
    return V.plus(V.plus(V.mal(this.ex, d.x), V.mal(this.ey, d.y)), V.mal(this.ez, d.z));
  };

  Lage.prototype.punktZuWelt = function (p) {
    return V.plus(this.o, this.richtungZuWelt(p));
  };

  // Lage mit gegebener z-Achse (und einer Wunschrichtung für x)
  Lage.mitAchse = function (ursprung, ez, xWunsch) {
    var z = V.norm(ez);
    var x = V.norm(V.minus(xWunsch, V.mal(z, V.punkt(xWunsch, z))));
    return new Lage(ursprung, x, V.kreuz(z, x), z);
  };

  // Element (rechnet lokal) an eine Lage stellen. Der Abstand t entlang des
  // Strahls ist in beiden Systemen gleich – es wird nur gedreht und verschoben.
  function imRahmen(lage, element, name) {
    return {
      name: name,
      lage: lage,
      schnitt: function (s) {
        return element.schnitt({ p: lage.punktZuLokal(s.p), d: lage.richtungZuLokal(s.d), lambda: s.lambda });
      },
      wirke: function (s, q) {
        var neu = element.wirke(
          { p: lage.punktZuLokal(s.p), d: lage.richtungZuLokal(s.d), lambda: s.lambda },
          lage.punktZuLokal(q)
        );
        return neu && { p: q, d: lage.richtungZuWelt(neu.d), lambda: s.lambda };
      }
    };
  }

  // ---------- Rand einer Fläche ----------

  // rand = { r } (Kreis) oder { a, b } (Ellipse, Halbachsen in x und y)
  function innerhalb(rand, x, y) {
    if (rand.r !== undefined) return x * x + y * y <= rand.r * rand.r;
    return (x * x) / (rand.a * rand.a) + (y * y) / (rand.b * rand.b) <= 1;
  }

  // ---------- Spiegel mit Kegelschnitt-Form ----------

  /*
    Fläche mit Scheitel im Ursprung, Achse z, nach +z hohl:
        c·(x² + y²) − 2z + (1 + k)·c·z² = 0       c = 1/R
    k = 0 Kugel, k = −1 Paraboloid, k < −1 Hyperboloid, c = 0 Ebene.

    Die Vorderseite (die spiegelnde) zeigt nach +z. Wer von hinten kommt,
    trifft die Rückseite und wird geschluckt – so entsteht z. B. der
    Schatten des Fangspiegels ganz von selbst.
  */
  // Schnittpunkt eines Strahls mit der Kegelschnitt-Fläche (lokal):
  // kleinstes t > ε auf dem Flächenstück am Scheitel, innerhalb des Rands
  function kegelSchnittpunkt(c, k, rand, s) {
    var ck = (1 + k) * c;
    var p = s.p;
    var d = s.d;
    // Strahl p + t·d eingesetzt: A·t² + B·t + C = 0
    var A = c * (d.x * d.x + d.y * d.y) + ck * d.z * d.z;
    var B = 2 * c * (p.x * d.x + p.y * d.y) - 2 * d.z + 2 * ck * p.z * d.z;
    var C = c * (p.x * p.x + p.y * p.y) - 2 * p.z + ck * p.z * p.z;
    var loesungen = [];

    if (Math.abs(A) < 1e-15) {
      if (Math.abs(B) < 1e-15) return null;      // läuft parallel zur Ebene
      loesungen.push(-C / B);
    } else {
      var D = B * B - 4 * A * C;
      if (D < 0) return null;
      var w = Math.sqrt(D);
      // numerisch stabile Form (kein Auslöschen bei kleinem A)
      var q = -0.5 * (B + (B >= 0 ? w : -w));
      if (q === 0) return null;                  // streift die Fläche nur
      loesungen.push(q / A, C / q);
    }

    var best = null;
    loesungen.forEach(function (t) {
      if (!(t > EPS) || (best !== null && t >= best)) return;
      var z = p.z + t * d.z;
      // nur das Flächenstück am Scheitel, nicht die zweite Schale
      // einer Kugel oder eines Hyperboloids
      if (ck * z >= 1) return;
      if (!innerhalb(rand, p.x + t * d.x, p.y + t * d.y)) return;
      best = t;
    });
    return best;
  }

  // Gradient der Flächengleichung (normiert); er zeigt vom Scheitel nach −z
  function gradient(c, k, q) {
    var ck = (1 + k) * c;
    return V.norm(V.v(2 * c * q.x, 2 * c * q.y, -2 + 2 * ck * q.z));
  }

  function Kegelschnitt(c, k, rand) {
    return {
      schnitt: function (s) { return kegelSchnittpunkt(c, k, rand, s); },

      wirke: function (s, q) {
        // Gradient der Flächengleichung; er zeigt von der Vorderseite weg
        var n = gradient(c, k, q);
        var dn = V.punkt(s.d, n);
        if (dn <= 0) return null;                    // Rückseite: geschluckt
        return { p: q, d: V.minus(s.d, V.mal(n, 2 * dn)) };   // r = d − 2(d·n)n
      }
    };
  }

  // ---------- Brechende Fläche (Linse) ----------

  /*
    Kegelschnitt-Fläche zwischen zwei Stoffen. nPlus(λ) ist die Brechzahl
    auf der +z-Seite des Scheitels, nMinus(λ) auf der −z-Seite.
    Brechung nach Snellius in Vektorform (η = n₁/n₂, cosᵢ = −n·d):
        t = η·d + (η·cosᵢ − √(1 − η²·(1 − cosᵢ²)))·n
    Ist der Ausdruck unter der Wurzel negativ, wird der Strahl total
    reflektiert.
  */
  function Brechend(c, k, rand, nPlus, nMinus) {
    return {
      schnitt: function (s) { return kegelSchnittpunkt(c, k, rand, s); },

      wirke: function (s, q) {
        var lambda = s.lambda || O.Glas.LINIEN.d;
        var g = gradient(c, k, q);
        var mitGradient = V.punkt(s.d, g) > 0;          // läuft von + nach −
        var n1 = mitGradient ? nPlus(lambda) : nMinus(lambda);
        var n2 = mitGradient ? nMinus(lambda) : nPlus(lambda);
        var n = mitGradient ? V.mal(g, -1) : g;          // Normale gegen den Strahl
        var eta = n1 / n2;
        var cosI = -V.punkt(n, s.d);
        var w = 1 - eta * eta * (1 - cosI * cosI);
        if (w < 0) return { p: q, d: V.minus(s.d, V.mal(n, 2 * V.punkt(s.d, n))), lambda: lambda };
        return { p: q, d: V.norm(V.plus(V.mal(s.d, eta), V.mal(n, eta * cosI - Math.sqrt(w)))), lambda: lambda };
      }
    };
  }

  // ---------- Blende ----------

  // Ebene z = 0 mit runder Öffnung: innen läuft das Licht durch, auf dem
  // Ring bis rAussen wird es geschluckt. Darüber hinaus ist nichts.
  function Blende(rInnen, rAussen) {
    return {
      schnitt: function (s) {
        if (Math.abs(s.d.z) < 1e-15) return null;
        var t = -s.p.z / s.d.z;
        if (!(t > EPS)) return null;
        var x = s.p.x + t * s.d.x;
        var y = s.p.y + t * s.d.y;
        var r2 = x * x + y * y;
        return r2 <= rAussen * rAussen ? t : null;
      },
      wirke: function (s, q) {
        return q.x * q.x + q.y * q.y <= rInnen * rInnen ? { p: q, d: s.d } : null;
      }
    };
  }

  O.Lage = Lage;
  O.Flaeche = {
    imRahmen: imRahmen,
    Kegelschnitt: Kegelschnitt,
    Brechend: Brechend,
    Blende: Blende
  };
})(globalThis.OPTIK = globalThis.OPTIK || {});
