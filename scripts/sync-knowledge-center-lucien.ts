import { knowledgeCenterService } from "@/features/knowledge-center/knowledge-center.service";

async function main() {
  await knowledgeCenterService.ensureSeeds();
  const articles = await knowledgeCenterService.listAdmin({ status: "PUBLISHED" });
  let synced = 0;
  for (const article of articles) {
    const result = await knowledgeCenterService.syncLucien(article.id);
    synced += result.synced;
  }
  console.log(`Knowledge Center Lucien sync complete — ${synced} rows upserted from ${articles.length} articles.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
