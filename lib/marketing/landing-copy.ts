import type { Locale } from "@/lib/i18n";

/** Landing page v2 — 1:1 mockup copy. */
export const landingCopy = {
  nav: {
    en: {
      howItWorks: "How it works",
      forBrands: "For Brands",
      forCreators: "For Creators",
      caseStudies: "Case Studies",
      pricing: "Pricing",
      login: "Log in",
      startProject: "Start a project"
    },
    zh: {
      howItWorks: "如何运作",
      forBrands: "品牌方",
      forCreators: "创作者",
      caseStudies: "案例",
      pricing: "价格",
      login: "登录",
      startProject: "开始项目"
    }
  },
  split: {
    en: {
      panelEyebrow: "Get started",
      panelTitle: "Sign in or create an account",
      panelSubtitle: "Choose your workspace — brands launch campaigns, creators deliver cinema-grade work.",
      welcomeBack: "Welcome back",
      loggedInSubtitle: "Continue to your StudioOS workspace.",
      brandTab: "Brand",
      creatorTab: "Creator",
      emailLabel: "Work email",
      emailPlaceholder: "you@company.com",
      continue: "Continue",
      orDivider: "or",
      signInBrand: "Brand sign in",
      signInCreator: "Creator sign in",
      noAccount: "New to StudioOS?",
      createAccount: "Create account",
      explorePricing: "View pricing",
      legalNotice: "By continuing you agree to our Terms and Privacy Policy.",
      leftFootnote: "Trusted by global brands for portfolio-first matching, frame-accurate review, and escrow-backed delivery."
    },
    zh: {
      panelEyebrow: "开始使用",
      panelTitle: "登录或注册账号",
      panelSubtitle: "选择您的工作台 — 品牌方发起项目，创作者交付电影级作品。",
      welcomeBack: "欢迎回来",
      loggedInSubtitle: "继续进入您的 StudioOS 工作台。",
      brandTab: "品牌方",
      creatorTab: "创作者",
      emailLabel: "工作邮箱",
      emailPlaceholder: "you@company.com",
      continue: "继续",
      orDivider: "或",
      signInBrand: "品牌方登录",
      signInCreator: "创作者登录",
      noAccount: "还没有账号？",
      createAccount: "立即注册",
      explorePricing: "查看价格",
      legalNotice: "继续即表示您同意我们的服务条款与隐私政策。",
      leftFootnote: "全球品牌信赖 — 作品集优先匹配、帧级审片、托管交付。"
    }
  },
  hero: {
    en: {
      eyebrow: "The Future of Commercial Production",
      titleLine1: "Hollywood Quality.",
      titleHighlight: "Without",
      titleLine2: "Hollywood Costs.",
      subtitle:
        "The production OS for global brands — portfolio-first matching, frame-accurate review, and escrow-backed delivery. Cinema-grade ads without the Hollywood price tag.",
      primary: "I'm a brand",
      secondary: "I'm a creator",
      trusted: "Trusted by 1,200+ brands worldwide",
      showreel: "Play showreel"
    },
    zh: {
      eyebrow: "商业制作的未来",
      titleLine1: "好莱坞品质。",
      titleHighlight: "无需好莱坞成本。",
      titleLine2: "",
      subtitle:
        "面向全球品牌的制作操作系统 — 作品集优先匹配、帧级审片、托管交付。电影级广告，无需好莱坞预算。",
      primary: "我是品牌方",
      secondary: "我是创作者",
      trusted: "全球 1,200+ 品牌信赖",
      showreel: "播放 Showreel"
    }
  },
  heroFeatures: {
    en: [
      { title: "Portfolio-first matching", desc: "Find the right creator with precision", icon: "users" as const },
      { title: "Frame-accurate review", desc: "Online proofing with clear versions", icon: "play" as const },
      { title: "Escrow-backed delivery", desc: "Secure handoff and rights protection", icon: "shield" as const },
      { title: "Efficient production", desc: "Shorter cycles, lower cost", icon: "zap" as const }
    ],
    zh: [
      { title: "作品集优先匹配", desc: "精准找到合适创作者", icon: "users" as const },
      { title: "帧级审片协作", desc: "在线审片，版本清晰", icon: "play" as const },
      { title: "托管交付保障", desc: "安全交付，权益保障", icon: "shield" as const },
      { title: "高效制作流程", desc: "缩短周期，降低成本", icon: "zap" as const }
    ]
  },
  stats: {
    en: [
      { value: "70%", suffix: "↓", label: "Lower Production Cost" },
      { value: "72h", suffix: "", label: "First Version Ready" },
      { value: "4K", suffix: "", label: "Cinema-level Quality" },
      { value: "2000+", suffix: "", label: "Global Creators" }
    ],
    zh: [
      { value: "70%", suffix: "↓", label: "制作成本更低" },
      { value: "72h", suffix: "", label: "初版就绪" },
      { value: "4K", suffix: "", label: "电影级画质" },
      { value: "2000+", suffix: "", label: "全球创作者" }
    ]
  },
  logos: {
    en: {
      label: "Trusted by global brands",
      brands: ["Google", "Coca-Cola", "Samsung", "Airbnb", "TikTok", "Shopify", "Amazon", "Meta"]
    },
    zh: {
      label: "全球品牌信赖",
      brands: ["Google", "Coca-Cola", "Samsung", "Airbnb", "TikTok", "Shopify", "Amazon", "Meta"]
    }
  },
  cost: {
    en: {
      title: "Traditional ad production is broken.",
      body: "Agencies add layers of markup, slow timelines, and opaque revisions — while brands still need cinema-grade output on paid-social timelines.",
      pains: ["High agency markup", "8–12 week timelines", "Limited creator access", "Endless revision loops"],
      compareTitle: "See the difference",
      traditional: "Traditional Agency",
      studio: "StudioOS",
      saveBadge: "Save 60–80%",
      rows: [
        { label: "Average Cost", trad: "$25,000+", studio: "$5,000" },
        { label: "Production Time", trad: "8–12 weeks", studio: "72 hours" },
        { label: "Creator Access", trad: "Through layers", studio: "Direct network" },
        { label: "Revisions", trad: "Extra fees", studio: "Included workflow" }
      ]
    },
    zh: {
      title: "传统广告制作模式已经失效。",
      body: "代理层层加价、周期冗长、修改不透明 — 品牌方却仍需在付费社交节奏下拿到电影级成片。",
      pains: ["代理层层加价", "8–12 周制作周期", "创作者触达受限", "修改陷入循环"],
      compareTitle: "一眼看懂差异",
      traditional: "传统广告公司",
      studio: "StudioOS",
      saveBadge: "节省 60–80%",
      rows: [
        { label: "平均成本", trad: "¥180,000+", studio: "¥36,000" },
        { label: "制作周期", trad: "8–12 周", studio: "72 小时" },
        { label: "创作者触达", trad: "多层中介", studio: "直连网络" },
        { label: "修改机制", trad: "额外收费", studio: "流程内包含" }
      ]
    }
  },
  steps: {
    en: {
      eyebrow: "HOW IT WORKS",
      title: "From brief to final cut — one production flow.",
      subtitle: "",
      items: [
        { num: "01", title: "Share Your Vision", desc: "Upload your brief and references in minutes." },
        { num: "02", title: "Match & Plan", desc: "Portfolio-first matching with vetted studios." },
        { num: "03", title: "Create & Collaborate", desc: "Production, review, and revisions in one flow." },
        { num: "04", title: "Deliver & Scale", desc: "Approve final cut and scale winning creative." }
      ]
    },
    zh: {
      eyebrow: "如何运作",
      title: "从 Brief 到成片 — 一条制作链路。",
      subtitle: "",
      items: [
        { num: "01", title: "分享愿景", desc: "几分钟上传 Brief 与参考素材。" },
        { num: "02", title: "匹配规划", desc: "作品集优先，严选制作方。" },
        { num: "03", title: "创作协作", desc: "制作、审片、修改一站完成。" },
        { num: "04", title: "交付扩展", desc: "验收成片，放大优质创意。" }
      ]
    }
  },
  why: {
    en: {
      line1: "Not a talent marketplace.",
      line2: "Not just proofing software.",
      highlight: "A cross-border ad production network."
    },
    zh: {
      line1: "不是找人平台，",
      line2: "不是审片工具，",
      highlight: "是跨境广告制作网络。"
    }
  },
  work: {
    en: {
      eyebrow: "RECENT WORK",
      title: "Work that speaks for itself",
      viewAll: "View all case studies"
    },
    zh: {
      eyebrow: "精选作品",
      title: "作品自己会说话",
      viewAll: "查看全部案例"
    }
  },
  features: {
    en: {
      networkTitle: "Creator network",
      networkItems: ["Curated creators", "Work certification", "Delivery ratings", "Platform escrow"],
      trustTitle: "Trust & escrow",
      trustItems: ["Payment protection", "Review watermarks", "Version history", "Pay when satisfied"]
    },
    zh: {
      networkTitle: "创作者网络",
      networkItems: ["严选创作者", "作品认证", "交付评分", "平台托管"],
      trustTitle: "信任与托管",
      trustItems: ["付款保护", "审片版水印", "版本记录", "满意后结算"]
    }
  },
  cta: {
    en: {
      title: "Ready to create something amazing?",
      subtitle: "Join thousands of brands already saving 70%+ on cinematic ad production.",
      primary: "Start your project",
      secondary: "Talk to an expert"
    },
    zh: {
      title: "准备好创造令人惊艳的作品了吗？",
      subtitle: "已有数千品牌通过 StudioOS 节省 70% 以上的电影级广告制作成本。",
      primary: "启动你的投放项目",
      secondary: "联系专家"
    }
  }
} as const;

export function landingText<K extends keyof typeof landingCopy>(
  section: K,
  locale: Locale
): (typeof landingCopy)[K]["en"] {
  return landingCopy[section][locale] as (typeof landingCopy)[K]["en"];
}
