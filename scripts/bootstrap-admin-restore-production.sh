#!/usr/bin/env bash
# Restore master admin on production Neon — keeps existing Authenticator when ADMIN_TOTP_SECRET is set.
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

Copy env.production.migrate.example → .env.production.migrate
Paste POSTGRES_URL_NON_POOLING from Vercel.

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
email="${ADMIN_LOGIN_EMAIL:-gwxaxxw@gmail.com}"

echo ">>> Production admin restore: ${host}"
echo ">>> Email: ${email}"

if [ -z "${AUTH_SECURITY_SECRET:-}" ]; then
  echo ""
  echo "ERROR: AUTH_SECURITY_SECRET must be set (same value as Vercel production)."
  echo "  export AUTH_SECURITY_SECRET=\"<from Vercel>\""
  exit 1
fi

if [ -z "${ADMIN_TOTP_SECRET:-}" ]; then
  echo ""
  echo "WARNING: ADMIN_TOTP_SECRET not set."
  echo "  Without it, bootstrap generates a NEW secret — your existing Authenticator codes will NOT work."
  echo "  Copy ADMIN_TOTP_SECRET from Vercel, or run:"
  echo "    node scripts/generate-admin-totp-secret.mjs ${email}"
  echo "  then scan the otpauth URI and export ADMIN_TOTP_SECRET before re-running."
  echo ""
fi

export DATABASE_URL="$url"
export DIRECT_DATABASE_URL="$url"

node -r ./scripts/helpers/load-env.cjs scripts/bootstrap-admin-profile.mjs -- --master "$email"

echo ""
echo "Verifying TOTP for ${email}..."
npm run verify:admin-totp -- "$email"

echo ""
echo "Done. Use a fresh 6-digit code from Google Authenticator (VINCIS Admin:${email})."
echo "If login still fails on vincis.app, confirm Vercel AUTH_SECURITY_SECRET matches what you exported above."
