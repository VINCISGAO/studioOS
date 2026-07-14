import {
  buildKnowledgeArticlePath,
  knowledgePathPrefixForCode
} from "@/features/knowledge-center/knowledge-center.constants";
import type { KnowledgeEditorPanelForm } from "@/lib/knowledge/knowledge-editor-initial-form";
import { adminPortalRoutes } from "@/lib/studioos/admin-portal-routes";
import type { KnowledgeArticleStatus } from "@prisma/client";

export function buildKnowledgeEditorPublicPath(slug: string, languageCode: string) {
  const pathPrefix = knowledgePathPrefixForCode(languageCode);
  return buildKnowledgeArticlePath(pathPrefix, slug);
}

export function buildKnowledgeEditorAdminPreviewPath(articleId: string, languageCode: string) {
  const params = new URLSearchParams({ lang: languageCode });
  return `${adminPortalRoutes.knowledgeEdit(articleId)}/preview?${params.toString()}`;
}

export function resolveKnowledgeEditorDisplayStatus(
  form: Pick<KnowledgeEditorPanelForm, "status" | "scheduledDate" | "scheduledTime">,
  wasEverPublished: boolean
): KnowledgeArticleStatus {
  if (form.scheduledDate && form.scheduledTime) {
    const scheduledAt = new Date(`${form.scheduledDate}T${form.scheduledTime}`);
    if (scheduledAt.getTime() > Date.now()) return "SCHEDULED";
  }
  if (form.status === "REVIEW") return "REVIEW";
  if (wasEverPublished || form.status === "PUBLISHED") return "PUBLISHED";
  return "DRAFT";
}

export function resolveKnowledgeEditorSaveStatus(
  form: KnowledgeEditorPanelForm,
  publish: boolean,
  wasEverPublished: boolean
): KnowledgeArticleStatus {
  if (publish) {
    return "PUBLISHED";
  }
  if (form.status === "REVIEW") return "REVIEW";
  if (form.scheduledDate && form.scheduledTime) {
    const scheduledAt = new Date(`${form.scheduledDate}T${form.scheduledTime}`);
    if (scheduledAt.getTime() > Date.now()) return "SCHEDULED";
  }
  if (wasEverPublished) return "PUBLISHED";
  return "DRAFT";
}
