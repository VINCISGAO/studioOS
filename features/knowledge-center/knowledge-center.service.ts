import "server-only";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { toArticleListItemDto } from "@/features/knowledge-center/knowledge-center.mappers";
import {
  buildKnowledgeArticlePath,
  buildKnowledgeIndexPath,
  KNOWLEDGE_LANGUAGE_OPTIONS,
  knowledgePathPrefixForCode
} from "@/features/knowledge-center/knowledge-center.constants";
import { knowledgeCenterRepository } from "@/features/knowledge-center/knowledge-center.repository";
import { knowledgeLucienSyncService } from "@/features/knowledge-center/knowledge-lucien-sync.service";
import {
  buildKnowledgeJsonLd,
  estimateReadingTimeMinutes
} from "@/features/knowledge-center/knowledge-seo.heuristics";
import {
  buildKnowledgeArticleAlternates,
  knowledgeAlternatesToMetadataLanguages
} from "@/features/knowledge-center/knowledge-hreflang";
import { enrichPublicKnowledgeArticle } from "@/features/knowledge-center/knowledge-article-enrichment";
import {
  rewriteKnowledgeAssetUrl,
  rewriteKnowledgeHtmlAssetUrls
} from "@/lib/knowledge/knowledge-asset-urls";
import { toAdminPreviewArticle } from "@/features/knowledge-center/knowledge-admin-preview.mapper";
import { commitArticleSlug } from "@/features/knowledge-center/knowledge-slug.service";
import { knowledgeSeoDashboardService } from "@/features/knowledge-center/knowledge-seo-dashboard.service";
import { runKnowledgePublishPipeline, type KnowledgeSaveResult, type KnowledgeTranslationSidecarJob } from "@/features/knowledge-center/knowledge-publish.pipeline";
import { resolveMultilingualSourceTranslation } from "@/features/knowledge-center/knowledge-multilingual-source";
import { syncKnowledgeArticleTranslations } from "@/features/knowledge-center/knowledge-multilingual-publish.service";
import { logger } from "@/lib/core/logger";
import type {
  KnowledgeArticleDetailDto,
  KnowledgeArticleListItemDto,
  KnowledgeCitationGapDto,
  KnowledgeDashboardStatsDto,
  KnowledgeHomeArticleCardDto,
  PublicKnowledgeArticleDto,
  UpsertKnowledgeArticleInput
} from "@/features/knowledge-center/knowledge-center.types";
import type { KnowledgeMultilingualBackgroundJob } from "@/features/knowledge-center/knowledge-publish.pipeline";
import { aiGatewayService } from "@/features/ai/ai-gateway.service";
import type { Locale } from "@/lib/i18n";

const ORIGIN = "https://vincis.app";

export class KnowledgeCenterService {
  isAvailable() {
    return knowledgeCenterRepository.isAvailable();
  }

  async ensureSeeds() {
    await knowledgeCenterRepository.ensureSeeds();
  }

  async listAdmin(filters?: {
    q?: string;
    status?: string;
    language?: string;
    category?: string;
    adminLocale?: Locale;
  }): Promise<KnowledgeArticleListItemDto[]> {
    return knowledgeCenterRepository.listAdmin(filters);
  }

  async getById(id: string) {
    return knowledgeCenterRepository.getById(id);
  }

  async getDashboardStats(): Promise<KnowledgeDashboardStatsDto> {
    return knowledgeCenterRepository.getDashboardStats();
  }

  async getCitationGaps(): Promise<KnowledgeCitationGapDto[]> {
    return knowledgeCenterRepository.getCitationGaps();
  }

  async getSeoDashboard() {
    return knowledgeSeoDashboardService.build();
  }

