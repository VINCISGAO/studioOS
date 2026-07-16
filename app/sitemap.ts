import { knowledgeCenterService } from "@/features/knowledge-center/knowledge-center.service";
import {
  buildKnowledgeArticlePath,
  buildKnowledgeCategoryPath,
  buildKnowledgeIndexPath,
  KNOWLEDGE_LANGUAGE_OPTIONS
} from "@/features/knowledge-center/knowledge-center.constants";

const ORIGIN = "https://vincis.app";

export default async function sitemap() {
  const entries: Array<{ url: string; lastModified?: Date; changeFrequency: "weekly"; priority: number }> = [
    { url: `${ORIGIN}/`, changeFrequency: "weekly", priority: 1 }
  ];

  if (!knowledgeCenterService.isAvailable()) {
    return entries;
  }

  for (const lang of KNOWLEDGE_LANGUAGE_OPTIONS) {
    entries.push({
      url: `${ORIGIN}${buildKnowledgeIndexPath(lang.pathPrefix)}`,
      changeFrequency: "weekly",
      priority: 0.8
    });

    try {
      const categories = await knowledgeCenterService.listCategorySummaries(lang.code);
      for (const category of categories) {
        entries.push({
          url: `${ORIGIN}${buildKnowledgeCategoryPath(lang.pathPrefix, category.slug)}`,
          changeFrequency: "weekly",
          priority: 0.65
        });
      }

      const articles = await knowledgeCenterService.listPublishedPublic(lang.code);
      for (const article of articles) {
        entries.push({
          url: `${ORIGIN}${buildKnowledgeArticlePath(lang.pathPrefix, article.slug)}`,
          lastModified: new Date(article.updated_at),
          changeFrequency: "weekly",
          priority: 0.7
        });
      }
    } catch {
      // Knowledge tables may be unavailable during local builds without migrations.
      continue;
    }
  }

  return entries;
}
