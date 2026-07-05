#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo ""
echo "========================================"
echo "  VINCIS / studioos — Vercel deploy"
echo "========================================"
echo ""

echo ">>> Step 1/2: Production build"
echo "    (Usually 1–3 minutes. Not frozen — webpack is working.)"
echo ""
npm run build
echo ""
echo ">>> Build OK"
echo ""

echo ">>> Step 2/2: Upload to Vercel (--yes = no prompts)"
echo ""
if ! npx vercel --prod --yes; then
  echo ""
  echo "!!! Vercel failed. If you see 'not logged in', run once:"
  echo "    npx vercel login"
  echo "    bash scripts/deploy-fast.sh"
  exit 1
fi

echo ""
echo ">>> Deploy finished. Open the Production URL above on another network."
echo ""
