import { z } from "zod";
import { adminRegionalPackagePricingService } from "@/features/admin/credits/admin-regional-package-pricing.service";
import { requireAdminMutationUser } from "@/features/admin/auth/admin-api-guard";
import { apiSuccess, handleRouteError } from "@/lib/core/api-route";

const updateSchema = z.object({
  currency: z.string().optional(),
  amountMinor: z.number().int().positive().optional(),
  bonusCredits: z.number().int().nonnegative().optional(),
  stripePriceId: z.string().nullable().optional(),
  enabled: z.boolean().optional(),
  startsAt: z.string().nullable().optional(),
  endsAt: z.string().nullable().optional(),
  taxBehavior: z.string().nullable().optional()
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ packageId: string; priceId: string }> }
) {
  try {
    const user = await requireAdminMutationUser(request);
    const { packageId, priceId } = await context.params;
    const body = updateSchema.parse(await request.json());
    const updated = await adminRegionalPackagePricingService.update(user, packageId, priceId, body);
    return apiSuccess(updated);
  } catch (error) {
    return handleRouteError(error);
  }
}
