import { brandDnaService } from "@/features/memory/brand-dna.service";
import { memoryRepository } from "@/features/memory/memory.repository";
import type { CampaignMemorySnapshot } from "@/features/memory/memory.types";
import { prisma } from "@/lib/core/database/prisma";

export class CampaignMemoryService {
  async inheritForNewCampaign(campaignId: string, brandUserId: string) {
    const brandDna = await brandDnaService.buildSnapshot(brandUserId);
    const facts = await memoryRepository.listFacts({ ownerType: "BRAND", brandId: brandUserId, limit: 50 });

    const snapshot: CampaignMemorySnapshot = {
      version: 1,
      inheritedFromBrand: true,
      brandDna,
      resolvedReferences: brandDna.styleReferences,
      facts: facts.map((f) => ({ category: f.category, key: f.factKey, value: f.factValue }))
    };

    await prisma.campaign.update({
      where: { id: campaignId },
      data: { campaignMemoryJson: snapshot }
    });

    return snapshot;
  }

  async getCampaignMemory(campaignId: string): Promise<CampaignMemorySnapshot | null> {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { campaignMemoryJson: true, brandId: true }
    });
    if (!campaign) return null;

    if (campaign.campaignMemoryJson) {
      return campaign.campaignMemoryJson as CampaignMemorySnapshot;
    }

    return {
      version: 1,
      inheritedFromBrand: false,
      brandDna: await brandDnaService.buildSnapshot(campaign.brandId),
      resolvedReferences: [],
      facts: []
    };
  }

  formatForPrompt(snapshot: CampaignMemorySnapshot | null) {
    if (!snapshot?.brandDna) return "";
    return brandDnaService.formatForPrompt(snapshot.brandDna);
  }
}

export const campaignMemoryService = new CampaignMemoryService();
