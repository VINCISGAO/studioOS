import "server-only";

import { Prisma, type KnowledgeArticleStatus } from "@prisma/client";
import { asInputJson } from "@/lib/core/prisma-json";
import { prisma, hasDatabaseUrl } from "@/lib/core/database/prisma";
import {
  knowledgeSeedCategories,
  toArticleDetailDto,
  toArticleListItemDto
} from "@/features/knowledge-center/knowledge-center.mappers";
import { ensureKnowledgeArticleSeeds } from "@/features/knowledge-center/knowledge-center.article-seeds";
import { knowledgeTranslationWithJsonLdWhere } from "@/features/knowledge-center/knowledge-prisma.filters";
import type {
  KnowledgeArticleDetailDto,
  KnowledgeArticleListItemDto,
  KnowledgeCitationGapDto,
  KnowledgeDashboardStatsDto,
  KnowledgeSeoArticleRowDto,
  UpsertKnowledgeArticleInput
} from "@/features/knowledge-center/knowledge-center.types";
import { renderKnowledgeMarkdown } from "@/lib/knowledge/knowledge-markdown";
import {
  type KnowledgeSeoScores,
  toPrismaKnowledgeSeoScoreFields
} from "@/features/knowledge-center/knowledge-seo.heuristics";
const articleInclude = {
  category: true,
  tags: { include: { tag: true } },
  analytics: true,
  translations: {
    include: {
      seo: true,
      faqs: { orderBy: { sortOrder: "asc" } },
      lucien: true,
      schema: true
    }
  }
} satisfies Prisma.KnowledgeArticleInclude;

type KnowledgeArticleModel = (typeof prisma)["knowledgeArticle"];

function isMissingKnowledgeTableError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2021"
  );
}

async function withKnowledgeTableFallback<T>(fallback: T, run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (error) {
    if (isMissingKnowledgeTableError(error)) return fallback;
    throw error;
  }
}

function articleModel(): KnowledgeArticleModel | null {
  if (!hasDatabaseUrl()) return null;
  const model = (prisma as { knowledgeArticle?: KnowledgeArticleModel }).knowledgeArticle;
  if (!model || typeof model.count !== "function") return null;
  return model;
}

async function ensureDefaultCategories() {
  for (const [index, item] of knowledgeSeedCategories.entries()) {
    await prisma.knowledgeCategory.upsert({
      where: { slug: item.slug },
      create: { slug: item.slug, name: item.name, sortOrder: index },
      update: { name: item.name, sortOrder: index }
    });
  }
}

async function resolveCategoryId(input: UpsertKnowledgeArticleInput) {
  if (input.category_id) return input.category_id;
  if (!input.category_slug) return null;
  const category = await prisma.knowledgeCategory.findUnique({ where: { slug: input.category_slug } });
  return category?.id ?? null;
}

async function syncTags(articleId: string, tags: string[] | undefined) {
  if (!tags) return;
  await prisma.knowledgeArticleTag.deleteMany({ where: { articleId } });
  for (const raw of tags) {
    const name = raw.trim();
    if (!name) continue;
    const slug = name.toLowerCase().replace(/\s+/g, "-");
    const tag = await prisma.knowledgeTag.upsert({
      where: { slug },
      create: { slug, name },
      update: { name }
    });
    await prisma.knowledgeArticleTag.create({ data: { articleId, tagId: tag.id } });
  }
}

export class KnowledgeCenterRepository {
  isAvailable() {
    return articleModel() !== null;
  }

