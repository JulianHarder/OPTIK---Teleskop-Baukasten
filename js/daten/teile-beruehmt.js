/*
  Infokarten der Bauteile der berühmten Teleskope – gleicher Aufbau wie
  js/daten/teile.js (name, wozu, woraus, fakt, innen, schild) und dort
  hineingemischt. Quellen der Zahlen: siehe js/daten/teleskope.js.
*/
(function (O) {
  'use strict';

  Object.assign(O.TEILE, {

    // ---------- Galilei ----------

    galileiRohr: {
      name: 'Rohr',
      wozu: 'Hält die beiden Linsen im richtigen Abstand: Objektiv und ' +
        'Okular stehen genau so weit auseinander, wie sich ihre ' +
        'Brennweiten unterscheiden (980 mm − 47,5 mm).',
      woraus: 'Holz, mit Leder bezogen – einst rot, heute braun – und mit ' +
        'Gold verziert.',
      fakt: 'Galilei verkaufte und verschenkte Fernrohre an Fürsten. Ein ' +
        'schön verziertes Rohr gehörte dazu wie die Linsen selbst.'
    },

    galileiLinse: {
      name: 'Objektiv',
      innen: true,
      wozu: 'Eine einzige Sammellinse, auf einer Seite gewölbt, auf der ' +
        'anderen flach. Sie bündelt das Licht – fast einen Meter dahinter ' +
        'läge ihr Brennpunkt.',
      woraus: 'Glas, von Galilei selbst geschliffen. 37 mm Durchmesser.',
      fakt: 'Die Linse ist noch das Original von 1609/10 – das Okular ' +
        'dagegen ging verloren und wurde später ersetzt.'
    },

    galileiBlende: {
      name: 'Blende',
      innen: true,
      wozu: 'Ein Ring direkt hinter der Linse, der nur ihre Mitte frei lässt: ' +
        '15 mm von 37 mm. Am Rand bildete die Linse unscharf und bunt ab.',
      woraus: 'Ein Ring in der Linsenfassung mit 15 mm Öffnung.',
      fakt: 'Galilei tauschte Licht gegen Schärfe: Mit Blende kommt nur ein ' +
        'Sechstel des Lichts durch. Mit 15 mm sammelt das Fernrohr gerade ' +
        'einmal fünfmal so viel Licht wie dein Auge.'
    },

    galileiOkular: {
      name: 'Okular',
      wozu: 'Eine Zerstreuungslinse, noch vor dem Brennpunkt. Sie macht das ' +
        'Lichtbündel wieder parallel – so sieht das Auge ein vergrößertes, ' +
        'aufrechtes Bild.',
      woraus: 'Eine Linse, auf beiden Seiten nach innen gewölbt, in einer ' +
        'kurzen Fassung. 22 mm Durchmesser.',
      fakt: 'Kepler schlug 1611 vor, stattdessen eine Sammellinse zu nehmen: ' +
        'Das Bild steht dann kopf, aber man sieht viel mehr Himmel. So sind ' +
        'Okulare bis heute gebaut.'
    },

    galileiStaender: {
      name: 'Ständer',
      wozu: 'Hält das Fernrohr ruhig. Bei 21-facher Vergrößerung zittert ' +
        'jedes Bild, das man aus der Hand beobachtet.',
      woraus: 'Holz. Wie Galileis eigener Ständer aussah, ist nicht ' +
        'überliefert – dieser ist ausgedacht.',
      fakt: 'Sein Buch über die neuen Entdeckungen, der „Sidereus Nuncius“, ' +
        'erschien schon im März 1610 – wenige Wochen nach den Jupitermonden.'
    },

    // ---------- Newton ----------

    newtonRohr: {
      name: 'Rohr',
      wozu: 'Kaum länger als eine Hand: 16 cm. Es hält Hauptspiegel, ' +
        'Fangspiegel und Okular zusammen – mehr braucht ein Spiegelteleskop nicht.',
      woraus: 'Bei den Nachbauten Holz und Messing.',
      fakt: 'Das erste Exemplar von 1668 lieh Newton einem Instrumentenbauer ' +
        'aus. Danach verliert sich seine Spur.'
    },

    newtonHauptspiegel: {
      name: 'Hauptspiegel',
      innen: true,
      wozu: 'Ein hohler Metallspiegel am Boden des Rohrs. Er sammelt das Licht ' +
        'wie eine Linse, aber ohne Farbsaum: Spiegel werfen alle Farben ' +
        'gleich zurück. Newton schliff ihn kugelförmig – das war einfacher ' +
        'als eine Parabel wie in deinem Dobson.',
      woraus: 'Spiegelmetall: sechs Teile Kupfer, zwei Teile Zinn – ' +
        'gegossen, geschliffen und poliert von Newton selbst.',
      fakt: 'Spiegelmetall wird schnell matt. Wer so ein Teleskop besaß, ' +
        'musste den Spiegel immer wieder neu polieren. Glasspiegel mit ' +
        'Silberschicht gibt es erst seit dem 19. Jahrhundert.'
    },

    newtonFangspiegel: {
      name: 'Fangspiegel',
      innen: true,
      wozu: 'Ein kleiner flacher Spiegel unter 45° vorne im Rohr. Er lenkt ' +
        'das Licht zur Seite hinaus – Newtons eigentliche Erfindung. ' +
        'Bis heute heißt diese Bauart „Newton“.',
      woraus: 'Spiegelmetall, flach poliert.',
      fakt: 'Dein Dobson ist genau so gebaut – nur 300 Jahre später ' +
        'auf eine Holzkiste gesetzt.'
    },

    newtonOkular: {
      name: 'Okular',
      wozu: 'Eine winzige Sammellinse an der Seite des Rohrs. Ihre kurze ' +
        'Brennweite ergibt die 35-fache Vergrößerung.',
      woraus: 'Messingfassung mit einer Linse, auf einer Seite flach.',
      fakt: 'Ganz ohne Linse kam Newton also doch nicht aus – aber eine ' +
        'kleine Linse direkt vor dem Auge macht kaum Farbsaum.'
    },

    newtonKugelgelenk: {
      name: 'Kugelgelenk',
      wozu: 'Das Rohr sitzt auf einer Kugel in einer Pfanne. So lässt es sich ' +
        'in jede Richtung kippen und drehen.',
      woraus: 'Holz und Messing.',
      fakt: 'Auf so einem Kugelgelenk stand Newtons zweites Teleskop, ' +
        'das 1671 an die Royal Society ging.'
    },

    newtonTisch: {
      name: 'Tisch',
      wozu: 'Nur zum Draufstellen – auf dem Boden wäre das kleine Teleskop ' +
        'neben dem Menschen kaum zu finden.',
      woraus: 'Holz.',
      fakt: 'Ende 1671 kam Newtons zweites Teleskop zur Royal Society nach ' +
        'London. Wenige Wochen später wurde Newton ihr Mitglied.'
    },

    // ---------- Yerkes ----------

    yerkesRohr: {
      name: 'Rohr',
      wozu: 'Hält das Objektiv 19 Meter vor dem Okular. In der Mitte ist es ' +
        '1,27 m dick, zu den Enden hin schlanker.',
      woraus: 'Blech, in der Mitte gut 6 mm stark, an den Enden 3 mm. ' +
        'Zusammen 6 Tonnen.',
      fakt: 'Lange Brennweiten machen weniger Farbsaum – deshalb sind große ' +
        'Linsenfernrohre so lang. Probier es im eigenen Linsenfernrohr: ' +
        'f/15 statt f/5.'
    },

    yerkesObjektiv: {
      name: 'Objektiv',
      innen: true,
      wozu: 'Zwei Linsen von 102 cm Durchmesser – ein Achromat, wie in deinem ' +
        'Linsenfernrohr, nur zehnmal größer.',
      woraus: 'Kronglas und Flintglas. Die Rohlinge goss Mantois in Paris, ' +
        'geschliffen hat sie Alvan Clark & Sons in Massachusetts. ' +
        'Zusammen 225 kg.',
      fakt: 'Bezahlt hat das alles der Geschäftsmann Charles T. Yerkes – ' +
        'daher der Name.'
    },

    yerkesOkularende: {
      name: 'Okularende',
      wozu: 'Hier sitzt der Beobachter. Daran hängen Okular, kleine ' +
        'Suchfernrohre und Griffe, um das Teleskop fein zu bewegen.',
      woraus: 'Metall. Die Einzelheiten sind hier vereinfacht.',
      fakt: 'Zeigt das Teleskop hoch hinauf, hängt das Okularende tief unten. ' +
        'Damit man immer hinkam, fährt der ganze Boden der Kuppel auf und ab.'
    },

    yerkesMontierung: {
      name: 'Montierung',
      wozu: 'Eine Achse zeigt genau zum Himmelspol, parallel zur Erdachse. ' +
        'Dreht man das Teleskop langsam um sie, folgt es den Sternen – ' +
        'gegen die Drehung der Erde.',
      woraus: 'Metall, gebaut von Warner & Swasey in Cleveland.',
      fakt: 'Die Polachse steht so schräg, wie der Ort auf der Erde liegt: ' +
        'In Williams Bay sind das 42,6° – in Deutschland wären es ' +
        '48° bis 55°.'
    },

    yerkesGegengewicht: {
      name: 'Gegengewicht',
      wozu: 'Hält dem 6-Tonnen-Rohr auf der anderen Seite der Achse die ' +
        'Waage. Erst dann lässt sich das Teleskop leicht drehen und bleibt ' +
        'stehen, wo man es hinschiebt.',
      woraus: 'Metall.',
      fakt: 'Dieselbe Idee wie eine Wippe: Was auf der einen Seite schwerer ' +
        'ist, muss auf der anderen dichter an der Achse sitzen.'
    },

    yerkesSaeule: {
      name: 'Säule',
      wozu: 'Trägt das Teleskop 12 m hoch. Der bewegliche Boden fährt um ' +
        'sie herum, ohne sie zu berühren – so wackelt nichts, wenn jemand ' +
        'herumläuft.',
      woraus: 'Gusseisen, in vier Stücken. Teleskop und Säule wiegen ' +
        'zusammen etwa 75 Tonnen.',
      fakt: 'Ihre Form ist hier vereinfacht – die Höhe von 12 m stimmt.'
    }
  });
})(globalThis.OPTIK = globalThis.OPTIK || {});
