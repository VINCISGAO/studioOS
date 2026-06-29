import { campaignService, serializeCampaign } from "@/features/campaign/campaign.service";
import { updateCampaignSchema } from "@/features/campaign/campaign.schemas";
import { apiSuccess, handleRouteError, requireApiUser } from "@/lib/core/api-route";
import { appError } from "@/lib/core/errors";

type Params = { params: Promise<{ campaignId: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const user = await requireApiUser();
    const { campaignId } = await params;
    const campaign = await campaignService.getDetail(campaignId, {
      id: user.id,
      role: user.role
    });
    return apiSuccess(serializeCampaign(campaign));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const user = await requireApiUser();
    const { campaignId } = await params;
    const body = updateCampaignSchema.parse(await request.json());
    if (Object.keys(body).length === 0) {
      throw appError("VALIDATION_ERROR", "No fields to update");
    }
    const campaign = await campaignService.update(campaignId, { id: user.id, role: user.role }, body);
    if (!campaign) {
      throw appError("NOT_FOUND", "Campaign not found");
    }
    return apiSuccess(serializeCampaign(campaign));
  } catch (error) {
    return handleRouteError(error);
  }
}
