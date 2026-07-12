#!/usr/bin/env bash
# Deploy migrations to Vercel/Neon production — never uses .env.local localhost.
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

if [ ! -f "$MIGRATE_ENV" ]; then
  cat <<EOF
Missing ${MIGRATE_ENV}

1. Vercel → Studio OS → Settings → Environment Variables
2. Open POSTGRES_URL_NON_POOLING (eye icon) and copy the full value
   Host must NOT contain "-pooler"
3. Create the file with exactly one line (no quotes around the URL):

POSTGRES_URL_NON_POOLING=postgresql://...

4. Run again:

npm run db:migrate:deploy:production

See env.production.migrate.example

EOF
  exit 1
fi

url="$(read_env_var "$MIGRATE_ENV" POSTGRES_URL_NON_POOLING || true)"
if [ -z "$url" ]; then
  echo "ERROR: ${MIGRATE_ENV} must contain POSTGRES_URL_NON_POOLING=..."
  exit 1
fi

if [[ "$url" == *"-pooler."* ]]; then
  echo "ERROR: Pooler URL detected. Copy POSTGRES_URL_NON_POOLING from Vercel, not POSTGRES_URL."
  exit 1
fi

if [[ "$url" == *"localhost"* ]]; then
  echo "ERROR: localhost URL — paste production Neon URL from Vercel."
  exit 1
fi

host="$(node -e 'try{console.log(new URL(process.argv[1]).hostname)}catch{console.log("invalid")}' "$url")"
echo ">>> Production migrate target: ${host}"

export POSTGRES_URL_NON_POOLING="$url"
unset DATABASE_URL
bash scripts/migrate-deploy.sh
