import type { KnowledgeFaqInput } from "@/features/knowledge-center/knowledge-center.types";

export const AI_ADVERTISING_CLUSTER_SLUGS = [
  "what-is-ai-advertising",
  "ai-video-ads-vs-traditional-production",
  "how-to-create-high-converting-tiktok-ai-ads",
  "what-is-an-ai-creative-studio",
  "how-ai-is-changing-global-advertising"
] as const;

export type AiAdvertisingClusterSlug = (typeof AI_ADVERTISING_CLUSTER_SLUGS)[number];

const EN_RELATED: Record<AiAdvertisingClusterSlug, { title: string; excerpt: string }> = {
  "what-is-ai-advertising": {
    title: "What Is AI Advertising?",
    excerpt: "A practical guide to how brands use AI for creative production, targeting, and campaign velocity."
  },
  "ai-video-ads-vs-traditional-production": {
    title: "AI Video Ads vs Traditional Production",
    excerpt: "Compare cost, speed, quality control, and when each production model wins."
  },
  "how-to-create-high-converting-tiktok-ai-ads": {
    title: "How to Create High-Converting TikTok AI Ads",
    excerpt: "Hooks, pacing, native formats, and iteration loops for performance creative."
  },
  "what-is-an-ai-creative-studio": {
    title: "What Is an AI Creative Studio?",
    excerpt: "How modern studios combine AI tooling with human creative direction at scale."
  },
  "how-ai-is-changing-global-advertising": {
    title: "How AI Is Changing Global Advertising",
    excerpt: "Why global brands are shifting from agency-only workflows to AI-native collaboration."
  }
};

const ZH_RELATED: Record<AiAdvertisingClusterSlug, { title: string; excerpt: string }> = {
  "what-is-ai-advertising": {
    title: "什么是 AI 广告？",
    excerpt: "品牌如何用 AI 提升创意制作、投放效率与 campaign 迭代速度。"
  },
  "ai-video-ads-vs-traditional-production": {
    title: "AI 视频广告 vs 传统制作",
    excerpt: "对比成本、交付速度、质量把控，以及各自更适合的场景。"
  },
  "how-to-create-high-converting-tiktok-ai-ads": {
    title: "如何制作高转化 TikTok AI 广告",
    excerpt: "钩子、节奏、原生格式与效果创意迭代方法。"
  },
  "what-is-an-ai-creative-studio": {
    title: "什么是 AI 创意工作室？",
    excerpt: "AI 工具与人类创意指导如何协同，支撑规模化广告制作。"
  },
  "how-ai-is-changing-global-advertising": {
    title: "AI 如何改变全球广告行业",
    excerpt: "全球品牌为何从纯代理模式转向 AI 原生协作流程。"
  }
};

const EN_FAQS: KnowledgeFaqInput[] = [
  {
    question: "What is AI advertising?",
    answer:
      "AI advertising uses machine learning and generative tools to plan, produce, test, and optimize campaigns faster. Brands still need strategy and brand judgment, but AI reduces production friction and improves iteration speed."
  },
  {
    question: "Is AI advertising expensive?",
    answer:
      "It is often less expensive than traditional production for short-form video and rapid testing. Costs depend on creative complexity, revision rounds, and whether you use in-house teams, agencies, or an AI-native studio platform like VINCIS."
  },
  {
    question: "Can AI replace advertising agencies?",
    answer:
      "AI does not fully replace agencies. It replaces slow, repetitive production steps. The best results combine AI speed with human creative direction, brand governance, and performance feedback loops."
  },
  {
    question: "Which industries benefit most from AI advertising?",
    answer:
      "E-commerce, consumer apps, gaming, education, SaaS, and local services benefit early because they need frequent creative refreshes, multilingual variants, and fast channel testing."
  },
  {
    question: "How do brands start using AI advertising?",
    answer:
      "Start with one clear campaign objective, a reference ad, and a short brief. Publish the brief, match vetted AI-native creators, run escrow-backed production, and iterate from review feedback instead of restarting from zero."
  }
];

const ZH_FAQS: KnowledgeFaqInput[] = [
  {
    question: "什么是 AI 广告？",
    answer:
      "AI 广告通过机器学习与生成式工具，更快完成创意策划、制作、测试与优化。品牌仍需要策略与品牌判断，但 AI 能显著降低制作摩擦并提升迭代速度。"
  },
  {
    question: "AI 广告贵吗？",
    answer:
      "在短视频与高频测试场景下，AI 广告通常比传统制作更经济。最终成本取决于创意复杂度、修订轮次，以及你是自建团队、代理制作，还是使用 VINCIS 这类 AI 原生平台。"
  },
  {
    question: "AI 能取代广告公司吗？",
    answer:
      "AI 不会完全取代广告公司，但会替代大量重复、低效的制作环节。最佳实践是 AI 提速 + 人类创意指导 + 品牌治理 + 效果反馈闭环。"
  },
  {
    question: "哪些行业最适合 AI 广告？",
    answer:
      "电商、消费应用、游戏、教育、SaaS 与本地服务通常最先受益，因为它们需要高频创意更新、多语言版本与快速渠道测试。"
  },
  {
    question: "品牌如何开始使用 AI 广告？",
    answer:
      "从一个明确 campaign 目标开始，准备参考广告与精简 brief，发布需求并匹配认证 AI 创作者，通过托管付款完成制作，再基于审片反馈迭代，而不是每次从零重做。"
  }
];

export function isAiAdvertisingClusterSlug(slug: string): slug is AiAdvertisingClusterSlug {
  return (AI_ADVERTISING_CLUSTER_SLUGS as readonly string[]).includes(slug);
}

export function shouldEnrichAiAdvertisingArticle(input: { slug: string; category_slug: string | null }) {
  return (
    isAiAdvertisingClusterSlug(input.slug) ||
    input.category_slug === "ai" ||
    input.category_slug === "ai-advertising"
  );
}

export function curatedRelatedSlugsFor(slug: string): AiAdvertisingClusterSlug[] {
  return AI_ADVERTISING_CLUSTER_SLUGS.filter((item) => item !== slug);
}

export function curatedFaqsForLanguage(languageCode: string): KnowledgeFaqInput[] {
  return languageCode === "zh-CN" ? ZH_FAQS : EN_FAQS;
}

export function curatedRelatedMeta(slug: AiAdvertisingClusterSlug, languageCode: string) {
  const pack = languageCode === "zh-CN" ? ZH_RELATED : EN_RELATED;
  return pack[slug];
}
