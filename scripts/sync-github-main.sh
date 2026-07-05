#!/usr/bin/env bash
# VINCIS — local ↔ GitHub main sync (safe, no force push)
set -euo pipefail

ROOT="/Users/linkele/Projects/studioOS"
cd "$ROOT"

echo "=========================================="
echo "  VINCIS GitHub Sync Check"
echo "  $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
echo "=========================================="
echo ""

echo "=== 1. Directory ==="
pwd
[ "$(pwd)" = "$ROOT" ] || { echo "❌ Wrong directory"; exit 1; }
echo "✅ $ROOT"
echo ""

echo "=== 2. Branch ==="
BR="$(git branch --show-current)"
echo "Branch: $BR"
echo ""

echo "=== 3. Fetch origin/main ==="
git fetch origin main
echo "✅ Fetched"
echo ""

echo "=== 4. Compare local vs origin/main ==="
HEAD_SHA="$(git rev-parse HEAD)"
ORIGIN_SHA="$(git rev-parse origin/main)"
echo "HEAD:        $HEAD_SHA"
echo "origin/main: $ORIGIN_SHA"
echo ""
echo "--- Commits on origin/main not in local (HEAD..origin/main) ---"
git log --oneline HEAD..origin/main || true
echo ""
echo "--- Commits on local not in origin/main (origin/main..HEAD) ---"
git log --oneline origin/main..HEAD || true
echo ""
git diff --stat origin/main...HEAD || true
echo ""

echo "=== 5. Today's modified files (since 2026-07-01) ==="
git log --since="2026-07-01 00:00:00" --name-only --pretty=format: | sort -u | sed '/^$/d' || true
echo ""
echo "--- Working tree (uncommitted) ---"
git status --short
git diff --name-only
echo ""

echo "=== 6. Uncommitted check ==="
if [ -n "$(git status --porcelain)" ]; then
  echo "⚠️  Uncommitted changes present"
else
  echo "✅ Working tree clean"
fi
echo ""

echo "=== 7. Merge origin/main if behind ==="
BEHIND="$(git rev-list --count HEAD..origin/main 2>/dev/null || echo 0)"
if [ "$BEHIND" -gt 0 ]; then
  echo "Local is $BEHIND commit(s) behind origin/main — merging..."
  if ! git merge origin/main -m "Merge origin/main into $BR"; then
    echo ""
    echo "❌ MERGE CONFLICT — stopped"
    echo "Conflict files:"
    git diff --name-only --diff-filter=U
    exit 1
  fi
  echo "✅ Merge complete"
else
  echo "✅ Local is not behind origin/main"
fi
echo ""

echo "=== 8. npm run build:clean ==="
if ! npm run build:clean; then
  echo "❌ Build failed — not committing or pushing"
  exit 1
fi
echo "✅ Build succeeded"
echo ""

echo "=== 9. Commit & push (if needed) ==="
UNCOMMITTED="$(git status --porcelain | wc -l | tr -d ' ')"
AHEAD="$(git rev-list --count origin/main..HEAD 2>/dev/null || echo 0)"

if [ "$UNCOMMITTED" -gt 0 ]; then
  git add -A
  git reset HEAD -- .env .env.local .env.development .env.production 2>/dev/null || true
  git reset HEAD -- '**/.env' '**/.env.local' 2>/dev/null || true
  if [ -n "$(git diff --cached --name-only)" ]; then
    git commit -m "$(cat <<'EOF'
Sync studio profile schema, Google OAuth role flow, and portal UX fixes.

- Prisma: STUDIO role, StudioProfile, studioId on CreatorProfile/Invitation
- Google OAuth with brand/creator entry routing and profile provisioning
- Focus mode mobile-only; hero EN two-line typography; prisma env wrapper
EOF
)"
    echo "✅ Committed: $(git rev-parse --short HEAD)"
  fi
fi

PUSH_BRANCH="${BR:-main}"
if [ "$AHEAD" -gt 0 ] || [ "$UNCOMMITTED" -gt 0 ]; then
  git push origin "$PUSH_BRANCH"
  echo "✅ Pushed to origin/$PUSH_BRANCH"
else
  echo "Nothing to push"
fi
echo ""

echo "=== 10. Final sync verification ==="
git fetch origin main
HEAD_SHA="$(git rev-parse HEAD)"
ORIGIN_SHA="$(git rev-parse origin/main)"
echo "HEAD:        $HEAD_SHA"
echo "origin/main: $ORIGIN_SHA"
if [ "$HEAD_SHA" = "$ORIGIN_SHA" ]; then
  echo "✅ IN SYNC: local HEAD == origin/main"
else
  echo "❌ NOT IN SYNC"
  git log --oneline --left-right HEAD...origin/main | head -20
fi
echo ""

echo "=== Vercel ==="
if [ -f vercel.json ]; then
  echo "vercel.json present — linked Vercel projects auto-deploy on push to production branch (typically main)."
else
  echo "No vercel.json in repo root."
fi
echo ""
echo "Done."
