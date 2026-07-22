import { z } from "zod";
import { adminCreditPackageService } from "@/features/admin/credits/admin-credit-package.service";
import {
  requireAdminAuthUser,
  requireAdminMutationUser
} from "@/features/admin/auth/admin-api-guard";
import { apiSuccess, handleRouteError } from "@/lib/core/api-route";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().optional(),
  version: z.number().int().positive().optional(),
  versionLabel: z.string().nullable().optional(),
  credits: z.number().int().positive().optional(),
  bonusCredits: z.number().int().nonnegative().optional(),
  currency: z.string().optional(),
  amountMinor: z.number().int().positive().optional(),
  regionCodes: z.array(z.string()).optional(),
  membershipTier: z.string().nullable().optional(),
  visible: z.boolean().optional(),
  isDefault: z.boolean().optional(),
  enabled: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  startsAt: z.string().nullable().optional(),
  endsAt: z.string().nullable().optional()
});

export async function GET(
  _request: Request,
  context: { params: Promise<{ packageId: string }> }
) {
  try {
    const user = await requireAdminAuthUser(_request);
    const { packageId } = await context.params;
    const detail = await adminCreditPackageService.get(user, packageId);
    if (!detail) {
      return handleRouteError(new Error("Credit package not found"));
    }
    return apiSuccess(detail);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ packageId: string }> }
) {
  try {
    const user = await requireAdminMutationUser(request);
    const { packageId } = await context.params;
    const input = updateSchema.parse(await request.json());
    const updated = await adminCreditPackageService.update(user, packageId, input);
    return apiSuccess(updated);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ packageId: string }> }
) {
  try {
    const user = await requireAdminMutationUser(request);
    const { packageId } = await context.params;
    const deleted = await adminCreditPackageService.softDelete(user, packageId);
    return apiSuccess(deleted);
  } catch (error) {
    return handleRouteError(error);
  }
}
