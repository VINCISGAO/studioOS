import { z } from "zod";
import { adminRegionalPackagePricingService } from "@/features/admin/credits/admin-regional-package-pricing.service";
import { requireAdminAuthUser } from "@/features/admin/auth/admin-api-guard";
import { apiSuccess, handleRouteError } from "@/lib/core/api-route";

const previewSchema = z.object({ regionCode: z.string().min(1) });

export async function POST(
  request: Request,
  context: { params: Promise<{ packageId: string }> }
) {
  try {
    const user = await requireAdminAuthUser(request);
    const { packageId } = await context.params;
    const body = previewSchema.parse(await request.json());
    const preview = await adminRegionalPackagePricingService.preview(user, packageId, body.regionCode);
    return apiSuccess(preview);
  } catch (error) {
    return handleRouteError(error);
  }
}
