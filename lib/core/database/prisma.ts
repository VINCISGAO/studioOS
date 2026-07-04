import { PrismaClient } from "@prisma/client";

const DEFAULT_LOCAL_DATABASE_URL = "postgresql://studioos:studioos@localhost:5432/studioos";

function resolveDatabaseUrl() {
  return (
    process.env.DATABASE_URL?.trim() ||
    process.env.POSTGRES_PRISMA_URL?.trim() ||
    process.env.POSTGRES_URL_NON_POOLING?.trim() ||
    process.env.POSTGRES_URL?.trim() ||
    (process.env.NODE_ENV !== "production" ? DEFAULT_LOCAL_DATABASE_URL : "")
  );
}

const resolvedDatabaseUrl = resolveDatabaseUrl();
if (resolvedDatabaseUrl && !process.env.DATABASE_URL) {
  process.env.DATABASE_URL = resolvedDatabaseUrl;
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"]
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export function hasDatabaseUrl(): boolean {
  return Boolean(resolveDatabaseUrl());
}
