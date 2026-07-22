import { z } from "zod";
import { adminCreditPackageService } from "@/features/admin/credits/admin-credit-package.service";
import { requireAdminMutationUser } from "@/features/admin/auth/admin-api-guard";
import { apiSuccess, handleRouteError } from "@/lib/core/api-route";

const duplicateSchema = z
  .object({
    name: z.string().optional(),
    versionLabel: z.string().optional()
  })
  .optional();

export async function POST(
  request: Request,
  context: { params: Promise<{ packageId: string }> }
) {
  try {
    const user = await requireAdminMutationUser(request);
    const { packageId } = await context.params;
    const body = duplicateSchema.parse(await request.json().catch(() => ({})));
    const created = await adminCreditPackageService.duplicate(user, packageId, body ?? undefined);
    return apiSuccess(created);
  } catch (error) {
    return handleRouteError(error);
  }
}
