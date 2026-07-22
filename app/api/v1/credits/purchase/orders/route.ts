import { creditWalletService } from "@/features/credit-wallet/credit-wallet.service";
import { apiSuccess, handleRouteError, requireApiUser } from "@/lib/core/api-route";

export async function GET(request: Request) {
  try {
    const user = await requireApiUser(request);
    const orders = await creditWalletService.listPurchaseOrders(user.id);
    return apiSuccess({ orders });
  } catch (error) {
    return handleRouteError(error);
  }
}
