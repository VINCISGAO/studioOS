import { KnowledgeCenterHomePage } from "@/components/knowledge-center/knowledge-center-home-page";
import { KnowledgeCenterShell } from "@/components/knowledge-center/knowledge-center-shell";
import {
  buildKnowledgeIndexPath,
  knowledgeCodeForPathPrefix,
  type KnowledgePathPrefix
} from "@/features/knowledge-center/knowledge-center.constants";
import { loadKnowledgeCenterHomePageData } from "@/features/knowledge-center/knowledge-center-public.service";
import { knowledgeCenterService } from "@/features/knowledge-center/knowledge-center.service";
import {
  buildKnowledgeIndexAlternates,
  knowledgeAlternatesToMetadataLanguages
} from "@/features/knowledge-center/knowledge-hreflang";
import { toUiLocale } from "@/lib/app-language.shared";
import { buildKnowledgeIndexJsonLdGraph } from "@/lib/marketing/structured-data/knowledge-center";
import { JsonLdScript } from "@/lib/marketing/structured-data/json-ld-script";
import type { Metadata } from "next";

const ORIGIN = "https://vincis.app";

type Props = {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ q?: string }>;
};

export const runtime = "nodejs";
export const revalidate = 300;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  const locale = toUiLocale(lang === "zh" ? "zh-CN" : "en");
  const pathPrefix = lang as KnowledgePathPrefix;
  const canonical = `${ORIGIN}${buildKnowledgeIndexPath(pathPrefix)}`;
  const title =
    locale === "zh" ? "VINCIS 知识中心 | VINCIS" : "VINCIS Knowledge Center | VINCIS";
  const description =
    locale === "zh"
      ? "VINCIS 官方知识中心 — AI 广告、视频制作、品牌营销与平台指南。"
      : "Official VINCIS knowledge hub for AI advertising, video production, brand marketing, and platform guides.";

  return {
    title: { absolute: title },
    description,
    openGraph: {
      type: "website",
      siteName: "VINCIS",
      title,
      description,
      url: canonical
    },
    twitter: {
      card: "summary_large_image",
      title,
      description
    },
    alternates: {
      canonical,
      languages: knowledgeAlternatesToMetadataLanguages(buildKnowledgeIndexAlternates())
    }
  };
}

export default async function KnowledgeIndexPage({ params, searchParams }: Props) {
  const { lang } = await params;
  const { q } = await searchParams;
  const languageCode = knowledgeCodeForPathPrefix(lang);
  const locale = toUiLocale(languageCode);
  const pathPrefix = lang as KnowledgePathPrefix;
  const searchQuery = q?.trim() ?? "";
  const { articles, categoryCounts } = await loadKnowledgeCenterHomePageData(languageCode);
  const searchResults = searchQuery
    ? await knowledgeCenterService.searchPublic(searchQuery, languageCode)
    : undefined;
  const schemaArticles = searchQuery
    ? (searchResults ?? []).map((item) => ({ slug: item.slug, title: item.title }))
    : articles.map((item) => ({ slug: item.slug, title: item.title }));

  return (
    <KnowledgeCenterShell locale={locale} pathPrefix={pathPrefix}>
      <JsonLdScript
        data={buildKnowledgeIndexJsonLdGraph({
          pathPrefix,
          locale,
          articles: schemaArticles,
          searchQuery: searchQuery || undefined
        })}
      />
      <KnowledgeCenterHomePage
        locale={locale}
        pathPrefix={pathPrefix}
        languageCode={languageCode}
        articles={articles}
        categoryCounts={categoryCounts}
        searchQuery={searchQuery || undefined}
        searchResults={searchResults}
      />
    </KnowledgeCenterShell>
  );
}
