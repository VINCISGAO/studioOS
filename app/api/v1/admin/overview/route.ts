import { adminService } from "@/features/admin/admin.service";
import { requireAdminAuthUser } from "@/features/admin/auth/admin-api-guard";
import { apiSuccess, handleRouteError } from "@/lib/core/api-route";

export async function GET(request: Request) {
  try {
    const user = await requireAdminAuthUser(request);
    const overview = await adminService.getOverview(user);
    return apiSuccess(overview);
  } catch (error) {
    return handleRouteError(error);
  }
}
