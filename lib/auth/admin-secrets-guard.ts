import "server-only";

const DEFAULT_DEV_SECRET = "studioos-dev-auth-security-secret";
const WEAK_SECRET_PATTERNS = [
  DEFAULT_DEV_SECRET,
  "changeme",
  "password",
  "secret",
  "studioos-dev"
];

export function isProductionRuntime() {
  return process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
}

export function resolveAuthSecuritySecret() {
  return (
    process.env.AUTH_SECURITY_SECRET?.trim() ||
    process.env.NEXTAUTH_SECRET?.trim() ||
    process.env.AUTH_SECRET?.trim() ||
    DEFAULT_DEV_SECRET
  );
}

function isWeakSecret(value: string) {
  const normalized = value.trim().toLowerCase();
  if (normalized.length < 32) return true;
  return WEAK_SECRET_PATTERNS.some((pattern) => normalized.includes(pattern));
}

/** Fail fast when admin crypto secrets are missing or exposed in production. */
export function assertAdminSecretsProductionReady() {
  if (!isProductionRuntime()) return;

  const dedicated = process.env.AUTH_SECURITY_SECRET?.trim();
  if (!dedicated || isWeakSecret(dedicated)) {
    throw new Error(
      "AUTH_SECURITY_SECRET must be set explicitly in production (32+ unique random chars). Do not rely on NEXTAUTH_SECRET fallback."
    );
  }

  if (!process.env.DATABASE_URL?.trim()) {
    throw new Error("DATABASE_URL must be set in production (server-only env, never NEXT_PUBLIC_).");
  }

  if (!process.env.RESEND_API_KEY?.trim()) {
    throw new Error(
      "RESEND_API_KEY must be set in production — sub-admin setup links must be emailed directly, not returned via API."
    );
  }

  for (const [key, value] of Object.entries(process.env)) {
    if (!key.startsWith("NEXT_PUBLIC_") || !value) continue;
    const upper = key.toUpperCase();
    if (
      upper.includes("SECRET") ||
      upper.includes("DATABASE") ||
      upper.includes("PASSWORD") ||
      upper.includes("TOTP") ||
      upper.includes("PRIVATE")
    ) {
      throw new Error(`Sensitive env var must not use NEXT_PUBLIC_ prefix: ${key}`);
    }
  }
}

/** Non-throwing checks for verify scripts. */
export function verifyAdminSecretsConfig(): { ok: true } | { ok: false; detail: string } {
  if (process.env.NEXT_PUBLIC_DATABASE_URL?.trim()) {
    return { ok: false, detail: "Remove NEXT_PUBLIC_DATABASE_URL — DATABASE_URL must stay server-only." };
  }

  for (const key of Object.keys(process.env)) {
    if (!key.startsWith("NEXT_PUBLIC_")) continue;
    const upper = key.toUpperCase();
    if (
      upper.includes("SECRET") ||
      upper.includes("DATABASE") ||
      upper.includes("PASSWORD") ||
      upper.includes("TOTP")
    ) {
      return { ok: false, detail: `Sensitive env must not be public: ${key}` };
    }
  }

  if (isProductionRuntime()) {
    const dedicated = process.env.AUTH_SECURITY_SECRET?.trim();
    if (!dedicated || isWeakSecret(dedicated)) {
      return {
        ok: false,
        detail:
          "Set AUTH_SECURITY_SECRET explicitly in Vercel (32+ random chars). Do not rely on NEXTAUTH_SECRET fallback."
      };
    }
    if (!process.env.DATABASE_URL?.trim()) {
      return { ok: false, detail: "DATABASE_URL is required in production." };
    }
    if (!process.env.RESEND_API_KEY?.trim()) {
      return {
        ok: false,
        detail: "RESEND_API_KEY is required in production — sub-admin setup links must be emailed, not returned in API."
      };
    }
  }

  return { ok: true };
}
