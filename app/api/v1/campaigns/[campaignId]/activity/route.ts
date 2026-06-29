import { activityService } from "@/features/campaign/activity.service";
import { apiSuccess, handleRouteError, requireApiUser } from "@/lib/core/api-route";

type Params = { params: Promise<{ campaignId: string }> };

export async function GET(request: Request, { params }: Params) {
  try {
    const user = await requireApiUser();
    const { campaignId } = await params;
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get("limit") ?? "50");
    const items = await activityService.listForCampaign(
      campaignId,
      { id: user.id, role: user.role },
      Number.isFinite(limit) ? limit : 50
    );
    return apiSuccess({ items });
  } catch (error) {
    return handleRouteError(error);
  }
}
