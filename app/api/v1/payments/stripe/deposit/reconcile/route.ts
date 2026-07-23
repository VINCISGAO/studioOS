import { stripeEmbeddedPaymentService } from "@/features/payment/stripe-embedded-payment.service";
import { apiSuccess, handleRouteError, requireApiUser } from "@/lib/core/api-route";

export async function POST(request: Request) {
  try {
    const user = await requireApiUser(request);
    if (user.role !== "CREATOR") {
      return handleRouteError(new Error("Creator account required"));
    }

    const body = (await request.json()) as { paymentIntentId?: string };
    const paymentIntentId = body.paymentIntentId?.trim();
    if (!paymentIntentId) {
      return handleRouteError(new Error("paymentIntentId is required"));
    }

    const result = await stripeEmbeddedPaymentService.reconcileCreatorDepositIntent(
      paymentIntentId,
      user.id
    );
    return apiSuccess(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
