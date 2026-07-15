import {
  requireAdminMutationUser,
  requireAdminSession
} from "@/features/admin/auth/admin-api-guard";
import { knowledgeCenterService } from "@/features/knowledge-center/knowledge-center.service";
import { parseKnowledgeArticleBody } from "@/features/knowledge-center/knowledge-center.api-parser";
import { scheduleKnowledgeMultilingualSyncAfterResponse } from "@/features/knowledge-center/knowledge-publish-schedule";
import { getAppUiLocale } from "@/lib/app-language";
import { apiSuccess, handleRouteError } from "@/lib/core/api-route";
import { appError } from "@/lib/core/errors";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(request: Request) {
  try {
    await requireAdminSession(request);
    const url = new URL(request.url);
    const adminLocale = await getAppUiLocale();
    const filters = {
      q: url.searchParams.get("q") ?? undefined,
      status: url.searchParams.get("status") ?? undefined,
      language: url.searchParams.get("language") ?? undefined,
      category: url.searchParams.get("category") ?? undefined,
      adminLocale
    };
    const [articles, stats] = await Promise.all([
      knowledgeCenterService.listAdmin(filters),
      knowledgeCenterService.getDashboardStats()
    ]);
    return apiSuccess({ articles, stats });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdminMutationUser(request);
    const body = (await request.json()) as Record<string, unknown>;
    const parsed = parseKnowledgeArticleBody(body);
    const article = await knowledgeCenterService.create(parsed);
    if (!article.article) {
      throw appError("SYSTEM_ERROR", "Database unavailable — check DATABASE_URL and run db:migrate:deploy");
    }
    scheduleKnowledgeMultilingualSyncAfterResponse(article);
    return apiSuccess({ article: article.article, pipeline: article.pipeline });
  } catch (error) {
    return handleRouteError(error);
  }
}
