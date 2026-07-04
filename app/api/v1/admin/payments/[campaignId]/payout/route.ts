import { paymentCollectionService } from "@/features/payment/payment-collection.service";
import { requireAdminMutationUser } from "@/features/admin/auth/admin-api-guard";
import { apiSuccess, handleRouteError } from "@/lib/core/api-route";

type Params = { params: Promise<{ campaignId: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const user = await requireAdminMutationUser(request);
    const { campaignId } = await params;
    const result = await paymentCollectionService.markCreatorPayoutPaid(user, campaignId);
    return apiSuccess(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
