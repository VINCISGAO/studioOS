import type { Locale } from "@/lib/i18n";

export const creatorDepositHeroCopy = {
  zh: {
    title: "专业认证 (可选)",
    body: "完成认证可提升品牌信任度；首单免费体验全部功能。首单交付后需认证才能继续接单，收益与提现始终可用。",
    completedMeta: (orders: number) =>
      orders >= 1
        ? `$99 · 已完成 ${orders} 单 · 接单功能已锁定 · 收益仍可提现`
        : `$99 · 已完成 ${orders} 单 · 首单前全部功能开放`,
    certify: "立即认证",
    later: "以后再说",
    features: [
      { title: "提升信任", body: "官方认证标识，增强客户信任" },
      { title: "更多机会", body: "优先展示与更多合作机会" },
      { title: "平台权益", body: "解锁平台高级功能与数据支持" }
    ]
  },
  en: {
    title: "Professional certification (optional)",
    body: "Get certified to boost brand trust — your first project is free with full access. After delivery, certify to accept more orders; income and withdrawals stay open.",
    completedMeta: (orders: number) =>
      orders >= 1
        ? `$99 · ${orders} completed · order tools locked · withdrawals open`
        : `$99 · ${orders} completed order(s) · all features open before first delivery`,
    certify: "Certify now",
    later: "Maybe later",
    features: [
      { title: "Build trust", body: "Official badge shown on your public profile" },
      { title: "More exposure", body: "Priority placement and collaboration opportunities" },
      { title: "Platform perks", body: "Unlock advanced tools and data support" }
    ]
  }
} as const;

export const creatorDepositSidebarCopy = {
  zh: {
    helpTitle: "需要帮助？",
    helpBody: "如有任何问题，欢迎联系我们的客服团队。",
    helpCta: "联系客服"
  },
  en: {
    helpTitle: "Need help?",
    helpBody: "Contact our support team if you have any questions.",
    helpCta: "Contact support"
  }
} as const;

export function parseDepositBenefit(benefit: string) {
  const [title, detail] = benefit.split(" — ");
  return { title: title ?? benefit, detail: detail ?? "" };
}

export const depositBenefitIconTones = [
  "bg-violet-100 text-violet-600",
  "bg-blue-100 text-blue-600",
  "bg-emerald-100 text-emerald-600",
  "bg-amber-100 text-amber-600",
  "bg-indigo-100 text-indigo-600"
] as const;

export function creatorDepositHeroCopyFor(locale: Locale) {
  return creatorDepositHeroCopy[locale];
}

export function creatorDepositSidebarCopyFor(locale: Locale) {
  return creatorDepositSidebarCopy[locale];
}
