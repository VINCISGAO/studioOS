import { apiSuccess, handleRouteError } from "@/lib/core/api-route";
import { hasSeedance } from "@/lib/core/config/ai";
import { readSeedanceCallbackUrl } from "@/lib/core/config/seedance-key";

export async function GET() {
  try {
    return apiSuccess({
      configured: hasSeedance(),
      provider: "seedance",
      callbackUrl: readSeedanceCallbackUrl(),
      docs: "https://seedance2.ai/zh/api-docs"
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
