import { disputeService } from "@/features/admin/dispute.service";
import { apiSuccess, handleRouteError, requireApiUser } from "@/lib/core/api-route";
import type { DisputeStatus } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const user = await requireApiUser();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as DisputeStatus | null;
    const disputes = await disputeService.list(user, status ?? undefined);
    return apiSuccess({ disputes });
  } catch (error) {
    return handleRouteError(error);
  }
}
