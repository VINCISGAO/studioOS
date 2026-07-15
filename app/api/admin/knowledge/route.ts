import {
  requireAdminMutationUser,
  requireAdminSession
} from "@/features/admin/auth/admin-api-guard";
import { knowledgeCenterService } from "@/features/knowledge-center/knowledge-center.service";
import { parseKnowledgeArticleBody } from "@/features/knowledge-center/knowledge-center.api-parser";
import { scheduleKnowledgePostSaveWork } from "@/features/knowledge-center/knowledge-publish-schedule";
import { getAppUiLocale } from "@/lib/app-language";
import { appError } from "@/lib/core/errors";
import {
  createKnowledgeRequestId,
  knowledgeAdminJsonError,
  knowledgeAdminJsonSuccess,
  logKnowledgeAdminStep,
  type KnowledgeAdminRouteStep
} from "@/lib/knowledge/knowledge-admin-api";
import { readKnowledgeMutationJson } from "@/lib/knowledge/knowledge-mutation-body";
import { toKnowledgeSaveClientPayload } from "@/lib/knowledge/knowledge-save-client";
import { unstable_cache } from "next/cache";

export const runtime = "nodejs";
export const maxDuration = 300;

const ROUTE = "POST /api/admin/knowledge";

const getCachedKnowledgeDashboardStats = unstable_cache(
  async () => knowledgeCenterService.getDashboardStats(),
  ["knowledge-dashboard-stats"],
  { revalidate: 60 }
);

export async function GET(request: Request) {
  const requestId = createKnowledgeRequestId(request);
  let step: KnowledgeAdminRouteStep = "auth";
  try {
    logKnowledgeAdminStep({ requestId, route: "GET /api/admin/knowledge", step, method: "GET" });
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
    return knowledgeAdminJsonSuccess({ articles, stats }, requestId);
  } catch (error) {
    return knowledgeAdminJsonError(error, requestId, { route: "GET /api/admin/knowledge", step });
  }
}

export async function POST(request: Request) {
  const requestId = createKnowledgeRequestId(request);
  let step: KnowledgeAdminRouteStep = "auth";
  try {
    logKnowledgeAdminStep({ requestId, route: ROUTE, step, method: "POST" });
    await requireAdminMutationUser(request);

    step = "parse_body";
    logKnowledgeAdminStep({ requestId, route: ROUTE, step, method: "POST" });
    const body = await readKnowledgeMutationJson(request);
    const parsed = parseKnowledgeArticleBody(body);

    step = "service_create";
    logKnowledgeAdminStep({ requestId, route: ROUTE, step, method: "POST" });
    const saved = await knowledgeCenterService.create(parsed);
    if (!saved.article) {
      throw appError("SYSTEM_ERROR", "Database unavailable — check DATABASE_URL and run db:migrate:deploy");
    }

    step = "schedule_background";
    logKnowledgeAdminStep({
      requestId,
      route: ROUTE,
      step,
      method: "POST",
      articleId: saved.article.id,
      extra: {
        hasSidecarQueue: Boolean(saved.queueTranslationSidecars),
        hasPublishPipeline: Boolean(saved.queuePublishPipeline)
      }
    });
    scheduleKnowledgePostSaveWork(saved, requestId);

    step = "serialize_response";
    const payload = toKnowledgeSaveClientPayload(saved);
    if (!payload) {
      throw appError("SYSTEM_ERROR", "Database unavailable — check DATABASE_URL and run db:migrate:deploy");
    }
    logKnowledgeAdminStep({
      requestId,
      route: ROUTE,
      step,
      method: "POST",
      articleId: payload.article.id
    });
    return knowledgeAdminJsonSuccess(payload, requestId);
  } catch (error) {
    return knowledgeAdminJsonError(error, requestId, { route: ROUTE, step });
  }
}