  async create(input: UpsertKnowledgeArticleInput): Promise<KnowledgeSaveResult> {
    await this.ensureSeeds();
    const tempSlug = `draft-${randomUUID()}`;
    const categoryId = await knowledgeCenterRepository.resolveCategoryAndTagsForCreate(input);
    const publishing = this.isPublishIntent(input);

    let article: Awaited<ReturnType<typeof knowledgeCenterRepository.createArticle>> = null;
    try {
      article = await knowledgeCenterRepository.createArticle({
        slug: tempSlug,
        status: this.resolvePublishStatus(input, "DRAFT"),
        authorName: input.author_name?.trim() || "VINCIS",
        coverImageUrl: input.cover_image_url?.trim() || null,
        visibility: input.visibility ?? "PUBLIC",
        scheduledAt: input.scheduled_at ? new Date(input.scheduled_at) : null,
        timezone: input.timezone ?? "UTC",
        category: categoryId ? { connect: { id: categoryId } } : undefined,
        publishedAt: publishing ? new Date() : null
      });

      if (!article) return { article: null };

      const slug = await commitArticleSlug(article.id, {
        title: this.resolveArticleTitle(input),
        publishing,
        existingSlug: tempSlug,
        preferredSlug: input.slug
      });

      await knowledgeCenterRepository.ensureAnalytics(article.id);
      await knowledgeCenterRepository.resolveCategoryAndTags(article.id, input);
      const sidecarJob = await this.persistTranslation(article.id, slug, input);
      const status = this.resolvePublishStatus(input, "DRAFT");

      if (!publishing) {
        return {
          article: this.saveRef(article.id, slug, status),
          queueTranslationSidecars: sidecarJob
        };
      }

      const published = this.finishMultilingualPublish(article.id, slug, input);
      return { ...published, queueTranslationSidecars: sidecarJob };
    } catch (error) {
      if (article?.id) {
        try {
          await knowledgeCenterRepository.softDelete(article.id);
        } catch {
          // Best-effort rollback so a failed create does not block the slug forever.
        }
      }
      throw error;
    }
  }

  async update(id: string, input: UpsertKnowledgeArticleInput): Promise<KnowledgeSaveResult> {
    const existing = await knowledgeCenterRepository.getById(id);
    if (!existing) return { article: null };

    const publishing = this.isPublishIntent(input);
    const wasPublished = existing.status === "PUBLISHED" || Boolean(existing.published_at);
    const slug = await commitArticleSlug(id, {
      title: this.resolveArticleTitle(input, existing),
      publishing,
      wasPublished,
      existingSlug: existing.slug,
      preferredSlug: input.slug
    });
    const categoryId = await knowledgeCenterRepository.resolveCategoryAndTags(id, input);

    const nextStatus = this.resolvePublishStatus(input, existing.status);

    const sidecarJob = await this.persistTranslation(id, slug, { ...input, status: nextStatus }, existing.author_name);

    await knowledgeCenterRepository.updateArticle(id, {
      status: nextStatus,
      authorName: input.author_name?.trim() || existing.author_name,
      coverImageUrl: input.cover_image_url?.trim() || existing.cover_image_url,
      visibility: input.visibility ?? existing.visibility ?? "PUBLIC",
      scheduledAt:
        nextStatus === "PUBLISHED"
          ? null
          : input.scheduled_at
            ? new Date(input.scheduled_at)
            : undefined,
      timezone: input.timezone ?? existing.timezone,
      category: categoryId ? { connect: { id: categoryId } } : { disconnect: true },
      publishedAt:
        nextStatus === "PUBLISHED"
          ? existing.published_at
            ? new Date(existing.published_at)
            : new Date()
          : undefined
    });

    if (nextStatus !== "PUBLISHED") {
      return {
        article: this.saveRef(id, slug, nextStatus),
        queueTranslationSidecars: sidecarJob
      };
    }

    const published = this.finishMultilingualPublish(id, slug, { ...input, status: nextStatus }, existing.author_name);
    return { ...published, queueTranslationSidecars: sidecarJob };
  }

