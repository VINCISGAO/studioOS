import { requireAdminSession } from "@/features/admin/auth/admin-api-guard";
import { checkKnowledgeSlugAvailability } from "@/features/knowledge-center/knowledge-slug.service";
import { apiSuccess, handleRouteError } from "@/lib/core/api-route";

export async function GET(request: Request) {
  try {
    await requireAdminSession(request);
    const url = new URL(request.url);
    const slug = url.searchParams.get("slug") ?? "";
    const excludeArticleId = url.searchParams.get("exclude_id") ?? undefined;
    const result = await checkKnowledgeSlugAvailability({ slug, excludeArticleId });
    return apiSuccess(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
