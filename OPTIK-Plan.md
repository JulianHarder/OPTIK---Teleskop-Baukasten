# OPTIK – Teleskop-Baukasten in 3D

## Kontext

OPTIK ist ein **Teleskop in 3D**, das man drehen, aufschrauben und selbst
zusammenstellen kann. Es steht unter einem Sternenhimmel. Man kann es
aufschneiden oder in seine Teile zerlegen und sieht dabei, wie das Licht eines
Sterns hineinfällt, am Spiegel umkehrt und im Okular landet. Am Ende schaut
man hindurch und sieht, was genau dieses Teleskop am Himmel zeigen würde.

**Neuausrichtung am 22.10.2026:** Die erste Fassung des Plans war eine flache
optische Bank (Strahlen auf Millimeterpapier). Nach Etappe 1 war klar, dass
das nicht nach Teleskop aussieht. Julian wollte ein Teleskop, das man in 3D
baut und aufschraubt. Die Physik von damals bleibt erhalten: Der
Strahlverfolger rechnet schon in 3D und wird hier weiterbenutzt. Nur die
Darstellung wechselt von 2D-Zeichnung zu 3D-Modell.

Die Leitfrage bleibt:

> **Was macht ein Teleskop gut?** Nicht die Vergrößerung, sondern die
> Öffnung – und die Form der Spiegel, das Glas und die Luft darüber.

Portfolio-Kategorie: **„Entdecken“** (neben SOL und FRAKTAL, weil man sich
darin umsieht). Das wird bei Etappe 8 noch einmal abgestimmt.

---

## Was man tut

| Erlebnis | So sieht es aus |
| --- | --- |
| **Ansehen** | Ein Dobson-Teleskop steht auf einer Wiese unter dem Sternenhimmel. Man dreht die Kamera darum herum, zoomt heran und sieht Rändelschrauben, Sucherfernrohr und Holzmaserung. |
| **Aufschrauben** | Drei Ansichten: **ganz**, **aufgeschnitten** (der Tubus wird der Länge nach geöffnet) und **zerlegt** (die Teile schweben auseinander, jedes ist beschriftet). Ein Klick auf ein Teil öffnet eine Infokarte: was es ist, wozu es dient, ein Fakt. |
| **Licht sehen** | Leuchtende Strahlen fallen in den Tubus, treffen den Hauptspiegel, sammeln sich zum Lichtkegel, werden vom Fangspiegel zur Seite gelenkt und laufen ins Okular. Lichtpulse wandern sichtbar mit. Alles kommt aus dem echten Strahlverfolger, nichts ist aufgemalt. |
| **Bauen** | Regler für Öffnung, Brennweite und Okular. Das Modell wächst und schrumpft live mit: Ein 300-mm-Dobson steht dann neben einem Menschen und ist größer als er. Das Datenblatt zeigt dazu Vergrößerung, Auflösung und Lichtsammelvermögen mit Ampel und Erklärung. |
| **Ausrichten** | Ein Objekt am Himmel anwählen (Saturn, Mond, Albireo …). Das Teleskop schwenkt hin, die Rockerbox dreht sich, der Tubus neigt sich. |
| **Durchschauen** | Klick aufs Okular: Die Kamera fliegt hinein, es wird schwarz, dann erscheint der Blick durchs Okular. Saturn ist so groß, so scharf und so hell, wie dieses Teleskop ihn zeigt. |
| **Berühmte Teleskope** | Galileis Fernrohr, Newtons erstes Spiegelteleskop, der Yerkes-Refraktor, Hubble und James Webb (mit goldenen Sechsecken und Sonnenschild). Jedes mit Steckbrief, zum Aufschrauben und mit Mensch daneben zum Größenvergleich. |

---

## Was OPTIK bewusst nicht ist

- **Kein CAD-Programm.** Man stellt Größen mit Reglern ein, man setzt keine
  Teile frei zusammen. Das Teleskop baut sich aus den Werten selbst.
- **Die Modelle sind vereinfacht**, aber maßstabsgerecht: Tubuslänge,
  Spiegeldurchmesser und Fangspiegelgröße stimmen mit der Optik überein.