  async publish(id: string): Promise<KnowledgeSaveResult> {
    const existing = await knowledgeCenterRepository.getById(id);
    if (!existing) return { article: null };

    const translation = existing.translations[0];
    if (!translation) return { article: existing };

    return this.update(id, {
      title: translation.title,
      category_slug: existing.category_slug ?? undefined,
      author_name: existing.author_name,
      status: "PUBLISHED",
      translation: {
        language_code: translation.language_code,
        title: translation.title,
        subtitle: translation.subtitle ?? undefined,
        body_html: translation.body_html,
        body_markdown: translation.body_markdown,
        excerpt: translation.excerpt ?? undefined,
        status: "PUBLISHED",
        seo: translation.seo
          ? {
              seo_title: translation.seo.seo_title ?? undefined,
              meta_description: translation.seo.meta_description ?? undefined,
              canonical_url: translation.seo.canonical_url ?? undefined,
              keywords: translation.seo.keywords,
              og_title: translation.seo.og_title ?? undefined,
              og_description: translation.seo.og_description ?? undefined,
              og_image_url: translation.seo.og_image_url ?? undefined
            }
          : undefined,
        faqs: translation.faqs.map((faq) => ({
          question: faq.question,
          answer: faq.answer,
          sort_order: faq.sort_order
        })),
        lucien: translation.lucien
          ? {
              ai_summary: translation.lucien.ai_summary ?? undefined,
              ai_keywords: translation.lucien.ai_keywords,
              ai_topics: translation.lucien.ai_topics,
              lucien_learning: translation.lucien.lucien_learning
            }
          : undefined
      }
    });
  }

  async delete(id: string) {
    const existing = await knowledgeCenterRepository.getById(id);
    if (!existing) return;
    for (const translation of existing.translations) {
      await knowledgeLucienSyncService.removeTranslationIndex(existing.slug, translation.language_code);
      const pathPrefix = knowledgePathPrefixForCode(translation.language_code);
      revalidatePath(buildKnowledgeArticlePath(pathPrefix, existing.slug));
    }
    await knowledgeCenterRepository.softDelete(id);
    for (const lang of KNOWLEDGE_LANGUAGE_OPTIONS) {
      revalidatePath(buildKnowledgeIndexPath(lang.pathPrefix));
    }
  }

  async deleteMany(ids: string[]) {
    const uniqueIds = [...new Set(ids.filter(Boolean))];
    for (const id of uniqueIds) {
      await this.delete(id);
    }
    return uniqueIds.length;
  }

  async syncLucien(articleId: string) {
    const detail = await knowledgeCenterRepository.getById(articleId);
    if (!detail) return { synced: 0 };
    const result = await runKnowledgePublishPipeline(detail);
    return { synced: result.lucien_synced };
  }

  async listPublishedByCategory(languageCode: string, categorySlug: string): Promise<KnowledgeArticleListItemDto[]> {
    const rows = await knowledgeCenterRepository.listPublishedByCategory(languageCode, categorySlug);
    return rows.map((row) => toArticleListItemDto(row, languageCode));
  }

  async searchPublic(query: string, languageCode: string, limit = 20) {
    return knowledgeCenterRepository.searchPublished(query, languageCode, limit);
  }

  async listCategorySummaries(languageCode: string) {
    return knowledgeCenterRepository.listCategorySummaries(languageCode);
  }

  async listPublishedPublic(languageCode: string): Promise<KnowledgeArticleListItemDto[]> {
    const rows = await knowledgeCenterRepository.listPublished(languageCode);
    return rows.map((row) => toArticleListItemDto(row, languageCode));
  }

