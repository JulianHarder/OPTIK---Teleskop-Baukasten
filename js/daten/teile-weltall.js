/*
  Infokarten der Weltraumteleskope Hubble und Webb – gleicher Aufbau wie
  js/daten/teile.js, dort hineingemischt. Quellen der Zahlen: siehe
  js/daten/teleskope.js und physik/Weltraumoptik.js.
*/
(function (O) {
  'use strict';

  Object.assign(O.TEILE, {

    // ---------- Hubble ----------

    hubbleHuelle: {
      name: 'Rohr mit Lichtschutz',
      wozu: 'Hält Haupt- und Fangspiegel genau im richtigen Abstand und ' +
        'schirmt Streulicht von Sonne, Erde und Mond ab. Innen fangen Ringe ' +
        'schräg einfallendes Licht.',
      woraus: 'Ein Gerüst aus Kohlefaser, außen mit glänzender Folie ' +
        'umwickelt, die Wärme und Kälte abhält.',
      fakt: 'Auf der Sonnenseite wird es heiß, im Erdschatten eiskalt – und ' +
        'das alle 94 Minuten. Die Folie sorgt dafür, dass sich das Rohr dabei ' +
        'kaum verzieht.'
    },

    hubbleDeckel: {
      name: 'Klappe',
      wozu: 'Ein Deckel vorne am Rohr. Er schließt sich, wenn Hubble zu nah ' +
        'an die Sonne schauen würde – sonst würde sie die Instrumente verbrennen.',
      woraus: 'Eine leichte Platte, mit Folie bezogen wie das Rohr.',
      fakt: 'Hubble schaut nie direkt auf die Sonne – und auch nicht auf ' +
        'Merkur, der zu nah an ihr steht.'
    },

    hubbleHauptspiegel: {
      name: 'Hauptspiegel',
      innen: true,
      wozu: 'Sammelt das Licht: 2,4 m groß, mit einem Loch in der Mitte. Durch ' +
        'das Loch fällt das Licht nach hinten zu den Instrumenten.',
      woraus: 'Spezialglas, das sich bei Wärme kaum ausdehnt, innen wie eine ' +
        'Bienenwabe ausgehöhlt und mit Aluminium bedampft. 828 kg – massiv ' +
        'wäre er rund dreimal so schwer.',
      fakt: 'Er ist eine Hyperbel, keine Parabel – zusammen mit dem Fangspiegel ' +
        'ergibt das auch am Bildrand scharfe Sterne (Ritchey-Chrétien).',
      werte: function () {
        return [['Durchmesser', '2,4 m'], ['Loch in der Mitte', '0,6 m'], ['Fehler 1990', 'am Rand 2,2 µm zu flach']];
      }
    },

    hubbleFangspiegel: {
      name: 'Fangspiegel',
      innen: true,
      wozu: 'Ein kleiner, nach außen gewölbter Spiegel 4,9 m vor dem ' +
        'Hauptspiegel. Er schickt das Licht zurück durch das Loch und macht ' +
        'die Brennweite zehnmal länger: 57,6 m in einem 13-m-Teleskop.',
      woraus: 'Glas mit Aluminium, 0,3 m groß, gehalten von vier dünnen Streben.',
      fakt: 'Die vier Streben machen die berühmten Strahlen-Zacken an hellen ' +
        'Sternen auf Hubble-Bildern.'
    },

    hubbleHeck: {
      name: 'Instrumente',
      innen: true,
      wozu: 'Hinter dem Hauptspiegel liegt der Brennpunkt. Dort sitzen die ' +
        'Kameras und Spektrografen, davor ein Ring aus Fächern mit Computern, ' +
        'Akkus und Kreiseln zum Ausrichten.',
      woraus: 'Instrumente in Schränken, die Astronauten tauschen konnten.',
      fakt: 'Bei fünf Besuchen haben Astronauten fast alle Instrumente ' +
        'ausgetauscht – Hubble ist heute viel besser als beim Start.'
    },

    hubbleSolar: {
      name: 'Solarflügel',
      wozu: 'Machen Strom aus Sonnenlicht. Im Erdschatten übernehmen Akkus.',
      woraus: 'Solarzellen auf starren Platten. Die Form ist hier vereinfacht.',
      fakt: 'Die heutigen Flügel sind schon die dritten: Die ersten beiden ' +
        'Paare ließen sich aufrollen, waren aber empfindlich.'
    },

    hubbleAntenne: {
      name: 'Antennen',
      wozu: 'Schicken die Bilder zur Erde – über Funksatelliten, die viel ' +
        'höher kreisen und immer eine Bodenstation sehen.',
      woraus: 'Schüsseln aus leichtem Verbundstoff an langen Auslegern. ' +
        'Größe hier geschätzt.',
      fakt: 'Hubble schickt jede Woche so viele Daten, dass sie mehrere ' +
        'Spielfilme füllen würden.'
    },

    astronaut: {
      name: 'Mensch im Raumanzug',
      wozu: 'Schwebt nur da, damit man sieht, wie groß das Teleskop wirklich ' +
        'ist: ein Mensch von 1,75 m – im All natürlich im Raumanzug.',
      woraus: 'Ein Anzug für Außeneinsätze: weißer Stoff in vielen Lagen, ' +
        'auf dem Rücken die Lebenserhaltung (Luft, Kühlung, Funk), vorne der ' +
        'Bedienkasten, ein Helm mit goldenem Visier gegen das grelle ' +
        'Sonnenlicht. Das Modell stammt von der NASA.',
      fakt: 'Bei Hubble waren wirklich Astronauten: fünfmal zwischen 1993 und ' +
        '2009, um zu reparieren und Neues einzubauen. Webb ist 1,5 Millionen km ' +
        'entfernt – dorthin kommt niemand.',
      werte: function () {
        return [['Größe mit Helm', '1,90 m']];
      }
    },

    // ---------- Webb ----------

    webbSegmente: {
      name: 'Hauptspiegel',
      wozu: '18 sechseckige Spiegel bilden zusammen einen von 6,5 m. Er war zu ' +
        'groß für jede Rakete und wurde gefaltet gestartet, dann im All ' +
        'aufgeklappt.',
      woraus: 'Beryllium – leicht und steif auch in großer Kälte –, mit einer ' +
        'hauchdünnen Schicht Gold. Gold spiegelt Infrarot besonders gut.',
      fakt: 'Jedes Segment wiegt nur etwa 20 kg und hat kleine Motoren auf der ' +
        'Rückseite. Damit wurden alle 18 im All so ausgerichtet, dass sie wie ' +
        'ein einziger Spiegel wirken.',
      werte: function () {
        return [['Durchmesser', '6,5 m'], ['Fläche', '25,4 m²'], ['Segmente', '18 × 1,32 m']];
      }
    },

    webbFangspiegel: {
      name: 'Fangspiegel',
      wozu: 'Ein runder Spiegel von 0,74 m, weit vor dem Hauptspiegel. Er ' +
        'wirft das Licht zurück in die Mitte, wo weitere Spiegel es zu den ' +
        'Instrumenten lenken.',
      woraus: 'Beryllium mit Gold, auf drei Streben von etwa 7,6 m Länge.',
      fakt: 'Die drei Streben und die Sechseck-Form machen das Muster mit ' +
        'sechs großen und zwei kleinen Zacken auf Webb-Bildern.'
    },

    webbInstrumente: {
      name: 'Instrumente',
      wozu: 'Hinter dem Hauptspiegel: vier Instrumente, Kameras und ' +
        'Spektrografen für Infrarot. In der Mitte des Spiegels steckt die ' +
        'Hilfsoptik mit dem dritten Spiegel.',
      woraus: 'Ein Kasten aus Kohlefaser, der in der Kälte die Form hält.',
      fakt: 'Das Instrument für das langwellige Infrarot (MIRI) wird mit einer ' +
        'eigenen Kühlmaschine noch kälter gemacht als der Rest.'
    },

    webbSonnenschild: {
      name: 'Sonnenschild',
      wozu: 'Hält Sonne, Erde und Mond ab, so groß wie ein Tennisplatz. ' +
        'Auf der Sonnenseite ist es heiß, dahinter so kalt, dass das ' +
        'Teleskop seine eigene Wärme nicht mehr sieht.',
      woraus: 'Fünf Lagen Kunststofffolie, dünn wie ein Haar, mit Aluminium ' +
        'bedampft. Zwischen den Lagen strahlt die Wärme zur Seite weg.',
      fakt: 'Der Schild wurde im All entfaltet – mit über hundert ' +
        'Auslösemechanismen, die alle funktionieren mussten.'
    },

    webbBus: {
      name: 'Raumfahrzeug',
      wozu: 'Unter dem Schild, auf der warmen Seite: Solarzellen für Strom, ' +
        'eine Antenne zur Erde, Triebwerke und Treibstoff, um die Bahn um L2 ' +
        'zu halten.',
      woraus: 'Ein Kasten aus Verbundstoff mit Solarflügel und Antenne. ' +
        'Formen hier vereinfacht.',
      fakt: 'Der Start mit der Ariane 5 war so genau, dass der Treibstoff ' +
        'für weit mehr als die geplanten zehn Jahre reicht.'
    }
  });
})(globalThis.OPTIK = globalThis.OPTIK || {});
