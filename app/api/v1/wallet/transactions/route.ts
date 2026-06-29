import { walletService } from "@/features/wallet/wallet.service";
import { apiSuccess, handleRouteError, requireApiUser } from "@/lib/core/api-route";

export async function GET(request: Request) {
  try {
    const user = await requireApiUser();
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get("limit") ?? "50");
    const result = await walletService.listLedger(
      { id: user.id, role: user.role },
      Number.isFinite(limit) ? limit : 50
    );
    return apiSuccess(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
