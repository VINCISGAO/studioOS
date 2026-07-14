import { knowledgeCenterService } from "@/features/knowledge-center/knowledge-center.service";
import {
  buildKnowledgeArticlePath,
  buildKnowledgeIndexPath,
  KNOWLEDGE_LANGUAGE_OPTIONS
} from "@/features/knowledge-center/knowledge-center.constants";
import { articleToRssItem, buildKnowledgeRssXml } from "@/lib/knowledge/knowledge-rss";

const ORIGIN = "https://vincis.app";

export async function GET() {
  const items = [];
  for (const lang of KNOWLEDGE_LANGUAGE_OPTIONS) {
    const articles = await knowledgeCenterService.listPublishedPublic(lang.code);
    for (const article of articles) {
      items.push(
        articleToRssItem(
          article,
          ORIGIN,
          buildKnowledgeArticlePath(lang.pathPrefix, article.slug),
          article.category
        )
      );
    }
  }

  const xml = buildKnowledgeRssXml({
    title: "VINCIS Knowledge Center",
    link: `${ORIGIN}${buildKnowledgeIndexPath("en")}`,
    description: "Official AI advertising knowledge from VINCIS.",
    language: "en",
    items: items.slice(0, 50)
  });

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600"
    }
  });
}
