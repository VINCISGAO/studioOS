import { apiSuccess, enforcePublicApiRateLimit, handleRouteError } from "@/lib/core/api-route";
import { hasSeedance } from "@/lib/core/config/ai";

export async function GET(request: Request) {
  try {
    await enforcePublicApiRateLimit(request);
    return apiSuccess({
      configured: hasSeedance(),
      provider: "seedance",
      docs: "https://seedance2.ai/zh/api-docs"
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
