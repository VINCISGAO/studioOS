import "server-only";

import { asInputJson } from "@/lib/core/prisma-json";
import { prisma } from "@/lib/core/database/prisma";
import {
  curatedFaqsForLanguage,
  curatedRelatedMeta,
  type AiAdvertisingClusterSlug
} from "@/lib/knowledge/knowledge-ai-advertising-cluster";
import {
  buildKnowledgeJsonLd,
  computeKnowledgeSeoScores,
  estimateReadingTimeMinutes
} from "@/features/knowledge-center/knowledge-seo.heuristics";

const ORIGIN = "https://vincis.app";

type SeedArticle = {
  slug: AiAdvertisingClusterSlug;
  title: string;
  subtitle: string;
  excerpt: string;
  body: string;
  includeFaqs?: boolean;
};

const EN_ARTICLES: SeedArticle[] = [
  {
    slug: "what-is-ai-advertising",
    title: "What Is AI Advertising?",
    subtitle: "How brands use AI to produce, test, and scale modern campaigns",
    excerpt:
      "AI advertising combines generative production, performance feedback, and human creative direction to ship campaigns faster.",
    includeFaqs: true,
    body: `## A practical definition

AI advertising is the use of machine learning and generative tools to plan, produce, test, and optimize ad creative. It does not remove strategy. It removes production friction.

## Why brands adopt it now

- Short-form platforms demand constant creative refresh
- Global campaigns need multilingual variants quickly
- Performance teams need faster iteration loops

## What good looks like

Strong AI advertising still includes brand governance, reference quality, and a review workflow. VINCIS connects brands with vetted AI-native creators so campaigns move from brief to approved delivery in one system.

## Related topics

Explore how AI video compares to traditional production, how to build TikTok-ready ads, and how AI creative studios operate at scale.`
  },
  {
    slug: "ai-video-ads-vs-traditional-production",
    title: "AI Video Ads vs Traditional Production",
    subtitle: "Speed, cost, and quality trade-offs for modern brand teams",
    excerpt: "When AI-native production wins, when traditional shoots still matter, and how to choose.",
    body: `## The core trade-off

Traditional production optimizes for cinematic craft. AI-native production optimizes for iteration speed and variant volume.

## Where AI video ads win

- Rapid concept testing on TikTok, Reels, and Shorts
- Multilingual cut-downs from one master brief
- Performance creative that needs weekly refreshes

## Where traditional production still wins

- Hero brand films with complex location work
- Campaigns requiring precise talent and wardrobe control
- Long-form storytelling with strict compliance review

## A hybrid model

Most global brands now blend both: traditional for flagship assets, AI-native studios for always-on performance creative.`
  },
  {
    slug: "how-to-create-high-converting-tiktok-ai-ads",
    title: "How to Create High-Converting TikTok AI Ads",
    subtitle: "Hooks, pacing, and iteration patterns for performance creative",
    excerpt: "A repeatable workflow for TikTok ads that feel native and convert.",
    body: `## Start with a reference, not a blank page

Pick one high-performing ad in your category. Break it into hook, proof, offer, and CTA. Your first AI draft should improve one variable at a time.

## Build for native pacing

- Open with motion in the first second
- Use captions for silent autoplay
- Keep one message per scene

## Iterate with review feedback

Publish V1 quickly, collect brand review notes, and ship V2 within days. Conversion lifts usually come from iteration volume, not one perfect first cut.`
  },
  {
    slug: "what-is-an-ai-creative-studio",
    title: "What Is an AI Creative Studio?",
    subtitle: "Human direction plus AI tooling at production scale",
    excerpt: "How AI creative studios differ from freelancers, agencies, and pure AI tools.",
    body: `## Not just software

An AI creative studio combines production systems, creator talent, and brand-safe review workflows. The studio is accountable for delivery quality.

## What clients get

- Brief-to-delivery production management
- AI-assisted editing and variant generation
- Escrow-backed collaboration and revision rounds

## Why platforms matter

Point tools generate clips. Studios deliver campaign-ready assets with governance, timelines, and measurable iteration.`
  },
  {
    slug: "how-ai-is-changing-global-advertising",
    title: "How AI Is Changing Global Advertising",
    subtitle: "From agency-only workflows to AI-native global collaboration",
    excerpt: "Why marketing leaders are restructuring creative operations around AI-native production.",
    body: `## Global pressure points

Teams must localize faster, test more variants, and control spend without slowing brand quality.

## Structural shift

- In-house teams own strategy and governance
- AI-native creators execute high-volume production
- Platforms coordinate matching, payment, and review

## The outcome

Global advertising becomes less about one big annual shoot and more about continuous creative operations.`
  }
];

const ZH_ARTICLES: Array<SeedArticle & { languageCode: "zh-CN" }> = EN_ARTICLES.map((article) => {
  const meta = curatedRelatedMeta(article.slug, "zh-CN");
  return {
    ...article,
    languageCode: "zh-CN" as const,
    title: meta.title,
    subtitle: article.slug === "what-is-ai-advertising" ? "品牌如何用 AI 制作、测试并规模化现代广告" : article.subtitle,
    excerpt: meta.excerpt,
    includeFaqs: article.includeFaqs
  };
});

  async function getAiCategoryId() {
  const category = await prisma.knowledgeCategory.findUnique({ where: { slug: "ai-advertising" } });
  return category?.id ?? null;
}

