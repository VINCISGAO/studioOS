import { stripeEmbeddedPaymentService } from "@/features/payment/stripe-embedded-payment.service";
import { getAppUiLocale } from "@/lib/app-language";
import { apiSuccess, handleRouteError, requireApiUser } from "@/lib/core/api-route";

export async function POST(request: Request) {
  try {
    const user = await requireApiUser(request);
    if (user.role !== "CREATOR") {
      return handleRouteError(new Error("Creator account required"));
    }

    const locale = await getAppUiLocale();
    const body = (await request.json().catch(() => ({}))) as { savePaymentMethod?: boolean };
    const intent = await stripeEmbeddedPaymentService.createCreatorDepositIntent({
      userId: user.id,
      locale,
      savePaymentMethod: body.savePaymentMethod !== false
    });

    return apiSuccess(intent, 202);
  } catch (error) {
    return handleRouteError(error);
  }
}
