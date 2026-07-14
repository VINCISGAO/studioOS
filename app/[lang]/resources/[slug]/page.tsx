import { notFound } from "next/navigation";
import { MarketingDocsShell } from "@/components/marketing/docs/marketing-docs-shell";
import { KnowledgeArticlePage } from "@/components/knowledge/knowledge-article-page";
import {
  buildKnowledgeArticlePath,
  knowledgeCodeForPathPrefix,
  knowledgePathPrefixForCode
} from "@/features/knowledge-center/knowledge-center.constants";
import { knowledgeCenterService } from "@/features/knowledge-center/knowledge-center.service";
import { toUiLocale } from "@/lib/app-language.shared";
import type { Metadata } from "next";

const ORIGIN = "https://vincis.app";

type Props = { params: Promise<{ lang: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, slug } = await params;
  const languageCode = knowledgeCodeForPathPrefix(lang);
  const article = await knowledgeCenterService.getPublicArticle(slug, languageCode, { recordView: false });
  if (!article) return { title: "Article not found" };

  const pathPrefix = knowledgePathPrefixForCode(languageCode);
  const canonical = article.seo?.canonical_url ?? `${ORIGIN}${buildKnowledgeArticlePath(pathPrefix, slug)}`;
  const hreflangLanguages = await knowledgeCenterService.getArticleHreflangLanguages(slug, languageCode);

  return {
    title: article.seo?.seo_title ?? article.title,
    description: article.seo?.meta_description ?? article.excerpt ?? undefined,
    openGraph: {
      title: article.seo?.og_title ?? article.title,
      description: article.seo?.og_description ?? article.seo?.meta_description ?? undefined,
      images: article.seo?.og_image_url ? [article.seo.og_image_url] : undefined,
      url: canonical
    },
    alternates: {
      canonical,
      languages: hreflangLanguages
    }
  };
}

export default async function KnowledgeArticleRoute({ params }: Props) {
  const { lang, slug } = await params;
  const languageCode = knowledgeCodeForPathPrefix(lang);
  const locale = toUiLocale(languageCode);
  const article = await knowledgeCenterService.getPublicArticle(slug, languageCode);
  if (!article) notFound();

  const jsonLd = knowledgeCenterService.buildPublicArticleJsonLd(article);

  return (
    <MarketingDocsShell locale={locale} active="resources">
      <KnowledgeArticlePage locale={locale} article={article} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </MarketingDocsShell>
  );
}
