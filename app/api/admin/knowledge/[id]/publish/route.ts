import { requireAdminMutationUser } from "@/features/admin/auth/admin-api-guard";
import { knowledgeCenterService } from "@/features/knowledge-center/knowledge-center.service";
import { apiSuccess, handleRouteError } from "@/lib/core/api-route";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    await requireAdminMutationUser(request);
    const { id } = await context.params;
    const saved = await knowledgeCenterService.publish(id);
    return apiSuccess(saved);
  } catch (error) {
    return handleRouteError(error);
  }
}
