import { z } from "zod";
import { adminRegionalPackagePricingService } from "@/features/admin/credits/admin-regional-package-pricing.service";
import { requireAdminAuthUser, requireAdminMutationUser } from "@/features/admin/auth/admin-api-guard";
import { apiSuccess, handleRouteError } from "@/lib/core/api-route";
import { appError } from "@/lib/core/errors";

const createSchema = z.object({
  regionCode: z.string().min(1),
  currency: z.string().optional(),
  amountMinor: z.number().int().positive(),
  bonusCredits: z.number().int().nonnegative().optional(),
  stripePriceId: z.string().nullable().optional(),
  enabled: z.boolean().optional(),
  startsAt: z.string().nullable().optional(),
  endsAt: z.string().nullable().optional(),
  taxBehavior: z.string().nullable().optional()
});

export async function GET(
  _request: Request,
  context: { params: Promise<{ packageId: string }> }
) {
  try {
    const user = await requireAdminAuthUser();
    const { packageId } = await context.params;
    const detail = await adminRegionalPackagePricingService.list(user, packageId);
    if (!detail) throw appError("NOT_FOUND", "Credit package not found");
    return apiSuccess(detail);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ packageId: string }> }
) {
  try {
    const user = await requireAdminMutationUser(request);
    const { packageId } = await context.params;
    const body = createSchema.parse(await request.json());
    const created = await adminRegionalPackagePricingService.create(user, packageId, body);
    return apiSuccess(created, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
