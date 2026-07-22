import { creditWalletService } from "@/features/credit-wallet/credit-wallet.service";
import { apiSuccess, handleRouteError, requireApiUser } from "@/lib/core/api-route";

export async function GET(
  request: Request,
  context: { params: Promise<{ orderId: string }> }
) {
  try {
    const user = await requireApiUser(request);
    const { orderId } = await context.params;
    const order = await creditWalletService.getPurchaseOrder(user, orderId);
    return apiSuccess({ order });
  } catch (error) {
    return handleRouteError(error);
  }
}
