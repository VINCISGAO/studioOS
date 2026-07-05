import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/core/database/prisma";

/** Options for interactive `prisma.$transaction(fn, options)` — not exported as Prisma.TransactionOptions in all client versions. */
export type PrismaInteractiveTransactionOptions = {
  maxWait?: number;
  timeout?: number;
  isolationLevel?: Prisma.TransactionIsolationLevel;
};

export const DEFAULT_PRISMA_TRANSACTION_OPTIONS: PrismaInteractiveTransactionOptions = {
  maxWait: Number(process.env.PRISMA_TX_MAX_WAIT ?? 15_000),
  timeout: Number(process.env.PRISMA_TX_TIMEOUT ?? 60_000)
};

function defaultMaxAttempts() {
  return process.env.STUDIOOS_SCRIPT_RUNTIME === "verify" ? 5 : 3;
}

export function isRetryableTransactionError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("Unable to start a transaction") ||
    message.includes("P2034") ||
    message.includes("deadlock") ||
    message.includes("advisory lock")
  );
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Interactive Prisma transaction with longer waits + retry for pool / lock contention. */
export async function withPrismaTransaction<T>(
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
  options?: { maxAttempts?: number; transaction?: PrismaInteractiveTransactionOptions }
): Promise<T> {
  const maxAttempts = options?.maxAttempts ?? defaultMaxAttempts();
  const transaction = options?.transaction ?? DEFAULT_PRISMA_TRANSACTION_OPTIONS;

  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await prisma.$transaction(fn, transaction);
    } catch (error) {
      lastError = error;
      if (!isRetryableTransactionError(error) || attempt >= maxAttempts) {
        throw error;
      }
      await sleep(attempt * 750);
    }
  }

  throw lastError;
}
