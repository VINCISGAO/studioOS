import "server-only";

const DEFAULT_DEV_SECRET = "studioos-dev-auth-security-secret";

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

export function assertAuthSecuritySecretConfigured() {
  const secret = resolveAuthSecuritySecret();
  if (isProductionRuntime() && secret === DEFAULT_DEV_SECRET) {
    throw new Error(
      "AUTH_SECURITY_SECRET must be set to a strong random value in production (admin TOTP encryption depends on it)."
    );
  }
  return secret;
}

/** Alias used by admin crypto helpers — throws in production when secret is default. */
export function assertAuthSecuritySecret() {
  return assertAuthSecuritySecretConfigured();
}

export function isStrictAdminSessionBinding() {
  if (process.env.ADMIN_SESSION_STRICT_BIND === "0") return false;
  if (process.env.ADMIN_SESSION_STRICT_BIND === "1") return true;
  // Local dev (even with VERCEL=1 in .env) must not bind sessions to IP/UA — headers differ between fetch and RSC.
  return process.env.NODE_ENV === "production";
}

export function isBootstrapAllowedInProduction() {
  return process.env.ADMIN_BOOTSTRAP_CONFIRM === "yes-i-own-this-server";
}
