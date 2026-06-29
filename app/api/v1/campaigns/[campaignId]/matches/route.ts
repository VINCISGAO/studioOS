import { matchingService } from "@/features/matching/matching.service";
import { apiSuccess, handleRouteError, requireApiUser } from "@/lib/core/api-route";

type Params = { params: Promise<{ campaignId: string }> };

export async function GET(request: Request, { params }: Params) {
  try {
    const user = await requireApiUser();
    const { campaignId } = await params;
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get("limit") ?? "6");
    const matches = await matchingService.matchCreatorsForCampaign(campaignId, { id: user.id, role: user.role }, limit);
    return apiSuccess({ items: matches });
  } catch (error) {
    return handleRouteError(error);
  }
}
