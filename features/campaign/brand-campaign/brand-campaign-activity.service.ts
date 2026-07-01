import { activityLogWriter } from "@/features/admin/activity-log.service";
import { readRequestMeta } from "@/lib/core/request-meta";
import type { BrandCampaignActor } from "@/features/campaign/brand-campaign/brand-campaign.types";

export class BrandCampaignActivityService {
  private async requestMeta() {
    return readRequestMeta();
  }

  async log(
    campaignId: string,
    action: string,
    actor: BrandCampaignActor,
    metadata?: Record<string, unknown>
  ) {
    const meta = await this.requestMeta();
    return activityLogWriter.write({
      campaignId,
      userId: actor.userId ?? null,
      action,
      metadata: {
        actor_email: actor.email,
        ...metadata
      },
      ip: meta.ip,
      device: meta.device
    });
  }
}

export const brandCampaignActivityService = new BrandCampaignActivityService();
