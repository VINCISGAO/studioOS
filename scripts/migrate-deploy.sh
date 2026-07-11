#!/usr/bin/env bash
# Deploy Prisma migrations with retries for Neon advisory-lock timeouts (P1002).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# Remove aborted migrate-dev folders that block deploy (Prisma P3015).
for dir in prisma/migrations/*/; do
  name="$(basename "$dir")"
  if [ ! -f "${dir}migration.sql" ]; then
    echo ">>> Removing orphan migration folder without migration.sql: ${name}"
    rm -rf "$dir"
  fi
done

# Fail fast when a migration folder is still missing migration.sql.
missing=0
for dir in prisma/migrations/*/; do
  name="$(basename "$dir")"
  if [ ! -f "${dir}migration.sql" ]; then
    echo "ERROR: missing ${dir}migration.sql (Prisma P3015)."
    echo "       Delete the folder: rm -rf ${dir}"
    missing=1
  fi
done
if [ "$missing" -ne 0 ]; then
  exit 1
fi

# Neon / serverless Postgres often cannot acquire Prisma's advisory lock in 10s (P1002).
# Safe when only one migrate deploy runs at a time (local verify, CI, release).
# Set PRISMA_SCHEMA_DISABLE_ADVISORY_LOCK=0 in .env.local to re-enable locking.
export PRISMA_SCHEMA_DISABLE_ADVISORY_LOCK="${PRISMA_SCHEMA_DISABLE_ADVISORY_LOCK:-1}"

MAX_ATTEMPTS="${MIGRATE_DEPLOY_MAX_ATTEMPTS:-5}"
attempt=1

while [ "$attempt" -le "$MAX_ATTEMPTS" ]; do
  echo ">>> prisma migrate deploy (attempt ${attempt}/${MAX_ATTEMPTS})"
  log="$(mktemp)"
  set +e
  bash scripts/prisma-with-env.sh migrate deploy 2>&1 | tee "$log"
  status="${PIPESTATUS[0]}"
  set -e

  if [ "$status" -eq 0 ]; then
    rm -f "$log"
    echo ">>> prisma generate (post-migrate)"
    bash scripts/prisma-with-env.sh generate
    exit 0
  fi

  if grep -qE 'P1002|advisory.lock|advisory_lock' "$log" && [ "$attempt" -lt "$MAX_ATTEMPTS" ]; then
    wait_sec=$((attempt * 8))
    echo ">>> migrate deploy hit advisory lock timeout — retrying in ${wait_sec}s…"
    rm -f "$log"
    sleep "$wait_sec"
    attempt=$((attempt + 1))
    continue
  fi

  # Known no-op migration that can remain marked failed after a partial apply on older trees.
  if grep -q 'P3009' "$log" && grep -q '20260705153000_admin_audit_ip_index' "$log"; then
    echo ">>> Resolving stale failed no-op migration 20260705153000_admin_audit_ip_index…"
    bash scripts/prisma-with-env.sh migrate resolve --applied 20260705153000_admin_audit_ip_index
    rm -f "$log"
    if [ "$attempt" -lt "$MAX_ATTEMPTS" ]; then
      attempt=$((attempt + 1))
      continue
    fi
  fi

  # Production pricing engine — often fails without pgcrypto; recover and retry deploy.
  if grep -q 'P3009' "$log" && grep -q '20260709120000_production_pricing_engine' "$log"; then
    echo ">>> Recovering failed migration 20260709120000_production_pricing_engine…"
    if bash scripts/prisma-with-env.sh db execute --stdin <<'SQL' 2>/dev/null | grep -q '1'; then
SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'production_pricing_profiles' LIMIT 1;
SQL
      bash scripts/prisma-with-env.sh migrate resolve --applied 20260709120000_production_pricing_engine
    else
      bash scripts/prisma-with-env.sh migrate resolve --rolled-back 20260709120000_production_pricing_engine
    fi
    rm -f "$log"
    if [ "$attempt" -lt "$MAX_ATTEMPTS" ]; then
      attempt=$((attempt + 1))
      continue
    fi
  fi

  # Production pricing engine — failed mid-apply (e.g. uuid/text FK mismatch); mark rolled back and retry.
  if grep -q 'P3018' "$log" && grep -q '20260709120000_production_pricing_engine' "$log"; then
    echo ">>> Recovering P3018 for 20260709120000_production_pricing_engine…"
    bash scripts/prisma-with-env.sh migrate resolve --rolled-back 20260709120000_production_pricing_engine
    rm -f "$log"
    if [ "$attempt" -lt "$MAX_ATTEMPTS" ]; then
      attempt=$((attempt + 1))
      continue
    fi
  fi

  rm -f "$log"
  exit "$status"
done

exit 1
