#!/usr/bin/env bash
# 连接 GitHub 并推送：bash scripts/connect-github.sh
set -euo pipefail

export PATH="/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:$PATH"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo ""
echo "=========================================="
echo "  连接 GitHub · VINCISGAO/studioOS"
echo "=========================================="
echo ""

if ! git rev-parse --git-dir >/dev/null 2>&1; then
  echo "❌ 不是 git 仓库"
  exit 1
fi

REMOTE="$(git remote get-url origin 2>/dev/null || true)"
if [ -z "${REMOTE}" ]; then
  echo ">>> 添加 origin..."
  git remote add origin "git@github.com:VINCISGAO/studioOS.git"
  REMOTE="git@github.com:VINCISGAO/studioOS.git"
fi

echo "远程: ${REMOTE}"
echo "分支: $(git branch --show-current)"
echo ""

# 始终使用 vincisgao@gmail.com（仅本仓库）
# shellcheck source=/dev/null
source "$(dirname "$0")/git-identity.sh"
echo ">>> 已设置提交身份: $(git config user.name) <$(git config user.email)>"
echo ""

echo ">>> 测试 GitHub SSH 连接..."
if ssh -T -o BatchMode=yes -o ConnectTimeout=8 git@github.com 2>&1 | grep -qi "successfully authenticated"; then
  echo "✅ SSH 已连接 GitHub"
else
  echo "⚠️  SSH 未配置或无法连接。可选方案："
  echo "   1) 配置 SSH: https://docs.github.com/en/authentication/connecting-to-github-with-ssh"
  echo "   2) 改用 HTTPS:"
  echo "      git remote set-url origin https://github.com/VINCISGAO/studioOS.git"
  echo "      gh auth login   # 或输入 Personal Access Token"
  echo ""
fi

node scripts/copy-marketing-assets.mjs 2>/dev/null || true

git add -A
git reset HEAD -- .env .env.local .env.* 2>/dev/null || true

if git diff --cached --quiet; then
  echo ">>> 没有新改动需要提交，直接推送..."
else
  git commit -m "$(cat <<'EOF'
Sync cinematic homepage with mockup and restore login-space background.

Match hero layout to design spec, keep login-space-bg asset, and update marketing sections.
EOF
)"
  echo "✅ 已提交: $(git rev-parse --short HEAD)"
fi

echo ""
echo ">>> 推送到 GitHub..."
git push -u origin HEAD

echo ""
echo "✅ 完成"
echo "   仓库: https://github.com/VINCISGAO/studioOS"
echo "   分支: $(git branch --show-current)"
echo "   提交: $(git rev-parse --short HEAD)"
echo ""
