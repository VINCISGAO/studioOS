import type { Locale } from "@/lib/i18n";

/** StudioOS product language — Brand & Studio, not Client & Creator marketplace. */
export const studioOS = {
  productName: "StudioOS",
  tagline: {
    en: "Infrastructure connecting global brands with AI-powered creative production.",
    zh: "连接全球品牌与 AI 驱动创意制作的基础设施。"
  },
  hero: {
    en: "Hollywood-level ads at the lowest budget.",
    zh: "最低的预算 好莱坞级别的广告"
  },
  heroHeadline: {
    en: {
      line1: "Hollywood-level ads,",
      line2: "at the lowest budget",
      highlight: "Hollywood-level"
    },
    zh: {
      line1: "最低的预算，",
      line2: "的广告",
      highlight: "好莱坞级别"
    }
  },
  slogan: {
    en: "We connect expensive overseas ad production demand with China's top creator productivity — cinematic commercials at a fraction of the cost.",
    zh: "把国外昂贵广告制作需求，与中国优秀创作者的高效生产力连接起来，让品牌用更低成本获得电影级广告。"
  }
} as const;

export function formatHeroHeadlineLine1(line1: string) {
  return line1.replace(/[，,]+$/u, "");
}

export const brandNav = {
  en: {
    dashboard: "Dashboard",
    projects: "Projects",
    analytics: "Analytics",
    creativeDna: "Creative DNA",
    assets: "Assets",
    invoices: "Invoices",
    team: "Team",
    newBrief: "New brief",
    reviewRoom: "Review center",
    settlement: "Settlement"
  },
  zh: {
    dashboard: "总览",
    projects: "项目",
    analytics: "Analytics",
    creativeDna: "Creative DNA",
    assets: "素材库",
    invoices: "账单",
    team: "团队",
    newBrief: "新建 Brief",
    reviewRoom: "审片中心",
    settlement: "托管结算"
  }
} as const;

export const studioNav = {
  en: {
    home: "Home",
    dashboard: "Production",
    projects: "Assigned projects",
    invitations: "Invitations",
    upload: "Delivery Workspace",
    income: "Income",
    deposit: "Certification",
    profile: "Studio profile",
    reviewRoom: "Review center",
    messages: "Messages",
    settings: "Account security",
    studioOwner: "Studio Owner"
  },
  zh: {
    home: "首页",
    dashboard: "制作台",
    projects: "分配项目",
    invitations: "项目邀请",
    upload: "交付工作台",
    income: "收入",
    deposit: "认证服务商",
    profile: "主页",
    reviewRoom: "审片中心",
    messages: "消息中心",
    settings: "账号安全",
    studioOwner: "Studio Owner"
  }
} as const;

export const marketingNav = {
  en: {
    pricing: "Pricing",
    caseStudies: "Case studies",
    howItWorks: "How it works",
    faq: "FAQ",
    contact: "Contact",
    signIn: "Sign in",
    brandPortal: "Brand portal",
    studioPortal: "Studio portal"
  },
  zh: {
    pricing: "价格",
    caseStudies: "案例",
    howItWorks: "如何运作",
    faq: "常见问题",
    contact: "联系",
    signIn: "登录",
    brandPortal: "Brand 门户",
    studioPortal: "创作者"
  }
} as const;

export function t<T extends Record<Locale, string>>(dict: T, locale: Locale): string {
  return dict[locale];
}