- **Der Okular-Blick ist eine Simulation**, kein Foto. Er zeigt die
  Unterschiede richtig (dieses Teleskop zeigt die Cassini-Teilung, jenes
  nicht), und das steht auch so auf der Seite.

---

## Technik

### Grundsätze (wie bei allen Projekten)

- Start per **Doppelklick** auf `index.html`, **nichts aus dem Netz**.
- **Three.js r128 lokal** in `lib/`. Es wird aus SOL übernommen, das dieselbe
  Version schon eingebettet hat. Es ist die UMD-Fassung (`THREE` als globale
  Variable) und läuft deshalb über `file://` ohne Module. Dazu kommt
  `OrbitControls` in der Nicht-Modul-Fassung derselben Version und die
  MIT-Lizenz als `lib/LIZENZ-three.txt`.
- Eigener Code: klassische `<script src>`-Tags, alles hängt an
  `globalThis.OPTIK`, kein `import`/`export`, kein `fetch`.
- Kommentare und Inhalte auf Deutsch, Dateinamen deutsch.
- Keine Datei über 500 Zeilen, ab ~350 aufteilen.
- Daten (Bauarten, Teile-Infos, Teleskope, Himmelsobjekte, Glas) in
  `js/daten/`, nicht im Code.

### Grafiklast im Griff (Lehre aus LANDFALL)

LANDFALL hatte Chrome mit zu viel Grafik in die Knie gezwungen. Deshalb:

- **Gezeichnet wird nur bei Bedarf**: wenn die Kamera sich bewegt, eine
  Animation läuft oder sich etwas ändert. Im Stillstand steht die Schleife.
- `devicePixelRatio` höchstens 2. Höchstens **ein** Licht wirft Schatten,
  mit kleiner Schattenkarte, und das nur, wenn es gut aussieht.
- Geometrie mit maßvoller Unterteilung (Tubus 64 Segmente, nicht 512).
- **Beim Umbauen alte Geometrie und Materialien freigeben** (`dispose()`).
  Sonst läuft bei jedem Reglerzug der Grafikspeicher voll.
- Ist der Tab im Hintergrund (`document.hidden`), läuft nichts.
- Fällt WebGL aus, steht ein klarer Hinweis da statt einer schwarzen Fläche.

### Maße

**1 Einheit in der Szene = 1 mm**, genau wie im Strahlverfolger. So sitzen
Lichtstrahlen und Modell ohne Umrechnung aufeinander. Die Kamera bekommt
`near`/`far` passend zur Größe des gezeigten Teleskops (ein Okular aus der
Nähe und Webb aus der Ferne brauchen andere Werte). Den Sternenhimmel zeichnet
eine eigene Szene ohne Tiefe, damit er nie abgeschnitten wird.

### Ordner

