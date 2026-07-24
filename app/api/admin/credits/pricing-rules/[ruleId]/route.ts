import { z } from "zod";
import { adminPricingRuleService } from "@/features/admin/credits/admin-pricing-rule.service";
import {
  requireAdminAuthUser,
  requireAdminMutationUser
} from "@/features/admin/auth/admin-api-guard";
import { apiSuccess, handleRouteError } from "@/lib/core/api-route";
import { appError } from "@/lib/core/errors";

const updateSchema = z.object({
  mode: z.string().nullable().optional(),
  label: z.string().nullable().optional(),
  durationSec: z.number().int().nullable().optional(),
  resolution: z.string().nullable().optional(),
  aspectRatio: z.string().nullable().optional(),
  inputType: z.string().nullable().optional(),
  outputCount: z.number().int().positive().optional(),
  providerCostMinor: z.number().int().nonnegative().nullable().optional(),
  creditPrice: z.number().int().positive().optional(),
  marginPercent: z.number().int().nullable().optional(),
  refundOnFailure: z.boolean().optional(),
  minimumBalance: z.number().int().nonnegative().optional(),
  sortOrder: z.number().int().optional(),
  startsAt: z.string().nullable().optional(),
  endsAt: z.string().nullable().optional(),
  changeReason: z.string().nullable().optional(),
  internalNotes: z.string().nullable().optional(),
  replacesRuleId: z.string().nullable().optional()
});

export async function GET(
  request: Request,
  context: { params: Promise<{ ruleId: string }> }
) {
  try {
    const user = await requireAdminAuthUser(request);
    const { ruleId } = await context.params;
    const detail = await adminPricingRuleService.get(user, ruleId);
    if (!detail) throw appError("NOT_FOUND", "Pricing rule not found");
    return apiSuccess(detail);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ ruleId: string }> }
) {
  try {
    const user = await requireAdminMutationUser(request);
    const { ruleId } = await context.params;
    const input = updateSchema.parse(await request.json());
    const updated = await adminPricingRuleService.update(user, ruleId, input);
    return apiSuccess(updated);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ ruleId: string }> }
) {
  try {
    const user = await requireAdminMutationUser(request);
    const { ruleId } = await context.params;
    const deleted = await adminPricingRuleService.deleteDraft(user, ruleId);
    return apiSuccess(deleted);
  } catch (error) {
    return handleRouteError(error);
  }
}
