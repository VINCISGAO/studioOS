import { stripeConnectService } from "@/features/payment/stripe-connect.service";
import { getAppUiLocale } from "@/lib/app-language";
import { apiSuccess, handleRouteError, requireApiUser } from "@/lib/core/api-route";

export async function GET() {
  try {
    const user = await requireApiUser();
    if (user.role !== "CREATOR") {
      return handleRouteError(new Error("Creator account required"));
    }
    const status = await stripeConnectService.getStatus(user.id);
    return apiSuccess({ status });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST() {
  try {
    const user = await requireApiUser();
    if (user.role !== "CREATOR") {
      return handleRouteError(new Error("Creator account required"));
    }
    const locale = await getAppUiLocale();
    const onboarding = await stripeConnectService.createOnboardingLink(user.id, locale);
    return apiSuccess(onboarding, 202);
  } catch (error) {
    return handleRouteError(error);
  }
}
