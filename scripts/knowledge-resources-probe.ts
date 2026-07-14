/**
 * Probe production/local DB for knowledge center public page prerequisites.
 * Run: npm run knowledge:resources-probe
 */
import { probeDatabaseConnection, probeDatabaseTable, redactDatabaseUrl } from "./helpers/database-probe";

async function probeColumn(client: import("@prisma/client").PrismaClient, table: string, column: string) {
  try {
    await client.$queryRawUnsafe(`SELECT "${column}" FROM "${table}" LIMIT 1`);
    return { ok: true as const };
  } catch (error) {
    return {
      ok: false as const,
      detail: error instanceof Error ? error.message : String(error)
    };
  }
}

async function countPublishedArticles(client: import("@prisma/client").PrismaClient, languageCode: string) {
  try {
    const rows = await client.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(DISTINCT a.id) AS count
      FROM knowledge_articles a
      INNER JOIN knowledge_translations t ON t.article_id = a.id
      WHERE a.deleted_at IS NULL
        AND t.language_code = ${languageCode}
        AND t.status = CAST('PUBLISHED' AS "KnowledgeArticleStatus")
    `;
    return Number(rows[0]?.count ?? 0);
  } catch (error) {
    throw error;
  }
}

async function main() {
  const probe = await probeDatabaseConnection();
  if (!probe.ok) {
    console.error("Database probe failed:", probe.detail);
    process.exit(1);
  }

  console.log(`Database OK (${redactDatabaseUrl(probe.url)}${probe.via ? ` via ${probe.via}` : ""})`);

  for (const table of [
    "knowledge_articles",
    "knowledge_translations",
    "knowledge_categories",
    "knowledge_search_indexes"
  ]) {
    const result = await probeDatabaseTable(probe.client, table);
    console.log(result.ok ? `✅ table ${table}` : `❌ table ${table}: ${result.detail}`);
  }

  for (const column of ["visibility", "body_html"] as const) {
    const table = column === "visibility" ? "knowledge_articles" : "knowledge_translations";
    const result = await probeColumn(probe.client, table, column);
    console.log(result.ok ? `✅ column ${table}.${column}` : `❌ column ${table}.${column}: ${result.detail}`);
  }

  for (const languageCode of ["zh-CN", "en"]) {
    try {
      const count = await countPublishedArticles(probe.client, languageCode);
      console.log(`✅ published articles (${languageCode}): ${count}`);
    } catch (error) {
      console.error(
        `❌ published count (${languageCode}):`,
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  await probe.client.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
