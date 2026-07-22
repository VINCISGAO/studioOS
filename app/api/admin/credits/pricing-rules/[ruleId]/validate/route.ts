import { adminPricingRuleService } from "@/features/admin/credits/admin-pricing-rule.service";
import { requireAdminMutationUser } from "@/features/admin/auth/admin-api-guard";
import { apiSuccess, handleRouteError } from "@/lib/core/api-route";

export async function POST(
  request: Request,
  context: { params: Promise<{ ruleId: string }> }
) {
  try {
    const user = await requireAdminMutationUser(request);
    const { ruleId } = await context.params;
    const result = await adminPricingRuleService.validate(user, ruleId);
    return apiSuccess(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
