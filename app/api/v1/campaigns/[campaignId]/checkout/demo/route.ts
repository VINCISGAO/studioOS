import { escrowService } from "@/features/payment/escrow.service";
import { apiSuccess, handleRouteError, requireApiUser } from "@/lib/core/api-route";
import { appError } from "@/lib/core/errors";
import { allowDemoPaymentFallback } from "@/lib/payment/payment-stub";

type Params = { params: Promise<{ campaignId: string }> };

/** Demo escrow pay — local dev when Stripe keys are absent. */
export async function POST(_request: Request, { params }: Params) {
  try {
    if (!allowDemoPaymentFallback()) {
      throw appError("FORBIDDEN", "Demo checkout is disabled in production");
    }

    const user = await requireApiUser();
    const { campaignId } = await params;
    const result = await escrowService.demoPay(campaignId, { id: user.id, role: user.role });
    return apiSuccess(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
