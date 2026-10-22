#!/usr/bin/env bash
# Screenshot der 3D-Szene aus einem bestimmten Blickwinkel – mit kopflosem
# Chrome über file://, also genau wie beim Doppelklick.
#
#   pruefungen/ansicht.sh ausgabe.png [breite höhe] [javascript]
#
# Das JavaScript läuft nach main.js und kann OPTIK.buehne / OPTIK.teleskop
# benutzen, z. B. um die Kamera zu setzen. Danach wird neu gezeichnet.
# Beispiel – Blick vorne in den Tubus:
#   pruefungen/ansicht.sh vorne.png 1400 820 'OPTIK.pruefBlick("vorne")'
set -euo pipefail

ausgabe=$(realpath -m "$1")
breite=${2:-1400}
hoehe=${3:-820}
js=${4:-}

projekt=$(cd "$(dirname "$0")/.." && pwd)
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

# index.html mit absoluten Pfaden kopieren und das Prüf-Skript anhängen
sed -e "s#src=\"#src=\"file://$projekt/#g" -e "s#href=\"css/#href=\"file://$projekt/css/#g" \
  "$projekt/index.html" > "$tmp/seite.html"
cat > "$tmp/pruef.js" <<EOF
${js};
if (OPTIK.buehne) OPTIK.buehne.zeichne();
EOF
sed -i "s#</body>#<script src=\"file://$projekt/pruefungen/blicke.js\"></script><script src=\"file://$tmp/pruef.js\"></script></body>#" "$tmp/seite.html"

timeout 120 google-chrome --headless=new --use-angle=swiftshader --enable-unsafe-swiftshader \
  --hide-scrollbars --user-data-dir="$tmp/profil" --window-size="$breite,$hoehe" \
  --virtual-time-budget=6000 --screenshot="$ausgabe" "file://$tmp/seite.html" >/dev/null 2>&1
echo "$ausgabe"
