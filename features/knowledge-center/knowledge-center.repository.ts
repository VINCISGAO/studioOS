import "server-only";

import { cache } from "react";
import { Prisma, type KnowledgeArticleStatus } from "@prisma/client";
import { asInputJson } from "@/lib/core/prisma-json";
import { prisma, hasDatabaseUrl } from "@/lib/core/database/prisma";
import {
  knowledgeSeedCategories,
  toArticleDetailDto,
  toArticleListItemDto
} from "@/features/knowledge-center/knowledge-center.mappers";
import {
  KNOWLEDGE_CITATION_CATEGORY_SLUGS,
  knowledgeCitationTopicLabel
} from "@/features/knowledge-center/knowledge-citation-categories";
import {
  KNOWLEDGE_DEMO_ARTICLE_SLUGS,
  knowledgePublicArticleWhere
} from "@/features/knowledge-center/knowledge-public.filters";
import { knowledgeTranslationWithJsonLdWhere } from "@/features/knowledge-center/knowledge-prisma.filters";
import type {
  KnowledgeArticleDetailDto,
  KnowledgeArticleListItemDto,
  KnowledgeCitationGapDto,
  KnowledgeDashboardStatsDto,
  KnowledgeSeoArticleRowDto,
  UpsertKnowledgeArticleInput
} from "@/features/knowledge-center/knowledge-center.types";
import type { Locale } from "@/lib/i18n";
import {
  knowledgeHtmlToMarkdownServer,
  knowledgeMarkdownToHtmlServer
} from "@/lib/knowledge/knowledge-body-convert";
import { rewriteKnowledgeHtmlAssetUrls } from "@/lib/knowledge/knowledge-asset-urls";
import { sanitizeKnowledgeHtml } from "@/lib/knowledge/sanitize-knowledge-html";
import {
  type KnowledgeSeoScores,
  toPrismaKnowledgeSeoScoreFields
} from "@/features/knowledge-center/knowledge-seo.heuristics";
import { buildKnowledgeTranslationSidecarBundle } from "@/features/knowledge-center/knowledge-translation-sidecar.bundle";
import { logger } from "@/lib/core/logger";

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

const articleAdminListInclude = {
  category: true,
  analytics: true,
  translations: {
    select: {
      languageCode: true,
      title: true,
      status: true,
      updatedAt: true,
      publishedAt: true,
      seo: { select: { seoScore: true } },
      lucien: { select: { lucienIndexed: true } }
    }
  }
} satisfies Prisma.KnowledgeArticleInclude;

const articlePublicListInclude = {
  category: true,
  tags: { include: { tag: true } },
  analytics: true,
  translations: {
    select: {
      languageCode: true,
      title: true,
      excerpt: true,
      status: true,
      readingTimeMinutes: true,
      updatedAt: true,
      publishedAt: true,
      seo: { select: { metaDescription: true, seoScore: true } }
    }
  }
} satisfies Prisma.KnowledgeArticleInclude;

const getPublishedTranslationCached = cache(async (routeKey: string, languageCode: string) => {
  const model = articleModel();
  if (!model) return null;
  return withKnowledgeTableFallback(null, async () => {
    const visibilityFilter = await resolveArticleVisibilityFilter();
    return model.findFirst({
      where: knowledgePublicArticleWhere({
        deletedAt: null,
        ...visibilityFilter,
        OR: [{ slug: routeKey }, { id: routeKey }],
        translations: {
          some: {
            languageCode,
            status: "PUBLISHED"
          }
        }
      }),
      include: articleInclude
    });
  });
});

type KnowledgeArticleModel = (typeof prisma)["knowledgeArticle"];

let articleVisibilityColumnCached: boolean | null = null;

function isMissingKnowledgeTableError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2021"
  );
}

function isPrismaColumnDriftError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2022"
  );
}

async function resolveArticleVisibilityFilter(): Promise<{ visibility: "PUBLIC" } | Record<string, never>> {
  if (articleVisibilityColumnCached === false) return {};
  if (articleVisibilityColumnCached === true) return { visibility: "PUBLIC" };

  const model = articleModel();
  if (!model) {
    articleVisibilityColumnCached = false;
    return {};
  }

  try {
    await model.count({ where: { visibility: "PUBLIC" } });
    articleVisibilityColumnCached = true;
    return { visibility: "PUBLIC" };
  } catch {
    articleVisibilityColumnCached = false;
    return {};
  }
}

