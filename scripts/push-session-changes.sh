#!/usr/bin/env bash
set -euo pipefail

export PATH="/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:$PATH"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
REPORT="${ROOT}/.git-deploy-report.txt"

{
  echo "=== push-session-changes $(date -u +"%Y-%m-%dT%H:%M:%SZ") ==="
} > "${REPORT}"

log() {
  echo "$@"
  echo "$@" >> "${REPORT}"
}

# shellcheck source=/dev/null
source "$(dirname "$0")/git-identity.sh"

log "Branch: $(git branch --show-current)"
log "Remote: $(git remote get-url origin 2>/dev/null || echo none)"
log ""

git add -A
git reset HEAD -- .env .env.local .env.production .env.development .env.* 2>/dev/null || true

if git diff --cached --quiet; then
  log "No staged changes — pushing existing commits only."
else
  git commit -m "$(cat <<'EOF'
Fix demo review 404, login redirect loops, and broken lang URLs.

Restore proj_demo_arc_nova from tombstones, sanitize malformed ?lang= links in middleware, and block cross-role post-login redirects so brand review pages load reliably in local demo mode.
EOF
)"
  log "Committed: $(git rev-parse HEAD)"
fi

git push -u origin HEAD
log "Push complete."
log "HEAD: $(git rev-parse --short HEAD)"
log "Files in last commit:"
git show --stat --oneline -1 >> "${REPORT}" 2>&1 || true

log "Done."
