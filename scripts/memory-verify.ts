/**
 * AI Memory verification — Brand/Creator/Relationship DNA + Campaign Memory
 * Run: npm run memory:verify
 */
import { PrismaClient } from "@prisma/client";
import { memoryExtractionService } from "../features/memory/memory-extraction.service";
import { memoryResolutionService } from "../features/memory/memory-resolution.service";
import { brandDnaService } from "../features/memory/brand-dna.service";
import { creatorDnaService } from "../features/memory/creator-dna.service";
import { relationshipDnaService } from "../features/memory/relationship-dna.service";
import { campaignMemoryService } from "../features/memory/campaign-memory.service";
import { aiPreferenceService } from "../features/memory/ai-preference.service";
import { matchingService } from "../features/matching/matching.service";

const prisma = new PrismaClient();

type Check = { name: string; ok: boolean; detail?: string };

async function main() {
  const checks: Check[] = [];
  let campaignId: string | null = null;

  try {
    const brand = await prisma.user.findUniqueOrThrow({ where: { email: "client.arc@adbridge.test" } });
    const creator = await prisma.user.findUniqueOrThrow({ where: { email: "creator.nova@adbridge.test" } });

    await memoryExtractionService.extractFromMessage({
      content: "我们品牌一直喜欢 Apple 那种极简风。",
      senderRole: "BRAND",
      brandId: brand.id,
      sourceRefId: "memory-verify-1"
    });

    const brandDna = await brandDnaService.buildSnapshot(brand.id);
    checks.push({
      name: "brand.dna.style",
      ok: brandDna.styleReferences.some((s) => /apple|极简|minimal/i.test(s)),
      detail: brandDna.styleReferences.join(", ") || "none"
    });

    await memoryExtractionService.extractFromMessage({
      content: "Logo 还是放右下角。",
      senderRole: "BRAND",
      brandId: brand.id,
      sourceRefId: "memory-verify-2"
    });
    const brandDna2 = await brandDnaService.buildSnapshot(brand.id);
    checks.push({
      name: "brand.dna.logo",
      ok: brandDna2.logoRules.some((r) => /bottom|右下/i.test(r)),
      detail: brandDna2.logoRules.join("; ") || "none"
    });

    const resolved = await memoryResolutionService.resolveMessage("还是和上次一样", brand.id);
    checks.push({
      name: "memory.same_as_last_time",
      ok: resolved.expanded && resolved.hints.length > 0,
      detail: `${resolved.hints.length} hints`
    });

    await memoryExtractionService.extractFromMessage({
      content: "我习惯用 Premiere，中文字幕，Runway 和 Veo 做 AI 视频。",
      senderRole: "CREATOR",
      creatorId: creator.id,
      brandId: brand.id,
      sourceRefId: "memory-verify-3"
    });
    const creatorDna = await creatorDnaService.buildSnapshot(creator.id);
    checks.push({
      name: "creator.dna.tools",
      ok: creatorDna.editingSoftware.some((t) => /premiere/i.test(t)) && creatorDna.aiVideoTools.length >= 1,
      detail: [...creatorDna.editingSoftware, ...creatorDna.aiVideoTools].join(", ")
    });

    await relationshipDnaService.seedDemoRelationship(brand.id, creator.id);
    const rel = await relationshipDnaService.buildSnapshot(brand.id, creator.id);
    checks.push({
      name: "relationship.dna",
      ok: rel != null && rel.collaborationCount >= 8 && (rel.avgSatisfaction ?? 0) >= 4.5,
      detail: rel ? `${rel.collaborationCount} collabs, ${rel.avgSatisfaction} sat` : "missing"
    });

    const campaign = await prisma.campaign.create({
      data: {
        brandId: brand.id,
        creatorId: creator.id,
        title: "Memory Verify Campaign",
        budget: 3000,
        deadline: new Date(Date.now() + 14 * 86400000),
        platform: "TikTok",
        aspectRatio: "9:16",
        status: "MATCHING"
      }
    });
    campaignId = campaign.id;

    const inherited = await campaignMemoryService.inheritForNewCampaign(campaign.id, brand.id);
    checks.push({
      name: "campaign.memory.inherit",
      ok: inherited.inheritedFromBrand && inherited.facts.length >= 1,
      detail: `${inherited.facts.length} facts`
    });

    const prefs = await aiPreferenceService.updateForUser(
      { id: brand.id, role: "BRAND" },
      { tone: "LUXURY", neverUseEmojis: true, preferredLanguage: "en" }
    );
    checks.push({
      name: "ai.preferences",
      ok: prefs.tone === "LUXURY" && prefs.neverUseEmojis === true,
      detail: prefs.tone
    });

    const matches = await matchingService.matchCreatorsForCampaign(campaign.id, {
      id: brand.id,
      role: "BRAND"
    });
    const novaMatch = matches.find((m) => m.userId === creator.id);
    checks.push({
      name: "matching.relationship_boost",
      ok: Boolean(novaMatch && (novaMatch.relationshipBoost ?? 0) > 0),
      detail: novaMatch ? `boost +${novaMatch.relationshipBoost}, score ${novaMatch.matchScore}` : "no match"
    });
  } catch (error) {
    checks.push({
      name: "memory.run",
      ok: false,
      detail: error instanceof Error ? error.message : String(error)
    });
  } finally {
    if (campaignId) {
      await prisma.memoryFact.deleteMany({ where: { campaignId } });
      await prisma.campaign.delete({ where: { id: campaignId } });
    }
  }

  console.log("\nAI Memory verification\n");
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