  async ensureSeeds() {
    if (!this.isAvailable()) return;
    await ensureDefaultCategories();
    try {
      await ensureKnowledgeArticleSeeds();
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code?: string }).code === "P2021"
      ) {
        return;
      }
      throw error;
    }
  }

  async listAdmin(filters?: {
    q?: string;
    status?: string;
    language?: string;
    category?: string;
  }): Promise<KnowledgeArticleListItemDto[]> {
    const model = articleModel();
    if (!model) return [];

    return withKnowledgeTableFallback([], async () => {
      const statusFilter =
        filters?.status && filters.status !== "ALL"
          ? (filters.status as KnowledgeArticleStatus)
          : undefined;

      const rows = await model.findMany({
        where: {
          deletedAt: null,
          ...(statusFilter ? { status: statusFilter } : {}),
          ...(filters?.category
            ? { category: { slug: filters.category } }
            : {}),
          ...(filters?.q
            ? {
                OR: [
                  { slug: { contains: filters.q, mode: "insensitive" } },
                  { translations: { some: { title: { contains: filters.q, mode: "insensitive" } } } }
                ]
              }
            : {})
        },
        include: articleInclude,
        orderBy: { updatedAt: "desc" }
      });

      return rows.map((row) => toArticleListItemDto(row, filters?.language));
    });
  }

  async listSeoDashboardArticles(): Promise<KnowledgeSeoArticleRowDto[]> {
    const model = articleModel();
    if (!model) return [];
    return withKnowledgeTableFallback([], async () => {
      const rows = await model.findMany({
        where: { deletedAt: null },
        include: articleInclude,
        orderBy: { updatedAt: "desc" }
      });

      const items: KnowledgeSeoArticleRowDto[] = [];
      for (const row of rows) {
        const publishedCodes = await this.listPublishedLanguageCodesBySlug(row.slug);
        for (const translation of row.translations) {
          items.push({
            id: row.id,
            slug: row.slug,
            title: translation.title,
            language_code: translation.languageCode,
            status: translation.status,
            seo_score: translation.seo?.seoScore ?? 0,
            ai_friendly_score: translation.seo?.aiFriendlyScore ?? 0,
            google_score: translation.seo?.googleScore ?? 0,
            baidu_score: translation.seo?.baiduScore ?? 0,
            lucien_indexed: translation.lucien?.lucienIndexed ?? false,
            schema_ready: Boolean(translation.schema?.jsonLd),
            hreflang_languages: publishedCodes.length,
            updated_at: translation.updatedAt.toISOString()
          });
        }
      }
      return items;
    });
  }

  async getById(id: string): Promise<KnowledgeArticleDetailDto | null> {
    const model = articleModel();
    if (!model) return null;
    const row = await model.findFirst({
      where: { id, deletedAt: null },
      include: articleInclude
    });
    return row ? toArticleDetailDto(row) : null;
  }

  async getBySlug(slug: string): Promise<KnowledgeArticleDetailDto | null> {
    const model = articleModel();
    if (!model) return null;
    const row = await model.findFirst({
      where: { slug, deletedAt: null },
      include: articleInclude
    });
    return row ? toArticleDetailDto(row) : null;
  }

  async findActiveArticleIdBySlug(slug: string, excludeArticleId?: string): Promise<string | null> {
    const model = articleModel();
    if (!model || !slug.trim()) return null;
    return withKnowledgeTableFallback(null, async () => {
      const row = await model.findFirst({
        where: {
          slug,
          deletedAt: null,
          ...(excludeArticleId ? { id: { not: excludeArticleId } } : {})
        },
        select: { id: true }
      });
      return row?.id ?? null;
    });
  }

  async isSlugTaken(slug: string, excludeArticleId?: string): Promise<boolean> {
    const existingArticleId = await this.findActiveArticleIdBySlug(slug, excludeArticleId);
    return Boolean(existingArticleId);
  }

  async createArticle(data: Prisma.KnowledgeArticleCreateInput) {
    const model = articleModel();
    if (!model) return null;
    return model.create({ data, include: articleInclude });
  }

  async updateArticle(id: string, data: Prisma.KnowledgeArticleUpdateInput) {
    const model = articleModel();
    if (!model) return null;
    return model.update({ where: { id }, data, include: articleInclude });
  }

  async softDelete(id: string) {
    const model = articleModel();
    if (!model) return;
    await model.update({ where: { id }, data: { deletedAt: new Date(), status: "ARCHIVED" } });
  }

  async softDeleteMany(ids: string[]) {
    const model = articleModel();
    if (!model || !ids.length) return 0;
    const uniqueIds = [...new Set(ids.filter(Boolean))];
    const result = await model.updateMany({
      where: { id: { in: uniqueIds }, deletedAt: null },
      data: { deletedAt: new Date(), status: "ARCHIVED" }
    });
    return result.count;
  }

  async ensureAnalytics(articleId: string) {
    await prisma.knowledgeAnalytics.upsert({
      where: { articleId },
      create: { articleId },
      update: {}
    });
  }

  async saveRevision(input: {
    translationId: string;
    versionNumber: number;
    authorName: string;
    snapshot: Record<string, unknown>;
  }) {
    await prisma.knowledgeRevision.create({
      data: {
        translationId: input.translationId,
        versionNumber: input.versionNumber,
        authorName: input.authorName,
        snapshotJson: asInputJson(input.snapshot)!
      }
    });
  }

  async countRevisions(translationId: string) {
    return prisma.knowledgeRevision.count({ where: { translationId } });
  }

  async upsertTranslationBundle(
    articleId: string,
    input: UpsertKnowledgeArticleInput,
    bundle: {
      readingTimeMinutes: number;
      seoScores: KnowledgeSeoScores;
      searchText: string;
      jsonLd: Record<string, unknown>;
    }
  ) {
    const t = input.translation;
    const htmlSource = t.body_html?.trim() || "";
    const markdownSource = t.body_markdown?.trim() || "";
    const bodyHtml = htmlSource
      ? htmlSource
      : markdownSource.includes("<")
        ? markdownSource
        : markdownSource
          ? renderKnowledgeMarkdown(markdownSource)
          : "";
    const bodyMarkdown = markdownSource || bodyHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

    const seoMetrics = toPrismaKnowledgeSeoScoreFields(bundle.seoScores);

    return prisma.$transaction(async (tx) => {
      const translation = await tx.knowledgeTranslation.upsert({
      where: {
        articleId_languageCode: {
          articleId,
          languageCode: t.language_code
        }
      },
      create: {
        articleId,
        languageCode: t.language_code,
        title: t.title.trim(),
        subtitle: t.subtitle?.trim() || null,
        bodyMarkdown,
        bodyHtml,
        excerpt: t.excerpt?.trim() || null,
        readingTimeMinutes: bundle.readingTimeMinutes,
        status: t.status ?? input.status ?? "DRAFT",
        publishedAt: (t.status ?? input.status) === "PUBLISHED" ? new Date() : null
      },
      update: {
        title: t.title.trim(),
        subtitle: t.subtitle?.trim() || null,
        bodyMarkdown,
        bodyHtml,
        excerpt: t.excerpt?.trim() || null,
        readingTimeMinutes: bundle.readingTimeMinutes,
        status: t.status ?? input.status,
        publishedAt: (t.status ?? input.status) === "PUBLISHED" ? new Date() : undefined
      }
    });

    await tx.knowledgeSeo.upsert({
      where: { translationId: translation.id },
      create: {
        translationId: translation.id,
        seoTitle: t.seo?.seo_title?.trim() || t.title.trim(),
        metaDescription: t.seo?.meta_description?.trim() || t.excerpt?.trim() || null,
        canonicalUrl: t.seo?.canonical_url?.trim() || null,
        keywordsJson: t.seo?.keywords?.length ? t.seo.keywords : undefined,
        ogTitle: t.seo?.og_title?.trim() || t.title.trim(),
        ogDescription: t.seo?.og_description?.trim() || t.seo?.meta_description?.trim() || null,
        ogImageUrl: t.seo?.og_image_url?.trim() || input.cover_image_url?.trim() || null,
        twitterCard: t.seo?.twitter_card ?? "summary_large_image",
        seoScore: seoMetrics.seoScore,
        readabilityScore: seoMetrics.readabilityScore,
        aiFriendlyScore: seoMetrics.aiFriendlyScore,
        googleScore: seoMetrics.googleScore,
        baiduScore: seoMetrics.baiduScore,
        internalLinkCount: seoMetrics.internalLinkCount,
        externalLinkCount: seoMetrics.externalLinkCount
      },
      update: {
        seoTitle: t.seo?.seo_title?.trim() || t.title.trim(),
        metaDescription: t.seo?.meta_description?.trim() || t.excerpt?.trim() || null,
        canonicalUrl: t.seo?.canonical_url?.trim() || null,
        keywordsJson: t.seo?.keywords?.length ? t.seo.keywords : undefined,
        ogTitle: t.seo?.og_title?.trim() || t.title.trim(),
        ogDescription: t.seo?.og_description?.trim() || t.seo?.meta_description?.trim() || null,
        ogImageUrl: t.seo?.og_image_url?.trim() || input.cover_image_url?.trim() || null,
        twitterCard: t.seo?.twitter_card ?? "summary_large_image",
        seoScore: seoMetrics.seoScore,
        readabilityScore: seoMetrics.readabilityScore,
        aiFriendlyScore: seoMetrics.aiFriendlyScore,
        googleScore: seoMetrics.googleScore,
        baiduScore: seoMetrics.baiduScore,
        internalLinkCount: seoMetrics.internalLinkCount,
        externalLinkCount: seoMetrics.externalLinkCount
      }
    });

    await tx.knowledgeFaq.deleteMany({ where: { translationId: translation.id } });
    if (t.faqs?.length) {
      await tx.knowledgeFaq.createMany({
        data: t.faqs.map((faq, index) => ({
          translationId: translation.id,
          question: faq.question.trim(),
          answer: faq.answer.trim(),
          sortOrder: faq.sort_order ?? index
        }))
      });
    }

    const lucien = t.lucien;
    await tx.knowledgeLucien.upsert({
      where: { translationId: translation.id },
      create: {
        translationId: translation.id,
        aiSummary: lucien?.ai_summary?.trim() || t.excerpt?.trim() || null,
        aiKeywordsJson: lucien?.ai_keywords?.length ? lucien.ai_keywords : undefined,
        aiTopicsJson: lucien?.ai_topics?.length ? lucien.ai_topics : undefined,
        aiIntent: lucien?.ai_intent ?? "informational",
        aiConfidence: lucien?.ai_confidence ?? 80,
        llmFriendly: lucien?.llm_friendly ?? true,
        allowCitation: lucien?.allow_citation ?? true,
        allowTraining: lucien?.allow_training ?? false,
        lucienLearning: lucien?.lucien_learning ?? true,
        searchPriority: lucien?.search_priority ?? 50,
        category: lucien?.category ?? "WORKFLOW",
        weight: lucien?.weight ?? 100,
        priority: lucien?.priority ?? "MEDIUM"
      },
      update: {
        aiSummary: lucien?.ai_summary?.trim() || t.excerpt?.trim() || null,
        aiKeywordsJson: lucien?.ai_keywords?.length ? lucien.ai_keywords : undefined,
        aiTopicsJson: lucien?.ai_topics?.length ? lucien.ai_topics : undefined,
        aiIntent: lucien?.ai_intent ?? "informational",
        aiConfidence: lucien?.ai_confidence ?? 80,
        llmFriendly: lucien?.llm_friendly ?? true,
        allowCitation: lucien?.allow_citation ?? true,
        allowTraining: lucien?.allow_training ?? false,
        lucienLearning: lucien?.lucien_learning ?? true,
        searchPriority: lucien?.search_priority ?? 50,
        category: lucien?.category ?? "WORKFLOW",
        weight: lucien?.weight ?? 100,
        priority: lucien?.priority ?? "MEDIUM"
      }
    });

    await tx.knowledgeSchema.upsert({
      where: { translationId: translation.id },
      create: {
        translationId: translation.id,
        schemaType: t.schema_type ?? "ARTICLE",
        jsonLd: asInputJson(bundle.jsonLd)!
      },
      update: {
        schemaType: t.schema_type ?? "ARTICLE",
        jsonLd: asInputJson(bundle.jsonLd)!
      }
    });

      await tx.knowledgeSearchIndex.upsert({
        where: { translationId: translation.id },
        create: { translationId: translation.id, searchText: bundle.searchText },
        update: { searchText: bundle.searchText }
      });

      return translation.id;
    });
  }

  async resolveCategoryAndTagsForCreate(input: UpsertKnowledgeArticleInput) {
    return resolveCategoryId(input);
  }

  async resolveCategoryAndTags(articleId: string, input: UpsertKnowledgeArticleInput) {
    const categoryId = await resolveCategoryId(input);
    await syncTags(articleId, input.tags);
    return categoryId;
  }

  async listPublished(languageCode: string, limit = 50) {
    const model = articleModel();
    if (!model) return [];
    return withKnowledgeTableFallback([], async () =>
      model.findMany({
        where: {
          deletedAt: null,
          visibility: "PUBLIC",
          translations: {
            some: {
              languageCode,
              status: "PUBLISHED"
            }
          }
        },
        include: articleInclude,
        orderBy: { publishedAt: "desc" },
        take: limit
      })
    );
  }

  async listPublishedByCategory(languageCode: string, categorySlug: string, limit = 50) {
    const model = articleModel();
    if (!model) return [];
    return withKnowledgeTableFallback([], async () =>
      model.findMany({
        where: {
          deletedAt: null,
          visibility: "PUBLIC",
          category: { slug: categorySlug },
          translations: { some: { languageCode, status: "PUBLISHED" } }
        },
        include: articleInclude,
        orderBy: { publishedAt: "desc" },
        take: limit
      })
    );
  }

  async listCategorySummaries(languageCode: string) {
    if (!this.isAvailable()) return [];
    return withKnowledgeTableFallback([], async () => {
      const categories = await prisma.knowledgeCategory.findMany({ orderBy: { sortOrder: "asc" } });
      const summaries = [];
      for (const category of categories) {
        const count = await prisma.knowledgeArticle.count({
          where: {
            deletedAt: null,
            categoryId: category.id,
            translations: { some: { languageCode, status: "PUBLISHED" } },
            visibility: "PUBLIC"
          }
        });
        if (count > 0) {
          summaries.push({ slug: category.slug, name: category.name, count });
        }
      }
      return summaries;
    });
  }

  async searchPublished(query: string, languageCode: string, limit = 20): Promise<KnowledgeArticleListItemDto[]> {
    const q = query.trim();
    if (!q || !this.isAvailable()) return [];

    return withKnowledgeTableFallback([], async () => {
      const indexRows = await prisma.$queryRaw<Array<{ article_id: string }>>(
        Prisma.sql`
          SELECT DISTINCT t.article_id
          FROM knowledge_search_indexes ksi
          INNER JOIN knowledge_translations t ON t.id = ksi.translation_id
          INNER JOIN knowledge_articles a ON a.id = t.article_id
          WHERE t.language_code = ${languageCode}
            AND t.status = CAST('PUBLISHED' AS "KnowledgeArticleStatus")
            AND a.deleted_at IS NULL
            AND a.visibility = 'PUBLIC'
            AND to_tsvector('simple', coalesce(ksi.search_text, '')) @@ plainto_tsquery('simple', ${q})
          LIMIT ${limit * 2}
        `
      );

      const articleIds = [...new Set(indexRows.map((row) => row.article_id))].slice(0, limit);
      if (!articleIds.length) return [];

      const model = articleModel();
      if (!model) return [];

      const rows = await model.findMany({
        where: { id: { in: articleIds }, deletedAt: null },
        include: articleInclude
      });

      return rows.map((row) => toArticleListItemDto(row, languageCode));
    });
  }

  async getPublishedTranslation(slug: string, languageCode: string) {
    const model = articleModel();
    if (!model) return null;
    return withKnowledgeTableFallback(null, async () =>
      model.findFirst({
        where: {
          slug,
          deletedAt: null,
          visibility: "PUBLIC",
          translations: {
            some: {
              languageCode,
              status: "PUBLISHED"
            }
          }
        },
        include: articleInclude
      })
    );
  }

  async listPublishedLanguageCodesBySlug(slug: string): Promise<string[]> {
    const model = articleModel();
    if (!model) return [];
    return withKnowledgeTableFallback([], async () => {
      const row = await model.findFirst({
        where: { slug, deletedAt: null },
        select: {
          translations: {
            where: { status: "PUBLISHED" },
            select: { languageCode: true }
          }
        }
      });
      return row?.translations.map((item) => item.languageCode) ?? [];
    });
  }

  async listPublishedBySlugs(
    slugs: string[],
    languageCode: string
  ): Promise<Array<{ slug: string; title: string; excerpt: string | null }>> {
    const model = articleModel();
    if (!model || !slugs.length) return [];
    return withKnowledgeTableFallback([], async () => {
      const rows = await model.findMany({
        where: {
          slug: { in: slugs },
          deletedAt: null,
          translations: { some: { languageCode, status: "PUBLISHED" } }
        },
        include: articleInclude
      });

      return slugs.flatMap((slug) => {
        const row = rows.find((item) => item.slug === slug);
        if (!row) return [];
        const translation = row.translations.find(
          (item) => item.languageCode === languageCode && item.status === "PUBLISHED"
        );
        if (!translation) return [];
        return [
          {
            slug,
            title: translation.title,
            excerpt: translation.excerpt
          }
        ];
      });
    });
  }

  async incrementView(articleId: string) {
    await prisma.knowledgeAnalytics.upsert({
      where: { articleId },
      create: { articleId, viewCount: 1, monthlyViews: 1 },
      update: { viewCount: { increment: 1 }, monthlyViews: { increment: 1 } }
    });
  }

  async recordFeedback(articleId: string, helpful: boolean) {
    await prisma.knowledgeAnalytics.upsert({
      where: { articleId },
      create: {
        articleId,
        helpfulCount: helpful ? 1 : 0,
        notHelpfulCount: helpful ? 0 : 1
      },
      update: helpful
        ? { helpfulCount: { increment: 1 } }
        : { notHelpfulCount: { increment: 1 } }
    });
  }

  async getDashboardStats(): Promise<KnowledgeDashboardStatsDto> {
    if (!this.isAvailable()) {
      return {
        articles: 0,
        published: 0,
        draft: 0,
        languages: 0,
        lucien_indexed: 0,
        google_indexed: 0,
        baidu_indexed: 0,
        bing_indexed: 0,
        avg_seo: 0,
        monthly_views: 0
      };
    }

    return withKnowledgeTableFallback(
      {
        articles: 0,
        published: 0,
        draft: 0,
        languages: 0,
        lucien_indexed: 0,
        google_indexed: 0,
        baidu_indexed: 0,
        bing_indexed: 0,
        avg_seo: 0,
        monthly_views: 0
      },
      async () => {
        const notDeleted = { deletedAt: null } as const;
        const [
          articles,
          published,
          draft,
          languages,
          lucienIndexed,
          analytics,
          seoAvg,
          googleReady,
          baiduReady,
          bingReady
        ] = await Promise.all([
          prisma.knowledgeArticle.count({ where: notDeleted }),
          prisma.knowledgeArticle.count({ where: { ...notDeleted, status: "PUBLISHED" } }),
          prisma.knowledgeArticle.count({ where: { ...notDeleted, status: "DRAFT" } }),
          prisma.knowledgeTranslation.groupBy({
            by: ["languageCode"],
            where: { article: notDeleted }
          }),
          prisma.knowledgeLucien.count({
            where: { lucienIndexed: true, translation: { article: notDeleted } }
          }),
          prisma.knowledgeAnalytics.aggregate({
            _sum: { monthlyViews: true, viewCount: true },
            where: { article: notDeleted }
          }),
          prisma.knowledgeSeo.aggregate({
            _avg: { seoScore: true },
            where: { translation: { article: notDeleted } }
          }),
          prisma.knowledgeTranslation.count({
            where: {
              status: "PUBLISHED",
              article: notDeleted,
              seo: { googleScore: { gte: 60 } },
              ...knowledgeTranslationWithJsonLdWhere
            }
          }),
          prisma.knowledgeTranslation.count({
            where: {
              status: "PUBLISHED",
              article: notDeleted,
              seo: { baiduScore: { gte: 55 } }
            }
          }),
          prisma.knowledgeTranslation.count({
            where: {
              status: "PUBLISHED",
              article: notDeleted,
              seo: { seoScore: { gte: 65 } },
              ...knowledgeTranslationWithJsonLdWhere
            }
          })
        ]);

        return {
          articles,
          published,
          draft,
          languages: languages.length,
          lucien_indexed: lucienIndexed,
          google_indexed: googleReady,
          baidu_indexed: baiduReady,
          bing_indexed: bingReady,
          avg_seo: Math.round(seoAvg._avg.seoScore ?? 0),
          monthly_views: analytics._sum.monthlyViews ?? 0
        };
      }
    );
  }

  async getCitationGaps(): Promise<KnowledgeCitationGapDto[]> {
    if (!this.isAvailable()) return [];
    const categories = await prisma.knowledgeCategory.findMany({ orderBy: { sortOrder: "asc" } });
    const gaps: KnowledgeCitationGapDto[] = [];

    for (const category of categories) {
      const articles = await prisma.knowledgeArticle.count({
        where: { deletedAt: null, categoryId: category.id }
      });
      const indexed = await prisma.knowledgeLucien.count({
        where: {
          lucienIndexed: true,
          translation: { article: { categoryId: category.id } }
        }
      });
      const seo = await prisma.knowledgeSeo.aggregate({
        _avg: { seoScore: true },
        where: { translation: { article: { categoryId: category.id } } }
      });
      const avgSeo = Math.round(seo._avg.seoScore ?? 0);
      const coverage: KnowledgeCitationGapDto["coverage"] =
        articles === 0 ? "missing" : indexed >= articles ? "strong" : "partial";
      gaps.push({
        topic: category.name,
        category: category.slug,
        articles,
        lucien_indexed: indexed,
        avg_seo: avgSeo,
        coverage
      });
    }

    return gaps;
  }
}

export const knowledgeCenterRepository = new KnowledgeCenterRepository();