```
OPTIK---Teleskop-Baukasten/
  index.html
  CLAUDE.md  README.md  OPTIK-Plan.md  .gitignore
  screenshots/  pruefungen/
  lib/three.min.js  lib/OrbitControls.js  lib/LIZENZ-three.txt

  css/variablen.css             Farben, Abstände, Schrift
  css/grundlage.css             Vollbild-Bühne, schwebende Leisten
  css/leisten.css               Konfigurator, Datenblatt, Ansicht-Schalter
  css/karten.css                Infokarten, Beschriftungen, Steckbriefe
  css/okular.css                Okular-Blick, Übergang

  js/daten/texte.js             Oberflächentexte, Erklärungen
  js/daten/teile.js             Infokarten der Bauteile
  js/daten/bauarten.js          Newton/Dobson, Refraktor, Galilei, Cassegrain
  js/daten/teleskope.js         berühmte Teleskope mit Quellen
  js/daten/himmel.js            Himmelsobjekte mit echten Größen
  js/daten/glaeser.js           Sellmeier-Werte (BK7, F2)

  js/kern/                      Vektor, Format, Ereignisse, Zustand, Speicher, Adresse
  js/physik/                    Flaeche (Kegelschnitt), Wechselwirkung, Strahlverfolger,
                                Paraxial, Glas, Kennzahlen, Optik (Bauart → Elemente)

  js/szene/Buehne.js            Renderer, Kamera, OrbitControls, Zeichnen bei Bedarf
  js/szene/Himmel.js            Sternenhimmel, Milchstraße
  js/szene/Umgebung.js          Boden, Licht, Spiegelungen
  js/szene/Material.js          Lack, Holz, Spiegel, Glas, Metall
  js/szene/Animation.js         sanfte Übergänge (Ein-/Ausfahren, Schwenken)
  js/szene/Auswahl.js           Teil unter der Maus finden (Raycaster)
  js/szene/Beschriftung.js      HTML-Schilder, die an 3D-Punkten hängen

  js/modell/Teile.js            Bausteine: Spiegel, Spinne, Okular, Sucher, Schrauben
  js/modell/Newton.js           Tubus mit Spiegelzelle, Fangspiegel, Okularauszug
  js/modell/Dobson.js           Rockerbox mit Seitenlagern
  js/modell/Refraktor.js        Linsenfernrohr mit Taukappe, Zenitspiegel, Stativ
  js/modell/Galilei.js          historisches Fernrohr
  js/modell/Hubble.js  Webb.js  Yerkes.js
  js/modell/Mensch.js           Silhouette, 1,75 m, zum Größenvergleich

  js/licht/Strahlenbild.js      Pfade aus dem Strahlverfolger → leuchtende Linien
  js/licht/Lichtpulse.js        wandernde Lichtpunkte
  js/licht/Lichtkegel.js        halbdurchsichtiger Kegel zum Brennpunkt

  js/okular/Objekte.js          Saturn, Jupiter, Mond, Doppelsterne, Sternhaufen
  js/okular/Okularblick.js      Bild aus Vergrößerung, Auflösung, Helligkeit, Seeing

  js/ui/Ansicht.js  Konfigurator.js  Datenblatt.js  Infokarte.js
  js/ui/Ausrichten.js  Steckbriefe.js  Hilfe.js

  js/main.js
```

Der 2D-Teil von Etappe 1 (`js/werkbank/`, `js/ui/Bauteilfenster.js`, `css/werkbank.css`)
wird entfernt. Übernommen werden `js/kern/Vektor.js`, `Format.js`,
`Ereignisse.js`, `js/physik/Paraxial.js`, `Strahlverfolger.js` und
`pruefungen/strahlen-test.js`.

---

## Technischer Kern

### 1. Das Teleskop entsteht aus Zahlen

Der Zustand enthält keine 3D-Objekte, sondern Werte:

```
{ bauart: 'dobson', oeffnungMm: 200, brennweiteMm: 1200, okularMm: 25, … }
```

Daraus entstehen **zwei Dinge aus derselben Quelle**:

- `physik/Optik.js` → die **optischen Elemente** (Parabolspiegel bei z = 0,
  Fangspiegel unter 45° bei z = f − Seitenabstand, Okular als ideale Linse)
- `modell/Newton.js` → das **3D-Modell** (Tubuslänge ≈ f + Reserve, Fangspiegel
  so groß wie optisch nötig, Okularauszug genau dort, wo der Brennpunkt
  herauskommt)

Deshalb passen Strahlen und Modell immer zusammen. Ändert man die Brennweite,
wird der Tubus länger, und die Strahlen treffen trotzdem genau ins Okular.

**Fangspiegelgröße:** Die kleine Achse beträgt mindestens
`D · (Abstand Fangspiegel → Fokus) / f` plus Rand fürs Bildfeld. Sie wird
gerechnet, nicht geschätzt.

### 2. Strahlverfolger mit Spiegeln

Vorhanden ist ein nichtsequentieller 3D-Strahlverfolger mit idealer Linse.
Dazu kommen **Kegelschnittflächen**:

```
c·(x² + y²) − 2z + (1 + k)·c·z² = 0      c = 1/R,  k = 0 Kugel, −1 Parabel, < −1 Hyperbel
```

Den Strahl einsetzen ergibt eine quadratische Gleichung in t (kleinste Lösung
> ε innerhalb des Durchmessers). Die Normale ist der Gradient, bei c = 0
(Ebene) gibt es einen eigenen linearen Zweig. Reflexion: `r = d − 2(d·n)n`.
Die Rückseite eines Spiegels schluckt den Strahl, dadurch entsteht der
Schatten des Fangspiegels von selbst. Flächen können verschoben und gedreht
werden (Fangspiegel unter 45°): Der Strahl wird dazu in das eigene
Koordinatensystem der Fläche umgerechnet und zurück.

