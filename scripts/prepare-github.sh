#!/usr/bin/env bash
# Push this project to GitHub for Vercel import (Method A).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -d .git ]]; then
  git init
  git branch -M main
fi

echo "==> Ensure secrets are not committed"
if git ls-files --error-unmatch .env.local 2>/dev/null; then
  echo "ERROR: .env.local is tracked. Run: git rm --cached .env.local"
  exit 1
fi

echo "==> Stage project files"
git add -A
git status -sb

echo ""
echo "Next steps:"
echo "  1. Create empty repo on GitHub (no README)"
echo "  2. git commit -m \"Prepare VINCIS for Vercel deploy\""
echo "  3. git remote add origin https://github.com/YOU/studioos.git"
echo "  4. git push -u origin main"
echo "  5. Open https://vercel.com/new → Import repo → Deploy"
