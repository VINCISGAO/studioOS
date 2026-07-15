import { notFound } from "next/navigation";
import { KnowledgeCenterShell } from "@/components/knowledge-center/knowledge-center-shell";
import { KnowledgeArticlePage } from "@/components/knowledge/knowledge-article-page";
import {
  buildKnowledgeArticlePath,
  knowledgeCodeForPathPrefix,
  knowledgePathPrefixForCode,
  type KnowledgePathPrefix
} from "@/features/knowledge-center/knowledge-center.constants";
import {
  getPublicKnowledgeArticleCached,
  scheduleKnowledgeArticleViewIncrement
} from "@/features/knowledge-center/knowledge-center-public.article";
import { knowledgeCenterService } from "@/features/knowledge-center/knowledge-center.service";
import { toUiLocale } from "@/lib/app-language.shared";
import type { Metadata } from "next";

const ORIGIN = "https://vincis.app";

export const runtime = "nodejs";
export const revalidate = 300;

type Props = { params: Promise<{ lang: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, slug } = await params;
  const languageCode = knowledgeCodeForPathPrefix(lang);
  const article = await getPublicKnowledgeArticleCached(slug, languageCode);
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
  const article = await getPublicKnowledgeArticleCached(slug, languageCode);
  if (!article) notFound();

  scheduleKnowledgeArticleViewIncrement(article.id);

  const jsonLd = knowledgeCenterService.buildPublicArticleJsonLd(article);

  return (
    <KnowledgeCenterShell locale={locale} pathPrefix={lang as KnowledgePathPrefix}>
      <KnowledgeArticlePage locale={locale} article={article} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </KnowledgeCenterShell>
  );
}
