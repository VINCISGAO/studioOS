import { walletService } from "@/features/wallet/wallet.service";
import { apiSuccess, handleRouteError, requireApiUser } from "@/lib/core/api-route";

export async function GET() {
  try {
    const user = await requireApiUser();
    const result = await walletService.getWallet({ id: user.id, role: user.role });
    return apiSuccess(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
