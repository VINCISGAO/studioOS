#!/bin/bash
export PATH="/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:$PATH"
cd "$(dirname "$0")" || exit 1
chmod +x scripts/connect-github.sh 2>/dev/null || true
bash scripts/connect-github.sh
read -r -p "按回车键关闭…" _
