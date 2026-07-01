#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
LOG=".verify-run-output.txt"
{
  echo "=== typecheck $(date -u +%Y-%m-%dT%H:%M:%SZ) ==="
  npm run typecheck
  echo "typecheck exit: $?"
  echo "=== build ==="
  npm run build
  echo "build exit: $?"
  echo "=== production:verify ==="
  npm run production:verify
  echo "production:verify exit: $?"
  if grep -qE '^DATABASE_URL=' .env 2>/dev/null; then
    echo "=== happy-path:verify ==="
    npm run happy-path:verify
    echo "happy-path:verify exit: $?"
    echo "=== sprint17:verify ==="
    npm run sprint17:verify
    echo "sprint17:verify exit: $?"
  else
    echo "DATABASE_URL not in .env — skipped happy-path:verify and sprint17:verify"
  fi
  echo "=== playwright (optional; requires dev deps) ==="
  if command -v npx >/dev/null 2>&1; then
    npx playwright test e2e/happy-path.spec.ts || echo "playwright exit: $?"
  fi
} > "$LOG" 2>&1
echo "done — see $LOG"
