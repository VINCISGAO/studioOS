import {
  buildKnowledgeArticlePath,
  knowledgePathPrefixForCode
} from "@/features/knowledge-center/knowledge-center.constants";
import type { UpsertKnowledgeArticleInput } from "@/features/knowledge-center/knowledge-center.types";
import {
  buildKnowledgeJsonLd,
  computeKnowledgeSeoScores,
  estimateReadingTimeMinutes,
  knowledgeExcerptFromBody,
  type KnowledgeSeoScores
} from "@/features/knowledge-center/knowledge-seo.heuristics";

const ORIGIN = "https://vincis.app";

function buildSearchText(input: UpsertKnowledgeArticleInput) {
  const t = input.translation;
  const bodyPlain = (t.body_html || t.body_markdown || "").replace(/<[^>]+>/g, " ");
  return [
    t.title,
    t.subtitle,
    t.excerpt,
    t.seo?.meta_description,
    bodyPlain,
    ...(t.seo?.keywords ?? []),
    ...(t.lucien?.ai_keywords ?? []),
    ...(input.tags ?? [])
  ]
    .filter(Boolean)
    .join("\n")
    .slice(0, 200_000);
}

export function buildKnowledgeTranslationSidecarBundle(input: {
  articleId: string;
  slug: string;
  authorName: string;
  categorySlug?: string | null;
  categoryName?: string | null;
  payload: UpsertKnowledgeArticleInput;
}) {
  const t = input.payload.translation;
  const bodyForScores = t.body_html?.trim() || t.body_markdown || "";
  const seoScores = computeKnowledgeSeoScores({
    translation: {
      title: t.title,
      subtitle: t.subtitle,
      body_markdown: bodyForScores,
      excerpt: t.excerpt
    },
    seo: t.seo
  });
  const readingTimeMinutes = estimateReadingTimeMinutes(
    t.body_html ? t.body_html.replace(/<[^>]+>/g, " ") : t.body_markdown
  );
  const pathPrefix = knowledgePathPrefixForCode(t.language_code);
  const canonical =
    t.seo?.canonical_url?.trim() || `${ORIGIN}${buildKnowledgeArticlePath(pathPrefix, input.slug)}`;
  const metaDescription =
    t.seo?.meta_description?.trim() ||
    t.excerpt?.trim() ||
    knowledgeExcerptFromBody(bodyForScores);
  const jsonLd = buildKnowledgeJsonLd({
    title: t.title,
    description: metaDescription,
    url: canonical,
    authorName: input.payload.author_name?.trim() || input.authorName,
    publishedAt: input.payload.status === "PUBLISHED" ? new Date().toISOString() : null,
    updatedAt: new Date().toISOString(),
    imageUrl: t.seo?.og_image_url || input.payload.cover_image_url,
    pathPrefix,
    categoryName: input.categoryName ?? null,
    categorySlug: input.categorySlug ?? null,
    origin: ORIGIN,
    faqs: t.faqs
  });

  return {
    readingTimeMinutes,
    seoScores,
    searchText: buildSearchText(input.payload),
    jsonLd,
    canonical,
    metaDescription
  } satisfies {
    readingTimeMinutes: number;
    seoScores: KnowledgeSeoScores;
    searchText: string;
    jsonLd: Record<string, unknown>;
    canonical: string;
    metaDescription: string;
  };
}
