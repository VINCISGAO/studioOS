#!/usr/bin/env bash
set -euo pipefail

export PATH="/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:$PATH"
if [ -s "${HOME}/.nvm/nvm.sh" ]; then
  # shellcheck source=/dev/null
  . "${HOME}/.nvm/nvm.sh"
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PORT=3000

echo ""
echo "=========================================="
echo "  VINCIS 本地预览 · 固定端口 ${PORT}"
echo "=========================================="
echo ""

if ! command -v node >/dev/null 2>&1; then
  echo "❌ 找不到 node 命令。"
  echo "   请安装 Node.js LTS: https://nodejs.org"
  exit 1
fi

echo "Node $(node -v) | npm $(npm -v)"
echo ""

NODE_MAJOR="$(node -v | sed 's/v//' | cut -d. -f1)"
if [ "${NODE_MAJOR}" -gt 22 ] 2>/dev/null; then
  echo "⚠️  当前 Node $(node -v) 较新，若启动异常建议改用 Node 20 LTS"
  echo ""
fi

if [ ! -d node_modules ]; then
  echo ">>> 安装依赖..."
  npm install
  echo ""
fi

if command -v docker >/dev/null 2>&1 && [ -f scripts/db-init.sh ]; then
  if ! grep -q '^DATABASE_URL=' .env.local 2>/dev/null && [ ! -f .env.local ]; then
    echo ">>> 首次启动：初始化 PostgreSQL + Prisma..."
    bash scripts/db-init.sh || echo "⚠️  db:init 跳过（Docker/Postgres 未就绪时可稍后运行 npm run db:init）"
    echo ""
  fi
fi

mkdir -p .data public/uploads/mvp seed public/images assets/marketing

echo ">>> 强制释放 3000–3005（预览只用 ${PORT}）..."
bash scripts/free-dev-ports.sh
echo ""

echo ">>> 复制营销背景图..."
node scripts/copy-marketing-assets.mjs || true
echo ""

rm -rf .next node_modules/.cache

echo ">>> 启动预览 → http://localhost:${PORT}"
echo ">>> 健康检查:  http://localhost:${PORT}/api/v1/health"
echo ">>> 首页:      http://localhost:${PORT}/?lang=zh"
echo ">>> ⚠️  不要关闭此窗口"
echo ""

exec npx next dev -p "${PORT}"
