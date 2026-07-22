import { creditWalletService } from "@/features/credit-wallet/credit-wallet.service";
import { apiSuccess, handleRouteError, requireApiUser } from "@/lib/core/api-route";

export async function GET(request: Request) {
  try {
    const user = await requireApiUser(request);
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get("limit") ?? "50");
    const transactions = await creditWalletService.listTransactions(
      user.id,
      Number.isFinite(limit) ? Math.min(100, Math.max(1, limit)) : 50
    );
    return apiSuccess({ transactions });
  } catch (error) {
    return handleRouteError(error);
  }
}
