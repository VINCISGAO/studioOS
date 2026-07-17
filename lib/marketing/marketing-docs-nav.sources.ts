import { marketingSiteNavEn, marketingSiteNavZhCN } from "@/lib/marketing/marketing-site-nav";

export type MarketingDocsSidebarSourceCopy = {
  about: string;
  cases: string;
  process: string;
  pricing: string;
  resources: string;
  faq: string;
  knowledge: string;
  backHome: string;
  aiHelpTitle: string;
  aiHelpBody: string;
  aiHelpButton: string;
};

const zhSidebarExtras = {
  backHome: "返回首页",
  aiHelpTitle: "需要帮助？",
  aiHelpBody: "AI 助手随时为您解答任何问题",
  aiHelpButton: "打开 AI 助手"
} as const;

const enSidebarExtras = {
  backHome: "Back to home",
  aiHelpTitle: "Need help?",
  aiHelpBody: "The AI assistant can answer your questions anytime.",
  aiHelpButton: "Open AI assistant"
} as const;

export const marketingDocsNavZhCN: MarketingDocsSidebarSourceCopy = {
  about: marketingSiteNavZhCN.about.label,
  cases: marketingSiteNavZhCN.cases.label,
  process: marketingSiteNavZhCN.process.label,
  pricing: marketingSiteNavZhCN.pricing.label,
  resources: marketingSiteNavZhCN.resources.label,
  faq: marketingSiteNavZhCN.faq.label,
  knowledge: marketingSiteNavZhCN.knowledge.label,
  ...zhSidebarExtras
};

export const marketingDocsNavEn: MarketingDocsSidebarSourceCopy = {
  about: marketingSiteNavEn.about.label,
  cases: marketingSiteNavEn.cases.label,
  process: marketingSiteNavEn.process.label,
  pricing: marketingSiteNavEn.pricing.label,
  resources: marketingSiteNavEn.resources.label,
  faq: marketingSiteNavEn.faq.label,
  knowledge: marketingSiteNavEn.knowledge.label,
  ...enSidebarExtras
};
