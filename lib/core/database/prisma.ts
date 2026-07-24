import { PrismaClient } from "@prisma/client";

const DEFAULT_LOCAL_DATABASE_URL = "postgresql://studioos:studioos@localhost:5432/studioos";

function readEnv(name: string) {
  const value = process.env[name]?.trim();
  return value || "";
}

function withoutPoolerHost(url: string) {
  if (!url.includes("-pooler.")) return url;
  return url.replace("-pooler.", ".");
}

function resolvePooledDatabaseUrl() {
  return (
    readEnv("DATABASE_URL") ||
    readEnv("POSTGRES_PRISMA_URL") ||
    readEnv("POSTGRES_URL") ||
    (process.env.NODE_ENV !== "production" ? DEFAULT_LOCAL_DATABASE_URL : "")
  );
}

/** Prefer direct / non-pooler URLs at runtime — Neon pooler breaks interactive txs and can poison connections. */
function resolveRuntimeDatabaseUrl() {
  const direct =
    readEnv("DIRECT_DATABASE_URL") ||
    readEnv("POSTGRES_URL_NON_POOLING") ||
    withoutPoolerHost(resolvePooledDatabaseUrl());

  return direct || resolvePooledDatabaseUrl();
}

const resolvedDatabaseUrl = resolveRuntimeDatabaseUrl();
if (resolvedDatabaseUrl && !process.env.DATABASE_URL) {
  process.env.DATABASE_URL = resolvedDatabaseUrl;
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    datasources: resolvedDatabaseUrl
      ? {
          db: {
            url: resolvedDatabaseUrl
          }
        }
      : undefined
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export function hasDatabaseUrl(): boolean {
  return Boolean(resolveRuntimeDatabaseUrl());
}

export function resolveDatabaseUrlForDiagnostics() {
  return resolveRuntimeDatabaseUrl();
}