  async listPublishedHomeCards(languageCode: string, limit = 12): Promise<KnowledgeHomeArticleCardDto[]> {
    const rows = await knowledgeCenterRepository.listPublished(languageCode, limit);
    return rows.map((row) => {
      const translation = row.translations.find(
        (item) => item.languageCode === languageCode && item.status === "PUBLISHED"
      );
      return {
        id: row.id,
        slug: row.slug,
        title: translation?.title ?? row.slug,
        excerpt: translation?.excerpt ?? translation?.seo?.metaDescription ?? null,
        category_name: row.category?.name ?? null,
        category_slug: row.category?.slug ?? null,
        cover_image_url: row.coverImageUrl,
        tags: row.tags.map((item) => item.tag.name),
        reading_time_minutes: translation?.readingTimeMinutes ?? 1,
        updated_at: translation?.updatedAt.toISOString() ?? row.updatedAt.toISOString(),
        published_at: translation?.publishedAt?.toISOString() ?? row.publishedAt?.toISOString() ?? null
      };
    });
  }

  async getArticleHreflangLanguages(slug: string, currentLanguageCode: string) {
    const publishedLanguageCodes = await knowledgeCenterRepository.listPublishedLanguageCodesBySlug(slug);
    const alternates = buildKnowledgeArticleAlternates({
      slug,
      publishedLanguageCodes,
      currentLanguageCode
    });
    return knowledgeAlternatesToMetadataLanguages(alternates);
  }

  buildPublicArticleJsonLd(article: PublicKnowledgeArticleDto) {
    const pathPrefix = knowledgePathPrefixForCode(article.language_code);
    const url = `${ORIGIN}${buildKnowledgeArticlePath(pathPrefix, article.slug)}`;
    return buildKnowledgeJsonLd({
      title: article.title,
      description: article.seo?.meta_description?.trim() || article.excerpt?.trim() || "",
      url,
      authorName: article.author_name,
      publishedAt: article.published_at,
      updatedAt: article.updated_at,
      imageUrl: article.seo?.og_image_url || article.cover_image_url,
      pathPrefix,
      categoryName: article.category_name,
      categorySlug: article.category_slug,
      origin: ORIGIN,
      faqs: article.faqs.map((faq) => ({
        question: faq.question,
        answer: faq.answer,
        sort_order: faq.sort_order
      }))
    });
  }

  async getPublicArticle(
    slug: string,
    languageCode: string,
    options?: { recordView?: boolean }
  ): Promise<PublicKnowledgeArticleDto | null> {
    const row = await knowledgeCenterRepository.getPublishedTranslation(slug, languageCode);
    if (!row) return null;

    const translation = row.translations.find((item) => item.languageCode === languageCode && item.status === "PUBLISHED");
    if (!translation) return null;

    const pathPrefix = knowledgePathPrefixForCode(languageCode);
    const canonical = `${ORIGIN}${buildKnowledgeArticlePath(pathPrefix, row.slug)}`;
    const seo = translation.seo;
    const schemaJson = (translation.schema?.jsonLd as Record<string, unknown> | null) ?? null;

    const relatedRows = await knowledgeCenterRepository.listPublished(languageCode, 4);
    const related = relatedRows
      .filter((item) => item.slug !== slug)
      .slice(0, 3)
      .map((item) => {
        const rel = item.translations.find((t) => t.languageCode === languageCode);
        return {
          slug: item.slug,
          title: rel?.title ?? item.slug,
          path: buildKnowledgeArticlePath(pathPrefix, item.slug)
        };
      });

    if (options?.recordView !== false) {
      await knowledgeCenterRepository.incrementView(row.id);
    }

    return enrichPublicKnowledgeArticle({
      id: row.id,
      slug: row.slug,
      language_code: languageCode,
      path_prefix: pathPrefix,
      title: translation.title,
      subtitle: translation.subtitle,
      body_html: rewriteKnowledgeHtmlAssetUrls(translation.bodyHtml ?? ""),
      body_markdown: translation.bodyMarkdown,
      excerpt: translation.excerpt,
      reading_time_minutes: translation.readingTimeMinutes,
      author_name: row.authorName,
      cover_image_url: rewriteKnowledgeAssetUrl(row.coverImageUrl),
      category_name: row.category?.name ?? null,
      category_slug: row.category?.slug ?? null,
      updated_at: translation.updatedAt.toISOString(),
      published_at: translation.publishedAt?.toISOString() ?? row.publishedAt?.toISOString() ?? null,
      seo: seo
        ? {
            seo_title: seo.seoTitle,
            meta_description: seo.metaDescription,
            canonical_url: seo.canonicalUrl ?? canonical,
            keywords: Array.isArray(seo.keywordsJson)
              ? seo.keywordsJson.map((item) => String(item))
              : [],
            og_title: seo.ogTitle,
            og_description: seo.ogDescription,
            og_image_url: rewriteKnowledgeAssetUrl(seo.ogImageUrl),
            twitter_card: seo.twitterCard,
            seo_score: seo.seoScore,
            readability_score: seo.readabilityScore,
            ai_friendly_score: seo.aiFriendlyScore,
            google_score: seo.googleScore,
            baidu_score: seo.baiduScore,
            internal_link_count: seo.internalLinkCount,
            external_link_count: seo.externalLinkCount
          }
        : null,
      faqs: translation.faqs.map((faq) => ({
        id: faq.id,
        question: faq.question,
        answer: faq.answer,
        sort_order: faq.sortOrder
      })),
      schema_json_ld: schemaJson,
      related
    });
  }

