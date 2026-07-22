import { creditPackageRegionalPricingService } from "@/features/credit-wallet/credit-package-regional-pricing.service";
import { getSessionUser } from "@/features/auth/session.service";
import { getAppUiLocale } from "@/lib/app-language";
import { apiSuccess, handleRouteError } from "@/lib/core/api-route";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const selectedRegion = url.searchParams.get("region");
    const user = await getSessionUser();
    const uiLocale = await getAppUiLocale();
    const result = await creditPackageRegionalPricingService.listPackagesForUser({
      user,
      request,
      selectedRegion,
      uiLocale
    });
    return apiSuccess(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
