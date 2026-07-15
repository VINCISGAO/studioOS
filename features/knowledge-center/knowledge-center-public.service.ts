import "server-only";

import { knowledgeCenterRepository } from "@/features/knowledge-center/knowledge-center.repository";
import type { KnowledgeHomeArticleCardDto } from "@/features/knowledge-center/knowledge-center.types";
import { logger } from "@/lib/core/logger";

export type KnowledgeCenterHomePageData = {
  articles: KnowledgeHomeArticleCardDto[];
  categoryCounts: Record<string, number>;
};

function mapPublishedHomeCards(
  rows: Awaited<ReturnType<typeof knowledgeCenterRepository.listPublished>>,
  languageCode: string
): KnowledgeHomeArticleCardDto[] {
  const seenSlugs = new Set<string>();
  const cards: KnowledgeHomeArticleCardDto[] = [];

  for (const row of rows) {
    if (seenSlugs.has(row.slug)) continue;
    const translation = row.translations.find(
      (item) => item.languageCode === languageCode && item.status === "PUBLISHED"
    );
    if (!translation) continue;
    seenSlugs.add(row.slug);
    cards.push({
      id: row.id,
      slug: row.slug,
      title: translation.title,
      excerpt: translation.excerpt ?? translation.seo?.metaDescription ?? null,
      category_name: row.category?.name ?? null,
      category_slug: row.category?.slug ?? null,
      cover_image_url: row.coverImageUrl,
      tags: row.tags.map((item) => item.tag.name),
      reading_time_minutes: translation.readingTimeMinutes ?? 1,
      updated_at: translation.updatedAt.toISOString(),
      published_at: translation.publishedAt?.toISOString() ?? row.publishedAt?.toISOString() ?? null
    });
  }

  return cards;
}

export async function loadKnowledgeCenterHomePageData(
  languageCode: string,
  limit = 12
): Promise<KnowledgeCenterHomePageData> {
  try {
    const [rows, categories] = await Promise.all([
      knowledgeCenterRepository.listPublished(languageCode, limit),
      knowledgeCenterRepository.listCategorySummaries(languageCode)
    ]);

    return {
      articles: mapPublishedHomeCards(rows, languageCode),
      categoryCounts: Object.fromEntries(categories.map((item) => [item.slug, item.count]))
    };
  } catch (error) {
    logger.error("Knowledge center home page load failed", {
      service: "KnowledgeCenterPublicService",
      languageCode,
      error: error instanceof Error ? error.message : String(error)
    });
    return { articles: [], categoryCounts: {} };
  }
}
