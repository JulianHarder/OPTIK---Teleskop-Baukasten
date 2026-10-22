# OPTIK – Projektregeln

## Projekt
Ein **Teleskop in 3D** unter einem Sternenhimmel: drehen, aufschrauben,
das Licht hineinlaufen sehen, selbst zusammenstellen, durchs Okular schauen.
Der vollständige Plan mit allen acht Etappen steht in `OPTIK-Plan.md`.

Die Leitfrage: **Was macht ein Teleskop gut?** Nicht die Vergrößerung,
sondern Öffnung, Spiegelform, Glas und die Luft darüber.

**Wichtig für die Richtung:** Die erste Fassung war eine flache 2D-Werkbank
(Strahlen auf Millimeterpapier). Julian: „nicht das, was ich mir vorstelle“ –
es sah nicht nach Teleskop aus. Seitdem gilt: **Es muss nach dem Ding
aussehen, um das es geht.** Erleben vor technischer Zeichnung; die Physik
arbeitet darunter und sorgt dafür, dass alles stimmt.

## Stand (22.10.2026)

**Fertig: Etappen 1 bis 6.**

1. **Ein Teleskop unter Sternen** – Three.js r128 lokal (aus SOL), Bühne mit
   Zeichnen bei Bedarf, Nachthimmel (Farbverlauf, ~4 000 Sterne,
   Milchstraße, Hügel am Horizont), Wiese mit Dunst, Mondlicht mit Schatten.
   Ein **Dobson 200/1200** aus prozeduraler Geometrie: Tubus mit
   Beschriftung, Spiegelzelle mit Justierschrauben, **parabolischer**
   Hauptspiegel, Spinne mit 45°-Fangspiegel, Crayford-Okularauszug mit
   Okular, Sucher 8×50, Höhenräder, Rockerbox aus Sperrholz mit
   Teflonlagern, Okularablage, Bodenplatte. Drehen, Zoomen, Verschieben;
   `F` setzt die Kamera zurück, `P` zeigt die Bildrate.
2. **Aufschrauben** – vier Ansichten (`1`–`4` oder Schalter unten):
   *ganz*, *aufgeschnitten* (Schnittebene durch die Tubusachse, auf der
   Seite zur Kamera), *zerlegt* (elf Bauteile fahren auseinander, die Kamera
   geht so weit zurück, dass alles ins Bild passt), *Röntgen* (Tubus und
   Spiegelzelle fast durchsichtig). Übergänge gleiten (1,1 s) und lassen
   sich mittendrin umkehren. Schilder an den Bauteilen (zerlegt: alle,
   aufgeschnitten/Röntgen: die innen liegenden), Hervorheben beim
   Darüberfahren, Klick → **Infokarte** mit Wozu, Woraus, Zahlen zum
   aktuellen Teleskop und einem Fakt (`js/daten/teile.js`). `Esc` schließt.

3. **Licht im Teleskop** – Strahlverfolger mit Kegelschnitt-Spiegeln
   (Parabel, Kugel, Hyperbel, Ebene), gedrehten Elementen (`Lage`,
   `imRahmen`) und Feldblende (`physik/Flaeche.js`); das ganze Newton-System
   in `Optik.elementeNewton`. Taste `L` / Knopf „Licht“: Sternlicht als
   Linien, halbdurchsichtiger Lichtkegel, Glühen im Brennpunkt und
   wandernde Lichtpulse (`js/licht/`); wechselt dazu auf „aufgeschnitten“,
   beim Zerlegen aus. Leiste „Sternlicht“: Regler „Stern neben der Mitte“
   (0–1,5°) mit Status *im Bild* / *am Rand (dunkler)* / *nicht im Bild* –
   alles aus der Strahlverfolgung, nichts geschätzt.

