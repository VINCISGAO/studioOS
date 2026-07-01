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

from_local="$(read_env_var .env.local DATABASE_URL || true)"
from_env="$(read_env_var .env DATABASE_URL || true)"

if [ -n "$from_local" ]; then
  export DATABASE_URL="$from_local"
elif [ -n "$from_env" ]; then
  export DATABASE_URL="$from_env"
elif [ -z "${DATABASE_URL:-}" ]; then
  export DATABASE_URL="$DEFAULT_DATABASE_URL"
fi

exec npx prisma "$@"
