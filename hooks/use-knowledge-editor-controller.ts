"use client";

import { useKnowledgeEditorToast } from "@/hooks/use-knowledge-editor-toast";
import type { KnowledgeArticleDetailDto } from "@/features/knowledge-center/knowledge-center.types";
import type { KnowledgePublishPipelineResult } from "@/features/knowledge-center/knowledge-publish.pipeline.shared";
import { adminMutationHeaders, readAdminCsrfToken } from "@/lib/studioos/admin-csrf-client";
import { extractApiErrorMessage, sanitizeApiResponseText } from "@/lib/studioos/api-error-message";
import { adminPortalRoutes } from "@/lib/studioos/admin-portal-routes";
import { buildKnowledgeEditorInitialForm, type KnowledgeEditorPanelForm } from "@/lib/knowledge/knowledge-editor-initial-form";
import {
  resolveKnowledgeEditorDisplayStatus,
  resolveKnowledgeEditorSaveStatus
} from "@/lib/knowledge/knowledge-editor-preview";
import {
  effectiveKnowledgeMetaDescription,
  effectiveKnowledgeSeoTitle,
  effectiveKnowledgeTags,
  knowledgeEditorPublishGate
} from "@/lib/knowledge/knowledge-editor-validation";
import { knowledgeHtmlToPlainText } from "@/lib/knowledge/knowledge-html";
import type { Locale } from "@/lib/i18n";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

function isPublishedStatus(status?: string) {
  return status === "PUBLISHED";
}

