import {
  requireAdminMutationUser,
  requireAdminSession
} from "@/features/admin/auth/admin-api-guard";
import { knowledgeCenterService } from "@/features/knowledge-center/knowledge-center.service";
import { parseKnowledgeArticleBody } from "@/features/knowledge-center/knowledge-center.api-parser";
import { scheduleKnowledgePostSaveWork } from "@/features/knowledge-center/knowledge-publish-schedule";
import { appError } from "@/lib/core/errors";
import {
  createKnowledgeRequestId,
  knowledgeAdminJsonError,
  knowledgeAdminJsonSuccess,
  logKnowledgeAdminStep,
  type KnowledgeAdminRouteStep
} from "@/lib/knowledge/knowledge-admin-api";
import { readKnowledgeMutationJson } from "@/lib/knowledge/knowledge-mutation-body";
import { aiGatewayService } from "@/features/ai/ai-gateway.service";
import { toKnowledgeSaveClientPayload } from "@/lib/knowledge/knowledge-save-client";

export const runtime = "nodejs";
export const maxDuration = 300;

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  const requestId = createKnowledgeRequestId(request);
  const route = "GET /api/admin/knowledge/:id";
  const step: KnowledgeAdminRouteStep = "auth";
  try {
    const { id } = await context.params;
    logKnowledgeAdminStep({ requestId, route, step, method: "GET", articleId: id });
    await requireAdminSession(request);
    const article = await knowledgeCenterService.getById(id);
    return knowledgeAdminJsonSuccess({ article }, requestId);
  } catch (error) {
    return knowledgeAdminJsonError(error, requestId, { route, step });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const requestId = createKnowledgeRequestId(request);
  const route = "PATCH /api/admin/knowledge/:id";
  let step: KnowledgeAdminRouteStep = "auth";
  try {
    const { id } = await context.params;
    logKnowledgeAdminStep({ requestId, route, step, method: "PATCH", articleId: id });
    await requireAdminMutationUser(request);

    step = "parse_body";
    logKnowledgeAdminStep({ requestId, route, step, method: "PATCH", articleId: id });
    const body = await readKnowledgeMutationJson(request);
    const parsed = parseKnowledgeArticleBody(body);

    step = "service_update";
    logKnowledgeAdminStep({ requestId, route, step, method: "PATCH", articleId: id });
    const saved = await knowledgeCenterService.update(id, parsed);
    if (!saved.article) {
      throw appError("NOT_FOUND", "Article not found");
    }

    step = "schedule_background";
    logKnowledgeAdminStep({
      requestId,
      route,
      step,
      method: "PATCH",
      articleId: id,
      extra: {
        hasSidecarQueue: Boolean(saved.queueTranslationSidecars),
        hasPublishPipeline: Boolean(saved.queuePublishPipeline),
        hasMultilingualQueue: Boolean(saved.queueMultilingualSync),
        openaiConfigured: aiGatewayService.isConfigured(),
        multilingualSyncQueued: Boolean(saved.pipeline?.multilingual_sync_queued)
      }
    });
    scheduleKnowledgePostSaveWork(saved, requestId);

    step = "serialize_response";
    const payload = toKnowledgeSaveClientPayload(saved);
    if (!payload) {
      throw appError("NOT_FOUND", "Article not found");
    }
    logKnowledgeAdminStep({ requestId, route, step, method: "PATCH", articleId: payload.article.id });
    return knowledgeAdminJsonSuccess(payload, requestId);
  } catch (error) {
    return knowledgeAdminJsonError(error, requestId, { route, step });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const requestId = createKnowledgeRequestId(request);
  const route = "DELETE /api/admin/knowledge/:id";
  const step: KnowledgeAdminRouteStep = "auth";
  try {
    const { id } = await context.params;
    logKnowledgeAdminStep({ requestId, route, step, method: "DELETE", articleId: id });
    await requireAdminMutationUser(request);
    await knowledgeCenterService.delete(id);
    return knowledgeAdminJsonSuccess({ deleted: true }, requestId);
  } catch (error) {
    return knowledgeAdminJsonError(error, requestId, { route, step });
  }
}
