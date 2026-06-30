#!/usr/bin/env bash
set -euo pipefail

export PATH="/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:$PATH"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
REPORT="${ROOT}/.git-deploy-report.txt"

{
  echo "=== GitHub deploy $(date -u +"%Y-%m-%dT%H:%M:%SZ") ==="
} > "${REPORT}"

log() {
  echo "$@"
  echo "$@" >> "${REPORT}"
}

log ""
log "=========================================="
log "  推送项目到 GitHub"
log "=========================================="
log ""

if ! git rev-parse --git-dir >/dev/null 2>&1; then
  log "❌ 当前目录不是 git 仓库"
  exit 1
fi

# shellcheck source=/dev/null
source "$(dirname "$0")/git-identity.sh"
log "提交身份: $(git config user.name) <$(git config user.email)>"
log ""

if git status --porcelain | grep -E '^[^?].*\.env(\.|$|-local)' >/dev/null 2>&1; then
  log "❌ 检测到 .env 相关改动已暂存，请先 git restore --staged 相关文件"
  exit 1
fi

BRANCH="$(git branch --show-current)"
REMOTE="$(git remote get-url origin 2>/dev/null || echo "(no origin)")"
log "分支: ${BRANCH}"
log "远程: ${REMOTE}"
log "身份: $(git config user.name) <$(git config user.email)>"
log ""

git add \
  app/globals.css \
  app/page.tsx \
  app/api/login-space-bg/route.ts \
  components/marketing/cinematic/ \
  components/marketing/landing/ \
  components/studioos/login-page-shell.tsx \
  components/studioos/login-social-buttons.tsx \
  components/studioos/login-workspace.tsx \
  lib/marketing/ \
  lib/studioos/login-theme.ts \
  lib/studioos/login-background.ts \
  scripts/start-dev.sh \
  scripts/deploy-homepage-github.sh \
  scripts/copy-marketing-assets.mjs \
  package.json \
  "启动本地开发.command" \
  "推送首页到GitHub.command" \
  public/images/home-hero-bg.png \
  public/images/home-hero-studio.png \
  assets/marketing/ \
  2>> "${REPORT}" || true

git add -u \
  app/globals.css \
  app/api/login-space-bg \
  components/marketing/cinematic \
  components/marketing/landing \
  components/studioos/login-page-shell.tsx \
  components/studioos/login-social-buttons.tsx \
  components/studioos/login-workspace.tsx \
  lib/marketing \
  lib/studioos/login-theme.ts \
  scripts/start-dev.sh \
  scripts/deploy-homepage-github.sh \
  scripts/copy-marketing-assets.mjs \
  package.json \
  2>> "${REPORT}" || true

git status >> "${REPORT}" 2>&1

if git diff --cached --quiet; then
  log "⚠️  没有可提交的改动（可能已提交过）"
else
  git commit -m "$(cat <<'EOF'
Ship cinematic homepage layout and restore login UX.

Refresh marketing cinematic sections and landing copy, align globals and login theming, and add local dev plus GitHub deploy scripts.
EOF
)"
  log "✅ 已提交: $(git rev-parse HEAD)"
fi

log ""
log ">>> 推送到 origin..."
if git push -u origin HEAD 2>&1 | tee -a "${REPORT}"; then
  log ""
  log "✅ 推送成功"
  log "   分支: $(git branch --show-current)"
  log "   提交: $(git rev-parse --short HEAD)"
  log "   远程: $(git remote get-url origin)"
else
  log ""
  log "❌ 推送失败 — 查看 ${REPORT}"
  exit 1
fi

log ""
