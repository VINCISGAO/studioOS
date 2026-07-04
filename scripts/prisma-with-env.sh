#!/usr/bin/env bash
# Load DATABASE_URL from .env.local / .env for Prisma CLI (Next.js uses .env.local; Prisma defaults to .env).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

DEFAULT_DATABASE_URL="postgresql://studioos:studioos@localhost:5432/studioos"

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

append_query_param() {
  local url="$1"
  local key="${2%%=*}"
  local param="$2"
  if [[ "$url" == *"${key}="* ]]; then
    printf '%s' "$url"
    return
  fi
  if [[ "$url" == *"?"* ]]; then
    printf '%s&%s' "$url" "$param"
  else
    printf '%s?%s' "$url" "$param"
  fi
}

from_local="$(read_env_var .env.local DATABASE_URL || true)"
from_env="$(read_env_var .env DATABASE_URL || true)"

if [ -n "$from_local" ]; then
  export DATABASE_URL="$from_local"
elif [ -n "$from_env" ]; then
  export DATABASE_URL="$from_env"
elif [ -z "${DATABASE_URL:-}" ]; then
  export DATABASE_URL="$DEFAULT_DATABASE_URL"
fi

from_local_direct="$(read_env_var .env.local DIRECT_DATABASE_URL || true)"
from_env_direct="$(read_env_var .env DIRECT_DATABASE_URL || true)"

if [ -n "$from_local_direct" ]; then
  export DIRECT_DATABASE_URL="$from_local_direct"
elif [ -n "$from_env_direct" ]; then
  export DIRECT_DATABASE_URL="$from_env_direct"
elif [ -z "${DIRECT_DATABASE_URL:-}" ]; then
  if [[ "${DATABASE_URL:-}" == *"-pooler."* ]]; then
    export DIRECT_DATABASE_URL="${DATABASE_URL/-pooler./.}"
  else
    export DIRECT_DATABASE_URL="${DATABASE_URL}"
  fi
fi

# Neon cold start + migrate: give direct connections more time to open.
export DIRECT_DATABASE_URL="$(append_query_param "$DIRECT_DATABASE_URL" "connect_timeout=30")"

from_local_lock="$(read_env_var .env.local PRISMA_SCHEMA_DISABLE_ADVISORY_LOCK || true)"
from_env_lock="$(read_env_var .env PRISMA_SCHEMA_DISABLE_ADVISORY_LOCK || true)"
if [ -n "$from_local_lock" ]; then
  export PRISMA_SCHEMA_DISABLE_ADVISORY_LOCK="$from_local_lock"
elif [ -n "$from_env_lock" ]; then
  export PRISMA_SCHEMA_DISABLE_ADVISORY_LOCK="$from_env_lock"
fi

exec npx prisma "$@"
