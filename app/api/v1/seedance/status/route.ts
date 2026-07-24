import { requireAdminAuthUser } from "@/features/admin/auth/admin-api-guard";
import { apiSuccess, handleRouteError } from "@/lib/core/api-route";
import { hasSeedance } from "@/lib/core/config/ai";
import { readSeedanceCallbackUrl } from "@/lib/core/config/seedance-key";

export async function GET(request: Request) {
  try {
    const admin = await requireAdminAuthUser(request).catch(() => null);
    return apiSuccess({
      configured: hasSeedance(),
      provider: "seedance",
      ...(admin ? { callbackUrl: readSeedanceCallbackUrl() } : {}),
      docs: "https://seedance2.ai/zh/api-docs"
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
