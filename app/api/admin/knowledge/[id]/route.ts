import {
  requireAdminMutationUser,
  requireAdminSession
} from "@/features/admin/auth/admin-api-guard";
import { knowledgeCenterService } from "@/features/knowledge-center/knowledge-center.service";
import { parseKnowledgeArticleBody } from "@/features/knowledge-center/knowledge-center.api-parser";
import { scheduleKnowledgePostSaveWork } from "@/features/knowledge-center/knowledge-publish-schedule";
import { apiSuccess, handleRouteError } from "@/lib/core/api-route";
import { appError } from "@/lib/core/errors";
import { readKnowledgeMutationJson } from "@/lib/knowledge/knowledge-mutation-body";
import { toKnowledgeSaveClientPayload } from "@/lib/knowledge/knowledge-save-client";

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
    const body = await readKnowledgeMutationJson(request);
    const parsed = parseKnowledgeArticleBody(body);
    const saved = await knowledgeCenterService.update(id, parsed);
    if (!saved.article) {
      throw appError("NOT_FOUND", "Article not found");
    }
    scheduleKnowledgePostSaveWork(saved);
    const payload = toKnowledgeSaveClientPayload(saved);
    if (!payload) {
      throw appError("NOT_FOUND", "Article not found");
    }
    return apiSuccess(payload);
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
