import { PrismaClient } from "@prisma/client";

const DEFAULT_LOCAL_DATABASE_URL = "postgresql://studioos:studioos@localhost:5432/studioos";

type ProbeResult =
  | { ok: true; url: string; client: PrismaClient; via?: string }
  | { ok: false; detail: string };

function isProductionRuntime() {
  return process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
}

function normalizeDatabaseUrl(url: string) {
  return url.trim();
}

function resolveCandidateDatabaseUrls(): string[] {
  const candidates = [
    process.env.DATABASE_URL,
    process.env.DIRECT_DATABASE_URL,
    process.env.POSTGRES_URL_NON_POOLING,
    process.env.POSTGRES_PRISMA_URL,
    process.env.POSTGRES_URL
  ]
    .map((value) => (value ? normalizeDatabaseUrl(value) : ""))
    .filter(Boolean);

  const unique: string[] = [];
  for (const url of candidates) {
    if (!unique.includes(url)) unique.push(url);
  }

  if (!isProductionRuntime()) {
    const hasLocal = unique.some((url) => /localhost|127\.0\.0\.1/.test(url));
    if (!hasLocal) unique.push(DEFAULT_LOCAL_DATABASE_URL);
  }

  return unique;
}

export function redactDatabaseUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname || "unknown-host";
    const port = parsed.port || "5432";
    const db = parsed.pathname.replace(/^\//, "") || "postgres";
    return `${host}:${port}/${db}`;
  } catch {
    return "invalid DATABASE_URL";
  }
}

function collectErrorText(error: unknown): string {
  const parts: string[] = [];
  const seen = new Set<string>();

  function push(value: unknown) {
    if (value == null) return;
    const text = value instanceof Error ? value.message : String(value);
    const trimmed = text.trim();
    if (!trimmed || seen.has(trimmed)) return;
    seen.add(trimmed);
    parts.push(trimmed);
  }

  push(error);
  if (error instanceof Error) {
    push(error.cause);
    const prismaCode = (error as Error & { code?: string }).code;
    if (prismaCode) push(`Prisma code ${prismaCode}`);
  }

  return parts.join(" | ");
}

function hintForDatabaseError(message: string): string | undefined {
  const lower = message.toLowerCase();
  if (
    lower.includes("can't reach database server") ||
    lower.includes("connection refused") ||
    lower.includes("econnrefused") ||
    lower.includes("connect timeout") ||
    lower.includes("timed out") ||
    lower.includes("enotfound")
  ) {
    return "Postgres unreachable — run `docker compose up -d`, then `npm run db:migrate:deploy`";
  }
  if (lower.includes("authentication failed") || lower.includes("password authentication failed")) {
    return "Check DATABASE_URL credentials in .env.local";
  }
  if (lower.includes("does not exist") && lower.includes("database")) {
    return "Database missing — run `npm run db:migrate:deploy`";
  }
  if (
    lower.includes("prepared statement") ||
    lower.includes("pgbouncer") ||
    lower.includes("transaction mode")
  ) {
    return "Pooled URL incompatible with raw SQL — set DIRECT_DATABASE_URL to the unpooled host";
  }
  if (lower.includes("self signed certificate") || lower.includes("ssl") || lower.includes("tls")) {
    return "Add `?sslmode=require` to DATABASE_URL for remote Postgres";
  }
  if (lower.includes("prisma client") && lower.includes("generate")) {
    return "Run `npm run db:generate`";
  }
  return undefined;
}

export function formatDatabaseConnectionError(error: unknown, attempted?: string[]): string {
  const combined = collectErrorText(error);
  const firstLine =
    combined.split("\n").find((line) => line.trim() && !line.includes("Invalid `prisma."))?.trim() ??
    combined.split("\n").find((line) => line.trim())?.trim() ??
    "Database connection failed";

  const hint = hintForDatabaseError(combined);
  const hosts =
    attempted && attempted.length
      ? ` (tried ${attempted.map((url) => redactDatabaseUrl(url)).join(", ")})`
      : "";

  const core = firstLine.includes("Invalid `prisma.$queryRaw()` invocation")
    ? combined.replace(/\s+/g, " ").slice(0, 240) || "Database connection failed"
    : firstLine;

  if (hint) return `${core}${hosts} — ${hint}`;
  if (hosts) return `${core}${hosts}`;
  return core || "Database connection failed — run `docker compose up -d` locally";
}

function createProbeClient(url: string) {
  return new PrismaClient({
    datasources: { db: { url } }
  });
}

async function tryConnect(url: string): Promise<{ ok: true; client: PrismaClient } | { ok: false; error: unknown }> {
  const client = createProbeClient(url);
  try {
    await client.$connect();
    await client.$queryRaw`SELECT 1`;
    return { ok: true, client };
  } catch (error) {
    await client.$disconnect().catch(() => undefined);
    return { ok: false, error };
  }
}

export async function probeDatabaseConnection(): Promise<ProbeResult> {
  const urls = resolveCandidateDatabaseUrls();
  if (urls.length === 0) {
    return { ok: false, detail: "DATABASE_URL not set" };
  }

  let lastError: unknown;
  for (const url of urls) {
    const attempt = await tryConnect(url);
    if (attempt.ok) {
      const via =
        url === DEFAULT_LOCAL_DATABASE_URL && normalizeDatabaseUrl(process.env.DATABASE_URL ?? "") !== url
          ? "local docker fallback"
          : undefined;
      return { ok: true, url, client: attempt.client, via };
    }
    lastError = attempt.error;
  }

  return {
    ok: false,
    detail: formatDatabaseConnectionError(lastError, urls)
  };
}

export async function probeDatabaseTable(
  client: PrismaClient,
  table: string
): Promise<{ ok: true } | { ok: false; detail: string }> {
  try {
    await client.$queryRawUnsafe(`SELECT 1 FROM "${table}" LIMIT 1`);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      detail: formatDatabaseConnectionError(error).split("\n")[0] ?? "missing — run npm run db:migrate:deploy"
    };
  }
}
