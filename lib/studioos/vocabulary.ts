import type { Locale } from "@/lib/i18n";

/** VINCIS product language — Brand & Studio, not Client & Creator marketplace. */
export const studioOS = {
  productName: "VINCIS",
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
    workspace: "Workspace",
    adRequirements: "Ad briefs",
    home: "My ads",
    campaigns: "My ads",
    finance: "Finance",
    brandAccount: "Brand account",
    brandCenter: "Brand homepage",
    brandLibrary: "Brand homepage",
    creators: "Creators",
    dataAnalysis: "Analytics",
    messages: "Messages",
    aiAssistant: "AI Assistant",
    attribution: "Ad attribution",
    settings: "Settings",
    dashboard: "Dashboard",
    projects: "Projects",
    analytics: "Analytics",
    creativeDna: "Creative DNA",
    assets: "Assets",
    invoices: "Invoices",
    team: "Team collaboration (coming soon)",
    newBrief: "New brief",
    reviewRoom: "Review center",
    settlement: "Settlement"
  },
  zh: {
    workspace: "工作台",
    adRequirements: "广告需求",
    home: "我的广告",
    campaigns: "我的广告",
    finance: "财务中心",
    brandAccount: "商家账户",
    brandCenter: "品牌主页",
    brandLibrary: "品牌主页",
    creators: "创作者",
    dataAnalysis: "数据分析",
    messages: "消息中心",
    aiAssistant: "AI助手",
    attribution: "广告效果归因",
    settings: "设置",
    dashboard: "总览",
    projects: "项目",
    analytics: "Analytics",
    creativeDna: "Creative DNA",
    assets: "素材库",
    invoices: "账单",
    team: "团队协作（暂未开放）",
    newBrief: "新建 Brief",
    reviewRoom: "审片中心",
    settlement: "托管结算"
  }
} as const;

export const studioNav = {
  en: {
    home: "Home",
    invitations: "Invitations",
    orders: "Orders",
    projects: "My projects",
    projectDetails: "Project details",
    works: "Profile",
    income: "Income",
    deposit: "Certification",
    messages: "Messages",
    aiAssistant: "AI Assistant",
    settings: "Account",
    dashboard: "Production",
    upload: "Delivery Workspace",
    profile: "Studio profile",
    reviewRoom: "Review center",
    studioOwner: "Creator"
  },
  zh: {
    home: "首页",
    invitations: "我的邀请",
    orders: "订单管理",
    projects: "项目管理",
    projectDetails: "项目详情",
    works: "个人资料",
    income: "收益管理",
    deposit: "认证服务商",
    messages: "消息中心",
    aiAssistant: "AI助手",
    settings: "账号设置",
    dashboard: "制作台",
    upload: "交付工作台",
    profile: "主页",
    reviewRoom: "审片中心",
    studioOwner: "创作者"
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
