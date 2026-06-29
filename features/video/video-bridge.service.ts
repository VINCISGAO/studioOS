import { findCampaignIdByMvpReviewProjectId } from "@/lib/project-service";
import { campaignBridgeService } from "@/features/campaign/campaign-bridge.service";
import { versionUploadService } from "@/features/video/version-upload.service";
import { getSessionUser } from "@/features/auth/session.service";
import { hasDatabaseUrl } from "@/lib/core/database/prisma";

export class VideoBridgeService {
  async resolvePrismaCampaignIdForMvpProject(mvpProjectId: string): Promise<string | null> {
    if (!hasDatabaseUrl()) return null;
    const legacyCampaignId = await findCampaignIdByMvpReviewProjectId(mvpProjectId);
    if (!legacyCampaignId) return null;
    return campaignBridgeService.resolvePrismaCampaignId(legacyCampaignId);
  }

  async syncUploadFromMvp(input: {
    mvpProjectId: string;
    videoUrl: string;
    videoKey: string;
  }): Promise<boolean> {
    const sessionUser = await getSessionUser();
    if (!sessionUser?.id || sessionUser.id.startsWith("demo_")) return false;

    const prismaCampaignId = await this.resolvePrismaCampaignIdForMvpProject(input.mvpProjectId);
    if (!prismaCampaignId) return false;

    await versionUploadService.createVersionFromUrl({
      campaignId: prismaCampaignId,
      uploadedBy: sessionUser.id,
      videoUrl: input.videoUrl,
      videoKey: input.videoKey
    });
    return true;
  }
}

export const videoBridgeService = new VideoBridgeService();
