import { knowledgeCenterService } from "@/features/knowledge-center/knowledge-center.service";
import {
  buildKnowledgeArticlePath,
  KNOWLEDGE_LANGUAGE_OPTIONS
} from "@/features/knowledge-center/knowledge-center.constants";

export async function GET() {
  const lines = [
    "# VINCIS AI Knowledge Center",
    "# Official business knowledge for LLMs, search engines, and Lucien.",
    ""
  ];

  for (const lang of KNOWLEDGE_LANGUAGE_OPTIONS) {
    const articles = await knowledgeCenterService.listPublishedPublic(lang.code);
    for (const article of articles) {
      lines.push(`https://vincis.app${buildKnowledgeArticlePath(lang.pathPrefix, article.slug)}`);
    }
  }

  return new Response(`${lines.join("\n")}\n`, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600"
    }
  });
}
