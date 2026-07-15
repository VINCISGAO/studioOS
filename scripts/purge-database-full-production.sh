#!/usr/bin/env bash
# Wipe production Postgres (Neon) — same schema, zero business rows.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

MIGRATE_ENV="${ROOT}/.env.production.migrate"

read_env_var() {
  local file="$1"
  local key="$2"
  if [ ! -f "$file" ]; then
    return 1
  fi
  local line
  line="$(grep -E "^${key}=" "$file" | tail -1 || true)"
  if [ -z "$line" ]; then
    return 1
  fi
  local value="${line#*=}"
  value="${value%$'\r'}"
  value="${value#\"}"
  value="${value%\"}"
  value="${value#\'}"
  value="${value%\'}"
  printf '%s' "$value"
}

if [ "${STUDIOOS_PURGE_DATABASE_FULL:-}" != "YES_I_UNDERSTAND" ]; then
  echo "Refusing to wipe production. Set STUDIOOS_PURGE_DATABASE_FULL=YES_I_UNDERSTAND"
  exit 1
fi

if [ ! -f "$MIGRATE_ENV" ]; then
  cat <<EOF
Missing ${MIGRATE_ENV}

Copy env.production.migrate.example → .env.production.migrate
Paste POSTGRES_URL_NON_POOLING from Vercel (non-pooler host).

EOF
  exit 1
fi

url="$(read_env_var "$MIGRATE_ENV" POSTGRES_URL_NON_POOLING || true)"
if [ -z "$url" ]; then
  echo "ERROR: ${MIGRATE_ENV} must contain POSTGRES_URL_NON_POOLING=..."
  exit 1
fi

if [[ "$url" == *"-pooler."* ]]; then
  echo "ERROR: Use POSTGRES_URL_NON_POOLING, not the pooler URL."
  exit 1
fi

host="$(node -e 'try{console.log(new URL(process.argv[1]).hostname)}catch{console.log("invalid")}' "$url")"
echo ">>> Production purge target: ${host}"

export DATABASE_URL="$url"
export DIRECT_DATABASE_URL="$url"
export STUDIOOS_PURGE_DATABASE_TARGET=production

node --require ./scripts/helpers/load-env.cjs --import tsx scripts/purge-database-full.ts
