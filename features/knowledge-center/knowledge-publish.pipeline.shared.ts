export const KNOWLEDGE_PUBLISH_STEPS = [
  "html",
  "json_ld",
  "open_graph",
  "twitter_card",
  "canonical",
  "hreflang",
  "schema_org",
  "article_page",
  "category_index",
  "site_search",
  "ai_summary",
  "sitemap",
  "rss",
  "llms_txt",
  "robots_txt",
  "lucien_learning",
  "multilingual_sync",
  "search_engine_ping",
  "cache_revalidated"
] as const;

export type KnowledgePublishStep = (typeof KNOWLEDGE_PUBLISH_STEPS)[number];

export type KnowledgePublishPipelineResult = {
  published: boolean;
  steps: KnowledgePublishStep[];
  lucien_synced: number;
  public_urls: string[];
  translations_synced?: number;
  translation_languages?: string[];
  translation_errors?: string[];
  multilingual_sync_queued?: boolean;
  search_engine_ping?: {
    attempted: string[];
    succeeded: string[];
    skipped: string[];
  };
};

export const KNOWLEDGE_PUBLISH_STEP_LABELS: Record<KnowledgePublishStep, { en: string; zh: string }> = {
  html: { en: "HTML article page", zh: "文章页面 HTML" },
  json_ld: { en: "JSON-LD graph", zh: "结构化数据" },
  open_graph: { en: "OpenGraph metadata", zh: "开放图谱元数据" },
  twitter_card: { en: "Twitter Card", zh: "推特卡片" },
  canonical: { en: "Canonical URL", zh: "规范链接" },
  hreflang: { en: "hreflang alternates", zh: "多语言链接" },
  schema_org: { en: "Schema.org bundle", zh: "Schema 数据包" },
  article_page: { en: "Public article routes", zh: "公开文章路由" },
  category_index: { en: "Category index pages", zh: "分类索引页" },
  site_search: { en: "Site search index", zh: "站内搜索索引" },
  ai_summary: { en: "AI summary for Lucien", zh: "Lucien 摘要" },
  sitemap: { en: "Sitemap", zh: "站点地图" },
  rss: { en: "RSS / Atom feeds", zh: "RSS 订阅" },
  llms_txt: { en: "llms.txt", zh: "大模型抓取清单" },
  robots_txt: { en: "robots.txt", zh: "爬虫规则" },
  lucien_learning: { en: "Lucien knowledge sync", zh: "Lucien 知识库同步" },
  multilingual_sync: { en: "11-language GPT translation sync", zh: "GPT 同步 11 种语言" },
  search_engine_ping: { en: "Search engine notification", zh: "搜索引擎通知" },
  cache_revalidated: { en: "Next.js cache revalidation", zh: "页面缓存刷新" }
};

export function formatKnowledgePublishSummary(
  pipeline: KnowledgePublishPipelineResult,
  locale: "en" | "zh" = "en"
) {
  return pipeline.steps.map((step) => KNOWLEDGE_PUBLISH_STEP_LABELS[step][locale]);
}
