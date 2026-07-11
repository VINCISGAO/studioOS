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
  aiAssistant: string;
  backHome: string;
  aiHelpTitle: string;
  aiHelpBody: string;
  aiHelpButton: string;
  ctaTitle: string;
  ctaBody: string;
  ctaButton: string;
  darkMode: string;
};

const zhSidebar: Omit<MarketingDocsSidebarCopy, keyof ReturnType<typeof marketingSiteNavLabels>> = {
  aiAssistant: "AI 助手",
  backHome: "返回首页",
  aiHelpTitle: "需要帮助？",
  aiHelpBody: "AI 助手随时为您解答任何问题",
  aiHelpButton: "打开 AI 助手",
  ctaTitle: "准备好开始创作了吗？",
  ctaBody: "连接全球创作者，让您的创意成为现实。",
  ctaButton: "立即开始",
  darkMode: "深色模式"
};

const enSidebar: Omit<MarketingDocsSidebarCopy, keyof ReturnType<typeof marketingSiteNavLabels>> = {
  aiAssistant: "AI assistant",
  backHome: "Back to home",
  aiHelpTitle: "Need help?",
  aiHelpBody: "The AI assistant can answer your questions anytime.",
  aiHelpButton: "Open AI assistant",
  ctaTitle: "Ready to create?",
  ctaBody: "Connect with global creators and bring your ideas to life.",
  ctaButton: "Get started",
  darkMode: "Dark mode"
};

export function marketingDocsNavText(locale: Locale): MarketingDocsSidebarCopy {
  const labels = marketingSiteNavLabels(locale);
  const sidebar = locale === "zh" ? zhSidebar : enSidebar;
  return { ...labels, ...sidebar };
}
