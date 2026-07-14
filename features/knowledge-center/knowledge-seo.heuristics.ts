import type { KnowledgeFaqInput } from "@/features/knowledge-center/knowledge-center.types";

export type KnowledgeSeoScores = {
  seo_score: number;
  readability_score: number;
  ai_friendly_score: number;
  google_score: number;
  baidu_score: number;
  internal_link_count: number;
  external_link_count: number;
};

function countLinks(markdown: string) {
  const internal = (markdown.match(/\]\(\/(?:en|zh(?:-tw)?|ja|ko|ms|km|th|vi|fr|es)\/resources\//g) ?? []).length;
  const external = (markdown.match(/\]\(https?:\/\//g) ?? []).length;
  return { internal, external };
}

function wordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function estimateReadingTimeMinutes(markdown: string) {
  const words = wordCount(markdown.replace(/[#>*_`[\]()!-]/g, " "));
  return Math.max(1, Math.round(words / 220));
}

export function slugifyKnowledgeTitle(title: string) {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120) || "article";
}

export function computeKnowledgeSeoScores(input: {
  translation: { title: string; subtitle?: string; body_markdown: string; excerpt?: string };
  seo?: { meta_description?: string; ai_summary?: string };
}): KnowledgeSeoScores {
  const { translation, seo } = input;
  const body = translation.body_markdown ?? "";
  const title = translation.title.trim();
  const meta = seo?.meta_description?.trim() ?? translation.excerpt?.trim() ?? "";
  const links = countLinks(body);
  const headings = (body.match(/^#{1,3}\s/mg) ?? []).length;
  const faqHints = (body.match(/\?/g) ?? []).length;
  const hasOg = Boolean(seo);

  let seoScore = 40;
  if (title.length >= 12 && title.length <= 70) seoScore += 15;
  if (meta.length >= 80 && meta.length <= 160) seoScore += 20;
  if (headings >= 2) seoScore += 10;
  if (links.internal >= 1) seoScore += 10;
  if (hasOg) seoScore += 5;

  const readability = clampScore(55 + Math.min(30, headings * 5) + (body.length > 400 ? 10 : 0));
  const aiFriendly = clampScore(
    50 +
      (translation.excerpt || seo?.ai_summary ? 15 : 0) +
      (headings >= 3 ? 15 : 0) +
      (faqHints > 0 ? 10 : 0) +
      (body.length > 600 ? 10 : 0)
  );
  const google = clampScore(seoScore * 0.55 + readability * 0.25 + aiFriendly * 0.2);
  const baidu = clampScore(google - (meta.length < 60 ? 8 : 0) + (title.length <= 30 ? 5 : 0));

  return {
    seo_score: clampScore(seoScore),
    readability_score: readability,
    ai_friendly_score: aiFriendly,
    google_score: google,
    baidu_score: baidu,
    internal_link_count: links.internal,
    external_link_count: links.external
  };
}

function buildArticleNode(input: {
  title: string;
  description: string;
  url: string;
  authorName: string;
  publishedAt?: string | null;
  updatedAt: string;
  imageUrl?: string | null;
  websiteId: string;
  articleId: string;
}) {
  return {
    "@type": "Article",
    "@id": input.articleId,
    headline: input.title,
    description: input.description,
    author: { "@type": "Organization", name: input.authorName },
    publisher: { "@type": "Organization", name: "VINCIS", url: "https://vincis.app" },
    datePublished: input.publishedAt ?? input.updatedAt,
    dateModified: input.updatedAt,
    mainEntityOfPage: { "@id": input.url },
    isPartOf: { "@id": input.websiteId },
    image: input.imageUrl ? [input.imageUrl] : undefined
  };
}

function buildBreadcrumbNode(input: {
  url: string;
  pathPrefix: string;
  title: string;
  categoryName?: string | null;
  categorySlug?: string | null;
  origin?: string;
}) {
  const origin = input.origin ?? "https://vincis.app";
  const items: Array<{ name: string; item: string }> = [
    { name: "VINCIS", item: origin },
    { name: "Knowledge Center", item: `${origin}/${input.pathPrefix}/resources` }
  ];
  if (input.categoryName && input.categorySlug) {
    items.push({
      name: input.categoryName,
      item: `${origin}/${input.pathPrefix}/resources/category/${input.categorySlug}`
    });
  }
  items.push({ name: input.title, item: input.url });

  return {
    "@type": "BreadcrumbList",
    "@id": `${input.url}#breadcrumb`,
    itemListElement: items.map((entry, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: entry.name,
      item: entry.item
    }))
  };
}

function buildOrganizationNode(origin = "https://vincis.app") {
  return {
    "@type": "Organization",
    "@id": `${origin}/#organization`,
    name: "VINCIS",
    url: origin,
    logo: `${origin}/images/LOGO.png`
  };
}

function buildWebsiteNode(origin = "https://vincis.app") {
  return {
    "@type": "WebSite",
    "@id": `${origin}/#website`,
    url: origin,
    name: "VINCIS",
    publisher: { "@id": `${origin}/#organization` }
  };
}

function buildFaqNode(faqs: KnowledgeFaqInput[]) {
  return {
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer }
    }))
  };
}

/** Organization + WebSite + Article + Breadcrumb (+ optional FAQPage) JSON-LD graph. */
export function buildKnowledgeJsonLd(input: {
  title: string;
  description: string;
  url: string;
  authorName: string;
  publishedAt?: string | null;
  updatedAt: string;
  imageUrl?: string | null;
  pathPrefix?: string;
  categoryName?: string | null;
  categorySlug?: string | null;
  origin?: string;
  faqs?: KnowledgeFaqInput[];
}) {
  const origin = input.origin ?? "https://vincis.app";
  const websiteId = `${origin}/#website`;
  const articleId = `${input.url}#article`;
  const pathPrefix = input.pathPrefix ?? "en";

  const graph: Record<string, unknown>[] = [
    buildOrganizationNode(origin),
    buildWebsiteNode(origin),
    buildArticleNode({
      title: input.title,
      description: input.description,
      url: input.url,
      authorName: input.authorName,
      publishedAt: input.publishedAt,
      updatedAt: input.updatedAt,
      imageUrl: input.imageUrl,
      websiteId,
      articleId
    }),
    buildBreadcrumbNode({
      url: input.url,
      pathPrefix,
      title: input.title,
      categoryName: input.categoryName,
      categorySlug: input.categorySlug,
      origin
    })
  ];

  if (input.faqs?.length) {
    graph.push(buildFaqNode(input.faqs));
  }

  return { "@context": "https://schema.org", "@graph": graph };
}

/** @deprecated Use buildKnowledgeJsonLd */
export function buildArticleJsonLd(input: {
  title: string;
  description: string;
  url: string;
  authorName: string;
  publishedAt?: string | null;
  updatedAt: string;
  imageUrl?: string | null;
}) {
  return buildKnowledgeJsonLd(input);
}
