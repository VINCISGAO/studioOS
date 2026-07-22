import { aiModelCatalogService } from "@/features/canvas/ai-model-catalog.service";
import { apiSuccess, handleRouteError } from "@/lib/core/api-route";

export async function GET() {
  try {
    const catalog = await aiModelCatalogService.listPublicCatalog();
    return apiSuccess(catalog);
  } catch (error) {
    return handleRouteError(error);
  }
}