4. **Selbst bauen** – linke Spalte mit „Selbst bauen“ (Vorlagen Klein /
   Klassiker / Groß / Riese, Regler für Öffnung 100–400 mm, Brennweite
   f/4–f/10, Okular aus 11 handelsüblichen Brennweiten) und **Datenblatt**
   (11 Kennzahlen mit Ampel und Erklärung zum Aufklappen,
   `physik/Kennzahlen.js`). Das Teleskop baut sich bei jeder Änderung neu
   (`baueTeleskop` in `main.js`, höchstens einmal pro Bild), das alte wird
   freigegeben; beim Loslassen zieht die Kamera nach. Ein Mensch (1,75 m)
   steht zum Größenvergleich daneben und ist anklickbar. Das Teleskop wird
   im Browser gemerkt (`kern/Speicher.js`, `optik.stand.v1`). Auf dem
   Handy sind Bauen und Datenblatt hinter dem Knopf „Bauen“.

5. **Ausrichten und Durchschauen** – Leiste „Beobachten“ (6 Objekte aus
   `js/daten/himmel.js`, Werte nachgesehen mit Quelle; Luft ruhig/normal/
   unruhig). Objekt wählen → Teleskop schwenkt hin, Ring am Himmel, Schild
   „zielt auf …“ vor der Öffnung. `O` / „Durchschauen“: Flug ins Okular,
   Okular-Blick mit ganzem Feld **und Lupe** (`js/okular/`), Okular, Luft
   und Objekt im Okular wechselbar, `Esc` zurück. Physik in
   `physik/Sehen.js` (Unschärfe aus Beugung + Luft, Flächenhelligkeit,
   Grenzgröße). Prüfseite `pruefungen/okular-ansehen.html` (#alle,
   #saturn, #epsilon, #m13, #messung).

6. **Linsenfernrohre** – Bauart-Wahl „Spiegel (Dobson) / Linse
   (Refraktor)“, beim Refraktor Objektiv „Achromat / Eine Linse“, eigene
   Vorlagen und Regelbereiche (`js/daten/bauarten.js`). Glas nach Sellmeier
   (`physik/Glas.js`, BK7 und F2), brechende Flächen (`Flaeche.Brechend`,
   Strahlen tragen ihre Wellenlänge), Refraktor-Optik mit Achromat aus der
   Formel (`physik/Linsenoptik.js`). Modell: blaues Rohr, Taukappe, Linsen
   in echter Form, Zahntrieb, Zenitspiegel, Rohrschellen, Montierungskopf,
   Stativ (`modell/Refraktor.js`, `Stativ.js`). Licht in drei Farben,
   **Brennpunkt-Lupe** oben rechts (30 mm, je Farbe die Randstrahlen).
   Okular-Blick mit Farbhof und seitenverkehrtem Bild (Zenitspiegel).
   Datenblatt-Zeile „Farbsaum“, Infokarten für die neuen Teile.

Als Nächstes: **Etappe 7** – Berühmte Teleskope (dazu jetzt auch Galileis
Fernrohr, das aus Etappe 6 hierher gewandert ist).

### Wo vom Plan abgewichen wurde

- **`js/kern/Zufall.js`** ist eine Datei mehr – Zufall mit festem Startwert,
  damit Sterne, Holz und Hügel bei jedem Laden gleich aussehen.
- **`js/ui/Oberflaeche.js`** statt der im Plan genannten UI-Dateien – für
  Etappe 1 reichen Kopfzeile, Tastenleiste und Bildrate.
- **`pruefungen/ansicht.sh` + `pruefungen/blicke.js`** sind dazugekommen:
  Screenshots aus festen Blickwinkeln (siehe „Prüfen“).
- Die Maße (`physik/Optik.js`) stehen schon jetzt in der Physik, nicht erst
  in Etappe 3 – das Modell soll von Anfang an optisch stimmen.
- **`js/modell/Anbauteile.js`** (Okularauszug, Sucher, Höhenräder) ist aus
  `Newton.js` abgetrennt, als die über 350 Zeilen kam.
- **`js/szene/Animation.js` gibt es nicht** – die Übergänge stecken in
  `Buehne.animiere()`, weil sie die Bildschleife am Laufen halten müssen.
- **Ansicht.js liegt in `js/ui/`**, steuert aber auch Materialien und
  Positionen in der Szene; Dobson.js liefert dafür `zerlegeZiele()`.
- **Der Fangspiegel vignettiert am Feldrand** (ab ~60 % des Feldradius
  verfehlt Licht den Fangspiegel, am Rand kommen ~80 % an). Das ist echt
  und gewollt – der Plan nahm volle Ausleuchtung an. Die Statusanzeige
  sagt es („am Rand, dunkler“).
- **Feldblende** als eigenes Element im Brennpunkt (52° scheinbares Feld);
  sie entscheidet, ob der Stern im Bild ist – nicht die Okularlinse.
- **Licht hält die Bildschleife am Laufen** (`buehne.dauerlauf`), solange
  es sichtbar ist – die Pulse sollen sich bewegen. Aus beim Zerlegen,
  beim Ausschalten und wenn der Tab im Hintergrund ist.
- **Die Spinne ist kein optisches Element** – ihre 1-mm-Streben würden
  kaum Strahlen treffen. Ihre Wirkung (Zacken) kommt im Okular-Blick.
- **Datenblatt und Konfigurator stehen links** (Plan: Datenblatt rechts) –
  rechts sind schon Infokarte und Sternlicht. Die Bedienhinweise sind
  dort als aufklappbare „Bedienung“ untergekommen.
- **Die Bildmitte ist nach rechts verschoben** (`kamera.setViewOffset`,
  `buehne.linksBelegt`), damit das Teleskop in der Mitte des freien
  Bereichs steht. Auf schmalen Bildschirmen (≤ 900 px) nicht.
- **Die Höhe des Okularauszugs wächst mit der Öffnung** (45 + 0,15·D mm,
  bei 200 mm wie bisher 75 mm). Mit festen 75 mm brauchten kleine
  Teleskope Fangspiegel mit über 50 % Abschattung.
- **Brennweite nur im Bereich f/4 bis f/10** (höchstens 3 m): Der Regler
  passt seine Grenzen der Öffnung an. Kennzahlen-Ampel warnt unter f/4,5.
- **Okular wechseln baut nicht neu**, nur Licht und Zahlen – das Modell
  hängt nicht von der Okularbrennweite ab.
- **Die Lupe im Okular-Blick ist dazugekommen.** Ein Bildschirm hat ~750
  Pixel übers Feld, das Auge trennt ~3 100 (1′ bei 52°). Ohne Lupe wäre
  Saturn bei 200-fach ein 20-Pixel-Fleck ohne Cassini-Teilung. Die Lupe
  zeigt die Mitte mit 1 Pixel = 1 Augenpunkt; das Hauptbild zeigt, wie
  klein das Objekt im Feld wirkt.
- **Helligkeit wie empfunden, nicht linear:** Flächen mit der Wurzel der
  Flächenhelligkeit (Stevens-Gesetz), Sterne nach Abstand zur Grenzgröße.
  Der Mond ist bewusst viel zu dunkel (sonst nur weiß).
- **Unschärfe als Gaußglocke** statt Beugungsbild per FFT – reicht zum
  Vergleichen (Cassini-Kontrast: 100/200/300 mm bei ruhiger Luft
  28/52/67 %, bei unruhiger Luft alle ≈ 0–5 %). Das FFT-Beugungslabor
  steht auf der Ideenliste.
- **Kriterium „60 mm sieht keine Cassini-Teilung“** nicht prüfbar – der
  Konfigurator beginnt bei 100 mm. Geprüft: 100 mm schwach, 200 mm klar.
- **Keine Kamerafahrt beim Zielen.** Ein Ziel 30° über dem Horizont passt
  geometrisch nicht mit dem Teleskop in einen 40°-Blick. Stattdessen das
  Schild „zielt auf …“ vor der Tubusöffnung.
- **Himmelsrichtungen der Objekte sind ausgedacht** (nur, damit das
  Teleskop sichtbar schwenkt) – die Leiste sagt das.
- **Galileis Fernrohr wandert nach Etappe 7** (Plan: Etappe 6). Es braucht
  ein Zerstreuungs-Okular und ein eigenes Modell; dort steht es neben den
  anderen historischen Teleskopen.
- **Brennpunkt-Lupe** ist dazugekommen: Die drei Farbkegel liegen nur
  Millimeter auseinander und mischen sich im Hauptbild zu Weiß. Die Lupe
  zeigt den Brennpunkt 30 mm breit, nur die äußersten Strahlen je Farbe
  (Ebene 2) und die Feldblende – echter Maßstab, nichts übertrieben.
- **Farbhof im Okular**: R- und B-Kanal halb scharf, halb als Hof mit
  Durchmesser D·Δz/f² (Δz aus der Strahlverfolgung, ×0,8). Ganz unscharfe
  Kanäle hätten Sternkerne grün und Planeten rosa gefärbt.
- **Jedes Teleskop beschreibt sich selbst**: `bauart`, `randschicht`
  (was geschnitten wird), `zerlegeZiele()`. Ansicht, Licht und main.js
  fragen nur noch das Teleskop, nicht mehr `O.Dobson`.
- Schilder wechseln selbst die Seite, wenn rechts oder links kein Platz ist
  (Handy); `schild: 'links'` in `teile.js` legt die bevorzugte Seite fest.

## Stack
- Vanilla JavaScript, **Three.js r128** (UMD, `lib/three.min.js` +
  `lib/OrbitControls.js`, MIT, aus SOL übernommen). Kein Build.
- **Kein `import`/`export` in `js/`.** Klassische `<script>`-Tags in fester
  Reihenfolge (siehe `index.html`), jede Datei hängt sich an
  `globalThis.OPTIK` (Muster: `(function (O) { … })(globalThis.OPTIK = globalThis.OPTIK || {});`).
  Grund: per Doppelklick über `file://` blockieren Browser ES-Module. Neuere
  Three.js-Versionen gibt es nur noch als Module – deshalb bleibt es bei r128.
- **Kein `fetch`**, keine Bilddateien: Texturen (Holz, Wiese, Schrift) werden
  auf Canvas gerechnet.
- **Nichts aus dem Netz.**
- Inhalte und Kommentare auf Deutsch, Dateinamen deutsch.

## Regeln
- **1 Einheit = 1 mm**, in Szene und Physik gleich.
- **Tubus-Koordinaten** (`physik/Optik.js`): z = optische Achse, Scheitel
  des Hauptspiegels bei z = 0, Öffnung bei +z. Der Okularauszug zeigt unter
  `fokusWinkel` (von +x nach +y). Die Dobson-Gruppe dreht den Tubus so, dass
  seine Achse bei 0° Höhe nach Welt −z zeigt (`modell/Dobson.js`).
- **Maße kommen aus der Optik** (`Optik.masseNewton`), das Modell rechnet
  nichts selbst aus, was die Optik bestimmt (Fangspiegelgröße und -ort,
  Brennpunkt, Tubuslänge).
- **Zeichnen nur bei Bedarf** (`buehne.zeichneBald()`); die Schleife steht
  still, wenn sich nichts bewegt. Kein Dauerlauf, keine Animation ohne Grund.
- Jedes Netz trägt in `userData.teil` den Namen seines Bauteils; dieser
  Name ist der Schlüssel in `js/daten/teile.js`. Bauteil-Gruppen tragen in
  `userData.anker` den Punkt für ihr Schild (`Teile.anker()`).
  `teleskop.teile` (aus `Dobson.erzeuge`) listet alle Bauteil-Gruppen.
- **Ein Teleskop-Objekt** (aus `Dobson.erzeuge` oder `Stativ.erzeuge`)
  hat immer: `bauart, teile, wurzel, azimut, hoehe, tubus, masse,
  okularHoeheMm, randschicht, zerlegeZiele()`; `teile.okular` mit +y als
  Okularachse. Neue Bauarten müssen genau das liefern.
- **Optik für beide Bauarten** über `O.Optik.masse(zustand)` und
  `O.Optik.licht(m, zustand, feld)`. Licht-Ergebnis: `faecher` (Pfade mit
  `farbe` oder null), `ringe: [{farbe, pfade}]`, `imBild`.
- **Umbauen nur über `baueTeleskop()`** (main.js): altes Teleskop
  entsorgen, neues bauen, dann allen Abhängigen das neue geben
  (`auswahl.neuesTeleskop`, `new Ansicht`, `licht.neuesTeleskop`,
  Schilder neu). Wer etwas Neues ans Teleskop hängt, muss dort mitmachen.
- **Geteilte Materialien nie direkt ändern.** Tubus und Spiegelzelle haben
  eigene Kopien (für Schnitt und Röntgen, `Ansicht.eigeneMaterialien`),
  Hervorheben tauscht vorübergehend gegen Leucht-Kopien (`Auswahl.js`).
- **Physik-Dateien kennen kein DOM und kein THREE** (`js/kern/` außer
  `Zufall.js` darf beides nicht brauchen, `js/physik/`) – sonst bricht
  `pruefungen/strahlen-test.js`.
- Farben der Oberfläche in `css/variablen.css`, der Szene in
  `js/szene/Himmel.js` und `Material.js`; Texte in `js/daten/texte.js`.
- Keine Datei über 500 Zeilen. Ab ca. 350 Zeilen aufteilen
  (`modell/Newton.js` steht bei 353 – beim nächsten Zuwachs teilen). Prüfen mit:
  `find js css -name "*.js" -o -name "*.css" | xargs wc -l | sort -n`
- Nur an der aktuellen Etappe arbeiten. Nach jeder Etappe prüft Julian.
- Teleskop- und Himmelsdaten **nachsehen, nicht aus dem Gedächtnis** – Quelle
  als Kommentar daneben.

## Prüfen
- `node pruefungen/strahlen-test.js` – muss „Alles grün.“ melden.
- **Screenshots** mit kopflosem Chrome über file:// (SwiftShader, echtes WebGL):
  `pruefungen/ansicht.sh ausgabe.png [breite höhe] ['OPTIK.pruefBlick("vorne")']`
  Blickwinkel: `vorne`, `okular`, `box`, `hinten` (`pruefungen/blicke.js`).
  Etappen-Screenshot: `pruefungen/ansicht.sh screenshots/etappe-N.png`
- **Ohne Bild prüfen:** endet die Ausgabe auf `.txt`, liefert
  `ansicht.sh` alles, was mit `OPTIK.melde(...)` gemeldet wird.
  `OPTIK.klickAuf('hauptspiegel')` sagt, welches Teil ein Klick auf dessen
  Schild-Punkt treffen würde (prüft Schnitt und Röntgen).
- **Animationen nicht mit der Uhr prüfen:** Im kopflosen Chrome mit
  `--virtual-time-budget` kommen nur ~2 `requestAnimationFrame` und dann
  keine mehr. Übergänge stattdessen von Hand vorantreiben:
  `OPTIK.buehne.schritt(zeit)` in einer Schleife mit selbst gezählter Zeit.
- **Das Browser-Pane der Desktop-App hat kein WebGL** – dort erscheint nur
  die Fehlermeldung. Gut zum Prüfen genau dieser Meldung und des Layouts
  schmaler Fenster (Server `optik`, Port 8782,
  `/home/julian/Programmieren/.claude/launch.json`), nicht für die Szene.

## Fallstricke
- **Additive Farben werden weiß**: Rot, Gelb und Blau übereinander ergeben
  Weiß. Farbunterschiede nur dort zeigen, wo sie sich trennen (Lupe).
- **Strahlen tragen ihre Wellenlänge** (`strahl.lambda`). Wer ein neues
  Element schreibt, muss sie im Ergebnis von `wirke` weitergeben
  (`imRahmen` und der Strahlverfolger tun es, wenn sie fehlt).
- **Linsenradien**: Optiker-Vorzeichen (R > 0 = Mittelpunkt in
  Lichtrichtung, hier −z) → lokale Krümmung c = −1/R.
- **Animation startet Animation:** `buehne.schritt` läuft über eine Kopie
  der Liste – eine fertige Animation darf eine neue anlegen (Schwenken →
  Flug ins Okular). Früher ging die neue dabei verloren.
- **Okular-Blick und `requestAnimationFrame`:** für den kurzen Takt vor
  dem Rechnen Timer benutzen; im kopflosen Chrome kommen kaum Bilder.
- **`material.clone()` erbt `userData.geteilt`.** Wer eine Kopie für ein
  einzelnes Teleskop anlegt, muss `userData` neu setzen – sonst wird die
  Kopie beim Umbau nie freigegeben (`Dobson.entsorge`).
- **Prüfungen mit vielen Umbauten:** Der Software-Renderer braucht pro Bild
  mit Schatten mehrere Sekunden; 40 Umbauten mit Zeichnen sprengen die
  2 Minuten von `ansicht.sh`. 10 reichen, um ein Speicherleck zu sehen
  (`renderer.info.memory` vorher/nachher, Licht dabei an).
- **Parabel ≠ atan(h/f):** Ein Parabolspiegel lenkt einen Strahl in Höhe h
  um 2·atan(h/2f) ab. Prüfwerte mit der Kleinwinkel-Näherung liegen am
  Rand um ~0,15 % daneben – das ist kein Rechenfehler.
- **Kegelschnitt hat zwei Schalen:** Kugel und Hyperboloid schneidet ein
  Strahl zweimal. Gültig ist nur das Stück am Scheitel, Bedingung
  `(1 + k)·c·z < 1` (in `Flaeche.js`).
- **Sofort-Wechsel muss laufende Übergänge abbrechen** (`buehne.stoppe`),
  sonst zieht eine ältere Animation die Ansicht im nächsten Bild zurück.
- **Markieren der Ansicht-Knöpfe** nur über `[data-ansicht]` – der
  Licht-Knopf steht in derselben Leiste und hat seinen eigenen Zustand.
- **Schnittebene und Mausstrahl:** Der Raycaster weiß nichts von
  `clippingPlanes` – er trifft auch weggeschnittene Flächen. `Ansicht.istSichtbar`
  filtert deshalb Treffer hinter der Ebene und fast durchsichtige Flächen.
- **Hochformat:** Kameraabstand mit `buehne.abstandFuer(radius)` rechnen,
  nicht nur mit dem senkrechten Blickwinkel – sonst ragt auf dem Handy das
  Teleskop links und rechts aus dem Bild.
- **Farbraum:** `MeshBasicMaterial`-Farben werden bei der Ausgabe nach sRGB
  umgerechnet, `ShaderMaterial` und Nebel nicht. Wer eine Basic-Farbe an
  Nebel oder Himmelsverlauf anpassen will, muss sie vorher mit
  `convertSRGBToLinear()` umrechnen (siehe Hügel in `Himmel.js`).
- **Schrift auf dem Tubus:** u = 0,25 auf dem Mantel ist die +x-Seite. Der
  Canvas wird um +90° gedreht; mit −90° steht sie auf dem Kopf, mit
  gespiegelter Textur seitenverkehrt (beides ausprobiert).
- **Drehteile (`LatheGeometry`)**: Profil gegen den Uhrzeigersinn angeben
  (r nach rechts, y nach oben), sonst zeigen die Flächen nach innen.
- **`requestAnimationFrame` läuft im verdeckten Fenster nicht** –
  `zeichneBald()` hat deshalb einen Rückfall-Timer.
- **Zoom zum Mauszeiger** stimmt nur, wenn die Mitte *nach* der
  Maßstabsänderung korrigiert wird (aus der 2D-Fassung, gilt wieder für
  den Okular-Blick).
