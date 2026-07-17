import { aiGatewayService } from "@/features/ai/ai-gateway.service";
import { knowledgeCenterRepository } from "@/features/knowledge-center/knowledge-center.repository";
import { resolveMultilingualSourceTranslation } from "@/features/knowledge-center/knowledge-multilingual-source";
import { syncKnowledgeArticleTranslations } from "@/features/knowledge-center/knowledge-multilingual-publish.service";
import {
  buildPublishUpsertFromDetail,
  listMissingPublishedLanguageCodes,
  pickMultilingualSourceTranslation
} from "@/features/knowledge-center/knowledge-multilingual-upsert";
import { runKnowledgePublishPipeline } from "@/features/knowledge-center/knowledge-publish.pipeline";
import type { UpsertKnowledgeArticleInput } from "@/features/knowledge-center/knowledge-center.types";
import {
  estimateReadingTimeMinutes
} from "@/features/knowledge-center/knowledge-seo.heuristics";
import { logger } from "@/lib/core/logger";

async function persistPublishedTranslation(
  articleId: string,
  slug: string,
  input: UpsertKnowledgeArticleInput,
  authorName: string
) {
  const readingTimeMinutes = estimateReadingTimeMinutes(
    input.translation.body_html
      ? input.translation.body_html.replace(/<[^>]+>/g, " ")
      : input.translation.body_markdown
  );

  const translationId = await knowledgeCenterRepository.upsertTranslationCore(articleId, input, {
    readingTimeMinutes
  });

  await knowledgeCenterRepository.upsertTranslationSidecars({
    articleId,
    translationId,
    slug,
    authorName: input.author_name?.trim() || authorName,
    input,
    categorySlug: input.category_slug ?? null,
    categoryName: null
  });
}

export async function syncMissingKnowledgeArticleTranslations(
  slug: string,
  options?: { sourceLanguage?: string }
) {
  if (!aiGatewayService.isConfigured()) {
    throw new Error("OPENAI_API_KEY is not configured — cannot sync missing translations");
  }

  const detail = await knowledgeCenterRepository.getBySlug(slug);
  if (!detail) {
    throw new Error(`Knowledge article not found: ${slug}`);
  }

  const missingCodes = listMissingPublishedLanguageCodes(detail);
  if (!missingCodes.length) {
    return {
      slug,
      articleId: detail.id,
      missing: [] as string[],
      translations_synced: detail.translations.filter((item) => item.status === "PUBLISHED").length,
      translation_languages: detail.translations
        .filter((item) => item.status === "PUBLISHED")
        .map((item) => item.language_code),
      errors: [] as string[]
    };
  }

  const sourceTranslation = pickMultilingualSourceTranslation(detail, options?.sourceLanguage);
  if (!sourceTranslation) {
    throw new Error(`No published source translation available for ${slug}`);
  }

  const publishInput = buildPublishUpsertFromDetail(detail, sourceTranslation);
  const resolvedSource = resolveMultilingualSourceTranslation(
    publishInput.translation,
    sourceTranslation
  );
  const base: UpsertKnowledgeArticleInput = {
    ...publishInput,
    translation: {
      ...resolvedSource,
      status: "PUBLISHED"
    }
  };

  logger.info("knowledge.multilingual_missing_sync.started", {
    service: "KnowledgeMultilingualMissingSync",
    slug,
    articleId: detail.id,
    sourceLanguage: resolvedSource.language_code,
    missingCodes
  });

  const multilingual = await syncKnowledgeArticleTranslations({
    base,
    onlyTargetCodes: missingCodes,
    concurrency: 1,
    persist: async (payload) => {
      await persistPublishedTranslation(detail.id, slug, payload, detail.author_name);
    }
  });

  const refreshed = await knowledgeCenterRepository.getById(detail.id);
  if (refreshed) {
    await runKnowledgePublishPipeline(refreshed, multilingual);
  }

  logger.info("knowledge.multilingual_missing_sync.completed", {
    service: "KnowledgeMultilingualMissingSync",
    slug,
    articleId: detail.id,
    translationsSynced: multilingual.translations_synced,
    errors: multilingual.errors.length
  });

  return {
    slug,
    articleId: detail.id,
    missing: missingCodes,
    ...multilingual
  };
}
