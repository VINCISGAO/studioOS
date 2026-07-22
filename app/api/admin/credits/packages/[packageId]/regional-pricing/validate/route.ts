import { adminRegionalPackagePricingService } from "@/features/admin/credits/admin-regional-package-pricing.service";
import { requireAdminAuthUser } from "@/features/admin/auth/admin-api-guard";
import { apiSuccess, handleRouteError } from "@/lib/core/api-route";

export async function GET(
  _request: Request,
  context: { params: Promise<{ packageId: string }> }
) {
  try {
    const user = await requireAdminAuthUser();
    const { packageId } = await context.params;
    const validation = await adminRegionalPackagePricingService.validateFallback(user, packageId);
    return apiSuccess(validation);
  } catch (error) {
    return handleRouteError(error);
  }
}
