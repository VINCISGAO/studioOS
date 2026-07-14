import { requireAdminMutationUser } from "@/features/admin/auth/admin-api-guard";
import { knowledgeCenterService } from "@/features/knowledge-center/knowledge-center.service";
import { apiError, apiSuccess, handleRouteError } from "@/lib/core/api-route";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await requireAdminMutationUser(request);
    const body = (await request.json()) as { ids?: unknown };
    const ids = Array.isArray(body.ids) ? body.ids.map((id) => String(id).trim()).filter(Boolean) : [];
    if (!ids.length) {
      return apiError("VALIDATION_ERROR", "ids is required", 422);
    }
    const deleted = await knowledgeCenterService.deleteMany(ids);
    return apiSuccess({ deleted });
  } catch (error) {
    return handleRouteError(error);
  }
}