Für Linsenfernrohre (Etappe 6) kommen **Brechung nach Snellius** und
**Glas nach Sellmeier** dazu (BK7: n_d ≈ 1,5168; F2: n_d ≈ 1,6200). Weißes
Licht wird in Rot, Grün und Blau zerlegt, und man sieht den Farbfehler einer
einfachen Linse als drei Lichtkegel, die nicht im selben Punkt enden.

### 3. Licht sichtbar machen

- **Strahlen** als Linien mit additiver Mischung, sie leuchten also, wo sie
  sich überlagern. Der Fokus wird dadurch von selbst zum hellsten Punkt.
- **Lichtpulse**: kleine leuchtende Punkte, die mit gleichmäßiger
  Geschwindigkeit die Pfade entlanglaufen. Man sieht die Richtung und dass
  das Licht hin und zurück läuft.
- **Lichtkegel**: ein Ring aus Strahlen über den ganzen Spiegel ergibt einen
  halbdurchsichtigen Kegel vom Hauptspiegel zum Fangspiegel und weiter.
- **Stern neben der Mitte**: Zielt das Teleskop nicht genau auf den Stern,
  fällt das Licht schräg ein und der Brennpunkt wandert aus dem Okular. Das
  Okular zeigt dann „Stern nicht im Bild“. So sieht man, wozu das
  Sucherfernrohr da ist.

### 4. Aufschrauben

| Ansicht | Technik |
| --- | --- |
| ganz | normales Modell |
| aufgeschnitten | **Schnittebene** (`clippingPlanes`), die über ~0,8 s durch den Tubus fährt. Die Innenseite ist mattschwarz (wie echt, gegen Streulicht). |
| zerlegt | Jedes Teil hat eine Ziel-Verschiebung (Hauptspiegel nach hinten, Fangspiegel nach oben, Okular nach außen …) und fährt sanft dorthin. Beschriftungen erscheinen. |
| Röntgen | Tubus halbdurchsichtig, Optik und Licht voll sichtbar |

**Infokarten** (`teile.js`): Name, wozu, woraus, ein Fakt. Beispiel
Fangspiegel: *„Ein flacher Spiegel unter 45°. Er lenkt das Licht zur Seite
aus dem Tubus, sonst müsste dein Kopf vorne im Rohr stecken – und würde das
Licht abdecken.“*

### 5. Datenblatt

| Kennzahl | Formel | Ampel |
| --- | --- | --- |
| Vergrößerung | V = f / f_Okular | rot über 2·D(mm): „leere Vergrößerung“ |
| Austrittspupille | AP = D / V | rot unter 0,5 mm, gelb über der Augenpupille (7 mm) |
| Öffnungsverhältnis | f / D | – |
| Auflösung | ≈ 138″ / D(mm) (Rayleigh, 550 nm) | gelb, wenn das Seeing schlechter ist |
| Lichtsammelvermögen | (D / 7 mm)² × Auge | – |
| Grenzgröße | ≈ 2,7 + 5·log₁₀ D(mm) (Faustformel) | – |
| wahres Gesichtsfeld | scheinbares Feld / V | – |
| Tubuslänge | aus dem Modell | – |

Jede Kennzahl hat eine Erklärung in einem Satz, sichtbar beim Darüberfahren.
Faustformeln sind als solche gekennzeichnet.

### 6. Durchschauen

- **Flug ins Okular**: Die Kamera fährt in ~1,2 s vor das Okular, ein
  schwarzer Rand zieht sich zum Kreis zusammen, dann kommt der Okular-Blick
  (2D-Canvas). Mit `Esc` geht es zurück.
- **Okular-Blick**: Das Objekt wird in echter Winkelgröße gezeichnet (Saturn
  ≈ 18″ Scheibe, ≈ 40″ Ringe, nachsehen), vergrößert mit V, beschnitten auf
  das wahre Gesichtsfeld, weichgezeichnet mit max(Rayleigh, Seeing),
  abgedunkelt nach der Austrittspupille. Das Bild steht kopf wie im echten
  Newton. Die Fangspiegelstreben erzeugen bei hellen Sternen die typischen
  vier Zacken.
