import { z } from "zod";
import type { AiModelCategory } from "@prisma/client";
import { adminAiModelService } from "@/features/admin/credits/admin-ai-model.service";
import {
  requireAdminAuthUser,
  requireAdminMutationUser
} from "@/features/admin/auth/admin-api-guard";
import { apiSuccess, handleRouteError } from "@/lib/core/api-route";

const createSchema = z.object({
  internalModelId: z.string().min(1),
  displayName: z.string().min(1),
  provider: z.string().min(1),
  category: z.enum(["VIDEO", "IMAGE", "MUSIC", "VOICE", "THREE_D"]),
  generationType: z.enum(["IMAGE", "VIDEO", "MUSIC"]),
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

export async function GET(request: Request) {
  try {
    const user = await requireAdminAuthUser(request);
    const url = new URL(request.url);
    const category = url.searchParams.get("category") as AiModelCategory | null;
    const models = await adminAiModelService.list(user, {
      category: category ?? undefined,
      q: url.searchParams.get("q") ?? undefined,
      enabled:
        url.searchParams.get("enabled") === "true"
          ? true
          : url.searchParams.get("enabled") === "false"
            ? false
            : undefined
    });
    return apiSuccess({ models });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAdminMutationUser(request);
    const input = createSchema.parse(await request.json());
    const created = await adminAiModelService.create(user, input);
    return apiSuccess(created);
  } catch (error) {
    return handleRouteError(error);
  }
}
