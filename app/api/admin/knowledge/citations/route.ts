import { requireAdminSession } from "@/features/admin/auth/admin-api-guard";
import { knowledgeCenterService } from "@/features/knowledge-center/knowledge-center.service";
import { apiSuccess, handleRouteError } from "@/lib/core/api-route";

export async function GET(request: Request) {
  try {
    await requireAdminSession(request);
    const gaps = await knowledgeCenterService.getCitationGaps();
    const stats = await knowledgeCenterService.getDashboardStats();
    return apiSuccess({ gaps, stats });
  } catch (error) {
    return handleRouteError(error);
  }
}
