import { brandCampaignActivityService } from "@/features/campaign/brand-campaign/brand-campaign-activity.service";
import { mapCampaignToStoredProject } from "@/features/campaign/brand-campaign/brand-campaign.mapper";
import { brandCampaignRepository } from "@/features/campaign/brand-campaign/brand-campaign.repository";
import type { BrandCampaignMemory, BrandProductionBrief } from "@/features/campaign/brand-campaign/brand-campaign.types";
import { readCampaignMemory, readProductionBrief } from "@/features/campaign/brand-campaign/brand-campaign.utils";
import { CampaignEvent, campaignStateMachine } from "@/features/campaign/campaign.state-machine";
import { CampaignEvents } from "@/features/shared/types/events";
import { hasDatabaseUrl, prisma } from "@/lib/core/database/prisma";
import { runTransition } from "@/lib/core/transition-runner";
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

    await brandCampaignRepository.updateCampaign(campaign.id, {
      campaignMemoryJson: {
        ...memory,
        wizard: {
          ...memory.wizard,
          ephemeral: false
        },
        published_at: publishedAt
      }
    });

    await runTransition({
      machine: campaignStateMachine,
      current: "DRAFT",
      event: CampaignEvent.PUBLISH,
      context: {
        aggregateType: "campaign",
        aggregateId: campaign.id,
        campaignId: campaign.id,
        actor: actor.userId ? { id: actor.userId, role: "BRAND" } : undefined
      },
      persist: async (next) => {
        await prisma.campaign.update({
          where: { id: campaign.id },
          data: { status: next }
        });
      },
      domainEvent: {
        name: CampaignEvents.UPDATED,
        aggregateType: "campaign",
        aggregateId: campaign.id,
        payload: { event: CampaignEvent.PUBLISH, from: "DRAFT", legacy_project_id: legacyProjectId }
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

    const updated = await brandCampaignRepository.findByLegacyProjectId(legacyProjectId);
    return updated ? mapCampaignToStoredProject(updated) : null;
  }
}

export const brandCampaignPublishService = new BrandCampaignPublishService();
