import { reviewService } from "@/features/review/review.service";
import { apiSuccess, handleRouteError, requireApiUser } from "@/lib/core/api-route";

type Params = { params: Promise<{ campaignId: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const user = await requireApiUser();
    const { campaignId } = await params;
    const timeline = await reviewService.getCampaignReviewTimeline(campaignId, {
      id: user.id,
      role: user.role
    });
    return apiSuccess(timeline);
  } catch (error) {
    return handleRouteError(error);
  }
}