async function upsertSeedTranslation(
  articleId: string,
  slug: string,
  languageCode: string,
  article: SeedArticle,
  categoryName: string | null
) {
  const pathPrefix = languageCode === "zh-CN" ? "zh" : "en";
  const url = `${ORIGIN}/${pathPrefix}/resources/${slug}`;
  const seoScores = computeKnowledgeSeoScores({
    translation: {
      title: article.title,
      subtitle: article.subtitle,
      body_markdown: article.body,
      excerpt: article.excerpt
    },
    seo: { meta_description: article.excerpt }
  });
  const readingTimeMinutes = estimateReadingTimeMinutes(article.body);
  const faqs = article.includeFaqs ? curatedFaqsForLanguage(languageCode) : [];
  const jsonLd = buildKnowledgeJsonLd({
    title: article.title,
    description: article.excerpt,
    url,
    authorName: "VINCIS",
    publishedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    pathPrefix,
    categoryName,
    categorySlug: "ai-advertising",
    origin: ORIGIN,
    faqs
  });

  const translation = await prisma.knowledgeTranslation.upsert({
    where: { articleId_languageCode: { articleId, languageCode } },
    create: {
      articleId,
      languageCode,
      title: article.title,
      subtitle: article.subtitle,
      bodyMarkdown: article.body,
      bodyHtml: article.body.includes("<") ? article.body : "",
      excerpt: article.excerpt,
      readingTimeMinutes,
      status: "PUBLISHED",
      publishedAt: new Date()
    },
    update: {
      title: article.title,
      subtitle: article.subtitle,
      bodyMarkdown: article.body,
      bodyHtml: article.body.includes("<") ? article.body : "",
      excerpt: article.excerpt,
      readingTimeMinutes,
      status: "PUBLISHED",
      publishedAt: new Date()
    }
  });

  await prisma.knowledgeSeo.upsert({
    where: { translationId: translation.id },
    create: {
      translationId: translation.id,
      seoTitle: article.title,
      metaDescription: article.excerpt,
      canonicalUrl: url,
      ogTitle: article.title,
      ogDescription: article.excerpt,
      twitterCard: "summary_large_image",
      seoScore: seoScores.seo_score,
      readabilityScore: seoScores.readability_score,
      aiFriendlyScore: seoScores.ai_friendly_score,
      googleScore: seoScores.google_score,
      baiduScore: seoScores.baidu_score,
      internalLinkCount: seoScores.internal_link_count,
      externalLinkCount: seoScores.external_link_count
    },
    update: {
      seoTitle: article.title,
      metaDescription: article.excerpt,
      canonicalUrl: url,
      ogTitle: article.title,
      ogDescription: article.excerpt,
      seoScore: seoScores.seo_score,
      readabilityScore: seoScores.readability_score,
      aiFriendlyScore: seoScores.ai_friendly_score,
      googleScore: seoScores.google_score,
      baiduScore: seoScores.baidu_score,
      internalLinkCount: seoScores.internal_link_count,
      externalLinkCount: seoScores.external_link_count
    }
  });

  await prisma.knowledgeFaq.deleteMany({ where: { translationId: translation.id } });
  if (faqs.length) {
    await prisma.knowledgeFaq.createMany({
      data: faqs.map((faq, index) => ({
        translationId: translation.id,
        question: faq.question,
        answer: faq.answer,
        sortOrder: faq.sort_order ?? index
      }))
    });
  }

  await prisma.knowledgeSchema.upsert({
    where: { translationId: translation.id },
    create: { translationId: translation.id, schemaType: "ARTICLE", jsonLd: asInputJson(jsonLd) },
    update: { schemaType: "ARTICLE", jsonLd: asInputJson(jsonLd) }
  });

  await prisma.knowledgeSearchIndex.upsert({
    where: { translationId: translation.id },
    create: {
      translationId: translation.id,
      searchText: [article.title, article.subtitle, article.excerpt, article.body.slice(0, 3000)].join("\n")
    },
    update: {
      searchText: [article.title, article.subtitle, article.excerpt, article.body.slice(0, 3000)].join("\n")
    }
  });
}

export async function ensureKnowledgeArticleSeeds() {
  const categoryId = await getAiCategoryId();
  if (!categoryId) return;

  for (const article of EN_ARTICLES) {
    const row = await prisma.knowledgeArticle.upsert({
      where: { slug: article.slug },
      create: {
        slug: article.slug,
        status: "PUBLISHED",
        authorName: "VINCIS",
        publishedAt: new Date(),
        categoryId
      },
      update: {
        status: "PUBLISHED",
        categoryId
      }
    });

    await prisma.knowledgeAnalytics.upsert({
      where: { articleId: row.id },
      create: { articleId: row.id },
      update: {}
    });

    await upsertSeedTranslation(row.id, article.slug, "en", article, "AI Advertising");
    const zhArticle = ZH_ARTICLES.find((item) => item.slug === article.slug);
    if (zhArticle) {
      await upsertSeedTranslation(row.id, article.slug, "zh-CN", zhArticle, "AI Advertising");
    }
  }
}
