import { settlementService } from "@/features/settlement/settlement.service";
import { apiSuccess, handleRouteError, requireApiUser } from "@/lib/core/api-route";

type Params = { params: Promise<{ campaignId: string }> };

/** Release held escrow into creator wallet (settlement). */
export async function POST(_request: Request, { params }: Params) {
  try {
    const user = await requireApiUser();
    const { campaignId } = await params;
    const result = await settlementService.releaseForCampaign({
      campaignId,
      actor: { id: user.id, role: user.role, email: user.email },
      locale: "en"
    });

    if (!result.ok) {
      throw new Error(result.error);
    }

    return apiSuccess(result.result);
  } catch (error) {
    return handleRouteError(error);
  }
}
