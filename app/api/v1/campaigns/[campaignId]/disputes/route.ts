import { disputeService } from "@/features/admin/dispute.service";
import { openDisputeSchema } from "@/features/admin/admin.schemas";
import { apiSuccess, handleRouteError, requireApiUser } from "@/lib/core/api-route";

type RouteContext = { params: Promise<{ campaignId: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const user = await requireApiUser(request);
    const { campaignId } = await context.params;
    const disputes = await disputeService.listForCampaign(user, campaignId);
    return apiSuccess({ disputes });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await requireApiUser(request);
    const { campaignId } = await context.params;
    const body = openDisputeSchema.parse(await request.json());
    const dispute = await disputeService.open(user, campaignId, body.reason);
    return apiSuccess({ dispute }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
