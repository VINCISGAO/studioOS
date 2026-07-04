import { auditService } from "@/features/admin/audit.service";
import { auditQuerySchema } from "@/features/admin/admin.schemas";
import { requireAdminAuthUser } from "@/features/admin/auth/admin-api-guard";
import { apiSuccess, handleRouteError } from "@/lib/core/api-route";

export async function GET(request: Request) {
  try {
    const user = await requireAdminAuthUser(request);
    const { searchParams } = new URL(request.url);
    const query = auditQuerySchema.parse(Object.fromEntries(searchParams.entries()));
    const logs = await auditService.list(user, query);
    return apiSuccess({ logs });
  } catch (error) {
    return handleRouteError(error);
  }
}
