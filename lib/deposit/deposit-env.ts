import { hasDatabaseUrl } from "@/lib/core/database/prisma";

/** Production deposit state must live in PostgreSQL — never JSON files. */
export function assertProductionDepositDatabase() {
  if (!hasDatabaseUrl()) {
    throw new Error("Creator deposit requires DATABASE_URL — JSON store is not allowed in production");
  }
}

/** Demo auto-confirm is opt-in and never allowed in production. */
export function isDemoDepositPaymentsEnabled() {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.VERCEL !== "1" &&
    process.env.ENABLE_DEMO_PAYMENTS === "true"
  );
}

export function assertDemoDepositPaymentsAllowed(operation: string) {
  if (!isDemoDepositPaymentsEnabled()) {
    throw new Error(`${operation} is disabled — set ENABLE_DEMO_PAYMENTS=true in non-production only`);
  }
}
