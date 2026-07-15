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
import { readKnowledgeMutationJson } from "@/lib/knowledge/knowledge-mutation-body";
import { toKnowledgeSaveClientPayload } from "@/lib/knowledge/knowledge-save-client";
import { unstable_cache } from "next/cache";

export const runtime = "nodejs";
export const maxDuration = 300;

const getCachedKnowledgeDashboardStats = unstable_cache(
  async () => knowledgeCenterService.getDashboardStats(),
  ["knowledge-dashboard-stats"],
  { revalidate: 60 }
);

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
    const articles = await knowledgeCenterService.listAdmin(filters);
    const stats = await getCachedKnowledgeDashboardStats();
    return apiSuccess({ articles, stats });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdminMutationUser(request);
    const body = await readKnowledgeMutationJson(request);
    const parsed = parseKnowledgeArticleBody(body);
    const article = await knowledgeCenterService.create(parsed);
    if (!article.article) {
      throw appError("SYSTEM_ERROR", "Database unavailable — check DATABASE_URL and run db:migrate:deploy");
    }
    scheduleKnowledgeMultilingualSyncAfterResponse(article);
    const payload = toKnowledgeSaveClientPayload(article);
    if (!payload) {
      throw appError("SYSTEM_ERROR", "Database unavailable — check DATABASE_URL and run db:migrate:deploy");
    }
    return apiSuccess(payload);
  } catch (error) {
    return handleRouteError(error);
  }
}
