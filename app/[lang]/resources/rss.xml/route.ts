import { knowledgeCenterService } from "@/features/knowledge-center/knowledge-center.service";
import {
  buildKnowledgeArticlePath,
  knowledgeCodeForPathPrefix
} from "@/features/knowledge-center/knowledge-center.constants";
import { articleToRssItem, buildKnowledgeRssXml } from "@/lib/knowledge/knowledge-rss";
import { notFound } from "next/navigation";

const ORIGIN = "https://vincis.app";

type Props = { params: Promise<{ lang: string }> };

export async function GET(_request: Request, { params }: Props) {
  const { lang } = await params;
  const languageCode = knowledgeCodeForPathPrefix(lang);
  const articles = await knowledgeCenterService.listPublishedPublic(languageCode);

  const xml = buildKnowledgeRssXml({
    title: lang === "zh" ? "VINCIS 知识中心" : "VINCIS Knowledge Center",
    link: `${ORIGIN}/${lang}/resources`,
    description:
      lang === "zh"
        ? "VINCIS 官方 AI 广告知识库。"
        : "Official VINCIS AI advertising knowledge base.",
    language: languageCode,
    items: articles.map((article) =>
      articleToRssItem(
        article,
        ORIGIN,
        buildKnowledgeArticlePath(lang as "en" | "zh", article.slug),
        article.category
      )
    )
  });

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600"
    }
  });
}
