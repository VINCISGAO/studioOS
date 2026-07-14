import "server-only";

import { revalidatePath } from "next/cache";
import {
  buildKnowledgeArticlePath,
  KNOWLEDGE_LANGUAGE_OPTIONS,
  knowledgePathPrefixForCode
} from "@/features/knowledge-center/knowledge-center.constants";
import { knowledgeLucienSyncService } from "@/features/knowledge-center/knowledge-lucien-sync.service";
import { pingKnowledgeSearchEngines } from "@/features/knowledge-center/knowledge-search-engine-ping.service";
import type { KnowledgeArticleDetailDto } from "@/features/knowledge-center/knowledge-center.types";
import type { UpsertKnowledgeArticleInput } from "@/features/knowledge-center/knowledge-center.types";
import type { KnowledgeMultilingualSyncResult } from "@/features/knowledge-center/knowledge-multilingual.types";
import { logger } from "@/lib/core/logger";

import {
  KNOWLEDGE_PUBLISH_STEPS,
  KNOWLEDGE_PUBLISH_STEP_LABELS,
  formatKnowledgePublishSummary,
  type KnowledgePublishPipelineResult,
  type KnowledgePublishStep
} from "@/features/knowledge-center/knowledge-publish.pipeline.shared";

export type { KnowledgePublishPipelineResult, KnowledgePublishStep } from "@/features/knowledge-center/knowledge-publish.pipeline.shared";
export { KNOWLEDGE_PUBLISH_STEPS, KNOWLEDGE_PUBLISH_STEP_LABELS, formatKnowledgePublishSummary };

export type KnowledgeSaveResult = {
  article: KnowledgeArticleDetailDto | null;
  pipeline?: KnowledgePublishPipelineResult;
  queueMultilingualSync?: KnowledgeMultilingualBackgroundJob;
};

export type KnowledgeMultilingualBackgroundJob = {
  articleId: string;
  slug: string;
  input: UpsertKnowledgeArticleInput;
  authorName: string;
};

function isPublishedArticle(detail: KnowledgeArticleDetailDto) {
  return (
    detail.status === "PUBLISHED" ||
    detail.translations.some((translation) => translation.status === "PUBLISHED")
  );
}

export async function runKnowledgePublishPipeline(
  detail: KnowledgeArticleDetailDto,
  multilingual?: KnowledgeMultilingualSyncResult
): Promise<KnowledgePublishPipelineResult> {
  const steps: KnowledgePublishStep[] = [];
  const publicUrls: string[] = [];

  if (!isPublishedArticle(detail)) {
    return { published: false, steps, lucien_synced: 0, public_urls: publicUrls };
  }

  steps.push(
    "html",
    "json_ld",
    "open_graph",
    "twitter_card",
    "canonical",
    "hreflang",
    "schema_org",
    "article_page",
    "site_search",
    "ai_summary"
  );

  let lucienSynced = 0;
  for (const translation of detail.translations) {
    if (translation.status !== "PUBLISHED") continue;

    if (translation.lucien?.lucien_learning) {
      try {
        const result = await knowledgeLucienSyncService.syncTranslation({
          slug: detail.slug,
          translation,
          categoryName: detail.category_name
        });
        lucienSynced += result.synced;
      } catch (error) {
        logger.warn("knowledge.publish.lucien_sync_failed", {
          service: "knowledge-center",
          slug: detail.slug,
          languageCode: translation.language_code,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    const pathPrefix = knowledgePathPrefixForCode(translation.language_code);
    const articlePath = buildKnowledgeArticlePath(pathPrefix, detail.slug);
    publicUrls.push(articlePath);

    revalidatePath(articlePath);
    revalidatePath(`/${pathPrefix}/resources`);
    if (detail.category_slug) {
      revalidatePath(`/${pathPrefix}/resources/category/${detail.category_slug}`);
      steps.push("category_index");
    }
  }

  if (lucienSynced > 0) {
    steps.push("lucien_learning");
  }

  if ((multilingual?.translations_synced ?? 0) > 1) {
    steps.push("multilingual_sync");
  }

  revalidatePath("/sitemap.xml");
  steps.push("sitemap");

  revalidatePath("/feed.xml");
  for (const lang of KNOWLEDGE_LANGUAGE_OPTIONS) {
    revalidatePath(`/${lang.pathPrefix}/resources/rss.xml`);
  }
  steps.push("rss");

  revalidatePath("/llms.txt");
  steps.push("llms_txt");

  revalidatePath("/robots.txt");
  steps.push("robots_txt");

  revalidatePath("/api/v1/knowledge/search");
  steps.push("cache_revalidated");

  let pingResult;
  try {
    pingResult = await pingKnowledgeSearchEngines({
      articleUrls: publicUrls.map((path) => path)
    });
    steps.push("search_engine_ping");
    logger.info("knowledge.publish.search_engine_ping", {
      service: "knowledge-center",
      attempted: pingResult.attempted,
      succeeded: pingResult.succeeded
    });
  } catch (error) {
    logger.warn("knowledge.publish.search_engine_ping_failed", {
      service: "knowledge-center",
      error: error instanceof Error ? error.message : String(error)
    });
  }

  return {
    published: true,
    steps: [...new Set(steps)],
    lucien_synced: lucienSynced,
    public_urls: publicUrls,
    translations_synced: multilingual?.translations_synced,
    translation_languages: multilingual?.translation_languages,
    translation_errors: multilingual?.errors.length ? multilingual.errors : undefined,
    search_engine_ping: pingResult
  };
}
