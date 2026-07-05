import { isRetryableTransactionError } from "../../lib/core/database/prisma-transaction";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Retry verify steps that hit Prisma pool / interactive transaction contention. */
export async function withVerifyTransactionRetry<T>(
  fn: () => Promise<T>,
  options?: { attempts?: number; delayMs?: number }
): Promise<T> {
  const attempts = options?.attempts ?? 5;
  const delayMs = options?.delayMs ?? 1000;
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (!isRetryableTransactionError(error) || attempt >= attempts) {
        throw error;
      }
      await sleep(delayMs * attempt);
    }
  }

  throw lastError;
}
