#!/usr/bin/env bash
# 强制释放本地预览端口 3000–3005（VINCIS 只认 3000，其余一律清掉）
set -euo pipefail

PORTS=(3000 3001 3002 3003 3004 3005)

free_port() {
  local port="$1"
  if ! command -v lsof >/dev/null 2>&1; then
    return 0
  fi
  local pids
  pids="$(lsof -tiTCP:"${port}" -sTCP:LISTEN 2>/dev/null || true)"
  if [ -n "${pids}" ]; then
    echo ">>> 释放 :${port} → PID ${pids//$'\n'/, }"
    # shellcheck disable=SC2086
    kill -9 ${pids} 2>/dev/null || true
  fi
}

echo ">>> 清理 Next / Node 开发进程..."
pkill -9 -f "next dev" 2>/dev/null || true
pkill -9 -f "next-server" 2>/dev/null || true

for port in "${PORTS[@]}"; do
  free_port "${port}"
done

sleep 0.3

if command -v lsof >/dev/null 2>&1 && lsof -tiTCP:3000 -sTCP:LISTEN >/dev/null 2>&1; then
  echo "❌ 端口 3000 仍被占用，请手动检查: lsof -i :3000"
  exit 1
fi

echo ">>> 端口 3000 已就绪"
