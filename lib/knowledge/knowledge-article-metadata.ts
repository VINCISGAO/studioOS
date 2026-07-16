import {
  buildKnowledgeArticlePath,
  knowledgePathPrefixForCode
} from "@/features/knowledge-center/knowledge-center.constants";
import type { PublicKnowledgeArticleDto } from "@/features/knowledge-center/knowledge-center.types";
import { knowledgeExcerptFromBody } from "@/features/knowledge-center/knowledge-seo.heuristics";
import type { Metadata } from "next";

const ORIGIN = "https://vincis.app";
const SITE_NAME = "VINCIS";

export function knowledgeArticlePageTitle(article: PublicKnowledgeArticleDto) {
  const base = article.seo?.seo_title?.trim() || article.title.trim();
  return base.endsWith(`| ${SITE_NAME}`) ? base : `${base} | ${SITE_NAME}`;
}

export function knowledgeArticleMetaDescription(article: PublicKnowledgeArticleDto) {
  return (
    article.seo?.meta_description?.trim() ||
    article.excerpt?.trim() ||
    knowledgeExcerptFromBody(article.body_html || article.body_markdown || "")
  );
}

export function knowledgeArticleOgImage(article: PublicKnowledgeArticleDto) {
  const image = article.seo?.og_image_url?.trim() || article.cover_image_url?.trim();
  return image ? (image.startsWith("http") ? image : `${ORIGIN}${image}`) : undefined;
}

export function buildKnowledgeArticleMetadata(input: {
  article: PublicKnowledgeArticleDto;
  routeSlug: string;
  languageCode: string;
  hreflangLanguages: Record<string, string>;
}): Metadata {
  const { article, languageCode, hreflangLanguages } = input;
  const pathPrefix = knowledgePathPrefixForCode(languageCode);
  const canonical =
    article.seo?.canonical_url?.trim() ||
    `${ORIGIN}${buildKnowledgeArticlePath(pathPrefix, article.slug)}`;
  const title = knowledgeArticlePageTitle(article);
  const description = knowledgeArticleMetaDescription(article);
  const ogTitle = article.seo?.og_title?.trim() || article.title.trim();
  const ogDescription =
    article.seo?.og_description?.trim() || article.seo?.meta_description?.trim() || description;
  const ogImage = knowledgeArticleOgImage(article);
  const keywords = article.seo?.keywords?.length ? article.seo.keywords : undefined;
  const twitterCard = article.seo?.twitter_card === "summary" ? "summary" : "summary_large_image";

  return {
    title: { absolute: title },
    description,
    keywords,
    openGraph: {
      type: "article",
      siteName: SITE_NAME,
      title: ogTitle,
      description: ogDescription,
      url: canonical,
      ...(ogImage ? { images: [{ url: ogImage, alt: article.title }] } : {})
    },
    twitter: {
      card: twitterCard,
      title: ogTitle,
      description: ogDescription,
      ...(ogImage ? { images: [ogImage] } : {})
    },
    alternates: {
      canonical,
      languages: hreflangLanguages
    }
  };
}
