import "server-only";

/** Hostname only — safe to expose in ops diagnostics (no credentials). */
export function resolveDatabaseHostForDiagnostics() {
  const raw =
    process.env.DATABASE_URL?.trim() ||
    process.env.POSTGRES_PRISMA_URL?.trim() ||
    process.env.POSTGRES_URL_NON_POOLING?.trim() ||
    process.env.POSTGRES_URL?.trim() ||
    "";

  if (!raw) {
    return process.env.NODE_ENV === "production" ? "unset" : "localhost-fallback";
  }

  try {
    const normalized = raw.replace(/^postgres:\/\//u, "postgresql://");
    return new URL(normalized).hostname;
  } catch {
    return "invalid-url";
  }
}
