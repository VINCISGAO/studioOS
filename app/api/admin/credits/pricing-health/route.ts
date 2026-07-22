import { adminAiModelService } from "@/features/admin/credits/admin-ai-model.service";
import { requireAdminAuthUser } from "@/features/admin/auth/admin-api-guard";
import { apiSuccess, handleRouteError } from "@/lib/core/api-route";

export async function GET(request: Request) {
  try {
    const user = await requireAdminAuthUser(request);
    const report = await adminAiModelService.getPricingHealth(user);
    return apiSuccess(report);
  } catch (error) {
    return handleRouteError(error);
  }
}
