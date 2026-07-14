import "server-only";

import {
  buildKnowledgeArticlePath,
  knowledgePathPrefixForCode
} from "@/features/knowledge-center/knowledge-center.constants";
import { knowledgeCenterRepository } from "@/features/knowledge-center/knowledge-center.repository";
import type { KnowledgeFaqDto, PublicKnowledgeArticleDto } from "@/features/knowledge-center/knowledge-center.types";
import {
  curatedFaqsForLanguage,
  curatedRelatedMeta,
  curatedRelatedSlugsFor,
  isAiAdvertisingClusterSlug,
  shouldEnrichAiAdvertisingArticle,
  type AiAdvertisingClusterSlug
} from "@/lib/knowledge/knowledge-ai-advertising-cluster";

function mergeCuratedFaqs(existing: KnowledgeFaqDto[], languageCode: string): KnowledgeFaqDto[] {
  if (existing.length >= 3) return existing;

  const curated = curatedFaqsForLanguage(languageCode);
  const seen = new Set(existing.map((item) => item.question.trim().toLowerCase()));
  const merged = [...existing];

  for (const faq of curated) {
    const key = faq.question.trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push({
      id: `curated-faq-${merged.length}`,
      question: faq.question,
      answer: faq.answer,
      sort_order: merged.length
    });
  }

  return merged;
}

async function resolveCuratedRelatedArticles(
  article: PublicKnowledgeArticleDto
): Promise<PublicKnowledgeArticleDto["related"]> {
  const slugs = curatedRelatedSlugsFor(article.slug);
  const published = await knowledgeCenterRepository.listPublishedBySlugs(slugs, article.language_code);
  const pathPrefix = knowledgePathPrefixForCode(article.language_code);

  return slugs.map((slug) => {
    const row = published.find((item) => item.slug === slug);
    const fallback = isAiAdvertisingClusterSlug(slug)
      ? curatedRelatedMeta(slug, article.language_code)
      : { title: slug, excerpt: "" };

    return {
      slug,
      title: row?.title ?? fallback.title,
      excerpt: row?.excerpt ?? fallback.excerpt,
      path: buildKnowledgeArticlePath(pathPrefix, slug)
    };
  });
}

export async function enrichPublicKnowledgeArticle(
  article: PublicKnowledgeArticleDto
): Promise<PublicKnowledgeArticleDto> {
  if (!shouldEnrichAiAdvertisingArticle({ slug: article.slug, category_slug: article.category_slug })) {
    return article;
  }

  const faqs = mergeCuratedFaqs(article.faqs, article.language_code);
  const related = await resolveCuratedRelatedArticles(article);

  return { ...article, faqs, related };
}
