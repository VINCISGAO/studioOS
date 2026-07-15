import {
  requireAdminMutationUser,
  requireAdminSession
} from "@/features/admin/auth/admin-api-guard";
import { knowledgeCenterService } from "@/features/knowledge-center/knowledge-center.service";
import { parseKnowledgeArticleBody } from "@/features/knowledge-center/knowledge-center.api-parser";
import { scheduleKnowledgeMultilingualSyncAfterResponse } from "@/features/knowledge-center/knowledge-publish-schedule";
import { apiSuccess, handleRouteError } from "@/lib/core/api-route";
import { appError } from "@/lib/core/errors";

export const runtime = "nodejs";
export const maxDuration = 300;

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    await requireAdminSession(request);
    const { id } = await context.params;
    const article = await knowledgeCenterService.getById(id);
    return apiSuccess({ article });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireAdminMutationUser(request);
    const { id } = await context.params;
    const body = (await request.json()) as Record<string, unknown>;
    const parsed = parseKnowledgeArticleBody(body);
    const saved = await knowledgeCenterService.update(id, parsed);
    if (!saved.article) {
      throw appError("NOT_FOUND", "Article not found");
    }
    scheduleKnowledgeMultilingualSyncAfterResponse(saved);
    return apiSuccess({ article: saved.article, pipeline: saved.pipeline });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    await requireAdminMutationUser(request);
    const { id } = await context.params;
    await knowledgeCenterService.delete(id);
    return apiSuccess({ deleted: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
