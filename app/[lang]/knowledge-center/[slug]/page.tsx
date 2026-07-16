import { notFound, permanentRedirect } from "next/navigation";
import { KnowledgeCenterShell } from "@/components/knowledge-center/knowledge-center-shell";
import { KnowledgeArticlePage } from "@/components/knowledge/knowledge-article-page";
import {
  buildKnowledgeArticlePath,
  knowledgeCodeForPathPrefix,
  type KnowledgePathPrefix
} from "@/features/knowledge-center/knowledge-center.constants";
import {
  getPublicKnowledgeArticleCached,
  scheduleKnowledgeArticleViewIncrement
} from "@/features/knowledge-center/knowledge-center-public.article";
import { knowledgeCenterService } from "@/features/knowledge-center/knowledge-center.service";
import { buildKnowledgeArticleMetadata } from "@/lib/knowledge/knowledge-article-metadata";
import { toUiLocale } from "@/lib/app-language.shared";
import type { Metadata } from "next";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = { params: Promise<{ lang: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, slug } = await params;
  const languageCode = knowledgeCodeForPathPrefix(lang);
  const article = await getPublicKnowledgeArticleCached(slug, languageCode);
  if (!article) return { title: "Article not found" };

  const hreflangLanguages = await knowledgeCenterService.getArticleHreflangLanguages(
    article.slug,
    languageCode
  );

  return buildKnowledgeArticleMetadata({
    article,
    routeSlug: slug,
    languageCode,
    hreflangLanguages
  });
}

export default async function KnowledgeArticleRoute({ params }: Props) {
  const { lang, slug } = await params;
  const languageCode = knowledgeCodeForPathPrefix(lang);
  const locale = toUiLocale(languageCode);
  const article = await knowledgeCenterService.getPublicArticle(slug, languageCode, { recordView: false });
  if (!article) notFound();

  const canonicalSlug = knowledgeCenterService.resolvePublicArticleRouteSlug(slug, article);
  if (canonicalSlug !== slug) {
    permanentRedirect(buildKnowledgeArticlePath(lang as KnowledgePathPrefix, canonicalSlug));
  }

  scheduleKnowledgeArticleViewIncrement(article.id);

  const jsonLd = knowledgeCenterService.buildPublicArticleJsonLd(article);

  return (
    <KnowledgeCenterShell locale={locale} pathPrefix={lang as KnowledgePathPrefix}>
      <KnowledgeArticlePage locale={locale} article={article} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </KnowledgeCenterShell>
  );
}
