import { adminCreditPackageService } from "@/features/admin/credits/admin-credit-package.service";
import { requireAdminAuthUser } from "@/features/admin/auth/admin-api-guard";
import { apiSuccess, handleRouteError } from "@/lib/core/api-route";

export async function GET(
  request: Request,
  context: { params: Promise<{ packageId: string }> }
) {
  try {
    const user = await requireAdminAuthUser(request);
    const { packageId } = await context.params;
    const preview = await adminCreditPackageService.preview(user, packageId);
    return apiSuccess(preview);
  } catch (error) {
    return handleRouteError(error);
  }
}
