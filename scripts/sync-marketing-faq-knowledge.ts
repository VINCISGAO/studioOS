import { marketingFaqKnowledgeService } from "@/features/ai-copilot/marketing-faq-knowledge.service";

async function main() {
  const result = await marketingFaqKnowledgeService.syncMarketingFaqToKnowledgeBase();
  console.log(
    `Synced marketing FAQ into Lucien knowledge base: ${result.count} entries (zh=${result.zhCount}, en=${result.enCount})`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
