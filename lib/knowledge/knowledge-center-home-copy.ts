import type { Locale } from "@/lib/i18n";
import type { LucideIcon } from "lucide-react";
import { BookOpen, Clapperboard, Lightbulb, Sparkles, Target, Video } from "lucide-react";

export type KnowledgeCenterNavKey = "home" | "guides" | "cases" | "resources" | "changelog";

export type KnowledgeTopicSlug =
  | "ai"
  | "creator-academy"
  | "workflow"
  | "brand-academy"
  | "pricing"
  | "help-center";

export type KnowledgeTopicCardCopy = {
  slug: KnowledgeTopicSlug;
  title: string;
  description: string;
  icon: LucideIcon;
  iconClassName: string;
};

export type KnowledgeCenterHomeCopy = {
  brandLabel: string;
  beta: string;
  back: string;
  nav: Record<KnowledgeCenterNavKey, string>;
  guideLinks: Array<{ slug: KnowledgeTopicSlug; label: string }>;
  caseLinks: Array<{ href: string; label: string }>;
  heroTitle: string;
  heroSubtitle: string;
  searchPlaceholder: string;
  searchButton: string;
  hotKeywordsLabel: string;
  hotKeywords: string[];
  topicsTitle: string;
  topicsViewAll: string;
  featuredTitle: string;
  featuredViewAll: string;
  latestTitle: string;
  supportTitle: string;
  supportLucienButton: string;
  emptyFeatured: string;
  emptyLatest: string;
  minRead: string;
  articlesCount: (count: number) => string;
  topics: KnowledgeTopicCardCopy[];
};

const zhTopics: KnowledgeTopicCardCopy[] = [
  {
    slug: "ai",
    title: "AI 广告",
    description: "了解 AI 如何改变广告创意与生产流程",
    icon: Sparkles,
    iconClassName: "text-violet-600 bg-violet-50"
  },
  {
    slug: "creator-academy",
    title: "AI 视频制作",
    description: "从脚本到成片的 AI 视频创作指南",
    icon: Video,
    iconClassName: "text-sky-600 bg-sky-50"
  },
  {
    slug: "workflow",
    title: "创意简报",
    description: "写出清晰、可执行的创意简报",
    icon: Target,
    iconClassName: "text-rose-600 bg-rose-50"
  },
  {
    slug: "brand-academy",
    title: "品牌营销",
    description: "品牌传播、投放与增长策略",
    icon: Lightbulb,
    iconClassName: "text-amber-600 bg-amber-50"
  },
  {
    slug: "pricing",
    title: "定价与交付",
    description: "透明报价、审片流程与托管付款",
    icon: Clapperboard,
    iconClassName: "text-emerald-600 bg-emerald-50"
  },
  {
    slug: "help-center",
    title: "入门指南",
    description: "快速上手 VINCIS 平台与协作流程",
    icon: BookOpen,
    iconClassName: "text-indigo-600 bg-indigo-50"
  }
];

const enTopics: KnowledgeTopicCardCopy[] = [
  {
    slug: "ai",
    title: "AI Advertising",
    description: "How AI is reshaping creative production and campaign velocity",
    icon: Sparkles,
    iconClassName: "text-violet-600 bg-violet-50"
  },
  {
    slug: "creator-academy",
    title: "AI Video Production",
    description: "Guides from brief to finished AI-native video",
    icon: Video,
    iconClassName: "text-sky-600 bg-sky-50"
  },
  {
    slug: "workflow",
    title: "Creative Briefs",
    description: "Write briefs teams can actually execute",
    icon: Target,
    iconClassName: "text-rose-600 bg-rose-50"
  },
  {
    slug: "brand-academy",
    title: "Brand Marketing",
    description: "Positioning, distribution, and growth playbooks",
    icon: Lightbulb,
    iconClassName: "text-amber-600 bg-amber-50"
  },
  {
    slug: "pricing",
    title: "Pricing & Delivery",
    description: "Quotes, review rounds, and escrow payments",
    icon: Clapperboard,
    iconClassName: "text-emerald-600 bg-emerald-50"
  },
  {
    slug: "help-center",
    title: "Getting Started",
    description: "Onboard to VINCIS and ship your first campaign",
    icon: BookOpen,
    iconClassName: "text-indigo-600 bg-indigo-50"
  }
];

