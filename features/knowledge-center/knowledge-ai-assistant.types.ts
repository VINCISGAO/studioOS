export const KNOWLEDGE_AI_ASSISTANT_ACTIONS = [
  "generate_seo_title",
  "generate_meta_description",
  "generate_summary",
  "generate_keywords",
  "generate_faq",
  "improve_writing",
  "suggest_internal_links",
  "generate_lucien_summary"
] as const;

export type KnowledgeAiAssistantAction = (typeof KNOWLEDGE_AI_ASSISTANT_ACTIONS)[number];

export type KnowledgeAiDraftContext = {
  title: string;
  subtitle?: string;
  slug?: string;
  body_markdown: string;
  seo_title?: string;
  meta_description?: string;
  focus_keywords?: string;
  category_slug?: string;
  tags?: string[];
};

export type KnowledgeAiFaqItem = {
  question: string;
  answer: string;
};

export type KnowledgeAiInternalLink = {
  slug: string;
  title: string;
  suggested_anchor: string;
  reason: string;
};

export type KnowledgeAiAssistantUsage = {
  provider: string;
  model: string;
  tokenInput: number;
  tokenOutput: number;
  cost: number;
  latencyMs: number;
};

export type KnowledgeAiAssistantResult = {
  ok: boolean;
  action: KnowledgeAiAssistantAction;
  seo_title?: string;
  meta_description?: string;
  summary?: string;
  keywords?: string[];
  faqs?: KnowledgeAiFaqItem[];
  body_markdown?: string;
  internal_links?: KnowledgeAiInternalLink[];
  lucien_summary?: string;
  lucien_keywords?: string[];
  usage: KnowledgeAiAssistantUsage;
  error?: string;
};
