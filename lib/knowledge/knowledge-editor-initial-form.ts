import type { KnowledgeArticleDetailDto } from "@/features/knowledge-center/knowledge-center.types";
import type { Locale } from "@/lib/i18n";
import {
  defaultKnowledgeTagForCategory,
  type KnowledgeEditorFormState
} from "@/lib/knowledge/knowledge-editor-validation";

export type KnowledgeEditorPanelForm = KnowledgeEditorFormState & {
  language_code: string;
  author_name: string;
  lucien_learning: boolean;
  scheduledDate: string;
  scheduledTime: string;
  timezone: string;
};

export function buildKnowledgeEditorInitialForm(
  locale: Locale,
  initial?: KnowledgeArticleDetailDto | null
): KnowledgeEditorPanelForm {
  const translation = initial?.translations.find((item) => item.language_code === "en") ?? initial?.translations[0];
  const scheduled = initial?.scheduled_at ? new Date(initial.scheduled_at) : null;
  const categorySlug = initial?.category_slug ?? "ai-advertising";
  return {
    title: translation?.title ?? "",
    slug: initial?.slug ?? "",
    subtitle: translation?.subtitle ?? "",
    body_markdown: translation?.body_markdown ?? "",
    seo_title: translation?.seo?.seo_title ?? "",
    meta_description: translation?.seo?.meta_description ?? "",
    focus_keywords: (translation?.seo?.keywords ?? []).join(", "),
    category_slug: categorySlug,
    tags: initial?.tags?.length ? initial.tags : [defaultKnowledgeTagForCategory(categorySlug)],
    cover_image_url: initial?.cover_image_url ?? "",
    cover_fallback_url: translation?.seo?.og_image_url ?? "",
    status: initial?.status ?? "DRAFT",
    visibility: "PUBLIC",
    language_code: translation?.language_code ?? (locale === "zh" ? "zh-CN" : "en"),
    author_name: initial?.author_name ?? "VINCIS",
    lucien_learning: translation?.lucien?.lucien_learning ?? true,
    scheduledDate: scheduled ? scheduled.toISOString().slice(0, 10) : "",
    scheduledTime: scheduled ? scheduled.toISOString().slice(11, 16) : "",
    timezone: initial?.timezone ?? "UTC"
  };
}
