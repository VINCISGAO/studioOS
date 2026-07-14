import type { KnowledgeArticleDetailDto } from "@/features/knowledge-center/knowledge-center.types";
import type { Locale } from "@/lib/i18n";
import { resolveKnowledgeBodyHtml } from "@/lib/knowledge/knowledge-html";
import { pickKnowledgeAdminTranslation } from "@/lib/knowledge/knowledge-admin-translation";
import {
  defaultKnowledgeTagForCategory,
  type KnowledgeEditorFormState,
  type KnowledgeVisibility
} from "@/lib/knowledge/knowledge-editor-validation";

function resolveVisibility(value: string | undefined): KnowledgeVisibility {
  if (value === "PRIVATE" || value === "INTERNAL") return value;
  return "PUBLIC";
}

export type KnowledgeEditorPanelForm = KnowledgeEditorFormState & {
  language_code: string;
  author_name: string;
  lucien_learning: boolean;
  scheduledDate: string;
  scheduledTime: string;
  timezone: string;
  faqs: Array<{ question: string; answer: string }>;
};

export function buildKnowledgeEditorInitialForm(
  locale: Locale,
  initial?: KnowledgeArticleDetailDto | null
): KnowledgeEditorPanelForm {
  const translation = pickKnowledgeAdminTranslation(initial?.translations ?? [], { adminLocale: locale });
  const scheduled = initial?.scheduled_at ? new Date(initial.scheduled_at) : null;
  const categorySlug = initial?.category_slug ?? "ai-advertising";
  const articleTags = new Set(initial?.tags ?? []);
  const focusKeywords = (translation?.seo?.keywords ?? []).filter((keyword) => !articleTags.has(keyword));
  return {
    title: translation?.title ?? "",
    slug: initial?.slug ?? "",
    subtitle: translation?.subtitle ?? "",
    body_html: resolveKnowledgeBodyHtml({
      body_html: translation?.body_html,
      body_markdown: translation?.body_markdown
    }),
    seo_title: translation?.seo?.seo_title ?? "",
    meta_description: translation?.seo?.meta_description ?? "",
    focus_keywords: focusKeywords.join(", "),
    category_slug: categorySlug,
    tags: initial?.tags?.length ? initial.tags : [defaultKnowledgeTagForCategory(categorySlug)],
    cover_image_url: initial?.cover_image_url ?? "",
    cover_fallback_url: translation?.seo?.og_image_url ?? "",
    status: initial?.status ?? "DRAFT",
    visibility: resolveVisibility(initial?.visibility),
    language_code: translation?.language_code ?? (locale === "zh" ? "zh-CN" : "en"),
    author_name: initial?.author_name ?? "VINCIS",
    lucien_learning: translation?.lucien?.lucien_learning ?? true,
    faqs: (translation?.faqs ?? []).map((item) => ({ question: item.question, answer: item.answer })),
    scheduledDate: scheduled ? scheduled.toISOString().slice(0, 10) : "",
    scheduledTime: scheduled ? scheduled.toISOString().slice(11, 16) : "",
    timezone: initial?.timezone ?? "UTC"
  };
}
