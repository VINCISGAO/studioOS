import { escrowService } from "@/features/payment/escrow.service";
import { apiSuccess, handleRouteError, requireApiUser } from "@/lib/core/api-route";
import { appError } from "@/lib/core/errors";

type Params = { params: Promise<{ campaignId: string }> };

function allowDemoCheckout() {
  return (
    process.env.VINCIS_ENABLE_DEMO_PAYMENT === "1" ||
    process.env.STUDIOOS_ENABLE_DEMO_PAYMENT === "1" ||
    (process.env.NODE_ENV !== "production" && process.env.VERCEL !== "1")
  );
}

/** Demo escrow pay — local dev when Stripe keys are absent. */
export async function POST(_request: Request, { params }: Params) {
  try {
    if (!allowDemoCheckout()) {
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
