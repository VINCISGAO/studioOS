#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

echo "=== git status (before) ==="
git status -sb

# Never commit macOS metadata if tracked
git restore --staged .DS_Store 2>/dev/null || true
git checkout -- .DS_Store 2>/dev/null || true

git add -A
git restore --staged .DS_Store 2>/dev/null || true

if git diff --cached --quiet; then
  echo "Nothing staged to commit."
  exit 0
fi

echo "=== staged ==="
git diff --cached --stat

git commit -m "$(cat <<'EOF'
Lock homepage golden baseline and ship production-ready fixes.

Document 2026-07-10 mobile/iPad/desktop layout freeze with HomeHeroVideo preserved; add card-style mobile nav and responsive hero/cost-table polish. Fix brand wizard entry redirects, upload gates, and payment webhook idempotency. Resolve typecheck blockers for production:verify.
EOF
)"

echo "=== pushing ==="
branch="$(git branch --show-current)"
git push -u origin "$branch"

echo "=== done ==="
git status -sb
git log -1 --oneline
