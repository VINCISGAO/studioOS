#!/bin/bash
# Finder 双击启动时 PATH 里没有 node，需要手动补上常见安装路径
export PATH="/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:$PATH"
if [ -s "$HOME/.nvm/nvm.sh" ]; then
  # shellcheck source=/dev/null
  . "$HOME/.nvm/nvm.sh"
fi

cd "$(dirname "$0")" || exit 1
chmod +x scripts/dev-local.sh 2>/dev/null || true

echo ""
echo "如果下面报错 command not found: node"
echo "请先在终端安装 Node.js: https://nodejs.org (选 LTS 20.x)"
echo ""

bash scripts/dev-local.sh
EXIT=$?

echo ""
if [ $EXIT -ne 0 ]; then
  echo "❌ 启动失败 (exit $EXIT)。请截图上面的报错。"
else
  echo "✅ 若上方有 Ready，请打开 http://localhost:3000/health"
fi
echo ""
read -r -p "按回车键关闭此窗口…" _
