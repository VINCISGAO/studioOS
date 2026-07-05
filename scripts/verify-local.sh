#!/usr/bin/env bash
# Full local gate: typecheck → build → production:verify
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
LOG="${ROOT}/.verify-run.log"

{
  echo "=== VINCIS verify-local $(date -u +"%Y-%m-%dT%H:%M:%SZ") ==="
  echo "Node: $(node -v 2>/dev/null || echo unknown)"
  echo "PWD: $ROOT"
  echo ""
} > "$LOG"

run_step() {
  local label="$1"
  shift
  echo ">>> $label" | tee -a "$LOG"
  set +e
  "$@" >> "$LOG" 2>&1
  local exit_code=$?
  set -e
  if [ "$exit_code" -eq 0 ]; then
    echo "PASS: $label" | tee -a "$LOG"
    return 0
  fi
  echo "FAIL: $label (exit $exit_code)" | tee -a "$LOG"
  return 1
}

FAIL=0

rm -rf .next
echo ">>> cleared .next" | tee -a "$LOG"

run_step "typecheck" npm run typecheck || FAIL=1
run_step "build" npm run build || FAIL=1
run_step "production:verify" npm run production:verify || FAIL=1

echo "" | tee -a "$LOG"
if [ "$FAIL" -eq 0 ]; then
  echo "=== ALL PASSED ===" | tee -a "$LOG"
  exit 0
fi

echo "=== FAILED - see $LOG ===" | tee -a "$LOG"
exit 1
