#!/bin/bash
export PATH="/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:$PATH"
if [ -s "$HOME/.nvm/nvm.sh" ]; then
  # shellcheck source=/dev/null
  . "$HOME/.nvm/nvm.sh"
fi
cd "$(dirname "$0")" || exit 1
chmod +x scripts/deploy-homepage-github.sh 2>/dev/null || true
bash scripts/deploy-homepage-github.sh
EXIT=$?
echo ""
if [ $EXIT -ne 0 ]; then
  echo "❌ 推送失败。详情见 .git-deploy-report.txt"
else
  echo "✅ 已推送到 GitHub"
fi
read -r -p "按回车键关闭…" _
