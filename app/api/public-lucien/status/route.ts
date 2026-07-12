import { publicLucienService } from "@/features/ai-copilot/public-lucien.service";
import { apiSuccess, handleRouteError } from "@/lib/core/api-route";

export async function GET() {
  try {
    return apiSuccess(publicLucienService.status());
  } catch (error) {
    return handleRouteError(error);
  }
}
