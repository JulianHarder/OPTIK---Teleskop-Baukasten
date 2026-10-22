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

**Fertig: Etappe 1** – Ein Teleskop unter Sternen.

1. **Ein Teleskop unter Sternen** – Three.js r128 lokal (aus SOL), Bühne mit
   Zeichnen bei Bedarf, Nachthimmel (Farbverlauf, ~4 000 Sterne,
   Milchstraße, Hügel am Horizont), Wiese mit Dunst, Mondlicht mit Schatten.
   Ein **Dobson 200/1200** aus prozeduraler Geometrie: Tubus mit
   Beschriftung, Spiegelzelle mit Justierschrauben, **parabolischer**
   Hauptspiegel, Spinne mit 45°-Fangspiegel, Crayford-Okularauszug mit
   Okular, Sucher 8×50, Höhenräder, Rockerbox aus Sperrholz mit
   Teflonlagern, Okularablage, Bodenplatte. Drehen, Zoomen, Verschieben;
   `F` setzt die Kamera zurück, `P` zeigt die Bildrate.

Als Nächstes: **Etappe 2** – Aufschrauben (ganz / aufgeschnitten / zerlegt /
Röntgen, Infokarten).

### Wo vom Plan abgewichen wurde

- **`js/kern/Zufall.js`** ist eine Datei mehr – Zufall mit festem Startwert,
  damit Sterne, Holz und Hügel bei jedem Laden gleich aussehen.
- **`js/ui/Oberflaeche.js`** statt der im Plan genannten UI-Dateien – für
  Etappe 1 reichen Kopfzeile, Tastenleiste und Bildrate.
- **`pruefungen/ansicht.sh` + `pruefungen/blicke.js`** sind dazugekommen:
  Screenshots aus festen Blickwinkeln (siehe „Prüfen“).
- Die Maße (`physik/Optik.js`) stehen schon jetzt in der Physik, nicht erst
  in Etappe 3 – das Modell soll von Anfang an optisch stimmen.

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
- Jedes Netz trägt in `userData.teil` den Namen seines Bauteils (für
  Etappe 2: Infokarten, Zerlegen).
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
- **Das Browser-Pane der Desktop-App hat kein WebGL** – dort erscheint nur
  die Fehlermeldung. Gut zum Prüfen genau dieser Meldung und des Layouts
  schmaler Fenster (Server `optik`, Port 8782,
  `/home/julian/Programmieren/.claude/launch.json`), nicht für die Szene.

## Fallstricke
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
