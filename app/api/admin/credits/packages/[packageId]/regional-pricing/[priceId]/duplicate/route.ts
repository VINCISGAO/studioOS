import { z } from "zod";
import { adminRegionalPackagePricingService } from "@/features/admin/credits/admin-regional-package-pricing.service";
import { requireAdminMutationUser } from "@/features/admin/auth/admin-api-guard";
import { apiSuccess, handleRouteError } from "@/lib/core/api-route";

const duplicateSchema = z.object({ targetRegionCode: z.string().min(1) });

export async function POST(
  request: Request,
  context: { params: Promise<{ packageId: string; priceId: string }> }
) {
  try {
    const user = await requireAdminMutationUser(request);
    const { packageId, priceId } = await context.params;
    const body = duplicateSchema.parse(await request.json());
    const created = await adminRegionalPackagePricingService.duplicate(
      user,
      packageId,
      priceId,
      body.targetRegionCode
    );
    return apiSuccess(created, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
