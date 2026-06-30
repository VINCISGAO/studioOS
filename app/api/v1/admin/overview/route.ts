import { adminService } from "@/features/admin/admin.service";
import { apiSuccess, handleRouteError, requireApiUser } from "@/lib/core/api-route";

export async function GET() {
  try {
    const user = await requireApiUser();
    const overview = await adminService.getOverview(user);
    return apiSuccess(overview);
  } catch (error) {
    return handleRouteError(error);
  }
}
