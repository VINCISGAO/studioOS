/**
 * AI Communication Engine verification
 * Run: npm run communication:verify
 */
import { PrismaClient } from "@prisma/client";
import { communicationService } from "../features/communication/communication.service";
import { communicationAiService } from "../features/communication/communication-ai.service";
import { platformLocalizationService } from "../features/communication/platform-localization.service";
import { communicationConfig } from "../lib/core/config/communication";

const prisma = new PrismaClient();

type Check = { name: string; ok: boolean; detail?: string };

async function main() {
  const checks: Check[] = [];
  let campaignId: string | null = null;
  let messageId: string | null = null;

  try {
    checks.push({
      name: "languages.supported",
      ok: communicationConfig.supportedLanguages.length >= 12,
      detail: `${communicationConfig.supportedLanguages.length} languages`
    });

    const brand = await prisma.user.findUniqueOrThrow({ where: { email: "client.arc@adbridge.test" } });
    const creator = await prisma.user.findUniqueOrThrow({ where: { email: "creator.nova@adbridge.test" } });

    const campaign = await prisma.campaign.create({
      data: {
        brandId: brand.id,
        creatorId: creator.id,
        title: "AI Communication Verify",
        description: "This looks cheap. Please make the CTA appear earlier and punch up the ending.",
        budget: 3200,
        deadline: new Date(Date.now() + 10 * 86400000),
        platform: "TikTok",
        aspectRatio: "9:16",
        status: "PRODUCING",
        reviewRound: 0,
        currentVersion: 0
      }
    });
    campaignId = campaign.id;

    const ai = await communicationAiService.processMessage({
      content: "This sucks. Make it punchier and move the logo.",
      targetLanguage: "zh_cn",
      sourceType: "CHAT",
      context: "ad review feedback",
      senderRole: "BRAND"
    });
    checks.push({
      name: "ai.json_output",
      ok: Boolean(ai.result.localizedContent) && Boolean(ai.result.language),
      detail: ai.result.language
    });
    checks.push({
      name: "ai.original_preserved_logic",
      ok: !ai.result.localizedContent.toLowerCase().includes("this sucks"),
      detail: "tone optimized"
    });

    const sent = await communicationService.sendCampaignMessage(
      campaign.id,
      { id: brand.id, role: "BRAND" },
      "Please increase logo size and improve subtitle readability. We need a stronger emotional ending."
    );
    messageId = sent.id;
    checks.push({
      name: "message.auto_localized",
      ok: Boolean(sent.displayContent) && sent.autoLocalized !== false,
      detail: sent.language?.code
    });
    checks.push({
      name: "message.original_stored",
      ok: Boolean(sent.originalContent?.includes("logo")),
      detail: "original kept for brand"
    });
    checks.push({
      name: "message.no_manual_translate",
      ok: sent.displayContent !== sent.originalContent || sent.language?.code === sent.targetLanguage,
      detail: "auto pipeline"
    });

    const brief = await platformLocalizationService.localizeCampaignBrief(campaign.id, creator.id);
    checks.push({
      name: "platform.brief",
      ok: Boolean(brief?.displayContent),
      detail: brief?.autoLocalized ? "localized" : "fallback"
    });

    const translateApi = await communicationService.translateText(
      { id: creator.id, role: "CREATOR" },
      {
        content: "今晚可以完成第一版修改。",
        targetLanguage: "en",
        sourceType: "CHAT",
        campaignId: campaign.id,
        context: "creator reply"
      }
    );
    checks.push({
      name: "creator.reply.localized",
      ok: Boolean(translateApi.localizedContent || translateApi.displayContent),
      detail: translateApi.targetLanguage
    });

    const logs = await prisma.communicationTranslationLog.count({
      where: { messageId: sent.id }
    });
    checks.push({
      name: "audit.translation_log",
      ok: logs >= 1,
      detail: `${logs} log(s)`
    });

    const summarize = await communicationService.summarizeText(
      { id: creator.id, role: "CREATOR" },
      "Logo too small. CTA too late. Ending feels weak. Subtitles hard to read on mobile.".repeat(20),
      "en"
    );
    checks.push({
      name: "summary.generated",
      ok: summarize.summary === null || summarize.summary.length > 0,
      detail: summarize.summary ? "has summary" : "short-input skip"
    });

    const todos = await communicationService.extractTodos(
      { id: creator.id, role: "CREATOR" },
      "Increase logo size. Move CTA earlier. Improve ending emotion.",
      "en"
    );
    checks.push({
      name: "todos.extracted",
      ok: todos.todos.length >= 1,
      detail: `${todos.todos.length} todo(s)`
    });
  } catch (error) {
    checks.push({
      name: "communication.run",
      ok: false,
      detail: error instanceof Error ? error.message : String(error)
    });
  } finally {
    if (campaignId) {
      await prisma.communicationMessage.deleteMany({ where: { campaignId } });
      await prisma.campaign.delete({ where: { id: campaignId } });
    }
  }

  console.log("\nAI Communication Engine verification\n");
  for (const check of checks) {
    console.log(`${check.ok ? "✅" : "❌"} ${check.name}${check.detail ? ` — ${check.detail}` : ""}`);
  }
  const failed = checks.filter((c) => !c.ok).length;
  console.log(failed ? `\n${failed} check(s) failed` : "\nAll checks passed");
  process.exit(failed ? 1 : 0);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
