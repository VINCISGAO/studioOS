import { creditWalletService } from "@/features/credit-wallet/credit-wallet.service";
import { getAppUiLocale } from "@/lib/app-language";
import { apiSuccess, handleRouteError, requireApiUser } from "@/lib/core/api-route";

export async function GET(request: Request) {
  try {
    const user = await requireApiUser(request);
    const uiLocale = await getAppUiLocale();
    const dashboard = await creditWalletService.getDashboard(user, uiLocale);
    return apiSuccess(dashboard);
  } catch (error) {
    return handleRouteError(error);
  }
}
