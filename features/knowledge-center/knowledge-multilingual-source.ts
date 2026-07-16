import type { KnowledgeTranslationDto, UpsertKnowledgeArticleInput } from "@/features/knowledge-center/knowledge-center.types";
import { knowledgeHtmlToMarkdownServer } from "@/lib/knowledge/knowledge-body-convert";

/** Prefer persisted translation bodies — editor saves body_html only. */
export function resolveMultilingualSourceTranslation(
  input: UpsertKnowledgeArticleInput["translation"],
  persisted?: KnowledgeTranslationDto | null
): UpsertKnowledgeArticleInput["translation"] {
  const bodyHtml = persisted?.body_html?.trim() || input.body_html?.trim() || "";
  const bodyMarkdown = bodyHtml
    ? knowledgeHtmlToMarkdownServer(bodyHtml)
    : persisted?.body_markdown?.trim() || input.body_markdown?.trim() || "";

  return {
    ...input,
    title: persisted?.title?.trim() || input.title,
    subtitle: persisted?.subtitle?.trim() || input.subtitle,
    excerpt: persisted?.excerpt?.trim() || input.excerpt,
    body_html: bodyHtml || input.body_html,
    body_markdown: bodyMarkdown,
    seo: persisted?.seo
      ? {
          seo_title: persisted.seo.seo_title ?? input.seo?.seo_title,
          meta_description: persisted.seo.meta_description ?? input.seo?.meta_description,
          keywords: persisted.seo.keywords?.length ? persisted.seo.keywords : input.seo?.keywords,
          og_title: persisted.seo.og_title ?? input.seo?.og_title,
          og_description: persisted.seo.og_description ?? input.seo?.og_description,
          og_image_url: persisted.seo.og_image_url ?? input.seo?.og_image_url,
          twitter_card: persisted.seo.twitter_card ?? input.seo?.twitter_card
        }
      : input.seo,
    faqs: persisted?.faqs?.length
      ? persisted.faqs.map((faq, index) => ({
          question: faq.question,
          answer: faq.answer,
          sort_order: faq.sort_order ?? index
        }))
      : input.faqs,
    lucien: persisted?.lucien
      ? {
          ai_summary: persisted.lucien.ai_summary ?? input.lucien?.ai_summary,
          ai_keywords: persisted.lucien.ai_keywords?.length
            ? persisted.lucien.ai_keywords
            : input.lucien?.ai_keywords,
          lucien_learning: input.lucien?.lucien_learning
        }
      : input.lucien
  };
}
