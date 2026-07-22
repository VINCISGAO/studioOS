#!/usr/bin/env bash
# Clear local JSON stores, then wipe the production Neon database.
# Dev machines often point .env.local at Neon — we only TRUNCATE production once.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [ "${STUDIOOS_PURGE_DATABASE_FULL:-}" != "YES_I_UNDERSTAND" ]; then
  echo "Refusing to wipe databases. Set STUDIOOS_PURGE_DATABASE_FULL=YES_I_UNDERSTAND"
  exit 1
fi

echo "========== 1/2 Local JSON runtime stores (.data/, seed/) =========="
export STUDIOOS_PURGE_SKIP_POSTGRES=1
node --require ./scripts/helpers/load-env.cjs --import tsx scripts/purge-database-full.ts

echo ""
echo "========== 2/2 Production Postgres (Neon) =========="
unset STUDIOOS_PURGE_SKIP_POSTGRES
bash scripts/purge-database-full-production.sh

echo ""
echo "✅ JSON stores cleared and production database wiped."
echo "   OAuth identities and the protected master-admin login must remain untouched."
