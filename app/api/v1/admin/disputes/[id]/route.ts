import { disputeService } from "@/features/admin/dispute.service";
import { resolveDisputeSchema } from "@/features/admin/admin.schemas";
import { requireAdminAuthUser, requireAdminMutationUser } from "@/features/admin/auth/admin-api-guard";
import { apiSuccess, handleRouteError } from "@/lib/core/api-route";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const user = await requireAdminAuthUser(request);
    const { id } = await context.params;
    const dispute = await disputeService.get(user, id);
    return apiSuccess({ dispute });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const user = await requireAdminMutationUser(request);
    const { id } = await context.params;
    const body = resolveDisputeSchema.parse(await request.json());
    const dispute = await disputeService.resolve(user, id, body);
    return apiSuccess({ dispute });
  } catch (error) {
    return handleRouteError(error);
  }
}
