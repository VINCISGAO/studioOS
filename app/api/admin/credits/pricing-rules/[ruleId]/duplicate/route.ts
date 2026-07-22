import { z } from "zod";
import { adminPricingRuleService } from "@/features/admin/credits/admin-pricing-rule.service";
import { requireAdminMutationUser } from "@/features/admin/auth/admin-api-guard";
import { apiSuccess, handleRouteError } from "@/lib/core/api-route";

const duplicateSchema = z.object({ changeReason: z.string().optional() }).optional();

export async function POST(
  request: Request,
  context: { params: Promise<{ ruleId: string }> }
) {
  try {
    const user = await requireAdminMutationUser(request);
    const { ruleId } = await context.params;
    const body = duplicateSchema.parse(await request.json().catch(() => ({})));
    const created = await adminPricingRuleService.duplicate(user, ruleId, body ?? undefined);
    return apiSuccess(created);
  } catch (error) {
    return handleRouteError(error);
  }
}
