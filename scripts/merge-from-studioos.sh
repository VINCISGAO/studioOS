#!/usr/bin/env bash
# Merge studioOS working-copy fixes into VINCIS (canonical repo with .git).
set -euo pipefail

SRC="${1:-/Users/linkele/Projects/studioOS}"
DST="${2:-/Users/linkele/Projects/VINCIS}"

if [[ ! -d "$SRC" || ! -d "$DST" ]]; then
  echo "Usage: $0 [studioOS-path] [VINCIS-path]"
  exit 1
fi

echo "Merging $SRC -> $DST"

rsync -a \
  --exclude node_modules \
  --exclude .next \
  --exclude .git \
  --exclude work \
  --exclude .npm-cache \
  --exclude .env \
  --exclude .env.local \
  --exclude '.env.*' \
  "$SRC/" "$DST/"

echo "Done. Verify from VINCIS:"
echo "  cd $DST"
echo "  npm run typecheck && npm run build && npm run production:verify"
