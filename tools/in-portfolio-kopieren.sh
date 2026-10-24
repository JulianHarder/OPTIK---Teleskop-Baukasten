#!/bin/bash
# Kopiert die laufende Seite ins Portfolio: ./tools/in-portfolio-kopieren.sh [Portfolio-Ordner]
# Standard: ../PortfolioWebseiteCloudflare (neben diesem Projekt). Kopiert wird nur, was die
# Seite zum Laufen braucht (index.html, css/, js/, lib/) – ohne pruefungen/, screenshots/,
# tools/ und Plandateien. Danach im Portfolio committen und pushen.
set -e
HIER="$(cd "$(dirname "$0")/.." && pwd)"
ZIEL_ROOT="${1:-$HIER/../PortfolioWebseiteCloudflare}"
ZIEL="$ZIEL_ROOT/projekte/optik"

[ -d "$ZIEL_ROOT/projekte" ] || { echo "Portfolio nicht gefunden: $ZIEL_ROOT" >&2; exit 1; }

rm -rf "$ZIEL"
mkdir -p "$ZIEL"
cp "$HIER/index.html" "$ZIEL/"
cp -r "$HIER/css" "$HIER/js" "$HIER/lib" "$ZIEL/"

echo "Kopiert nach: $ZIEL"
echo "Dateien: $(find "$ZIEL" -type f | wc -l), Größe: $(du -sh "$ZIEL" | cut -f1)"
echo "Als Nächstes im Portfolio: git add projekte/optik && git commit && git push"
