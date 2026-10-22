/*
  Infokarten der Bauteile: was es ist, wozu es dient, woraus es besteht,
  ein Fakt. Der Schlüssel ist der Name in userData.teil.

  werte(m, z, t) liefert Zahlen zum aktuellen Teleskop (m = Maße aus
  Optik.masseNewton, z = Zustand, t = gebautes Teleskop aus Dobson.erzeuge)
  als Liste [Beschriftung, Wert].
  innen: true = das Teil liegt im Tubus; seine Beschriftung erscheint
  auch in den Ansichten „aufgeschnitten“ und „Röntgen“.
  schild: 'links' = Text links vom Punkt, wo zwei Schilder sonst
  übereinanderliegen.
*/
(function (O) {
  'use strict';

  function mm(x, stellen) {
    return O.Format.mm(x, stellen || 0);
  }

  O.TEILE = {
    tubus: {
      name: 'Tubus',
      wozu: 'Hält Hauptspiegel und Fangspiegel im genau richtigen Abstand ' +
        'und schirmt Streulicht ab. Innen ist er mattschwarz, damit kein ' +
        'Licht von der Seite ins Bild gerät.',
      woraus: 'Gerolltes Stahlblech, außen lackiert, innen mattschwarz.',
      fakt: 'Für die Abbildung selbst ist das Rohr gar nicht nötig: Große ' +
        'Dobsons haben oft einen Gitterrohr-Tubus, der nur aus acht Stangen ' +
        'besteht – das spart Gewicht und Platz im Auto.',
      werte: function (m) {
        return [['Länge', mm(m.laenge)], ['Außendurchmesser', mm(2 * m.rAussen)]];
      }
    },

    hauptspiegel: {
      name: 'Hauptspiegel',
      innen: true,
      wozu: 'Das Herz des Teleskops. Er fängt das Licht ein und bündelt es ' +
        'in einem Punkt, dem Brennpunkt. Je größer er ist, desto mehr Licht ' +
        'sammelt er und desto feinere Details zeigt das Teleskop.',
      woraus: 'Glas, vorne mit einer hauchdünnen Schicht Aluminium bedampft ' +
        '(etwa ein Zehntausendstel Millimeter) und mit Quarz geschützt.',
      fakt: 'Seine Oberfläche ist eine Parabel, nicht eine Kugel – nur so ' +
        'treffen sich alle Strahlen im selben Punkt. Damit das Bild scharf ' +
        'wird, darf die Form höchstens etwa ein Achtel einer Lichtwellenlänge ' +
        'abweichen: rund 70 Millionstel Millimeter.',
      werte: function (m) {
        return [
          ['Durchmesser (Öffnung)', mm(m.D)],
          ['Brennweite', mm(m.f)],
          ['Mitte tiefer als Rand', mm(m.sag(m.D / 2), 2)]
        ];
      }
    },

    spiegelzelle: {
      name: 'Spiegelzelle',
      wozu: 'Trägt den Hauptspiegel, ohne ihn zu verbiegen. Mit den drei ' +
        'großen Schrauben wird er gekippt, bis er genau auf den Fangspiegel ' +
        'zielt – das nennt man Kollimieren. Die drei kleinen Schrauben ' +
        'kontern, damit nichts verrutscht.',
      woraus: 'Kunststoff und Aluminium, mit Federn zwischen Zelle und Boden.',
      fakt: 'Steht der Spiegel schief, werden aus punktförmigen Sternen ' +
        'kleine Kometen. Deshalb prüfen Beobachter die Justage regelmäßig – ' +
        'oft vor jeder Nacht.'
    },

    fangspiegel: {
      name: 'Fangspiegel',
      innen: true,
      wozu: 'Ein flacher Spiegel unter 45°. Er lenkt das gebündelte Licht ' +
        'zur Seite aus dem Tubus heraus. Ohne ihn müsste dein Kopf vorne im ' +
        'Rohr stecken – und würde das Licht selbst verdecken.',
      woraus: 'Plan geschliffenes Glas mit Aluminiumschicht. Er ist ' +
        'elliptisch, damit er unter 45° von vorne gesehen genau rund ist.',
      fakt: 'Er steht mitten im Lichtweg und schattet einen Teil des ' +
        'Hauptspiegels ab. Ein Loch im Bild sieht man trotzdem nicht – der ' +
        'Schatten liegt weit vor dem Brennpunkt und kostet nur etwas Licht.',
      werte: function (m) {
        var anteil = (m.fang / m.D) * (m.fang / m.D) * 100;
        return [
          ['Kleine Achse', mm(m.fang)],
          ['Mindestens nötig', mm(m.fangNoetig, 1)],
          ['Abgeschattete Fläche', O.Format.zahl(anteil, 1) + ' %']
        ];
      }
    },

    spinne: {
      name: 'Fangspiegelspinne',
      innen: true,
      schild: 'links',
      wozu: 'Hält den Fangspiegel mitten im Rohr. Ihre Streben sind so dünn ' +
        'wie möglich, damit sie kaum Licht wegnehmen.',
      woraus: 'Vier Stahlstreben, je etwa 1 mm dünn, außen am Tubus verschraubt.',
      fakt: 'Von diesen Streben kommen die Zacken, die helle Sterne auf ' +
        'vielen Fotos haben – auch auf den Bildern des Hubble-Teleskops. ' +
        'Vier Streben ergeben vier Zacken.'
    },

    okularauszug: {
      name: 'Okularauszug',
      schild: 'links',
      wozu: 'Schiebt das Okular hinein und heraus, bis das Bild scharf ist. ' +
        'Genau hier liegt der Brennpunkt, in dem der Spiegel das Bild ' +
        'erzeugt.',
      woraus: 'Aluminium. Bei dieser Bauart (Crayford) läuft das Rohr auf ' +
        'Rollen statt auf einer Zahnstange – ganz ohne Spiel.',
      fakt: 'Der Lichtweg vom Hauptspiegel zum Fangspiegel und von dort ' +
        'hierher ist zusammen genau eine Brennweite lang.',
      werte: function (m) {
        return [
          ['Spiegel → Fangspiegel', mm(m.zFang)],
          ['Fangspiegel → Brennpunkt', mm(m.seitlich)],
          ['Zusammen', mm(m.zFang + m.seitlich)]
        ];
      }
    },

    okular: {
      name: 'Okular',
      wozu: 'Eine Lupe, mit der du das Bild im Brennpunkt vergrößert ' +
        'ansiehst. Mit einem anderen Okular ändert sich die Vergrößerung: ' +
        'Brennweite des Teleskops geteilt durch Brennweite des Okulars.',
      woraus: 'Mehrere Linsen in einer Metallhülse mit 31,75 mm (1¼ Zoll) ' +
        'Durchmesser, außen gummiert.',
      fakt: 'Das Teleskop selbst vergrößert gar nicht – es sammelt Licht. ' +
        'Vergrößern tut erst das Okular.',
      werte: function (m, z) {
        return [
          ['Brennweite', mm(z.okularMm)],
          ['Vergrößerung', O.Format.zahl(m.f / z.okularMm, 0) + '-fach'],
          ['Zeigt vom Himmel', O.Format.zahl(O.Optik.wahresFeldGrad(m, z.okularMm), 2) + '°']
        ];
      }
    },

    sucher: {
      name: 'Sucherfernrohr',
      wozu: 'Ein kleines Fernrohr mit Fadenkreuz und großem Blickfeld. Das ' +
        'Hauptteleskop zeigt nur ein winziges Stück Himmel – mit dem Sucher ' +
        'zielt man erst einmal grob in die richtige Richtung.',
      woraus: 'Zwei Linsen und ein Fadenkreuz in einem Rohr, in zwei Ringen ' +
        'mit Justierschrauben.',
      fakt: '„8 × 50“ heißt: 8-fache Vergrößerung, 50 mm Öffnung. Sein ' +
        'Blickfeld ist rund sechs Grad weit – zwölf Vollmonde nebeneinander.'
    },

    hoehenrad: {
      name: 'Höhenrad',
      wozu: 'Auf diesen beiden Scheiben liegt der Tubus. Er lässt sich damit ' +
        'nach oben und unten kippen.',
      woraus: 'Kunststoff, gleitend auf Teflon – leicht zu bewegen, bleibt ' +
        'aber stehen, wo man loslässt.',
      fakt: 'Die Räder sitzen genau im Schwerpunkt des Tubus. Deshalb bleibt ' +
        'er in jeder Neigung von selbst stehen, ganz ohne Bremse.'
    },

    rockerbox: {
      name: 'Rockerbox',
      wozu: 'Die Holzkiste, in der der Tubus liegt. Sie dreht sich auf der ' +
        'Bodenplatte nach links und rechts.',
      woraus: 'Sperrholz, an den Gleitstellen Teflon.',
      fakt: 'Erfunden hat diese Bauart John Dobson in den 1960er-Jahren in ' +
        'San Francisco. Er baute Teleskope aus Sperrholz und Pappröhren und ' +
        'zeigte damit Passanten auf dem Gehweg den Himmel. Seitdem sind große ' +
        'Spiegel für Hobby-Astronomen bezahlbar.'
    },

    bodenplatte: {
      name: 'Bodenplatte',
      wozu: 'Steht auf drei Füßen auf dem Boden. Die Rockerbox dreht sich ' +
        'darauf um einen Mittelbolzen.',
      woraus: 'Sperrholz, Gummifüße, Teflon-Gleitpunkte.',
      fakt: 'Drei Füße wackeln nie, auch nicht auf einer unebenen Wiese – ' +
        'ein Tisch mit vier Beinen schon.'
    },

    // ---------- Linsenfernrohr ----------

    taukappe: {
      name: 'Taukappe',
      wozu: 'Das Rohrstück vor der Linse. Es hält Streulicht ab und vor ' +
        'allem den Tau: Nachts kühlt die Linse ab und würde sonst beschlagen ' +
        'wie eine Autoscheibe.',
      woraus: 'Aluminium, innen mattschwarz, zum Mitnehmen oft abnehmbar.',
      fakt: 'Spiegelteleskope beschlagen viel seltener – ihr Spiegel liegt ' +
        'unten im Rohr, geschützt wie von einer sehr langen Taukappe.'
    },

    objektiv: {
      name: 'Objektiv',
      wozu: 'Statt eines Spiegels sammelt hier eine Linse das Licht und ' +
        'bündelt es im Brennpunkt. Das Rohr ist dadurch geschlossen, und ' +
        'nichts steht im Lichtweg – kein Fangspiegel, keine Spinne.',
      woraus: 'Eine oder zwei Linsen in einer Fassung aus Metall.',
      fakt: 'Linsen brechen Blau stärker als Rot. Deshalb hat ein Objektiv ' +
        'aus nur einer Linse bunte Ränder. Die Lösung, den Achromat aus zwei ' +
        'Glassorten, ließ sich John Dollond 1758 patentieren.',
      werte: function (m) {
        var f = O.Linsenoptik.farbfehler(m);
        return [
          ['Durchmesser (Öffnung)', mm(m.D)],
          ['Brennweite', mm(m.f)],
          ['Rot ↔ Blau im Brennpunkt', O.Format.mm(f.abstandMm, 2)]
        ];
      }
    },

    kronlinse: {
      name: 'Sammellinse (Kronglas)',
      wozu: 'Die dicke, nach außen gewölbte Linse. Sie bündelt das Licht – ' +
        'und zerlegt es dabei leicht in Farben, wie ein Prisma.',
      woraus: 'Kronglas (BK7): klar, bricht das Licht mäßig und zerstreut die ' +
        'Farben wenig.',
      fakt: 'Ihre Wölbung ist kaum zu sehen: Bei einem 80-mm-Objektiv ist die ' +
        'Mitte nur wenige Millimeter dicker als der Rand.',
      werte: function (m) {
        var l = m.objektivFlaechen.linsen[0];
        return [['Radius vorne', mm(Math.abs(l.R1))], ['Radius hinten', mm(Math.abs(l.R2))], ['Dicke', mm(l.t, 1)]];
      }
    },

    flintlinse: {
      name: 'Zerstreuungslinse (Flintglas)',
      wozu: 'Die dünne zweite Linse direkt dahinter, nach innen gewölbt. Sie ' +
        'nimmt etwas Brechkraft zurück, aber viel mehr von der Farbzerlegung ' +
        '– danach treffen sich Rot und Blau im selben Punkt.',
      woraus: 'Flintglas (F2), mit Blei: bricht stärker und zerstreut die ' +
        'Farben fast doppelt so stark wie Kronglas.',
      fakt: 'Die beiden Linsen sind miteinander verkittet. Zusammen heißen sie ' +
        'Achromat – „ohne Farbe“. Ganz ohne geht es trotzdem nicht: Ein ' +
        'schwacher violetter Saum bleibt (das sekundäre Spektrum).',
      werte: function (m) {
        var l = m.objektivFlaechen.linsen[1];
        return [['Radius vorne', mm(Math.abs(l.R1))], ['Radius hinten', mm(Math.abs(l.R2))], ['Dicke', mm(l.t, 1)]];
      }
    },

    zenitspiegel: {
      name: 'Zenitspiegel',
      wozu: 'Ein Spiegel unter 45° vor dem Okular. Er lenkt das Licht nach ' +
        'oben, damit du nicht unter das Fernrohr kriechen musst, wenn es steil ' +
        'nach oben zeigt.',
      woraus: 'Ein flacher Spiegel oder ein Prisma in einem Gehäuse.',
      fakt: 'Durch den Spiegel steht das Bild zwar aufrecht, ist aber ' +
        'seitenverkehrt – wie in einem Badezimmerspiegel. Beim Newton steht es ' +
        'dagegen auf dem Kopf.'
    },

    rohrschellen: {
      name: 'Rohrschellen',
      wozu: 'Zwei Ringe halten das Rohr. Unten verbindet sie eine Schiene, ' +
        'die man in die Montierung einklemmt.',
      woraus: 'Aluminium, innen mit Filz, damit der Lack keine Kratzer bekommt.',
      fakt: 'Die Schiene heißt Prismenschiene – nach ihrem Querschnitt. Sie ' +
        'ist bei vielen Herstellern gleich, deshalb passen fremde Teleskope ' +
        'auf dieselbe Montierung.'
    },

    montierung: {
      name: 'Montierung',
      wozu: 'Der Kopf, an dem das Rohr hängt. Er dreht sich nach links und ' +
        'rechts und kippt das Rohr nach oben und unten – wie die Rockerbox ' +
        'beim Dobson.',
      woraus: 'Aluminiumguss, mit Klemmschrauben für beide Achsen.',
      fakt: 'Das Rohr sitzt seitlich neben dem Stativ. So stößt es nicht an ' +
        'die Beine, wenn man genau nach oben schaut.'
    },

    stativ: {
      name: 'Stativ',
      wozu: 'Drei Beine bringen das Fernrohr auf Augenhöhe und stehen auch ' +
        'auf unebenem Boden fest.',
      woraus: 'Aluminiumrohre zum Ausziehen, dazwischen eine Ablage für ' +
        'Okulare.',
      fakt: 'Ein Fernrohr wackelt bei hoher Vergrößerung bei jeder Berührung. ' +
        'Je schwerer und steifer das Stativ, desto schneller kommt das Bild ' +
        'wieder zur Ruhe.'
    },

    mensch: {
      name: 'Mensch zum Vergleich',
      wozu: 'Steht nur da, damit man sieht, wie groß das Teleskop wirklich ' +
        'ist: 1,75 m.',
      woraus: 'Ein paar Zylinder und eine Kugel.',
      fakt: 'Bei Dobsons mit 40 cm Spiegel und mehr steht man zum Beobachten ' +
        'auf einer Leiter. Die größten Amateur-Dobsons haben über einen ' +
        'Meter Öffnung – dort ist die Leiter mehrere Meter hoch.',
      werte: function (m, z, t) {
        return [
          ['Augenhöhe', O.Format.zahl(O.Mensch.AUGENHOEHE_MM / 1000, 2) + ' m'],
          ['Okular über dem Boden', O.Format.zahl(t.okularHoeheMm / 1000, 2) + ' m']
        ];
      }
    },

    ablage: {
      name: 'Okularablage',
      wozu: 'Platz für die Okulare, die gerade nicht im Teleskop stecken. ' +
        'Im Dunkeln findet man sie so mit der Hand wieder.',
      woraus: 'Ein Holzbrett mit Bohrungen.',
      fakt: 'Viele Beobachter benutzen drei bis vier Okulare: eins für den ' +
        'Überblick, eins für mittlere und eins für hohe Vergrößerung.'
    }
  };
})(globalThis.OPTIK = globalThis.OPTIK || {});
