import {
  requireAdminMutationUser,
  requireAdminSession
} from "@/features/admin/auth/admin-api-guard";
import { knowledgeCenterService } from "@/features/knowledge-center/knowledge-center.service";
import { parseKnowledgeArticleBody } from "@/features/knowledge-center/knowledge-center.api-parser";
import { apiSuccess, handleRouteError } from "@/lib/core/api-route";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(request: Request) {
  try {
    await requireAdminSession(request);
    const url = new URL(request.url);
    const articles = await knowledgeCenterService.listAdmin({
      q: url.searchParams.get("q") ?? undefined,
      status: url.searchParams.get("status") ?? undefined,
      language: url.searchParams.get("language") ?? undefined,
      category: url.searchParams.get("category") ?? undefined
    });
    const stats = await knowledgeCenterService.getDashboardStats();
    return apiSuccess({ articles, stats });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdminMutationUser(request);
    const body = (await request.json()) as Record<string, unknown>;
    const article = await knowledgeCenterService.create(parseKnowledgeArticleBody(body));
    return apiSuccess({ article: article.article, pipeline: article.pipeline });
  } catch (error) {
    return handleRouteError(error);
  }
}
