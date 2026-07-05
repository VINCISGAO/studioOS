#!/usr/bin/env bash
# Sprint 1 — Docker Postgres + Prisma migrate + seed
# Usage: npm run db:init
set -euo pipefail

export PATH="/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:$PATH"
if [ -s "${HOME}/.nvm/nvm.sh" ]; then
  # shellcheck source=/dev/null
  . "${HOME}/.nvm/nvm.sh"
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

DEFAULT_DATABASE_URL="postgresql://studioos:studioos@localhost:5432/studioos"

ensure_env() {
  if [ ! -f .env.local ]; then
    echo ">>> Creating .env.local from DATABASE_URL default"
    echo "DATABASE_URL=${DEFAULT_DATABASE_URL}" > .env.local
    return
  fi

  if ! grep -q '^DATABASE_URL=' .env.local 2>/dev/null; then
    echo ">>> Appending DATABASE_URL to .env.local"
    echo "DATABASE_URL=${DEFAULT_DATABASE_URL}" >> .env.local
  fi
}

load_database_url() {
  # Do not `source` the whole .env.local — values like RESEND_FROM_EMAIL may contain
  # spaces or `<>` and break bash. Only read DATABASE_URL.
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

  local from_local from_env
  from_local="$(read_env_var .env.local DATABASE_URL || true)"
  from_env="$(read_env_var .env DATABASE_URL || true)"

  if [ -n "$from_local" ]; then
    export DATABASE_URL="$from_local"
  elif [ -n "$from_env" ]; then
    export DATABASE_URL="$from_env"
  else
    export DATABASE_URL="$DEFAULT_DATABASE_URL"
  fi
}

wait_for_postgres() {
  echo ">>> Waiting for Postgres..."
  for _ in $(seq 1 30); do
    if command -v docker >/dev/null 2>&1; then
      if docker compose exec -T postgres pg_isready -U studioos -d studioos >/dev/null 2>&1; then
        echo ">>> Postgres is ready"
        return 0
      fi
    elif npx prisma db execute --stdin <<< "SELECT 1;" >/dev/null 2>&1; then
      echo ">>> Postgres is ready"
      return 0
    fi
    sleep 2
  done
  echo "❌ Postgres not reachable. Run: docker compose up -d"
  exit 1
}

recover_failed_migrations() {
  npx prisma migrate resolve --rolled-back "20250630130000_payment_collection" 2>/dev/null || true
}

ensure_migration() {
  local init_dir="prisma/migrations/20250630120000_init"
  local orphan_dir="prisma/migrations/20250630130000_payment_collection"

  recover_failed_migrations

  # Alter-only migration without base schema breaks fresh installs
  if [ -d "$orphan_dir" ] && [ ! -s "$init_dir/migration.sql" ]; then
    echo ">>> Removing orphan payment-only migration (regenerating full init)"
    rm -rf "$orphan_dir"
  fi

  if [ ! -s "$init_dir/migration.sql" ]; then
    echo ">>> Generating initial migration from schema"
    mkdir -p "$init_dir"
    npx prisma migrate diff \
      --from-empty \
      --to-schema-datamodel prisma/schema.prisma \
      --script > "$init_dir/migration.sql"
  fi

  echo ">>> Applying migrations"
  if ! npx prisma migrate deploy; then
    echo ">>> migrate deploy failed — falling back to db push (local dev)"
    npx prisma db push
  fi
}

echo ""
echo "=========================================="
echo "  VINCIS Sprint 1 — Database Init"
echo "=========================================="
echo ""

ensure_env
load_database_url

if ! command -v docker >/dev/null 2>&1; then
  echo "⚠️  Docker not found — assuming Postgres is already running"
else
  echo ">>> Starting Docker services (Postgres, Redis, MinIO, Mailpit)..."
  docker compose up -d
fi

if [ ! -d node_modules ] || [ ! -x node_modules/.bin/prisma ]; then
  echo ">>> Installing npm dependencies..."
  npm install
fi

echo ">>> Generating Prisma client..."
npm run db:generate

wait_for_postgres
ensure_migration

echo ">>> Seeding demo users + campaign..."
npm run db:seed

echo ""
echo "✅ Database init complete"
echo "   Verify: npm run sprint1:verify"
echo ""
