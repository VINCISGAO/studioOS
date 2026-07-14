"use client";

import { KnowledgeEditorAiCard } from "@/components/studioos/knowledge-editor/knowledge-editor-ai-card";
import { KnowledgeEditorArticleInfo } from "@/components/studioos/knowledge-editor/knowledge-editor-article-info";
import { KnowledgeEditorCategoryCard } from "@/components/studioos/knowledge-editor/knowledge-editor-category-card";
import { KnowledgeEditorCover } from "@/components/studioos/knowledge-editor/knowledge-editor-cover";
import { KnowledgeEditorHeader } from "@/components/studioos/knowledge-editor/knowledge-editor-header";
import { KnowledgeEditorLucienCard } from "@/components/studioos/knowledge-editor/knowledge-editor-lucien-card";
import { KnowledgeEditorPublishCard } from "@/components/studioos/knowledge-editor/knowledge-editor-publish-card";
import { KnowledgeEditorPublishIssuesCard } from "@/components/studioos/knowledge-editor/knowledge-editor-publish-issues-card";
import { KnowledgeEditorSeoCard } from "@/components/studioos/knowledge-editor/knowledge-editor-seo-card";
import { KnowledgeMarkdownEditor } from "@/components/studioos/knowledge-editor/knowledge-markdown-editor";
import { useKnowledgeEditorAiActions } from "@/hooks/use-knowledge-editor-ai-actions";
import { useKnowledgeEditorAutosave } from "@/hooks/use-knowledge-editor-autosave";
import { useKnowledgeSlugCheck } from "@/hooks/use-knowledge-slug-check";
import { adminMutationHeaders } from "@/lib/studioos/admin-csrf-client";
import { adminPortalRoutes } from "@/lib/studioos/admin-portal-routes";
import { curatedFaqsForLanguage } from "@/lib/knowledge/knowledge-ai-advertising-cluster";
import { buildKnowledgeEditorInitialForm, type KnowledgeEditorPanelForm } from "@/lib/knowledge/knowledge-editor-initial-form";
import {
  effectiveKnowledgeMetaDescription,
  effectiveKnowledgeSeoTitle,
  effectiveKnowledgeTags,
  knowledgeEditorPublishGate,
  normalizeKnowledgeSlug,
  validateKnowledgeSlug
} from "@/lib/knowledge/knowledge-editor-validation";
import type { KnowledgeArticleDetailDto } from "@/features/knowledge-center/knowledge-center.types";
import type { KnowledgePublishPipelineResult } from "@/features/knowledge-center/knowledge-publish.pipeline.shared";
import type { Locale } from "@/lib/i18n";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

type EditorProps = {
  locale: Locale;
  articleId?: string;
  initial?: KnowledgeArticleDetailDto | null;
};

