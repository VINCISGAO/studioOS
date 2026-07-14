"use client";

import { useKnowledgeEditorToast } from "@/hooks/use-knowledge-editor-toast";
import { useKnowledgeSlugCheck } from "@/hooks/use-knowledge-slug-check";
import type { KnowledgeArticleDetailDto } from "@/features/knowledge-center/knowledge-center.types";
import type { KnowledgePublishPipelineResult } from "@/features/knowledge-center/knowledge-publish.pipeline.shared";
import { adminMutationHeaders } from "@/lib/studioos/admin-csrf-client";
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
  knowledgeEditorPublishGate,
  normalizeKnowledgeSlug,
  validateKnowledgeSlug
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
  const [slugTouched, setSlugTouched] = useState(Boolean(input.initial?.slug));
  const [form, setForm] = useState(() => buildKnowledgeEditorInitialForm(input.locale, input.initial));
  const [wasEverPublished, setWasEverPublished] = useState(() => isPublishedStatus(input.initial?.status));
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const { message, notify, clear: clearMessage } = useKnowledgeEditorToast();
  const [publishOpen, setPublishOpen] = useState(false);

  const slugValidation = validateKnowledgeSlug(form.slug);
  const slugCheck = useKnowledgeSlugCheck({
    slug: form.slug,
    excludeArticleId: currentId,
    enabled: slugValidation.ok
  });

  const displayStatus = useMemo(
    () => resolveKnowledgeEditorDisplayStatus(form, wasEverPublished),
    [form, wasEverPublished]
  );

  const patchForm = useCallback((patch: Partial<KnowledgeEditorPanelForm>) => {
    setForm((current) => ({ ...current, ...patch }));
  }, []);

  const prepareForm = useCallback((state: KnowledgeEditorPanelForm) => {
    const next = { ...state };
    if (!next.slug.trim() && next.title.trim()) {
      next.slug = normalizeKnowledgeSlug(next.title);
    }
    return next;
  }, []);

  const syncPreparedForm = useCallback(
    (state: KnowledgeEditorPanelForm) => {
      if (state.slug !== form.slug) patchForm({ slug: state.slug });
      return state;
    },
    [form.slug, patchForm]
  );

  const publishGate = useCallback(
    (state: KnowledgeEditorPanelForm) => {
      const gate = knowledgeEditorPublishGate(state, zh);
      const blockers = [...gate.blockers];
      const warnings = [...gate.warnings];
      const slugToSave = state.slug.trim();
      const slugMatchesForm = slugToSave === form.slug.trim();

      if (slugToSave && slugMatchesForm) {
        if (slugCheck.status === "checking") {
          blockers.push(zh ? "正在验证 URL 别名，请稍候再发布" : "Slug validation in progress — wait and retry");
        } else if (slugCheck.isBlocking) {
          blockers.push(slugCheck.message ?? (zh ? "URL 别名已被占用" : "Slug is taken"));
        }
      }

      return { blockers, warnings };
    },
    [form.slug, slugCheck.isBlocking, slugCheck.message, slugCheck.status, zh]
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
        slug: state.slug,
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
      const state = syncPreparedForm(prepareForm(form));

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

      async function requestSave(articleId: string | undefined) {
        const response = await fetch(articleId ? `/api/admin/knowledge/${articleId}` : "/api/admin/knowledge", {
          method: articleId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json", ...adminMutationHeaders() },
          body: JSON.stringify(buildPayload(state, publish)),
          credentials: "same-origin"
        });
        const body = (await response.json().catch(() => ({}))) as {
          data?: { article?: KnowledgeArticleDetailDto; pipeline?: KnowledgePublishPipelineResult };
          error?: { message?: string; details?: { existing_article_id?: string } };
        };
        return { response, body };
      }

      try {
        let activeId = currentId;
        let { response, body } = await requestSave(activeId);

        if (
          !response.ok &&
          response.status === 409 &&
          !activeId &&
          body.error?.details?.existing_article_id
        ) {
          const resumeId = body.error.details.existing_article_id;
          activeId = resumeId;
          setCurrentId(resumeId);
          router.replace(adminPortalRoutes.knowledgeEdit(resumeId));
          notify(
            zh ? "检测到同 URL 别名的草稿，正在继续保存…" : "Resuming existing draft with this slug…",
            "info"
          );
          ({ response, body } = await requestSave(resumeId));
        }

        if (!response.ok) {
          slugCheck.refresh();
          if (response.status === 403) {
            throw new Error(zh ? "权限校验失败，请刷新页面后重试" : "Permission denied — refresh and retry");
          }
          const detail =
            typeof body.error?.details === "object" && body.error.details !== null
              ? JSON.stringify(body.error.details)
              : "";
          const message = body.error?.message ?? (zh ? "保存失败" : "Save failed");
          throw new Error(detail ? `${message} (${detail})` : message);
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
        slugCheck.refresh();
        setSaveState("idle");
        notify(error instanceof Error ? error.message : zh ? "保存失败" : "Save failed", "error");
        return false;
      }
    },
    [buildPayload, clearMessage, currentId, form, notify, patchForm, prepareForm, publishGate, router, slugCheck, syncPreparedForm, zh]
  );

  const openPublish = useCallback(() => {
    const state = syncPreparedForm(prepareForm(form));
    setPublishOpen(true);
    const { blockers } = publishGate(state);
    notify(
      blockers.length ? (zh ? "请先修复弹窗中的必填项" : "Fix required items in the dialog") : zh ? "请确认后发布" : "Review and confirm",
      blockers.length ? "error" : "info"
    );
  }, [form, notify, prepareForm, publishGate, syncPreparedForm, zh]);

  const confirmPublish = useCallback(async () => {
    const state = syncPreparedForm(prepareForm(form));
    const { blockers } = publishGate(state);
    if (blockers.length) {
      notify(blockers.join(" · "), "error");
      return;
    }

    notify(zh ? "正在发布…" : "Publishing…", "info");
    const ok = await save(true);
    if (ok) setPublishOpen(false);
  }, [form, notify, prepareForm, publishGate, save, syncPreparedForm, zh]);

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

  const publishDialogForm = prepareForm(form);
  const publishGateState = publishGate(publishDialogForm);

  return {
    zh,
    currentId,
    form,
    patchForm,
    slugTouched,
    setSlugTouched,
    slugValidation,
    slugCheck,
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
      form: publishDialogForm,
      blockers: publishGateState.blockers,
      warnings: publishGateState.warnings,
      close: () => setPublishOpen(false),
      saving: saveState === "saving"
    }
  };
}
