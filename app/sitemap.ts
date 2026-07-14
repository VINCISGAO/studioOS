import { knowledgeCenterService } from "@/features/knowledge-center/knowledge-center.service";
import {
  buildKnowledgeArticlePath,
  KNOWLEDGE_LANGUAGE_OPTIONS
} from "@/features/knowledge-center/knowledge-center.constants";

const ORIGIN = "https://vincis.app";

export default async function sitemap() {
  const entries: Array<{ url: string; lastModified?: Date; changeFrequency: "weekly"; priority: number }> = [
    { url: `${ORIGIN}/`, changeFrequency: "weekly", priority: 1 }
  ];

  for (const lang of KNOWLEDGE_LANGUAGE_OPTIONS) {
    entries.push({
      url: `${ORIGIN}/${lang.pathPrefix}/resources`,
      changeFrequency: "weekly",
      priority: 0.8
    });

    const articles = await knowledgeCenterService.listPublishedPublic(lang.code);
    for (const article of articles) {
      entries.push({
        url: `${ORIGIN}${buildKnowledgeArticlePath(lang.pathPrefix, article.slug)}`,
        lastModified: new Date(article.updated_at),
        changeFrequency: "weekly",
        priority: 0.7
      });
    }
  }

  return entries;
}
