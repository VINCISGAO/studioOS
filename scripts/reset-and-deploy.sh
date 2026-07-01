#!/usr/bin/env bash
set -euo pipefail

export PATH="/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:$PATH"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
REPORT="${ROOT}/.git-deploy-report.txt"

run_step() {
  local title="$1"
  local cmd="$2"
  {
    echo "========== ${title} =========="
    echo "Command: ${cmd}"
    echo "---"
  } | tee -a "${REPORT}"
  bash -lc "${cmd}" 2>&1 | tee -a "${REPORT}"
  local ec="${PIPESTATUS[0]}"
  echo "EXIT_CODE: ${ec}" | tee -a "${REPORT}"
  echo "" | tee -a "${REPORT}"
  return "${ec}"
}

{
  echo "=== reset-and-deploy $(date -u +"%Y-%m-%dT%H:%M:%SZ") ==="
  echo "Branch: $(git branch --show-current)"
  echo "Remote: $(git remote get-url origin 2>/dev/null || echo none)"
  echo ""
} > "${REPORT}"

# shellcheck source=/dev/null
source "$(dirname "$0")/git-identity.sh"

run_step "1. reset:demo-accounts" "npm run reset:demo-accounts"
run_step "2. typecheck" "npm run typecheck"
run_step "3. build" "npm run build"
run_step "4. production:verify" "npm run production:verify"
run_step "5. git status --short" "git status --short"

if [[ -n "$(git status --porcelain)" ]]; then
  {
    echo "========== 6. git add/commit/push =========="
  } | tee -a "${REPORT}"
  git add -A
  git reset HEAD -- .env .env.local .env.production .env.development .env.test .verify-run.log 2>/dev/null || true
  git commit -m "$(cat <<'EOF'
Reset demo accounts to fresh state and ship portal fixes.

Adds comprehensive JSON + Prisma cleanup for six studioos.test demo users, plus message center delete, certification onboarding, and first-order-free income access improvements.
EOF
)"
  echo "COMMIT_HASH: $(git rev-parse HEAD)" | tee -a "${REPORT}"
  git push -u origin HEAD 2>&1 | tee -a "${REPORT}"
  echo "PUSH_EXIT_CODE: ${PIPESTATUS[0]}" | tee -a "${REPORT}"
else
  echo "========== 6. skipped (clean working tree) ==========" | tee -a "${REPORT}"
  echo "COMMIT_HASH: $(git rev-parse HEAD)" | tee -a "${REPORT}"
  git push -u origin HEAD 2>&1 | tee -a "${REPORT}" || true
fi

{
  echo "========== 7. final status =========="
  git status -sb
  echo "Done."
} | tee -a "${REPORT}"

echo ""
echo "Report: ${REPORT}"
echo "Restart dev server after reset: npm run dev:clean"
