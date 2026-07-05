#!/usr/bin/env bash
# Daily backup wrapper — suitable for cron / launchd
# Example cron (9:00 AM daily):
#   0 9 * * * cd /path/to/project && npm run backup:daily >> ~/VINCIS-Backups/logs/cron.log 2>&1
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
node scripts/backup/backup-all.mjs
