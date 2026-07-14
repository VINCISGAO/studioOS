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
  const internal = (markdown.match(/\]\(\/(?:en|zh|ja|ko|th|vi|fr|es)\/resources\//g) ?? []).length;
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
}) {
  return {
    "@type": "Article",
    headline: input.title,
    description: input.description,
    author: { "@type": "Organization", name: input.authorName },
    publisher: { "@type": "Organization", name: "VINCIS", url: "https://vincis.app" },
    datePublished: input.publishedAt ?? input.updatedAt,
    dateModified: input.updatedAt,
    mainEntityOfPage: input.url,
    image: input.imageUrl ? [input.imageUrl] : undefined
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

/** Article + optional FAQPage JSON-LD for publish pipeline. */
export function buildKnowledgeJsonLd(input: {
  title: string;
  description: string;
  url: string;
  authorName: string;
  publishedAt?: string | null;
  updatedAt: string;
  imageUrl?: string | null;
  faqs?: KnowledgeFaqInput[];
}) {
  const article = buildArticleNode(input);
  if (!input.faqs?.length) {
    return { "@context": "https://schema.org", ...article };
  }
  return {
    "@context": "https://schema.org",
    "@graph": [article, buildFaqNode(input.faqs)]
  };
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
