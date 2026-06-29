import { walletService } from "@/features/wallet/wallet.service";
import { apiSuccess, handleRouteError, requireApiUser } from "@/lib/core/api-route";

type Params = { params: Promise<{ campaignId: string }> };

/** Release held escrow into creator wallet (settlement). */
export async function POST(_request: Request, { params }: Params) {
  try {
    const user = await requireApiUser();
    const { campaignId } = await params;
    const result = await walletService.releaseEscrowForCampaign(campaignId, {
      id: user.id,
      role: user.role
    });
    return apiSuccess(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
