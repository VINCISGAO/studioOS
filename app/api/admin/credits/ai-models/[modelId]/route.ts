import { z } from "zod";
import { adminAiModelService } from "@/features/admin/credits/admin-ai-model.service";
import {
  requireAdminAuthUser,
  requireAdminMutationUser
} from "@/features/admin/auth/admin-api-guard";
import { apiSuccess, handleRouteError } from "@/lib/core/api-route";

const updateSchema = z.object({
  displayName: z.string().min(1).optional(),
  provider: z.string().min(1).optional(),
  category: z.enum(["VIDEO", "IMAGE", "MUSIC", "VOICE", "THREE_D"]).optional(),
  generationType: z.enum(["IMAGE", "VIDEO", "MUSIC"]).optional(),
  logoUrl: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  enabled: z.boolean().optional(),
  recommended: z.boolean().optional(),
  isDefault: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  baseCreditPrice: z.number().int().nullable().optional(),
  providerCostMinor: z.number().int().nullable().optional(),
  marginPercent: z.number().int().nullable().optional(),
  startsAt: z.string().nullable().optional(),
  endsAt: z.string().nullable().optional()
});

export async function GET(
  request: Request,
  context: { params: Promise<{ modelId: string }> }
) {
  try {
    const user = await requireAdminAuthUser(request);
    const { modelId } = await context.params;
    const detail = await adminAiModelService.get(user, modelId);
    if (!detail) {
      return handleRouteError(new Error("AI model not found"));
    }
    return apiSuccess(detail);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ modelId: string }> }
) {
  try {
    const user = await requireAdminMutationUser(request);
    const { modelId } = await context.params;
    const input = updateSchema.parse(await request.json());
    const updated = await adminAiModelService.update(user, modelId, input);
    return apiSuccess(updated);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ modelId: string }> }
) {
  try {
    const user = await requireAdminMutationUser(request);
    const { modelId } = await context.params;
    const deleted = await adminAiModelService.softDelete(user, modelId);
    return apiSuccess(deleted);
  } catch (error) {
    return handleRouteError(error);
  }
}
