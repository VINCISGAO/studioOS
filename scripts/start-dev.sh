#!/usr/bin/env bash
# 最简启动：在项目根目录运行 bash scripts/start-dev.sh
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
echo "StudioOS 本地预览 · http://127.0.0.1:${PORT}/?lang=zh"
echo ""

if ! command -v node >/dev/null 2>&1; then
  echo "❌ 找不到 node。请安装 Node 20 LTS: https://nodejs.org"
  exit 1
fi

NODE_MAJOR="$(node -p "process.versions.node.split('.')[0]")"
echo "Node $(node -v)"
if [ "${NODE_MAJOR}" -ge 23 ] 2>/dev/null; then
  echo "⚠️  package.json 要求 Node 20–22。Node 24+ 可能导致 dev/build 异常，建议: nvm use 22"
fi
echo ""

if [ ! -d node_modules ]; then
  echo ">>> 首次运行，安装依赖..."
  npm install
fi

bash scripts/free-dev-ports.sh
node scripts/copy-marketing-assets.mjs || true

echo ""
echo ">>> 启动中… 看到 Ready 后打开浏览器"
echo ">>> http://127.0.0.1:${PORT}/?lang=zh"
echo ">>> 不要关闭此窗口"
echo ""

exec npx next dev -p "${PORT}" -H 127.0.0.1
