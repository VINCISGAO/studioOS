import { z } from "zod";
import { adminPricingRuleService } from "@/features/admin/credits/admin-pricing-rule.service";
import { requireAdminAuthUser } from "@/features/admin/auth/admin-api-guard";
import { apiSuccess, handleRouteError } from "@/lib/core/api-route";

const simulateSchema = z.object({
  type: z.enum(["IMAGE", "VIDEO", "MUSIC"]),
  model: z.string().min(1),
  parameters: z.record(z.union([z.string(), z.number(), z.boolean()])),
  draftRuleId: z.string().optional()
});

export async function POST(request: Request) {
  try {
    const user = await requireAdminAuthUser(request);
    const input = simulateSchema.parse(await request.json());
    const result = await adminPricingRuleService.simulate(user, input);
    return apiSuccess(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
