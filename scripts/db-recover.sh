#!/usr/bin/env bash
# Recover from failed/incomplete Prisma migrations (e.g. P3018)
# Usage: npm run db:recover
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

DEFAULT_DATABASE_URL="postgresql://studioos:studioos@localhost:5432/studioos"

read_env_var() {
  local file="$1"
  local key="$2"
  [ -f "$file" ] || return 1
  local line
  line="$(grep -E "^${key}=" "$file" | tail -1 || true)"
  [ -n "$line" ] || return 1
  local value="${line#*=}"
  value="${value%$'\r'}"
  value="${value#\"}"
  value="${value%\"}"
  value="${value#\'}"
  value="${value%\'}"
  printf '%s' "$value"
}

from_local="$(read_env_var .env.local DATABASE_URL || true)"
from_env="$(read_env_var .env DATABASE_URL || true)"
export DATABASE_URL="${from_local:-${from_env:-$DEFAULT_DATABASE_URL}}"

echo ">>> Clearing failed migration records (if any)"
npx prisma migrate resolve --rolled-back "20250630130000_payment_collection" 2>/dev/null || true

if [ -d prisma/migrations/20250630130000_payment_collection ]; then
  echo ">>> Removing orphan payment-only migration folder"
  rm -rf prisma/migrations/20250630130000_payment_collection
fi

INIT_DIR="prisma/migrations/20250630120000_init"
if [ ! -s "$INIT_DIR/migration.sql" ]; then
  echo ">>> Generating full init migration from schema"
  mkdir -p "$INIT_DIR"
  npx prisma migrate diff \
    --from-empty \
    --to-schema-datamodel prisma/schema.prisma \
    --script > "$INIT_DIR/migration.sql"
fi

echo ">>> Applying migrations"
if ! npx prisma migrate deploy; then
  echo ">>> migrate deploy failed — falling back to db push (local dev)"
  npx prisma db push
fi

echo "✅ Database recovered. Run: npm run db:seed"
