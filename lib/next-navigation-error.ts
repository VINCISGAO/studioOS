import "server-only";

/** Next.js navigation helpers throw errors with digest NEXT_* — must not be caught as failures. */
export function isNextNavigationError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const digest = (error as Error & { digest?: string }).digest;
  return (
    error.message === "NEXT_REDIRECT" ||
    error.message === "NEXT_NOT_FOUND" ||
    (typeof digest === "string" && digest.startsWith("NEXT_"))
  );
}

export function rethrowUnlessNavigationError(error: unknown): never {
  if (isNextNavigationError(error)) {
    throw error;
  }
  throw error;
}
