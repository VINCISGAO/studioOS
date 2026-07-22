import { creditWalletService } from "@/features/credit-wallet/credit-wallet.service";
import { apiSuccess, handleRouteError, requireApiUser } from "@/lib/core/api-route";

export async function GET(request: Request) {
  try {
    const user = await requireApiUser(request);
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get("limit") ?? "20");
    const rows = await creditWalletService.listEarningConversions(user.id, limit);
    return apiSuccess({ conversions: rows });
  } catch (error) {
    return handleRouteError(error);
  }
}
