import "server-only";

import { revalidatePath } from "next/cache";
import {
  buildKnowledgeArticlePath,
  KNOWLEDGE_LANGUAGE_OPTIONS,
  knowledgePathPrefixForCode
} from "@/features/knowledge-center/knowledge-center.constants";
import { knowledgeLucienSyncService } from "@/features/knowledge-center/knowledge-lucien-sync.service";
import type { KnowledgeArticleDetailDto } from "@/features/knowledge-center/knowledge-center.types";

export const KNOWLEDGE_PUBLISH_STEPS = [
  "article_page",
  "category_index",
  "search_index",
  "schema_org",
  "sitemap",
  "rss",
  "llms_txt",
  "lucien_learning",
  "cache_revalidated"
] as const;

export type KnowledgePublishStep = (typeof KNOWLEDGE_PUBLISH_STEPS)[number];

export type KnowledgePublishPipelineResult = {
  published: boolean;
  steps: KnowledgePublishStep[];
  lucien_synced: number;
  public_urls: string[];
};

export type KnowledgeSaveResult = {
  article: KnowledgeArticleDetailDto | null;
  pipeline?: KnowledgePublishPipelineResult;
};

function isPublishedArticle(detail: KnowledgeArticleDetailDto) {
  return (
    detail.status === "PUBLISHED" ||
    detail.translations.some((translation) => translation.status === "PUBLISHED")
  );
}

export async function runKnowledgePublishPipeline(
  detail: KnowledgeArticleDetailDto
): Promise<KnowledgePublishPipelineResult> {
  const steps: KnowledgePublishStep[] = [];
  const publicUrls: string[] = [];

  if (!isPublishedArticle(detail)) {
    return { published: false, steps, lucien_synced: 0, public_urls: publicUrls };
  }

  steps.push("article_page", "search_index", "schema_org");

  let lucienSynced = 0;
  for (const translation of detail.translations) {
    if (translation.status !== "PUBLISHED") continue;

    if (translation.lucien?.lucien_learning) {
      const result = await knowledgeLucienSyncService.syncTranslation({
        slug: detail.slug,
        translation,
        categoryName: detail.category_name
      });
      lucienSynced += result.synced;
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

  revalidatePath("/sitemap.xml");
  steps.push("sitemap");

  revalidatePath("/feed.xml");
  for (const lang of KNOWLEDGE_LANGUAGE_OPTIONS) {
    revalidatePath(`/${lang.pathPrefix}/resources/rss.xml`);
  }
  steps.push("rss");

  revalidatePath("/llms.txt");
  steps.push("llms_txt");

  revalidatePath("/api/v1/knowledge/search");
  steps.push("cache_revalidated");

  return {
    published: true,
    steps: [...new Set(steps)],
    lucien_synced: lucienSynced,
    public_urls: publicUrls
  };
}
