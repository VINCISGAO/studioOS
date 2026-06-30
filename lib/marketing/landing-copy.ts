import type { Locale } from "@/lib/i18n";

/** StudioOS marketing copy. */
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
      panelSubtitle: "选择您的工作台 — 品牌方发起项目，创作者交付电影级作品",
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
      leftFootnote: "全球品牌信赖 — 作品集优先匹配、帧级审片、托管交付"
    }
  },
  hero: {
    en: {
      eyebrow: "Commercial production infrastructure for global brands",
      titleLine1: "Launch cinematic ads",
      titleHighlight: "with an operating system",
      titleLine2: "built for modern production.",
      subtitle:
        "StudioOS connects brand teams with vetted AI production studios, structured review rooms, escrow-backed delivery, and performance-ready creative workflows.",
      primary: "Start as a brand",
      secondary: "Join as a studio",
      trusted: "Built for brand teams shipping paid-social creative at speed",
      showreel: "View the workflow"
    },
    zh: {
      eyebrow: "面向全球品牌的商业制作基础设施",
      titleLine1: "好莱坞品质",
      titleHighlight: "无需好莱坞成本",
      titleLine2: "",
      subtitle:
        "StudioOS 连接品牌团队与严选 AI 制作方，提供结构化需求简报、帧级审片、资金托管交付与适合投放的创意生产流程",
      primary: "我是项目方",
      secondary: "我是创作者",
      trusted: "为需要高速投放素材的品牌团队而建",
      showreel: "查看流程"
    }
  },
  heroFeatures: {
    en: [
      { title: "Studio matching", desc: "Vetted teams ranked by portfolio fit", icon: "users" as const },
      { title: "Review rooms", desc: "Frame notes, versions, and approvals", icon: "play" as const },
      { title: "Escrow workflow", desc: "Milestone-based payment protection", icon: "shield" as const },
      { title: "Creative velocity", desc: "Launch more tests with fewer layers", icon: "zap" as const }
    ],
    zh: [
      { title: "制作方匹配", desc: "按作品集与品类精准推荐", icon: "users" as const },
      { title: "审片工作室", desc: "帧级批注、版本、审批统一管理", icon: "play" as const },
      { title: "托管流程", desc: "按里程碑保护付款与交付", icon: "shield" as const },
      { title: "创意速度", desc: "减少中间层，快速测试更多素材", icon: "zap" as const }
    ]
  },
  stats: {
    en: [
      { value: "70%", suffix: "↓", label: "Typical cost reduction" },
      { value: "72h", suffix: "", label: "First concept window" },
      { value: "4K", suffix: "", label: "Delivery standard" },
      { value: "2000+", suffix: "", label: "Vetted studio network" }
    ],
    zh: [
      { value: "70%", suffix: "↓", label: "典型成本下降" },
      { value: "72h", suffix: "", label: "首轮方案窗口" },
      { value: "4K", suffix: "", label: "交付标准" },
      { value: "2000+", suffix: "", label: "严选制作网络" }
    ]
  },
  logos: {
    en: {
      label: "Production model designed for modern marketing teams",
      brands: ["Strategy", "Brief", "Match", "Review", "Escrow", "Delivery", "Rights", "Analytics"]
    },
    zh: {
      label: "为现代市场团队设计的制作模型",
      brands: ["策略", "简报", "匹配", "审片", "托管", "交付", "版权", "分析"]
    }
  },
  cost: {
    en: {
      title: "Traditional ad production is broken",
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
      title: "传统广告制作模式已经失效",
      body: "代理层层加价、周期冗长、修改不透明 — 品牌方却仍需在付费社交节奏下拿到电影级成片",
      pains: ["代理层层加价", "8–12 周制作周期", "创作者触达受限", "修改陷入循环"],
      compareTitle: "一眼看懂差异",
      traditional: "传统广告公司",
      studio: "StudioOS",
      saveBadge: "节省 60–80%",
      rows: [
        { label: "平均成本", trad: "$20,000+", studio: "$200+" },
        { label: "制作周期", trad: "8–12 周", studio: "72 小时" },
        { label: "创作者触达", trad: "多层中介", studio: "直连网络" },
        { label: "修改机制", trad: "额外收费", studio: "流程内包含" }
      ]
    }
  },
  steps: {
    en: {
      eyebrow: "HOW IT WORKS",
      title: "From brief to final cut, one production flow",
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
      title: "从需求简报到成片交付",
      subtitle: "",
      items: [
        { num: "01", title: "提交需求", desc: "上传目标、参考素材与投放要求" },
        { num: "02", title: "匹配制作方", desc: "按品类、风格与作品质量推荐团队" },
        { num: "03", title: "制作协作", desc: "制作、审片、修改在同一流程推进" },
        { num: "04", title: "成片交付", desc: "验收最终版本并释放交付资产" }
      ]
    }
  },
  why: {
    en: {
      eyebrow: "Platform position",
      titleLine1: "Move commercial production out of manual coordination",
      titleLine2: "into one controlled operating system",
      subtitle:
        "StudioOS gives brand teams one place to brief, match studios, review cuts, protect payment, and release campaign-ready assets.",
      items: ["Structured brief intake", "Vetted studio matching", "Frame review and escrow delivery"],
      trustLabel: "Built for global brand standards",
      brands: ["Google", "Coca-Cola", "Samsung", "Airbnb", "TikTok", "Shopify", "Amazon", "Meta"]
    },
    zh: {
      eyebrow: "产品定位",
      titleLine1: "把广告制作从人工协调",
      titleLine2: "升级成一套可控的制作系统",
      subtitle:
        "StudioOS 让品牌团队在一个工作流里完成需求简报、制作方匹配、审片、资金托管和成片交付",
      items: ["把需求变成可执行简报", "按作品集匹配制作团队", "用审片与托管锁定交付质量"],
      trustLabel: "以全球品牌级标准设计",
      brands: ["Google", "Coca-Cola", "Samsung", "Airbnb", "TikTok", "Shopify", "Amazon", "Meta"]
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
      title: "Bring your next campaign into a real production system",
      subtitle: "Start with a structured brief, matched studios, protected milestones, and a review room your team can actually use.",
      primary: "Start your project",
      secondary: "Talk to an expert"
    },
    zh: {
      title: "把下一次广告项目放进制作系统",
      subtitle: "从结构化需求、制作方匹配、里程碑托管，到团队可用的审片工作室，一次完成",
      primary: "启动投放项目",
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
