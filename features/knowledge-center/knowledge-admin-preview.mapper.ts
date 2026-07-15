import "server-only";

import {
  buildKnowledgeArticlePath,
  knowledgePathPrefixForCode
} from "@/features/knowledge-center/knowledge-center.constants";
import { enrichPublicKnowledgeArticle } from "@/features/knowledge-center/knowledge-article-enrichment";
import type { Locale } from "@/lib/i18n";
import { pickKnowledgeAdminTranslation } from "@/lib/knowledge/knowledge-admin-translation";
import {
  rewriteKnowledgeAssetUrl,
  rewriteKnowledgeHtmlAssetUrls
} from "@/lib/knowledge/knowledge-asset-urls";
import type {
  KnowledgeArticleDetailDto,
  PublicKnowledgeArticleDto
} from "@/features/knowledge-center/knowledge-center.types";

const ORIGIN = "https://vincis.app";

export async function toAdminPreviewArticle(
  detail: KnowledgeArticleDetailDto,
  languageCode?: string,
  adminLocale?: Locale
): Promise<PublicKnowledgeArticleDto | null> {
  const translation =
    pickKnowledgeAdminTranslation(detail.translations, {
      preferredLanguageCode: languageCode,
      adminLocale
    }) ?? detail.translations[0];
  if (!translation) return null;

  const pathPrefix = knowledgePathPrefixForCode(translation.language_code);
  const canonical = `${ORIGIN}${buildKnowledgeArticlePath(pathPrefix, detail.slug)}`;
  const seo = translation.seo;

  const article: PublicKnowledgeArticleDto = {
    id: detail.id,
    slug: detail.slug,
    language_code: translation.language_code,
    path_prefix: pathPrefix,
    title: translation.title,
    subtitle: translation.subtitle,
    body_html: rewriteKnowledgeHtmlAssetUrls(translation.body_html),
    body_markdown: translation.body_markdown,
    excerpt: translation.excerpt,
    reading_time_minutes: translation.reading_time_minutes,
    author_name: detail.author_name,
    cover_image_url: rewriteKnowledgeAssetUrl(detail.cover_image_url),
    category_name: detail.category_name,
    category_slug: detail.category_slug,
    updated_at: translation.updated_at,
    published_at: translation.published_at ?? detail.published_at,
    seo: seo
      ? {
          seo_title: seo.seo_title,
          meta_description: seo.meta_description,
          canonical_url: seo.canonical_url ?? canonical,
          keywords: seo.keywords,
          og_title: seo.og_title,
          og_description: seo.og_description,
          og_image_url: rewriteKnowledgeAssetUrl(seo.og_image_url),
          twitter_card: seo.twitter_card,
          seo_score: seo.seo_score,
          readability_score: seo.readability_score,
          ai_friendly_score: seo.ai_friendly_score,
          google_score: seo.google_score,
          baidu_score: seo.baidu_score,
          internal_link_count: seo.internal_link_count,
          external_link_count: seo.external_link_count
        }
      : null,
    faqs: translation.faqs,
    schema_json_ld: null,
    related: []
  };

  return enrichPublicKnowledgeArticle(article);
}