const zh: KnowledgeCenterHomeCopy = {
  brandLabel: "知识中心",
  beta: "Beta",
  back: "返回上一页",
  nav: {
    home: "首页",
    guides: "指南",
    cases: "案例",
    resources: "资源",
    changelog: "更新日志"
  },
  guideLinks: [
    { slug: "ai", label: "AI 广告" },
    { slug: "creator-academy", label: "AI 视频制作" },
    { slug: "workflow", label: "创意简报" },
    { slug: "brand-academy", label: "品牌营销" },
    { slug: "help-center", label: "入门指南" }
  ],
  caseLinks: [
    { href: "/cases", label: "精选案例" },
    { href: "/case-studies", label: "案例研究" }
  ],
  heroTitle: "VINCIS 知识中心",
  heroSubtitle: "探索 AI 广告、创意制作与品牌营销的专业知识与最佳实践",
  searchPlaceholder: "搜索文章、指南、案例…",
  searchButton: "搜索",
  hotKeywordsLabel: "热门搜索",
  hotKeywords: ["AI 广告", "AI 视频制作", "创意简报", "品牌营销", "实战案例"],
  topicsTitle: "浏览主题",
  topicsViewAll: "查看所有主题",
  featuredTitle: "精选文章",
  featuredViewAll: "查看所有文章",
  latestTitle: "最新更新",
  supportTitle: "找不到答案，问问AI助手卢西恩",
  supportLucienButton: "问问卢西恩",
  emptyFeatured: "精选文章即将发布。",
  emptyLatest: "暂无更新。",
  minRead: "分钟阅读",
  articlesCount: (count) => `${count} 篇文章`,
  topics: zhTopics
};

const en: KnowledgeCenterHomeCopy = {
  brandLabel: "Knowledge Center",
  beta: "Beta",
  back: "Back",
  nav: {
    home: "Home",
    guides: "Guides",
    cases: "Work",
    resources: "Resources",
    changelog: "Changelog"
  },
  guideLinks: [
    { slug: "ai", label: "AI Advertising" },
    { slug: "creator-academy", label: "AI Video" },
    { slug: "workflow", label: "Creative Briefs" },
    { slug: "brand-academy", label: "Brand Marketing" },
    { slug: "help-center", label: "Getting Started" }
  ],
  caseLinks: [
    { href: "/cases", label: "Selected work" },
    { href: "/case-studies", label: "Case studies" }
  ],
  heroTitle: "VINCIS Knowledge Center",
  heroSubtitle: "Explore professional guides on AI advertising, creative production, and brand marketing",
  searchPlaceholder: "Search articles, guides, and playbooks…",
  searchButton: "Search",
  hotKeywordsLabel: "Popular",
  hotKeywords: ["AI advertising", "AI video", "creative brief", "brand marketing", "case studies"],
  topicsTitle: "Browse topics",
  topicsViewAll: "View all topics",
  featuredTitle: "Featured articles",
  featuredViewAll: "View all articles",
  latestTitle: "Latest updates",
  supportTitle: "Can't find an answer? Ask Lucien, your AI assistant.",
  supportLucienButton: "Ask Lucien",
  emptyFeatured: "Featured articles are coming soon.",
  emptyLatest: "No updates yet.",
  minRead: "min read",
  articlesCount: (count) => `${count} articles`,
  topics: enTopics
};

export function knowledgeCenterHomeCopy(locale: Locale): KnowledgeCenterHomeCopy {
  return locale === "zh" ? zh : en;
}
