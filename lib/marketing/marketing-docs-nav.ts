import type { Locale } from "@/lib/i18n";
import {
  marketingSiteNavLabels,
  type MarketingSiteNavKey
} from "@/lib/marketing/marketing-site-nav";

export type MarketingDocsNavKey = MarketingSiteNavKey;

export type MarketingDocsSidebarCopy = {
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

const zhSidebar: Omit<MarketingDocsSidebarCopy, keyof ReturnType<typeof marketingSiteNavLabels>> = {
  backHome: "返回首页",
  aiHelpTitle: "需要帮助？",
  aiHelpBody: "AI 助手随时为您解答任何问题",
  aiHelpButton: "打开 AI 助手"
};

const enSidebar: Omit<MarketingDocsSidebarCopy, keyof ReturnType<typeof marketingSiteNavLabels>> = {
  backHome: "Back to home",
  aiHelpTitle: "Need help?",
  aiHelpBody: "The AI assistant can answer your questions anytime.",
  aiHelpButton: "Open AI assistant"
};

export function marketingDocsNavText(locale: Locale): MarketingDocsSidebarCopy {
  const labels = marketingSiteNavLabels(locale);
  const sidebar = locale === "zh" ? zhSidebar : enSidebar;
  return { ...labels, ...sidebar };
}
