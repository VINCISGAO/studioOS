import { syncAllPublishedKnowledgeArticlesToLucien } from "@/features/knowledge-center/knowledge-lucien-sync.core";

async function main() {
  const result = await syncAllPublishedKnowledgeArticlesToLucien();
  console.log(
    `Knowledge Center Lucien sync complete — ${result.synced} rows upserted from ${result.articles} published articles.`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
