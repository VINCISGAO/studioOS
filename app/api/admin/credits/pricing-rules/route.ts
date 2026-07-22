import { z } from "zod";
import { adminPricingRuleService } from "@/features/admin/credits/admin-pricing-rule.service";
import {
  requireAdminAuthUser,
  requireAdminMutationUser
} from "@/features/admin/auth/admin-api-guard";
import { apiSuccess, handleRouteError } from "@/lib/core/api-route";

const createSchema = z.object({
  aiModelId: z.string().optional(),
  provider: z.string().optional(),
  model: z.string().optional(),
  generationType: z.enum(["IMAGE", "VIDEO", "MUSIC"]).optional(),
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

export async function GET(request: Request) {
  try {
    const user = await requireAdminAuthUser(request);
    const url = new URL(request.url);
    const rules = await adminPricingRuleService.list(user, {
      q: url.searchParams.get("q") ?? undefined,
      model: url.searchParams.get("model") ?? undefined,
      generationType: (url.searchParams.get("generationType") as "IMAGE" | "VIDEO" | "MUSIC" | null) ?? undefined,
      status: (url.searchParams.get("status") as "DRAFT" | "VALIDATED" | "PUBLISHED" | "ARCHIVED" | null) ?? undefined,
      unhealthyOnly: url.searchParams.get("unhealthyOnly") === "true"
    });
    return apiSuccess({ rules });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAdminMutationUser(request);
    const input = createSchema.parse(await request.json());
    const created = await adminPricingRuleService.create(user, input);
    return apiSuccess(created);
  } catch (error) {
    return handleRouteError(error);
  }
}
