import { platformCompanyCredentialsService } from "@/features/ai-copilot/platform-company-credentials.service";

async function main() {
  const result = await platformCompanyCredentialsService.syncToLucienKnowledgeBase();
  console.log(
    `Synced VINCIS company credentials into Lucien knowledge base: ${result.count} entries (zh=${result.zhCount}, en=${result.enCount})`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
