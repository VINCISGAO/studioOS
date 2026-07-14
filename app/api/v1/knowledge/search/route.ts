import { knowledgeCenterService } from "@/features/knowledge-center/knowledge-center.service";
import { apiSuccess, handleRouteError } from "@/lib/core/api-route";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const q = url.searchParams.get("q")?.trim() ?? "";
    const language = url.searchParams.get("language")?.trim() || "en";
    if (!q) return apiSuccess({ results: [] });

    const results = await knowledgeCenterService.searchPublic(q, language);
    return apiSuccess({ results });
  } catch (error) {
    return handleRouteError(error);
  }
}
