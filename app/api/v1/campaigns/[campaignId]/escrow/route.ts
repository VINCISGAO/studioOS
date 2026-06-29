import { escrowService } from "@/features/payment/escrow.service";
import { apiSuccess, handleRouteError, requireApiUser } from "@/lib/core/api-route";

type Params = { params: Promise<{ campaignId: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const user = await requireApiUser();
    const { campaignId } = await params;
    const result = await escrowService.getEscrow(campaignId, { id: user.id, role: user.role });
    return apiSuccess(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
