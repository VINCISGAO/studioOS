import { apiSuccess, handleRouteError } from "@/lib/core/api-route";
import { hasMureka } from "@/lib/core/config/ai";

export async function GET() {
  try {
    return apiSuccess({
      configured: hasMureka(),
      provider: "mureka",
      docs: "https://platform.mureka.ai/docs/"
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
