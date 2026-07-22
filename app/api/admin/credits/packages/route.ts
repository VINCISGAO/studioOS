import { z } from "zod";
import { adminCreditPackageService } from "@/features/admin/credits/admin-credit-package.service";
import {
  requireAdminAuthUser,
  requireAdminMutationUser
} from "@/features/admin/auth/admin-api-guard";
import { apiSuccess, handleRouteError } from "@/lib/core/api-route";

const createSchema = z.object({
  name: z.string().min(1),
  slug: z.string().optional(),
  version: z.number().int().positive().optional(),
  versionLabel: z.string().nullable().optional(),
  credits: z.number().int().positive(),
  bonusCredits: z.number().int().nonnegative().optional(),
  currency: z.string().optional(),
  amountMinor: z.number().int().positive(),
  regionCodes: z.array(z.string()).optional(),
  membershipTier: z.string().nullable().optional(),
  visible: z.boolean().optional(),
  isDefault: z.boolean().optional(),
  enabled: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  startsAt: z.string().nullable().optional(),
  endsAt: z.string().nullable().optional(),
  regionalPrices: z
    .array(
      z.object({
        currency: z.string(),
        amountMinor: z.number().int().positive(),
        regionCode: z.string().nullable().optional(),
        enabled: z.boolean().optional()
      })
    )
    .optional()
});

export async function GET(request: Request) {
  try {
    const user = await requireAdminAuthUser(request);
    const url = new URL(request.url);
    const packages = await adminCreditPackageService.list(user, {
      q: url.searchParams.get("q") ?? undefined,
      enabled:
        url.searchParams.get("enabled") === "true"
          ? true
          : url.searchParams.get("enabled") === "false"
            ? false
            : undefined,
      includeDeleted: url.searchParams.get("includeDeleted") === "true",
      region: url.searchParams.get("region") ?? undefined
    });
    return apiSuccess({ packages });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAdminMutationUser(request);
    const input = createSchema.parse(await request.json());
    const created = await adminCreditPackageService.create(user, input);
    return apiSuccess(created);
  } catch (error) {
    return handleRouteError(error);
  }
}
