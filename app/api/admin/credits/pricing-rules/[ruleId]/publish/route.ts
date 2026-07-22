import { z } from "zod";
import { adminPricingRuleService } from "@/features/admin/credits/admin-pricing-rule.service";
import { requireAdminMutationUser } from "@/features/admin/auth/admin-api-guard";
import { apiSuccess, handleRouteError } from "@/lib/core/api-route";

const publishSchema = z.object({
  idempotencyKey: z.string().min(8).max(120),
  confirm: z.literal(true),
  startsAt: z.string().nullable().optional(),
  endsAt: z.string().nullable().optional(),
  replacesRuleId: z.string().nullable().optional(),
  requestId: z.string().optional()
});

export async function POST(
  request: Request,
  context: { params: Promise<{ ruleId: string }> }
) {
  try {
    const user = await requireAdminMutationUser(request);
    const { ruleId } = await context.params;
    const input = publishSchema.parse(await request.json());
    const published = await adminPricingRuleService.publish(user, ruleId, input);
    return apiSuccess(published);
  } catch (error) {
    return handleRouteError(error);
  }
}