- **Objekte**: Saturn, Jupiter mit Monden, Mond am Terminator, Albireo,
  Epsilon Lyrae (Doppeldoppelstern als Auflösungstest), ein
  Kugelsternhaufen.

### 7. Berühmte Teleskope

Prozedurale, vereinfachte Modelle mit nachgesehenen Maßen (Quelle als
Kommentar):

- **Galileis Fernrohr** (1609/10): Lederrohr, kleine Linse, ~20-fach
- **Newtons Spiegelteleskop** (1668): handgroß, das erste seiner Art
- **Yerkes-Refraktor** (1897): größter Linsenrefraktor, ~1 m Linse,
  ~19 m Rohr
- **Hubble** (1990): 2,4 m, im All, mit Solarpaneelen, dazu die Geschichte
  vom falsch geschliffenen Spiegel
- **James Webb** (2021): 6,5 m, 18 goldene Sechsecke, Sonnenschild so groß
  wie ein Tennisplatz

Bei jedem steht der Mensch daneben. Hubble und Webb stehen nicht auf der
Wiese, sondern vor Schwarz und Sternen.

---

## Design

- **Vollbild-3D**, die Bedienung schwebt darüber in halbdurchsichtigen,
  dunklen Leisten. Links der Konfigurator, rechts das Datenblatt (einklappbar),
  unten mittig der Ansicht-Schalter *ganz · aufgeschnitten · zerlegt ·
  Röntgen* und *Licht an/aus*, oben die Bauart-Wahl.
- **Stimmung**: Nacht, aber nicht stockdunkel. Blaues Mondlicht von der Seite,
  schwaches Himmelslicht von oben, damit man das Teleskop gut erkennt.
  Licht der Strahlen warmweiß bzw. in Spektralfarben.
- **Materialien**: weiß lackierter Tubus, Rockerbox aus hellem Holz,
  schwarze Kunststoffteile, Spiegel mit Spiegelung des Himmels.
- Auf dem Handy: Leisten als ausklappbare Knöpfe, Drehen mit einem Finger,
  Zoomen mit zwei.

### Tasten

| Taste | Wirkung |
| --- | --- |
| Maus ziehen / Rad | drehen / zoomen |
| Rechts ziehen | verschieben |
| `1` `2` `3` `4` | ganz / aufgeschnitten / zerlegt / Röntgen |
| `L` | Licht an/aus |
| `O` | ins Okular schauen |
| `F` | Kamera aufs ganze Teleskop |
| `H` | Hilfe |
| `Esc` | zurück / Karte schließen |

---

## Etappen

Jede Etappe endet mit einer laufenden Seite, einem Screenshot und dem Stand in
`CLAUDE.md`. **Nach jeder Etappe schaut Julian drüber.** Schon ab Etappe 1
soll es nach Teleskop aussehen.

1. **Ein Teleskop unter Sternen.** Three.js aus SOL nach `lib/` übernehmen,
   2D-Teile entfernen, Bühne mit Zeichnen bei Bedarf, Sternenhimmel, Wiese,
   Mondlicht. Ein **Dobson 200/1200** aus prozeduraler Geometrie: Tubus,
   Spiegelzelle, Spinne mit Fangspiegel, Okularauszug mit Okular, Sucher,
   Rockerbox mit Seitenlagern. Drehen und Zoomen.
   *Fertig, wenn es auf den ersten Blick nach Teleskop aussieht.*
2. **Aufschrauben.** Ansichten ganz / aufgeschnitten / zerlegt / Röntgen mit
   sanften Übergängen, Beschriftungen, Klick auf ein Teil → Infokarte.
3. **Licht im Teleskop.** Kegelschnittflächen, Spiegel, gedrehte Flächen im
   Strahlverfolger (mit node-Tests: Parabolspiegel trifft auf < 1e-9 mm),
   Strahlen, Lichtpulse und Lichtkegel in der Szene, Stern neben der Mitte.
   *Fertig, wenn das Licht sichtbar ins Okular läuft und die Tests grün sind.*
