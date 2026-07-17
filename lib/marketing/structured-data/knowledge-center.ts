import {
  buildKnowledgeArticlePath,
  buildKnowledgeCategoryPath,
  buildKnowledgeIndexPath,
  type KnowledgePathPrefix
} from "@/features/knowledge-center/knowledge-center.constants";
import { VINCIS_SITE_ORIGIN, buildOrganizationGraphNode } from "@/lib/marketing/organization-schema";
import { buildBreadcrumbJsonLd } from "@/lib/marketing/structured-data/breadcrumb";
import { buildWebsiteGraphNode } from "@/lib/marketing/structured-data/website";

type KnowledgeSchemaArticle = {
  slug: string;
  title: string;
};

function buildArticleItemList(
  articles: KnowledgeSchemaArticle[],
  pathPrefix: KnowledgePathPrefix,
  origin: string
) {
  return {
    "@type": "ItemList",
    itemListElement: articles.slice(0, 24).map((article, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: article.title,
      url: `${origin}${buildKnowledgeArticlePath(pathPrefix, article.slug)}`
    }))
  };
}

export function buildKnowledgeIndexJsonLdGraph(options: {
  pathPrefix: KnowledgePathPrefix;
  locale: "en" | "zh";
  articles: KnowledgeSchemaArticle[];
  searchQuery?: string;
  origin?: typeof VINCIS_SITE_ORIGIN;
}) {
  const origin = options.origin ?? VINCIS_SITE_ORIGIN;
  const indexPath = buildKnowledgeIndexPath(options.pathPrefix);
  const indexUrl = `${origin}${indexPath}`;
  const indexName = options.locale === "zh" ? "VINCIS 知识中心" : "VINCIS Knowledge Center";
  const trimmedQuery = options.searchQuery?.trim();

  const collectionPage: Record<string, unknown> = {
    "@type": "CollectionPage",
    "@id": `${indexUrl}#collection`,
    name: trimmedQuery
      ? options.locale === "zh"
        ? `搜索「${trimmedQuery}」`
        : `Search results for "${trimmedQuery}"`
      : indexName,
    url: trimmedQuery ? `${indexUrl}?q=${encodeURIComponent(trimmedQuery)}` : indexUrl,
    isPartOf: { "@id": `${origin}/#website` },
    publisher: { "@id": `${origin}/#organization` }
  };

  if (options.articles.length > 0) {
    collectionPage.mainEntity = buildArticleItemList(options.articles, options.pathPrefix, origin);
  }

  return {
    "@context": "https://schema.org",
    "@graph": [
      buildOrganizationGraphNode(origin),
      buildWebsiteGraphNode(origin, options.pathPrefix),
      buildBreadcrumbJsonLd(
        [
          { name: "Home", path: "/" },
          { name: indexName, path: indexPath }
        ],
        origin
      ),
      collectionPage
    ]
  };
}

export function buildKnowledgeCategoryJsonLdGraph(options: {
  pathPrefix: KnowledgePathPrefix;
  categorySlug: string;
  categoryName: string;
  articles: KnowledgeSchemaArticle[];
  origin?: typeof VINCIS_SITE_ORIGIN;
}) {
  const origin = options.origin ?? VINCIS_SITE_ORIGIN;
  const indexPath = buildKnowledgeIndexPath(options.pathPrefix);
  const categoryPath = buildKnowledgeCategoryPath(options.pathPrefix, options.categorySlug);
  const categoryUrl = `${origin}${categoryPath}`;
  const indexName = "VINCIS Knowledge Center";

  const collectionPage: Record<string, unknown> = {
    "@type": "CollectionPage",
    "@id": `${categoryUrl}#collection`,
    name: options.categoryName,
    url: categoryUrl,
    isPartOf: { "@id": `${origin}/#website` },
    publisher: { "@id": `${origin}/#organization` }
  };

  if (options.articles.length > 0) {
    collectionPage.mainEntity = buildArticleItemList(options.articles, options.pathPrefix, origin);
  }

  return {
    "@context": "https://schema.org",
    "@graph": [
      buildOrganizationGraphNode(origin),
      buildWebsiteGraphNode(origin, options.pathPrefix),
      buildBreadcrumbJsonLd(
        [
          { name: "Home", path: "/" },
          { name: indexName, path: indexPath },
          { name: options.categoryName, path: categoryPath }
        ],
        origin
      ),
      collectionPage
    ]
  };
}
