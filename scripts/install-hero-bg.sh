#!/usr/bin/env bash
# Copies hero background from Cursor chat assets into public/ for local + Vercel deploy.
set -euo pipefail
cd "$(dirname "$0")/.."
node scripts/copy-marketing-assets.mjs
echo "Done. Hero bg: public/images/home-hero-bg.png"
