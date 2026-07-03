const POSTGRES_UNDEFINED_COLUMN = "42703";
const POSTGRES_UNDEFINED_TABLE = "42P01";

export function isMissingPrismaMigrationError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const candidate = error as {
    code?: unknown;
    meta?: { code?: unknown; database_error?: unknown; table?: unknown; column?: unknown };
    message?: unknown;
  };
  if (candidate.code === "P2021" || candidate.code === "P2022") return true;
  if (candidate.meta?.code === POSTGRES_UNDEFINED_COLUMN || candidate.meta?.code === POSTGRES_UNDEFINED_TABLE) {
    return true;
  }
  const message = typeof candidate.message === "string" ? candidate.message : "";
  return (
    message.includes(POSTGRES_UNDEFINED_COLUMN) ||
    message.includes(POSTGRES_UNDEFINED_TABLE) ||
    message.includes("does not exist")
  );
}