export function useKnowledgeEditorController(input: {
  locale: Locale;
  articleId?: string;
  initial?: KnowledgeArticleDetailDto | null;
}) {
  const zh = input.locale === "zh";
  const router = useRouter();
  const [currentId, setCurrentId] = useState(input.articleId);
  const [form, setForm] = useState(() => buildKnowledgeEditorInitialForm(input.locale, input.initial));
  const [wasEverPublished, setWasEverPublished] = useState(() => isPublishedStatus(input.initial?.status));
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const { message, notify, clear: clearMessage } = useKnowledgeEditorToast();
  const [publishOpen, setPublishOpen] = useState(false);

  const displayStatus = useMemo(
    () => resolveKnowledgeEditorDisplayStatus(form, wasEverPublished),
    [form, wasEverPublished]
  );

  const patchForm = useCallback((patch: Partial<KnowledgeEditorPanelForm>) => {
    setForm((current) => ({ ...current, ...patch }));
  }, []);

  const publishGate = useCallback(
    (state: KnowledgeEditorPanelForm) => knowledgeEditorPublishGate(state, zh),
    [zh]
  );

  const buildPayload = useCallback(
    (state: KnowledgeEditorPanelForm, publish: boolean) => {
      const status = resolveKnowledgeEditorSaveStatus(state, publish, wasEverPublished);
      const keywords = [
        ...state.tags,
        ...state.focus_keywords.split(",").map((item) => item.trim()).filter(Boolean)
      ].filter((item, index, array) => array.indexOf(item) === index);

      return {
        title: state.title,
        category_slug: state.category_slug,
        author_name: state.author_name,
        cover_image_url: state.cover_image_url || undefined,
        visibility: state.visibility,
        status,
        tags: effectiveKnowledgeTags(state),
        scheduled_at:
          publish
            ? null
            : state.scheduledDate && state.scheduledTime
              ? new Date(`${state.scheduledDate}T${state.scheduledTime}`).toISOString()
              : null,
        timezone: state.timezone,
        translation: {
          language_code: state.language_code,
          title: state.title,
          subtitle: state.subtitle,
          excerpt: effectiveKnowledgeMetaDescription(state),
          body_html: state.body_html,
          body_markdown: knowledgeHtmlToPlainText(state.body_html),
          status,
          seo: {
            seo_title: effectiveKnowledgeSeoTitle(state),
            meta_description: effectiveKnowledgeMetaDescription(state),
            keywords,
            og_image_url: state.cover_fallback_url || undefined
          },
          faqs: state.faqs.length ? state.faqs.map((item, index) => ({ ...item, sort_order: index })) : undefined,
          lucien: {
            ai_summary: effectiveKnowledgeMetaDescription(state),
            ai_keywords: keywords,
            lucien_learning: state.lucien_learning
          }
        }
      };
    },
    [wasEverPublished]
  );

  const save = useCallback(
    async (publish: boolean) => {
      const state = form;

      if (publish) {
        const { blockers } = publishGate(state);
        if (blockers.length) {
          notify(blockers.join(" · "), "error");
          return false;
        }
      } else if (!state.title.trim()) {
        notify(zh ? "请先填写标题" : "Add a title first", "error");
        return false;
      }

      setSaveState("saving");
      if (!publish) clearMessage();

      if (!readAdminCsrfToken()) {
        setSaveState("idle");
        notify(zh ? "安全令牌缺失，请刷新页面后重试" : "Missing security token — refresh the page", "error");
        return false;
      }

      async function requestSave(articleId: string | undefined) {
        const response = await fetch(articleId ? `/api/admin/knowledge/${articleId}` : "/api/admin/knowledge", {
          method: articleId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json", ...adminMutationHeaders() },
          body: JSON.stringify(buildPayload(state, publish)),
          credentials: "same-origin"
        });
        const rawText = await response.text();
        let body: {
          data?: { article?: KnowledgeArticleDetailDto; pipeline?: KnowledgePublishPipelineResult };
          error?: { message?: string; code?: string; details?: { existing_article_id?: string; prismaCode?: string } } | string;
          message?: string;
          ok?: boolean;
        } = {};
        if (rawText.trim()) {
          try {
            body = JSON.parse(rawText) as typeof body;
          } catch {
            body = { message: sanitizeApiResponseText(rawText, response.status) };
          }
        }
        return { response, body, rawText };
      }

      try {
        const activeId = currentId;
        const { response, body, rawText } = await requestSave(activeId);

        if (!response.ok) {
          const detail =
            typeof body.error === "object" &&
            body.error !== null &&
            typeof body.error.details === "object" &&
            body.error.details !== null
              ? JSON.stringify(body.error.details)
              : "";
          const message = extractApiErrorMessage(
            body,
            zh
              ? rawText.trim()
                ? `保存失败（HTTP ${response.status}）`
                : `服务器错误 (${response.status})`
              : rawText.trim()
                ? `Save failed (HTTP ${response.status})`
                : `Server error (${response.status})`,
            response.status
          );
          const localized =
            zh && message === "Invalid CSRF token"
              ? "权限校验失败，请刷新页面后重试"
              : zh && message === "Admin session required"
                ? "登录已过期，请重新登录"
                : message;
          throw new Error(detail ? `${localized} (${detail})` : localized);
        }

        const saved = body.data?.article;
        const nextId = saved?.id ?? activeId ?? null;
        if (!nextId) {
          throw new Error(zh ? "数据库未连接，请运行 npm run db:migrate" : "Database unavailable — run npm run db:migrate");
        }

        if (!currentId && saved?.id) {
          setCurrentId(saved.id);
          router.replace(adminPortalRoutes.knowledgeEdit(saved.id));
        }
        if (saved?.slug) {
          patchForm({ slug: saved.slug });
        }
        if (isPublishedStatus(saved?.status)) setWasEverPublished(true);
        if (publish && (body.data?.pipeline?.published || isPublishedStatus(saved?.status))) {
          setWasEverPublished(true);
          patchForm({ status: "PUBLISHED" });
          router.refresh();
        }

        setSaveState("saved");
        const publishedOk =
          publish && (isPublishedStatus(saved?.status) || body.data?.pipeline?.published);
        notify(
          publish
            ? publishedOk
              ? body.data?.pipeline?.multilingual_sync_queued
                ? zh
                  ? "已发布。多语言翻译正在后台同步…"
                  : "Published. Multilingual translation is syncing in the background…"
                : zh
                  ? "已发布。"
                  : "Published."
              : zh
                ? "已保存，但发布流程未完成。"
                : "Saved, but publish did not complete."
            : zh
              ? "已保存。"
              : "Saved.",
          publish && !publishedOk ? "error" : "success"
        );
        return publish ? publishedOk : true;
      } catch (error) {
        setSaveState("idle");
        notify(error instanceof Error ? error.message : zh ? "保存失败" : "Save failed", "error");
        return false;
      }
    },
    [buildPayload, clearMessage, currentId, form, notify, patchForm, publishGate, router, zh]
  );

  const openPublish = useCallback(() => {
    setPublishOpen(true);
    const { blockers } = publishGate(form);
    notify(
      blockers.length
        ? blockers.join(" · ")
        : zh
          ? "请确认后发布"
          : "Review and confirm",
      blockers.length ? "error" : "info"
    );
  }, [form, notify, publishGate, zh]);

  const confirmPublish = useCallback(async () => {
    const { blockers } = publishGate(form);
    if (blockers.length) {
      notify(blockers.join(" · "), "error");
      return;
    }

    notify(zh ? "正在发布…" : "Publishing…", "info");
    const ok = await save(true);
    if (ok) setPublishOpen(false);
  }, [form, notify, publishGate, save, zh]);

  const deleteArticle = useCallback(async () => {
    if (!currentId) return;
    clearMessage();
    try {
      const response = await fetch(`/api/admin/knowledge/${currentId}`, {
        method: "DELETE",
        headers: adminMutationHeaders()
      });
      const body = (await response.json()) as { error?: { message?: string } };
      if (!response.ok) throw new Error(body.error?.message ?? (zh ? "删除失败" : "Delete failed"));
      notify(zh ? "文章已删除" : "Article deleted", "success");
      router.push(adminPortalRoutes.knowledge);
    } catch (error) {
      notify(error instanceof Error ? error.message : zh ? "删除失败" : "Delete failed", "error");
    }
  }, [clearMessage, currentId, notify, router, zh]);

  const publishGateState = publishGate(form);

  return {
    zh,
    currentId,
    form,
    patchForm,
    displayStatus,
    saveState,
    message,
    clearMessage,
    notify,
    saveDraft: () => void save(false),
    openPublish,
    confirmPublish,
    deleteArticle,
    publishDialog: {
      open: publishOpen,
      form,
      blockers: publishGateState.blockers,
      warnings: publishGateState.warnings,
      close: () => setPublishOpen(false),
      saving: saveState === "saving"
    }
  };
}
