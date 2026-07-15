#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
git fetch origin main 2>/dev/null || true
PATHS=(
  app/page.tsx
  app/globals.css
  app/layout.tsx
  components/marketing
  components/language-switcher.tsx
  lib/marketing
  lib/studioos/home-hero-space-asset.ts
  lib/studioos/marketing-headline-font.ts
)
git checkout origin/main -- "${PATHS[@]}"
echo "RESTORED_FROM=origin/main" > scripts/.homepage-restore.log
git diff --stat HEAD -- app/page.tsx app/globals.css app/layout.tsx components/marketing lib/marketing >> scripts/.homepage-restore.log 2>&1 || true
echo DONE >> scripts/.homepage-restore.log
