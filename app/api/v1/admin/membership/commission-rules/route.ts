import { membershipAdminService } from "@/features/membership/membership-admin.service";
import { commissionRuleSchema } from "@/features/membership/membership.schemas";
import { requireAdminAuthUser, requireAdminMutationUser } from "@/features/admin/auth/admin-api-guard";
import { apiSuccess, handleRouteError } from "@/lib/core/api-route";

export async function GET(request: Request) {
  try {
    const user = await requireAdminAuthUser(request);
    const config = await membershipAdminService.getConfiguration(user);
    return apiSuccess(config);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireAdminMutationUser(request);
    const body = commissionRuleSchema.parse(await request.json());
    const rule = await membershipAdminService.upsertCommissionRule(user, body);
    return apiSuccess({ rule });
  } catch (error) {
    return handleRouteError(error);
  }
}
