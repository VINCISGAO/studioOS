#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! command -v vercel >/dev/null 2>&1; then
  echo "Installing Vercel CLI..."
  npm install -g vercel
fi

echo "==> Typecheck"
npm run typecheck

echo "==> Production build"
npm run build

echo "==> Deploy (production)"
if [[ -f .vercel/project.json ]]; then
  echo "    Linked project: $(cat .vercel/project.json)"
fi
vercel deploy --prod --name studio-os-adbridge "$@"

echo ""
echo "Done. Set env vars in Vercel dashboard (Project → Settings → Environment Variables):"
echo "  NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app"
echo "  OPENAI_API_KEY=... (optional, for AI features)"
echo "  NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY (recommended for persistent data)"
