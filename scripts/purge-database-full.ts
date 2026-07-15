/**
 * Wipe ALL application data from Postgres — users, campaigns, orders, knowledge, admin, etc.
 * Schema + i18n language catalog are preserved.
 *
 * Local:
 *   STUDIOOS_PURGE_DATABASE_FULL=YES_I_UNDERSTAND npm run db:purge-full
 *
 * Production (uses .env.production.migrate):
 *   STUDIOOS_PURGE_DATABASE_FULL=YES_I_UNDERSTAND npm run db:purge-full:production
 *
 * Both (JSON locally + Neon production DB):
 *   STUDIOOS_PURGE_DATABASE_FULL=YES_I_UNDERSTAND npm run db:purge-full:sync
 *
 * Note: if .env.local DATABASE_URL is Neon (not localhost), use db:purge-full:production
 * or db:purge-full:sync — not plain db:purge-full without STUDIOOS_PURGE_DATABASE_TARGET=production.
 */
import { PrismaClient } from "@prisma/client";
import { promises as fs } from "node:fs";
import path from "node:path";

const CONFIRM_ENV = "STUDIOOS_PURGE_DATABASE_FULL";
const CONFIRM_VALUE = "YES_I_UNDERSTAND";
const PRODUCTION_FLAG = "STUDIOOS_PURGE_DATABASE_TARGET";
const SKIP_POSTGRES_ENV = "STUDIOOS_PURGE_SKIP_POSTGRES";

/** Migration-seeded i18n catalog — keep so schema stays usable after wipe. */
const PRESERVE_TABLES = new Set([
  "_prisma_migrations",
  "languages",
  "language_keys",
  "language_translations",
  /** Owner master admin — never wipe super-admin identity on full purge. */
  "admin_users"
]);

const EMPTY_RUNTIME_STORES: Record<string, Record<string, unknown>> = {
  "order-store.json": { quotes: [], orders: [], deliverables: [], dismissed_demo_ids: [], deleted_order_ids: [] },
  "project-store.json": { projects: [], applications: [], dismissed_demo_ids: [], deleted_project_ids: [] },
  "campaign-store.json": { assets: [], references: [], briefs: [], pack_items: [] },
  "chat-store.json": { inquiries: [], messages: [] },
  "review-store.json": { comments: [], dismissed_demo_order_ids: [] },
  "creator-invitation-store.json": { invitations: [] },
  "notification-store.json": { notifications: [], dismissed_demo_ids: [] },
  "brand-notification-store.json": { notifications: [] },
  "project-events-store.json": { events: [] },
  "review-engine-store.json": { sessions: [] },
  "creative-performance-store.json": { records: [], insights: [], dna_profiles: [] },
  "work-engagement-store.json": { likes: {} },
  "order-ratings-store.json": { reviews: [] },
  "withdrawal-store.json": { payout_methods: [], withdrawals: [] },
  "deliverable-video-retention.json": { records: [] },
  "certification-form-store.json": { forms: [] },
  "deposit-store.json": { creator_overlays: {}, payments: [] },
  "creator-settings-store.json": { settings: {}, email_aliases: {} },
  "creator-profile-store.json": { profiles: {} },
  "brand-profile-store.json": { profiles: {} },
  "works-store.json": { works: [], deletedIds: [] },
  "mvp-store.json": { profiles: [], projects: [], versions: [], comments: [] }
};

function databaseHost(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "unknown";
  }
}

function isProductionDatabase(url: string): boolean {
  const host = databaseHost(url).toLowerCase();
  return !host.includes("localhost") && !host.includes("127.0.0.1");
}

async function writeJsonStores(root: string) {
  const exists = await fs.stat(root).then((stat) => stat.isDirectory()).catch(() => false);
  if (!exists) return 0;

  await Promise.all(
    Object.entries(EMPTY_RUNTIME_STORES).map(async ([fileName, data]) => {
      await fs.writeFile(path.join(root, fileName), `${JSON.stringify(data, null, 2)}\n`, "utf8");
    })
  );
  return Object.keys(EMPTY_RUNTIME_STORES).length;
}

