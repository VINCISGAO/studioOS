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
import { buildKnowledgeIndexJsonLdGraph } from "@/lib/marketing/structured-data/knowledge-center";
import { knowledgeCenterHomeCopy } from "@/lib/knowledge/knowledge-center-home-copy";
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
  const languageCode = knowledgeCodeForPathPrefix(lang);
  const copy = knowledgeCenterHomeCopy(languageCode);
  const pathPrefix = lang as KnowledgePathPrefix;
  const canonical = `${ORIGIN}${buildKnowledgeIndexPath(pathPrefix)}`;

  return {
    title: { absolute: copy.indexPageTitle },
    description: copy.indexPageDescription,
    openGraph: {
      type: "website",
      siteName: "VINCIS",
      title: copy.indexPageTitle,
      description: copy.indexPageDescription,
      url: canonical
    },
    twitter: {
      card: "summary_large_image",
      title: copy.indexPageTitle,
      description: copy.indexPageDescription
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
    <KnowledgeCenterShell locale={languageCode} pathPrefix={pathPrefix}>
      <JsonLdScript
        data={buildKnowledgeIndexJsonLdGraph({
          pathPrefix,
          locale: languageCode,
          articles: schemaArticles,
          searchQuery: searchQuery || undefined
        })}
      />
      <KnowledgeCenterHomePage
        locale={languageCode}
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
