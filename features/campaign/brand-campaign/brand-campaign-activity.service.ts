import { headers } from "next/headers";
import { activityLogWriter } from "@/features/admin/activity-log.service";
import type { BrandCampaignActor } from "@/features/campaign/brand-campaign/brand-campaign.types";

export class BrandCampaignActivityService {
  private async requestMeta() {
    const headerList = await headers();
    return {
      ip:
        headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        headerList.get("x-real-ip") ??
        null,
      device: headerList.get("user-agent")
    };
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
