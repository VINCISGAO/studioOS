import { withdrawService } from "@/features/wallet/withdraw.service";
import { apiSuccess, handleRouteError, requireApiUser } from "@/lib/core/api-route";

type Params = { params: Promise<{ withdrawId: string }> };

export async function POST(_request: Request, { params }: Params) {
  try {
    const user = await requireApiUser();
    const { withdrawId } = await params;
    const result = await withdrawService.demoCompleteOwnWithdraw(withdrawId, {
      id: user.id,
      role: user.role
    });
    return apiSuccess(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
