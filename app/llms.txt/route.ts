import { knowledgeCenterService } from "@/features/knowledge-center/knowledge-center.service";
import { KNOWLEDGE_LANGUAGE_OPTIONS } from "@/features/knowledge-center/knowledge-center.constants";
import { buildKnowledgeLlmsTxtDocument } from "@/lib/knowledge/knowledge-llms-document";

export async function GET() {
  const articlesByLanguage = await Promise.all(
    KNOWLEDGE_LANGUAGE_OPTIONS.map(async (lang) => {
      if (!knowledgeCenterService.isAvailable()) {
        return { lang, articles: [] as Awaited<ReturnType<typeof knowledgeCenterService.listPublishedPublic>> };
      }
      try {
        return {
          lang,
          articles: await knowledgeCenterService.listPublishedPublic(lang.code)
        };
      } catch {
        return { lang, articles: [] as Awaited<ReturnType<typeof knowledgeCenterService.listPublishedPublic>> };
      }
    })
  );

  const body = buildKnowledgeLlmsTxtDocument({ articlesByLanguage });

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600"
    }
  });
}