export function AdminKnowledgeEditorPanel({ locale, articleId, initial }: EditorProps) {
  const zh = locale === "zh";
  const router = useRouter();
  const [currentId, setCurrentId] = useState(articleId);
  const [slugTouched, setSlugTouched] = useState(Boolean(initial?.slug));
  const [form, setForm] = useState(() => buildKnowledgeEditorInitialForm(locale, initial));
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [lucienSynced, setLucienSynced] = useState(Boolean(initial?.translations[0]?.lucien?.lucien_indexed));

  const slugValidation = validateKnowledgeSlug(form.slug);
  const slugCheck = useKnowledgeSlugCheck({
    slug: form.slug,
    excludeArticleId: currentId,
    enabled: slugValidation.ok
  });

  const publishGate = useMemo(() => knowledgeEditorPublishGate(form, zh), [form, zh]);

  const publishBlockers = useMemo(() => {
    const blockers = [...publishGate.blockers];
    if (slugCheck.isBlocking) {
      blockers.push(slugCheck.message ?? (zh ? "Slug 已被占用" : "Slug is already taken"));
    }
    return blockers;
  }, [publishGate.blockers, slugCheck.isBlocking, slugCheck.message, zh]);

  const publishWarnings = useMemo(() => {
    const warnings = [...publishGate.warnings];
    if (slugCheck.status === "checking") {
      warnings.push(zh ? "正在验证 Slug…" : "Validating slug…");
    }
    return warnings;
  }, [publishGate.warnings, slugCheck.status, zh]);

  const publishBlocked = publishBlockers.length > 0;

  const lastSavedLabel = lastSavedAt
    ? lastSavedAt.toLocaleTimeString(locale === "zh" ? "zh-CN" : "en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      })
    : null;

  const patchForm = useCallback((patch: Partial<KnowledgeEditorPanelForm>) => {
    setForm((current) => ({ ...current, ...patch }));
  }, []);

  const buildPayload = useCallback(
    (publish = false) => {
      const status = publish ? "PUBLISHED" : form.status;
      const scheduledAt =
        form.scheduledDate && form.scheduledTime
          ? new Date(`${form.scheduledDate}T${form.scheduledTime}:00`).toISOString()
          : null;
      return {
        title: form.title,
        slug: form.slug,
        category_slug: form.category_slug,
        author_name: form.author_name,
        cover_image_url: form.cover_image_url || undefined,
        status,
        tags: effectiveKnowledgeTags(form),
        scheduled_at: scheduledAt,
        timezone: form.timezone,
        translation: {
          language_code: form.language_code,
          title: form.title,
          subtitle: form.subtitle,
          excerpt: effectiveKnowledgeMetaDescription(form),
          body_markdown: form.body_markdown,
          status,
          seo: {
            seo_title: effectiveKnowledgeSeoTitle(form),
            meta_description: effectiveKnowledgeMetaDescription(form),
            keywords: form.focus_keywords.split(",").map((item) => item.trim()).filter(Boolean),
            og_image_url: form.cover_fallback_url || undefined
          },
          faqs: publish ? curatedFaqsForLanguage(form.language_code) : undefined,
          lucien: {
            ai_summary: effectiveKnowledgeMetaDescription(form),
            ai_keywords: form.focus_keywords.split(",").map((item) => item.trim()).filter(Boolean),
            lucien_learning: form.lucien_learning
          }
        }
      };
    },
    [form]
  );

  const save = useCallback(
    async (publish = false) => {
      if (publish && publishBlocked) {
        setMessage(publishBlockers.join(" · "));
        return;
      }
      setSaveState("saving");
      setMessage(null);
      try {
        const response = await fetch(currentId ? `/api/admin/knowledge/${currentId}` : "/api/admin/knowledge", {
          method: currentId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json", ...adminMutationHeaders() },
          body: JSON.stringify(buildPayload(publish))
        });
        const body = (await response.json()) as {
          data?: { article?: KnowledgeArticleDetailDto; pipeline?: KnowledgePublishPipelineResult };
          error?: { message?: string };
        };
        if (!response.ok) throw new Error(body.error?.message ?? (zh ? "保存失败" : "Save failed"));

        const saved = body.data?.article;
        if (!currentId && saved?.id) {
          setCurrentId(saved.id);
          router.replace(adminPortalRoutes.knowledgeEdit(saved.id));
        }
        setSaveState("saved");
        setLastSavedAt(new Date());
        if (publish && body.data?.pipeline?.published) {
          setLucienSynced(true);
          const synced = body.data.pipeline.translations_synced ?? 1;
          const languages = body.data.pipeline.translation_languages?.join(", ") ?? form.language_code;
          const translationErrors = body.data.pipeline.translation_errors;
          setMessage(
            zh
              ? `已发布。GPT 已同步 ${synced} 种语言：${languages}${translationErrors?.length ? `（${translationErrors.length} 项翻译告警）` : ""}`
              : `Published. GPT synced ${synced} languages: ${languages}${translationErrors?.length ? ` (${translationErrors.length} translation warnings)` : ""}`
          );
        } else {
          setMessage(zh ? "已保存。" : "Saved.");
        }
      } catch (error) {
        setSaveState("idle");
        setMessage(error instanceof Error ? error.message : zh ? "保存失败" : "Save failed");
      }
    },
    [buildPayload, currentId, publishBlocked, publishBlockers, router, zh]
  );

  useKnowledgeEditorAutosave({
    enabled: Boolean(form.title.trim()),
    snapshot: JSON.stringify(form),
    onSave: async () => {
      await save(false);
    }
  });

  const { runningAction, runAction } = useKnowledgeEditorAiActions({
    zh,
    draft: {
      title: form.title,
      subtitle: form.subtitle,
      slug: form.slug,
      body_markdown: form.body_markdown,
      seo_title: form.seo_title,
      meta_description: form.meta_description,
      focus_keywords: form.focus_keywords,
      category_slug: form.category_slug,
      tags: form.tags
    },
    onPatch: (patch) => {
      const { message: aiMessage, ...formPatch } = patch;
      if (Object.keys(formPatch).length) patchForm(formPatch);
      if (aiMessage) setMessage(aiMessage);
    }
  });

  function handleTitleChange(value: string) {
    setForm((current) => ({
      ...current,
      title: value,
      seo_title: current.seo_title || value,
      slug: slugTouched ? current.slug : normalizeKnowledgeSlug(value)
    }));
  }

  function generateLucienFields() {
    const keywords = form.focus_keywords
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    const fallbackKeywords = [form.category_slug, "AI advertising", "VINCIS"].filter(Boolean);
    patchForm({
      focus_keywords: keywords.length ? form.focus_keywords : fallbackKeywords.join(", "),
      meta_description: form.meta_description || form.subtitle || form.title
    });
    setMessage(zh ? "已根据英文正文生成 Lucien 字段。" : "Generated Lucien fields from the English draft.");
  }

  async function syncLucien() {
    if (!currentId) return;
    const response = await fetch(`/api/admin/knowledge/${currentId}/sync-lucien`, {
      method: "POST",
      headers: adminMutationHeaders()
    });
    if (!response.ok) {
      setMessage(zh ? "Lucien 同步失败" : "Lucien sync failed");
      return;
    }
    setLucienSynced(true);
    setMessage(zh ? "Lucien 已同步。" : "Lucien synced.");
  }

  return (
    <div className="pb-10">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,7fr)_minmax(300px,3fr)]">
        <KnowledgeEditorHeader
          className="xl:col-span-2"
          locale={locale}
          title={currentId ? (zh ? "编辑文章" : "Edit Article") : zh ? "创建文章" : "Create Article"}
          subtitle={
            currentId
              ? zh
                ? "更新源稿、SEO 与发布状态；发布时 GPT 将同步 11 种语言。"
                : "Update the source draft and SEO; publishing triggers GPT sync to all 11 languages."
              : zh
                ? "撰写中文源稿并发布，GPT 将自动翻译并同步到 11 种语言。"
                : "Write the source draft and publish — GPT auto-syncs all 11 languages."
          }
          saveState={saveState}
          lastSavedAt={lastSavedAt}
          publishDisabled={publishBlocked}
          saving={saveState === "saving"}
          onPreview={() => {
            if (!form.slug) return;
            window.open(`/en/resources/${form.slug}`, "_blank", "noopener,noreferrer");
          }}
          onSaveDraft={() => void save(false)}
          onPublish={() => void save(true)}
        />

        <div className="min-w-0 space-y-5">
          <KnowledgeEditorArticleInfo
            locale={locale}
            title={form.title}
            subtitle={form.subtitle}
            slug={form.slug}
            slugTouched={slugTouched}
            excludeArticleId={currentId}
            onTitleChange={handleTitleChange}
            onSubtitleChange={(value) => patchForm({ subtitle: value })}
            onSlugChange={(value) => {
              setSlugTouched(true);
              patchForm({ slug: normalizeKnowledgeSlug(value) });
            }}
          />
          <KnowledgeEditorCover
            locale={locale}
            value={form.cover_image_url}
            fallbackUrl={form.cover_fallback_url}
            onChange={(value) =>
              patchForm({
                cover_image_url: value.url,
                cover_fallback_url: value.fallback_url ?? ""
              })
            }
          />
          <KnowledgeMarkdownEditor locale={locale} value={form.body_markdown} onChange={(value) => patchForm({ body_markdown: value })} lastSavedLabel={lastSavedLabel} />
        </div>

        <aside className="space-y-5 xl:sticky xl:top-6 xl:max-h-[calc(100vh-5rem)] xl:self-start xl:overflow-y-auto xl:pr-1">
          <KnowledgeEditorSeoCard locale={locale} form={form} onChange={patchForm} />
          <KnowledgeEditorCategoryCard
            locale={locale}
            categorySlug={form.category_slug}
            tags={form.tags}
            onCategoryChange={(value) => patchForm({ category_slug: value })}
            onTagsChange={(tags) => patchForm({ tags })}
          />
          <KnowledgeEditorPublishCard
            locale={locale}
            status={form.status}
            visibility={form.visibility}
            scheduledDate={form.scheduledDate}
            scheduledTime={form.scheduledTime}
            timezone={form.timezone}
            onChange={(patch) => patchForm(patch)}
          />
          <KnowledgeEditorPublishIssuesCard
            locale={locale}
            blockers={publishBlockers}
            warnings={publishWarnings}
          />
          <KnowledgeEditorAiCard
            locale={locale}
            disabled={!form.title.trim() || !form.body_markdown.trim()}
            runningAction={runningAction}
            onAction={(action) => void runAction(action)}
          />
          <KnowledgeEditorLucienCard
            locale={locale}
            aiSummary={form.meta_description}
            aiKeywords={form.focus_keywords}
            synced={lucienSynced}
            disabled={!currentId}
            onGenerate={generateLucienFields}
            onSync={() => void syncLucien()}
          />
          {message ? (
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm leading-6 text-zinc-700">
              {message}
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