4. **Selbst bauen.** Konfigurator (Öffnung, Brennweite, Okular), Modell und
   Strahlen bauen sich live um (mit `dispose()`), Datenblatt mit Ampeln,
   Mensch zum Vergleich, Speichern im Browser.
5. **Ausrichten und Durchschauen.** Objekt wählen → Teleskop schwenkt hin,
   Flug ins Okular, Okular-Blick mit den Objekten, zurück mit `Esc`.
   *Fertig, wenn Saturn mit 200 mm die Cassini-Teilung zeigt und mit 60 mm
   nicht.*
6. **Linsenfernrohre.** Refraktor auf Stativ und Galilei-Fernrohr, Brechung
   und Glas, Farbfehler in drei Farben (sichtbar im Strahlengang und als
   Farbsaum im Okular), Achromat als Lösung.
7. **Berühmte Teleskope.** Newton 1668, Yerkes, Hubble, Webb mit
   Steckbriefen, Mensch zum Größenvergleich, Weltraum-Hintergrund.
   Geteilt in **7a** (Galilei, Newton 1668, Yerkes – fertig 23.10.2026) und
   **7b** (Hubble und Webb vor dem Weltraum).
8. **Feinschliff und Portfolio.** Hilfe, Link zum eigenen Teleskop, Handy,
   README, Kopie ins Portfolio, Eintrag in `projekte-entdecken.js`.
   **Push erst auf Zuruf.**

---

## Fallstricke, die eingeplant sind

- **Grafikspeicher läuft voll**, wenn beim Umbauen alte Geometrie nicht mit
  `dispose()` freigegeben wird. Prüfung: 100 Reglerzüge, danach
  `renderer.info.memory` vergleichen.
- **z-Fighting / Abschneiden**: Bei 1 Einheit = 1 mm ist ein Okular 30
  Einheiten groß und Webb 20 000. `near`/`far` werden je Teleskop gesetzt, der
  Himmel liegt in einer eigenen Szene.
- **Schnittebene schneidet alles**: Nur Tubus und Rockerbox bekommen die
  Schnittebene, Spiegel, Licht und Okular nicht. Sonst verschwindet das
  Interessante mit.
- **Achsen**: Der Strahlverfolger nimmt z als optische Achse, Three.js hat y
  oben. Die Umrechnung steht an **einer** Stelle (eine Gruppe, die das
  optische System in die Lage des Tubus dreht). Die Strahlen hängen in
  derselben Gruppe wie das Modell und drehen beim Schwenken mit.
- **`requestAnimationFrame` im verdeckten Fenster** läuft nicht. Für
  Screenshots gibt es zusätzlich einen Timer (wie in Etappe 1).
- **Three.js r128 ist alt.** Es gibt keine Updates, aber es ist erprobt
  (SOL) und läuft ohne Module. Ein Wechsel auf eine neue Version wäre nur mit
  ES-Modulen möglich, und die gehen über `file://` nicht.
- **Zahlen aus dem Gedächtnis**: alle Daten zu Teleskopen und Himmelsobjekten
  nachsehen, Quelle als Kommentar.

## Prüfen

- `node pruefungen/strahlen-test.js`: Physik ohne Browser, muss grün sein.
- `index.html` per Doppelklick: keine Konsolenfehler, kein Netzwerkzugriff.
- Screenshot mit kopflosem Chrome über `file://` (Befehl in `CLAUDE.md`).
- **Flüssig**: Drehen im Vollbild ohne Ruckeln. Im Stillstand zeigt die
  Bildrate-Anzeige (Taste `P`, nur zum Prüfen) 0 Bilder pro Sekunde.
- **Schmal**: 375×812, alles erreichbar.
- Zeilen zählen: keine Datei über 500.

## Ideenliste (nicht Teil des Plans)

- Beugungslabor: Form der Öffnung → Beugungsbild per FFT (Zacken von Hubble
  und Webb exakt berechnet)
- Schmidt-Cassegrain mit Korrekturplatte
- Teleskop selbst aus einzelnen Teilen zusammenstecken (Drag & Drop)
- Seeing als flimmernde Animation im Okular