async function clearLocalJsonStores() {
  const root = process.cwd();
  const seedCount = await writeJsonStores(path.join(root, "seed"));
  await fs.mkdir(path.join(root, ".data"), { recursive: true });
  const dataCount = await writeJsonStores(path.join(root, ".data"));
  return { seedCount, dataCount };
}

async function countRows(prisma: PrismaClient, table: string): Promise<number> {
  const rows = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
    `SELECT COUNT(*)::bigint AS count FROM ${quoteIdent(table)}`
  );
  return Number(rows[0]?.count ?? 0);
}

function quoteIdent(name: string): string {
  return `"${name.replace(/"/g, '""')}"`;
}

async function purgePostgres(prisma: PrismaClient) {
  const tables = await prisma.$queryRawUnsafe<Array<{ tablename: string }>>(
    `SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`
  );

  const targets = tables.map((row) => row.tablename).filter((name) => !PRESERVE_TABLES.has(name));
  if (!targets.length) {
    return { truncated: 0, before: {}, after: {} };
  }

  const before: Record<string, number> = {};
  for (const table of ["users", "campaigns", "notifications", "knowledge_articles", "admin_users"]) {
    if (targets.includes(table)) {
      before[table] = await countRows(prisma, table);
    }
  }

  const tableList = targets.map(quoteIdent).join(", ");
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tableList} RESTART IDENTITY CASCADE`);

  const after: Record<string, number> = {};
  for (const table of Object.keys(before)) {
    after[table] = await countRows(prisma, table);
  }

  return { truncated: targets.length, before, after };
}

async function main() {
  if (process.env[CONFIRM_ENV] !== CONFIRM_VALUE) {
    throw new Error(`Refusing to wipe database. Re-run with ${CONFIRM_ENV}=${CONFIRM_VALUE}.`);
  }

  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set.");
  }

  const skipPostgres = process.env[SKIP_POSTGRES_ENV] === "1";
  const host = databaseHost(databaseUrl);
  const production = isProductionDatabase(databaseUrl);
  if (production && !skipPostgres && process.env[PRODUCTION_FLAG] !== "production") {
    throw new Error(
      `Production database detected (${host}). Re-run with ${PRODUCTION_FLAG}=production to confirm.`
    );
  }

  console.log(
    `\n⚠️  FULL DATABASE WIPE — target: ${host}${
      skipPostgres ? " (JSON stores only)" : production ? " (PRODUCTION)" : " (local)"
    }\n`
  );

  const databaseUrlForSql =
    process.env.DIRECT_DATABASE_URL?.trim() || process.env.DATABASE_URL?.trim() || "";
  const prisma = new PrismaClient({
    datasources: databaseUrlForSql ? { db: { url: databaseUrlForSql } } : undefined
  });
  try {
    const jsonResult = await clearLocalJsonStores();
    const postgresResult =
      process.env[SKIP_POSTGRES_ENV] === "1"
        ? { skipped: true as const, truncated: 0, before: {}, after: {} }
        : { skipped: false as const, ...(await purgePostgres(prisma)) };

    console.log("JSON runtime stores cleared:");
    console.log(`  seed/: ${jsonResult.seedCount} files`);
    console.log(`  .data/: ${jsonResult.dataCount} files`);
    if (postgresResult.skipped) {
      console.log("\nPostgres: skipped (STUDIOOS_PURGE_SKIP_POSTGRES=1)");
    } else {
      console.log(`\nPostgres tables truncated: ${postgresResult.truncated}`);
      console.log("Row counts before → after:");
      for (const [table, count] of Object.entries(postgresResult.before)) {
        console.log(`  ${table}: ${count} → ${postgresResult.after[table] ?? 0}`);
      }
    }

    console.log("\nPreserved tables:", [...PRESERVE_TABLES].join(", "));
    console.log("\nNext steps:");
    console.log("  1. Supabase Dashboard → Authentication → Users → delete all auth users");
    console.log("  2. If admin login fails: npm run bootstrap:admin:restore-master");
    console.log("  3. Redeploy or wait for ISR cache on Vercel (knowledge center / marketing)");
    console.log("  4. Do NOT run npm run db:seed unless you want demo data again\n");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
