import { membershipAdminService } from "@/features/membership/membership-admin.service";
import { commissionRuleSchema, membershipPlanSchema } from "@/features/membership/membership.schemas";
import { apiSuccess, handleRouteError, requireApiUser } from "@/lib/core/api-route";

export async function GET() {
  try {
    const user = await requireApiUser();
    const config = await membershipAdminService.getConfiguration(user);
    return apiSuccess(config);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireApiUser();
    const body = commissionRuleSchema.parse(await request.json());
    const rule = await membershipAdminService.upsertCommissionRule(user, body);
    return apiSuccess({ rule });
  } catch (error) {
    return handleRouteError(error);
  }
}
