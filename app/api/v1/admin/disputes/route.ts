import { disputeService } from "@/features/admin/dispute.service";
import { requireAdminAuthUser } from "@/features/admin/auth/admin-api-guard";
import { apiSuccess, handleRouteError } from "@/lib/core/api-route";
import type { DisputeStatus } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const user = await requireAdminAuthUser(request);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as DisputeStatus | null;
    const disputes = await disputeService.list(user, status ?? undefined);
    return apiSuccess({ disputes });
  } catch (error) {
    return handleRouteError(error);
  }
}
