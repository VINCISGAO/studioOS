import { brandCampaignActivityService } from "@/features/campaign/brand-campaign/brand-campaign-activity.service";
import { mapCampaignToStoredProject } from "@/features/campaign/brand-campaign/brand-campaign.mapper";
import { brandCampaignRepository } from "@/features/campaign/brand-campaign/brand-campaign.repository";
import type { BrandCampaignMemory, BrandProductionBrief } from "@/features/campaign/brand-campaign/brand-campaign.types";
import { readCampaignMemory, readProductionBrief } from "@/features/campaign/brand-campaign/brand-campaign.utils";
import { hasDatabaseUrl } from "@/lib/core/database/prisma";
import type { StoredProject } from "@/lib/project-types";

export class BrandCampaignPublishService {
  isEnabled() {
    return hasDatabaseUrl();
  }

  async publish(
    legacyProjectId: string,
    actor: { email: string; userId?: string | null }
  ): Promise<StoredProject | null> {
    if (!this.isEnabled()) return null;

    const campaign = await brandCampaignRepository.findByLegacyProjectId(legacyProjectId);
    if (!campaign) {
      throw new Error("Campaign not found");
    }
    if (campaign.status !== "DRAFT") {
      throw new Error("Only draft campaigns can be published");
    }

    const brief = readProductionBrief(campaign.productionBrief) as BrandProductionBrief;
    if (!brief.confirmed_brief || typeof brief.confirmed_brief !== "object") {
      throw new Error("Confirmed brief required before publish");
    }

    const memory = readCampaignMemory(campaign.campaignMemoryJson) as BrandCampaignMemory;
    const publishedAt = new Date().toISOString();

    const updated = await brandCampaignRepository.updateCampaign(campaign.id, {
      status: "MATCHING",
      campaignMemoryJson: {
        ...memory,
        wizard: {
          ...memory.wizard,
          ephemeral: false
        },
        published_at: publishedAt
      }
    });

    await brandCampaignActivityService.log(
      campaign.id,
      "brand_campaign.published",
      { userId: actor.userId ?? campaign.brandId, email: actor.email, role: "brand" },
      {
        legacy_project_id: legacyProjectId,
        from_status: "DRAFT",
        to_status: "MATCHING"
      }
    );

    return mapCampaignToStoredProject(updated);
  }
}

export const brandCampaignPublishService = new BrandCampaignPublishService();
