import { platformPaymentService } from "@/features/payment/platform-payment.service";
import { getAppUiLocale } from "@/lib/app-language";
import { apiSuccess, handleRouteError, requireApiUser } from "@/lib/core/api-route";

export async function POST(request: Request) {
  try {
    const user = await requireApiUser(request);
    if (user.role !== "CREATOR") {
      return handleRouteError(new Error("Creator account required"));
    }
    const locale = await getAppUiLocale();
    const checkout = await platformPaymentService.createCreatorDepositCheckout(user.id, locale);
    return apiSuccess(checkout, 202);
  } catch (error) {
    return handleRouteError(error);
  }
}
