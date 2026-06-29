import { campaignMemoryService } from "@/features/memory/campaign-memory.service";
import { campaignRepository } from "@/features/campaign/campaign.repository";
import { PermissionService } from "@/features/auth/permission.service";
import { apiSuccess, handleRouteError, requireApiUser } from "@/lib/core/api-route";
import { appError } from "@/lib/core/errors";

type Params = { params: Promise<{ campaignId: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const user = await requireApiUser();
    const { campaignId } = await params;
    const campaign = await campaignRepository.findById(campaignId);
    if (!campaign) throw appError("NOT_FOUND", "Campaign not found");
    if (!PermissionService.canAccessCampaign(user, campaign)) {
      throw appError("FORBIDDEN", "Not allowed");
    }

    const memory = await campaignMemoryService.getCampaignMemory(campaignId);
    return apiSuccess({ campaignMemory: memory });
  } catch (error) {
    return handleRouteError(error);
  }
}
