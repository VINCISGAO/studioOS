import { paymentCollectionService } from "@/features/payment/payment-collection.service";
import { apiSuccess, handleRouteError, requireApiUser } from "@/lib/core/api-route";

type Params = { params: Promise<{ campaignId: string }> };

export async function POST(_request: Request, { params }: Params) {
  try {
    const user = await requireApiUser();
    const { campaignId } = await params;
    const result = await paymentCollectionService.markCreatorPayoutPaid(user, campaignId);
    return apiSuccess(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
