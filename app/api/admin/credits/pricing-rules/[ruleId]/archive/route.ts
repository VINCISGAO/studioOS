import { z } from "zod";
import { adminPricingRuleService } from "@/features/admin/credits/admin-pricing-rule.service";
import { requireAdminMutationUser } from "@/features/admin/auth/admin-api-guard";
import { apiSuccess, handleRouteError } from "@/lib/core/api-route";

const archiveSchema = z.object({ reason: z.string().optional() }).optional();

export async function POST(
  request: Request,
  context: { params: Promise<{ ruleId: string }> }
) {
  try {
    const user = await requireAdminMutationUser(request);
    const { ruleId } = await context.params;
    const body = archiveSchema.parse(await request.json().catch(() => ({})));
    const archived = await adminPricingRuleService.archive(user, ruleId, body ?? undefined);
    return apiSuccess(archived);
  } catch (error) {
    return handleRouteError(error);
  }
}