  async getAdminPreviewArticle(articleId: string, languageCode?: string, adminLocale?: Locale) {
    const detail = await knowledgeCenterRepository.getById(articleId);
    if (!detail) return null;
    return toAdminPreviewArticle(detail, languageCode, adminLocale);
  }

  async recordFeedback(articleId: string, helpful: boolean) {
    await knowledgeCenterRepository.recordFeedback(articleId, helpful);
  }

  /** Runs GPT multilingual sync after the publish HTTP response has returned. */
  async runBackgroundMultilingualSync(job: KnowledgeMultilingualBackgroundJob) {
    if (!aiGatewayService.isConfigured()) {
      logger.info("knowledge.multilingual_background.skipped", {
        service: "KnowledgeCenterService",
        articleId: job.articleId,
        reason: "openai_not_configured"
      });
      return;
    }

    const detail = await knowledgeCenterRepository.getById(job.articleId);
    const persistedSource = detail?.translations.find(
      (item) => item.language_code === job.input.translation.language_code
    );
    const sourceTranslation = resolveMultilingualSourceTranslation(job.input.translation, persistedSource);

    const publishInput: UpsertKnowledgeArticleInput = {
      ...job.input,
      status: "PUBLISHED",
      translation: {
        ...sourceTranslation,
        status: "PUBLISHED"
      }
    };

    logger.info("knowledge.multilingual_background.started", {
      service: "KnowledgeCenterService",
      articleId: job.articleId,
      slug: job.slug,
      sourceLanguage: publishInput.translation.language_code,
      bodyMarkdownChars: publishInput.translation.body_markdown?.length ?? 0
    });

    try {
      const multilingual = await syncKnowledgeArticleTranslations({
        base: publishInput,
        persist: async (payload) => {
          await this.persistTranslation(job.articleId, job.slug, payload, job.authorName, { awaitSidecars: true });
        }
      });

      const refreshed = await knowledgeCenterRepository.getById(job.articleId);
      if (refreshed) {
        await runKnowledgePublishPipeline(refreshed, multilingual);
      }

      logger.info("knowledge.multilingual_background.completed", {
        service: "KnowledgeCenterService",
        articleId: job.articleId,
        translationsSynced: multilingual.translations_synced,
        errors: multilingual.errors.length
      });
    } catch (error) {
      logger.error("knowledge.multilingual_background.failed", {
        service: "KnowledgeCenterService",
        articleId: job.articleId,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  private finishMultilingualPublish(
    articleId: string,
    slug: string,
    input: UpsertKnowledgeArticleInput,
    authorName = "VINCIS"
  ): KnowledgeSaveResult {
    const publishInput: UpsertKnowledgeArticleInput = {
      ...input,
      status: "PUBLISHED",
      translation: {
        ...input.translation,
        status: "PUBLISHED"
      }
    };

    const sourceCode = publishInput.translation.language_code;
    const pathPrefix = knowledgePathPrefixForCode(sourceCode);
    const publicUrl = buildKnowledgeArticlePath(pathPrefix, slug);
    const openaiConfigured = aiGatewayService.isConfigured();

    if (!openaiConfigured) {
      logger.info("knowledge.multilingual_background.not_queued", {
        service: "KnowledgeCenterService",
        articleId,
        slug,
        sourceLanguage: sourceCode,
        reason: "openai_not_configured"
      });
    } else {
      logger.info("knowledge.multilingual_background.queued", {
        service: "KnowledgeCenterService",
        articleId,
        slug,
        sourceLanguage: sourceCode
      });
    }

    return {
      article: this.saveRef(articleId, slug, "PUBLISHED"),
      pipeline: {
        published: true,
        steps: [],
        lucien_synced: 0,
        public_urls: [publicUrl],
        multilingual_sync_queued: openaiConfigured
      },
      queuePublishPipeline: {
        articleId,
        slug,
        sourceLanguage: sourceCode
      },
      queueMultilingualSync: openaiConfigured
        ? {
            articleId,
            slug,
            input: publishInput,
            authorName
          }
        : undefined
    };
  }

  private saveRef(
    id: string,
    slug: string,
    status: KnowledgeArticleDetailDto["status"]
  ): KnowledgeArticleDetailDto {
    return {
      id,
      slug,
      status,
      author_name: "VINCIS",
      category_id: null,
      category_slug: null,
      category_name: null,
      cover_image_url: null,
      visibility: "PUBLIC",
      tags: [],
      scheduled_at: null,
      timezone: "UTC",
      published_at: status === "PUBLISHED" ? new Date().toISOString() : null,
      translations: [],
      analytics: {
        view_count: 0,
        helpful_count: 0,
        not_helpful_count: 0,
        monthly_views: 0
      }
    };
  }

  private async persistTranslation(
    articleId: string,
    slug: string,
    input: UpsertKnowledgeArticleInput,
    authorName = "VINCIS",
    options?: { awaitSidecars?: boolean }
  ): Promise<KnowledgeTranslationSidecarJob | undefined> {
    const t = input.translation;
    const readingTimeMinutes = estimateReadingTimeMinutes(
      t.body_html ? t.body_html.replace(/<[^>]+>/g, " ") : t.body_markdown
    );

    const translationId = await knowledgeCenterRepository.upsertTranslationCore(articleId, input, {
      readingTimeMinutes
    });

    const sidecarJob: KnowledgeTranslationSidecarJob = {
      articleId,
      translationId,
      slug,
      authorName: input.author_name?.trim() || authorName,
      input,
      categorySlug: input.category_slug ?? null,
      categoryName: null
    };

    if (options?.awaitSidecars) {
      await knowledgeCenterRepository.upsertTranslationSidecars(sidecarJob);
      return undefined;
    }

    return sidecarJob;
  }

  private resolveArticleTitle(
    input: UpsertKnowledgeArticleInput,
    existing?: KnowledgeArticleDetailDto | null
  ) {
    return (
      input.translation.title?.trim() ||
      input.title?.trim() ||
      existing?.translations[0]?.title?.trim() ||
      ""
    );
  }

  private isPublishIntent(input: UpsertKnowledgeArticleInput) {
    return input.status === "PUBLISHED" || input.translation.status === "PUBLISHED";
  }

  private resolvePublishStatus(
    input: UpsertKnowledgeArticleInput,
    current: KnowledgeArticleDetailDto["status"]
  ): KnowledgeArticleDetailDto["status"] {
    if (this.isPublishIntent(input)) return "PUBLISHED";
    return (input.status ?? current) as KnowledgeArticleDetailDto["status"];
  }
}

export const knowledgeCenterService = new KnowledgeCenterService();