function prismaErrorCode(error: unknown) {
  if (typeof error === "object" && error !== null && "code" in error) {
    return String((error as { code?: string }).code ?? "");
  }
  return "";
}

function isRecoverableKnowledgeReadError(error: unknown) {
  const code = prismaErrorCode(error);
  if (code && ["P1001", "P1002", "P1017", "P2021", "P2022", "P2024"].includes(code)) {
    return true;
  }
  const message = (error instanceof Error ? error.message : String(error)).toLowerCase();
  return (
    message.includes("prepared statement") ||
    message.includes("connection") ||
    message.includes("timeout") ||
    message.includes("does not exist")
  );
}

async function withKnowledgeTableFallback<T>(fallback: T, run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (error) {
    if (isMissingKnowledgeTableError(error) || isPrismaColumnDriftError(error)) return fallback;
    throw error;
  }
}

async function withKnowledgePublicReadFallback<T>(
  fallback: T,
  operation: string,
  run: () => Promise<T>
): Promise<T> {
  try {
    return await run();
  } catch (error) {
    logger.error("Knowledge public read failed", {
      service: "KnowledgeCenterRepository",
      operation,
      code: prismaErrorCode(error) || undefined,
      error: error instanceof Error ? error.message : String(error)
    });
    if (isRecoverableKnowledgeReadError(error)) return fallback;
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
  }

  async listAdmin(filters?: {
    q?: string;
    status?: string;
    language?: string;
    category?: string;
    adminLocale?: Locale;
  }): Promise<KnowledgeArticleListItemDto[]> {
    const model = articleModel();
    if (!model) return [];

    return withKnowledgeTableFallback([], async () => {
      const statusFilter =
        filters?.status && filters.status !== "ALL"
          ? (filters.status as KnowledgeArticleStatus)
          : undefined;

      const languageFilter =
        filters?.language && filters.language !== "ALL"
          ? filters.language === "zh-CN"
            ? { startsWith: "zh" }
            : filters.language.startsWith("en")
              ? { startsWith: "en" }
              : filters.language
          : undefined;

      const rows = await model.findMany({
        where: {
          deletedAt: null,
          ...(statusFilter ? { status: statusFilter } : {}),
          ...(filters?.category
            ? { category: { slug: filters.category } }
            : {}),
          ...(languageFilter
            ? { translations: { some: { languageCode: languageFilter } } }
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
        include: articleAdminListInclude,
        orderBy: { updatedAt: "desc" },
        take: 100
      });

      return rows.map((row) => toArticleListItemDto(row, filters?.language, filters?.adminLocale));
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

  /** Slug uniqueness includes soft-deleted rows — DB unique index does not ignore deletedAt. */
  async findOccupiedArticleIdBySlug(slug: string, excludeArticleId?: string): Promise<string | null> {
    const model = articleModel();
    if (!model || !slug.trim()) return null;
    return withKnowledgeTableFallback(null, async () => {
      const row = await model.findFirst({
        where: {
          slug,
          ...(excludeArticleId ? { id: { not: excludeArticleId } } : {})
        },
        select: { id: true }
      });
      return row?.id ?? null;
    });
  }

  async isSlugTaken(slug: string, excludeArticleId?: string): Promise<boolean> {
    const existingArticleId = await this.findOccupiedArticleIdBySlug(slug, excludeArticleId);
    return Boolean(existingArticleId);
  }

  async createArticle(data: Prisma.KnowledgeArticleCreateInput) {
    const model = articleModel();
    if (!model) return null;
    try {
      return await model.create({ data, include: articleInclude });
    } catch (error) {
      if (isPrismaColumnDriftError(error) && "visibility" in data) {
        const { visibility: _visibility, ...withoutVisibility } = data;
        return model.create({ data: withoutVisibility, include: articleInclude });
      }
      throw error;
    }
  }

  async updateArticle(id: string, data: Prisma.KnowledgeArticleUpdateInput) {
    const model = articleModel();
    if (!model) return null;
    try {
      return await model.update({ where: { id }, data, include: articleInclude });
    } catch (error) {
      if (isPrismaColumnDriftError(error) && "visibility" in data) {
        const { visibility: _visibility, ...withoutVisibility } = data;
        return model.update({ where: { id }, data: withoutVisibility, include: articleInclude });
      }
      throw error;
    }
  }

  async softDelete(id: string) {
    const model = articleModel();
    if (!model) return;
    const archivedSlug = `archived-${id}`;
    await model.update({
      where: { id },
      data: { deletedAt: new Date(), status: "ARCHIVED", slug: archivedSlug }
    });
  }

  async softDeleteMany(ids: string[]) {
    const model = articleModel();
    if (!model || !ids.length) return 0;
    const uniqueIds = [...new Set(ids.filter(Boolean))];
    let count = 0;
    for (const id of uniqueIds) {
      const result = await model.updateMany({
        where: { id, deletedAt: null },
        data: { deletedAt: new Date(), status: "ARCHIVED", slug: `archived-${id}` }
      });
      count += result.count;
    }
    return count;
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

  private resolveTranslationBodies(t: UpsertKnowledgeArticleInput["translation"]) {
    const htmlSource = t.body_html?.trim() || "";
    const markdownSource = t.body_markdown?.trim() || "";

    if (htmlSource) {
      const bodyHtml = rewriteKnowledgeHtmlAssetUrls(sanitizeKnowledgeHtml(htmlSource));
      const bodyMarkdown = knowledgeHtmlToMarkdownServer(htmlSource);
      return { bodyHtml, bodyMarkdown };
    }

    if (markdownSource) {
      const bodyMarkdown = markdownSource;
      const rawBodyHtml = markdownSource.includes("<")
        ? markdownSource
        : knowledgeMarkdownToHtmlServer(markdownSource);
      const bodyHtml = rewriteKnowledgeHtmlAssetUrls(sanitizeKnowledgeHtml(rawBodyHtml));
      return { bodyHtml, bodyMarkdown };
    }

    return { bodyHtml: "", bodyMarkdown: "" };
  }

  async upsertTranslationCore(
    articleId: string,
    input: UpsertKnowledgeArticleInput,
    bundle: { readingTimeMinutes: number }
  ) {
    const t = input.translation;
    const { bodyHtml, bodyMarkdown } = this.resolveTranslationBodies(t);

    const translation = await prisma.knowledgeTranslation.upsert({
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

    return translation.id;
  }

  async upsertTranslationSidecars(job: {
    translationId: string;
    slug: string;
    authorName: string;
    articleId: string;
    input: UpsertKnowledgeArticleInput;
    categorySlug?: string | null;
    categoryName?: string | null;
  }) {
    const bundle = buildKnowledgeTranslationSidecarBundle({
      articleId: job.articleId,
      slug: job.slug,
      authorName: job.authorName,
      categorySlug: job.categorySlug,
      categoryName: job.categoryName,
      payload: job.input
    });

    const t = job.input.translation;
    const seoMetrics = toPrismaKnowledgeSeoScoreFields(bundle.seoScores);
    const seoTitle = t.seo?.seo_title?.trim() || t.title.trim();
    const metaDescription = bundle.metaDescription || null;
    const canonicalUrl = bundle.canonical;

    await prisma.$transaction(async (tx) => {
      await tx.knowledgeSeo.upsert({
        where: { translationId: job.translationId },
        create: {
          translationId: job.translationId,
          seoTitle,
          metaDescription,
          canonicalUrl,
          keywordsJson: t.seo?.keywords?.length ? t.seo.keywords : undefined,
          ogTitle: t.seo?.og_title?.trim() || seoTitle,
          ogDescription: t.seo?.og_description?.trim() || metaDescription,
          ogImageUrl: t.seo?.og_image_url?.trim() || job.input.cover_image_url?.trim() || null,
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
          seoTitle,
          metaDescription,
          canonicalUrl,
          keywordsJson: t.seo?.keywords?.length ? t.seo.keywords : undefined,
          ogTitle: t.seo?.og_title?.trim() || seoTitle,
          ogDescription: t.seo?.og_description?.trim() || metaDescription,
          ogImageUrl: t.seo?.og_image_url?.trim() || job.input.cover_image_url?.trim() || null,
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

      await tx.knowledgeFaq.deleteMany({ where: { translationId: job.translationId } });
      if (t.faqs?.length) {
        await tx.knowledgeFaq.createMany({
          data: t.faqs.map((faq, index) => ({
            translationId: job.translationId,
            question: faq.question.trim(),
            answer: faq.answer.trim(),
            sortOrder: faq.sort_order ?? index
          }))
        });
      }

      const lucien = t.lucien;
      await tx.knowledgeLucien.upsert({
        where: { translationId: job.translationId },
        create: {
          translationId: job.translationId,
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
        where: { translationId: job.translationId },
        create: {
          translationId: job.translationId,
          schemaType: t.schema_type ?? "ARTICLE",
          jsonLd: asInputJson(bundle.jsonLd)!
        },
        update: {
          schemaType: t.schema_type ?? "ARTICLE",
          jsonLd: asInputJson(bundle.jsonLd)!
        }
      });

      await tx.knowledgeSearchIndex.upsert({
        where: { translationId: job.translationId },
        create: { translationId: job.translationId, searchText: bundle.searchText },
        update: { searchText: bundle.searchText }
      });
    });

    const revisionCount = await this.countRevisions(job.translationId);
    try {
      await this.saveRevision({
        translationId: job.translationId,
        versionNumber: revisionCount + 1,
        authorName: job.authorName,
        snapshot: {
          slug: job.slug,
          status: job.input.status,
          translation: {
            language_code: t.language_code,
            title: t.title,
            status: t.status ?? job.input.status
          }
        }
      });
    } catch {
      // Revisions are audit-only.
    }
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
    const translationId = await this.upsertTranslationCore(articleId, input, {
      readingTimeMinutes: bundle.readingTimeMinutes
    });
    await this.upsertTranslationSidecars({
      translationId,
      articleId,
      slug: input.slug?.trim() || articleId,
      authorName: input.author_name?.trim() || "VINCIS",
      input,
      categorySlug: input.category_slug ?? null
    });
    return translationId;
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
    return withKnowledgePublicReadFallback([], "listPublished", async () => {
      const visibilityFilter = await resolveArticleVisibilityFilter();
      return model.findMany({
        where: knowledgePublicArticleWhere({
          deletedAt: null,
          ...visibilityFilter,
          translations: {
            some: {
              languageCode,
              status: "PUBLISHED"
            }
          }
        }),
        include: articlePublicListInclude,
        orderBy: { publishedAt: "desc" },
        take: limit
      });
    });
  }

  async listPublishedByCategory(languageCode: string, categorySlug: string, limit = 50) {
    const model = articleModel();
    if (!model) return [];
    return withKnowledgeTableFallback([], async () => {
      const visibilityFilter = await resolveArticleVisibilityFilter();
      return model.findMany({
        where: knowledgePublicArticleWhere({
          deletedAt: null,
          ...visibilityFilter,
          category: { slug: categorySlug },
          translations: { some: { languageCode, status: "PUBLISHED" } }
        }),
        include: articlePublicListInclude,
        orderBy: { publishedAt: "desc" },
        take: limit
      });
    });
  }

  async listCategorySummaries(languageCode: string) {
    if (!this.isAvailable()) return [];
    return withKnowledgePublicReadFallback([], "listCategorySummaries", async () => {
      const visibilityFilter = await resolveArticleVisibilityFilter();
      const [categories, countRows] = await Promise.all([
        prisma.knowledgeCategory.findMany({ orderBy: { sortOrder: "asc" } }),
        prisma.knowledgeArticle.groupBy({
          by: ["categoryId"],
          where: knowledgePublicArticleWhere({
            deletedAt: null,
            categoryId: { not: null },
            translations: { some: { languageCode, status: "PUBLISHED" } },
            ...visibilityFilter
          }),
          _count: { _all: true }
        })
      ]);

      const countByCategoryId = new Map(
        countRows.map((row) => [row.categoryId, row._count._all])
      );

      return categories
        .map((category) => ({
          slug: category.slug,
          name: category.name,
          count: countByCategoryId.get(category.id) ?? 0
        }))
        .filter((item) => item.count > 0);
    });
  }

  async searchPublished(query: string, languageCode: string, limit = 20): Promise<KnowledgeArticleListItemDto[]> {
    const q = query.trim();
    if (!q || !this.isAvailable()) return [];

    return withKnowledgeTableFallback([], async () => {
      const visibilityFilter = await resolveArticleVisibilityFilter();
      const visibilitySql =
        "visibility" in visibilityFilter ? Prisma.sql`AND a.visibility = 'PUBLIC'` : Prisma.empty;
      const demoSlugSql = Prisma.sql`AND a.slug NOT IN (${Prisma.join(
        KNOWLEDGE_DEMO_ARTICLE_SLUGS.map((slug) => Prisma.sql`${slug}`)
      )})`;

      const indexRows = await prisma.$queryRaw<Array<{ article_id: string }>>(
        Prisma.sql`
          SELECT DISTINCT t.article_id
          FROM knowledge_search_indexes ksi
          INNER JOIN knowledge_translations t ON t.id = ksi.translation_id
          INNER JOIN knowledge_articles a ON a.id = t.article_id
          WHERE t.language_code = ${languageCode}
            AND t.status = CAST('PUBLISHED' AS "KnowledgeArticleStatus")
            AND a.status = CAST('PUBLISHED' AS "KnowledgeArticleStatus")
            AND a.deleted_at IS NULL
            ${visibilitySql}
            ${demoSlugSql}
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
        include: articlePublicListInclude
      });

      return rows.map((row) => toArticleListItemDto(row, languageCode));
    });
  }

  async getPublishedTranslation(routeKey: string, languageCode: string) {
    return getPublishedTranslationCached(routeKey, languageCode);
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
            where: {
              lucienIndexed: true,
              translation: { status: "PUBLISHED", article: notDeleted }
            }
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

    const dbCategories = await prisma.knowledgeCategory.findMany({
      where: { slug: { in: [...KNOWLEDGE_CITATION_CATEGORY_SLUGS] } }
    });
    const categoryBySlug = new Map(dbCategories.map((row) => [row.slug, row]));
    const gaps: KnowledgeCitationGapDto[] = [];

    for (const slug of KNOWLEDGE_CITATION_CATEGORY_SLUGS) {
      const category = categoryBySlug.get(slug);
      if (!category) {
        gaps.push({
          topic: knowledgeCitationTopicLabel(slug),
          category: slug,
          articles: 0,
          published_translations: 0,
          lucien_indexed: 0,
          avg_seo: 0,
          coverage: "missing"
        });
        continue;
      }

      const articleFilter = { deletedAt: null, categoryId: category.id } as const;
      const publishedTranslationFilter = {
        status: "PUBLISHED" as const,
        article: articleFilter
      };

      const [articles, publishedTranslations, lucienIndexed, seo] = await Promise.all([
        prisma.knowledgeArticle.count({ where: articleFilter }),
        prisma.knowledgeTranslation.count({ where: publishedTranslationFilter }),
        prisma.knowledgeLucien.count({
          where: {
            lucienIndexed: true,
            translation: publishedTranslationFilter
          }
        }),
        prisma.knowledgeSeo.aggregate({
          _avg: { seoScore: true },
          where: { translation: { article: articleFilter } }
        })
      ]);

      const avgSeo = Math.round(seo._avg.seoScore ?? 0);
      const coverage: KnowledgeCitationGapDto["coverage"] =
        articles === 0 || publishedTranslations === 0
          ? "missing"
          : lucienIndexed >= publishedTranslations
            ? "strong"
            : lucienIndexed > 0
              ? "partial"
              : "missing";

      gaps.push({
        topic: knowledgeCitationTopicLabel(slug, category.name),
        category: slug,
        articles,
        published_translations: publishedTranslations,
        lucien_indexed: lucienIndexed,
        avg_seo: avgSeo,
        coverage
      });
    }

    return gaps;
  }
}

export const knowledgeCenterRepository = new KnowledgeCenterRepository();
