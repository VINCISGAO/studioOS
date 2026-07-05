import type { Locale } from "@/lib/i18n";
import type { CreatorPortalNavKey } from "@/lib/studioos/creator-portal-nav";

export const certificationUnlockOrder: CreatorPortalNavKey[] = [
  "projectDetails",
  "orders",
  "reviewRoom",
  "income",
  "messages"
];

export const certificationExperienceCopy = {
  en: {
    modalTitle: "🎉 Certified Service Partner",
    modalSubtitle:
      "Congratulations — you're a VINCIS Certified Service Partner. Accept unlimited projects and collaborate with global brands.",
    benefits: [
      {
        title: "Unlimited project invitations",
        body: "No first-order cap — keep receiving global brand opportunities."
      },
      {
        title: "Full workspace unlocked",
        body: "Production, review, delivery, and income — all in one place."
      },
      {
        title: "Official certification badge",
        body: "Certified Service Partner status builds brand trust everywhere."
      },
      {
        title: "Priority high-quality briefs",
        body: "AI prioritizes certified studios for premium matches."
      },
      {
        title: "Escrow settlement protection",
        body: "Every project settles through platform escrow — safe payouts."
      }
    ],
    primaryCta: "Start accepting projects",
    secondaryCta: "View certification benefits",
    partnerBadge: "Certified Service Partner",
    partnerBadgeSidebar: "Verified Partner",
    unlockLabel: "Unlocked",
    welcomeTitle: "Welcome to the VINCIS Certified Service Partner program!",
    welcomeBody:
      "Unlimited orders, official certification, and your full workspace are live — start collaborating with global brands now.",
    welcomeDismiss: "Dismiss"
  },
  zh: {
    modalTitle: "🎉 恭喜成为认证服务商",
    modalSubtitle: "您已成为 VINCIS 认证服务商。您已解锁全部创作者功能，现在可以无限接单，与全球品牌合作。",
    benefits: [
      {
        title: "无限接收项目邀请",
        body: "不再受首单限制，持续获得全球品牌合作机会。"
      },
      {
        title: "开放全部工作台",
        body: "制作、审片、交付、收入中心全部开放。"
      },
      {
        title: "平台官方认证标识",
        body: "获得「认证服务商」身份，提高品牌信任度。"
      },
      {
        title: "优先获得高质量项目",
        body: "AI 优先推荐给认证服务商，提高接单机会。"
      },
      {
        title: "托管结算保障",
        body: "所有项目通过平台托管，按流程安全放款。"
      }
    ],
    primaryCta: "开始接单",
    secondaryCta: "查看认证权益",
    partnerBadge: "认证服务商",
    partnerBadgeSidebar: "认证服务商",
    unlockLabel: "已解锁",
    welcomeTitle: "🎉 欢迎加入 VINCIS 认证服务商计划！",
    welcomeBody:
      "您已解锁无限接单权限、官方认证标识及全部工作台功能，立即开始接收全球品牌合作。",
    welcomeDismiss: "关闭"
  }
} as const;

export function tCertificationExperience(locale: Locale) {
  return certificationExperienceCopy[locale];
}
