import type { Locale } from "@/lib/i18n";

export type AboutCopy = {
  pageTitle: string;
  sidebar: {
    about: string;
    cases: string;
    process: string;
    faq: string;
    aiAssistant: string;
    ctaTitle: string;
    ctaBody: string;
    ctaButton: string;
    darkMode: string;
  };
  hero: {
    title: string;
    paragraphs: string[];
    features: Array<{ title: string; body: string }>;
    watchFilm: string;
    filmDuration: string;
  };
  quickNav: Array<{ id: string; label: string }>;
  story: {
    eyebrow: string;
    title: string;
    paragraphs: string[];
    quote: string;
    moreLink: string;
  };
  mission: {
    title: string;
    body: string;
    bullets: string[];
    moreLink: string;
  };
  why: {
    title: string;
    paragraphs: string[];
    bullets: string[];
    moreLink: string;
  };
  values: {
    title: string;
    items: Array<{ title: string; body: string }>;
    moreLink: string;
  };
  platform: {
    title: string;
    subtitle: string;
    items: string[];
    closing: string;
  };
  stats: Array<{ value: string; label: string }>;
  team: {
    title: string;
    body: string;
    moreLink: string;
    members: Array<{ name: string; role: string }>;
  };
  press: {
    title: string;
    body: string;
    items: string[];
    downloadLink: string;
    note: string;
  };
  contact: {
    title: string;
    body: string;
    business: string;
    press: string;
    support: string;
    website: string;
    sendMessage: string;
  };
  closing: {
    en: string;
    local: string;
  };
};

const zh: AboutCopy = {
  pageTitle: "关于我们",
  sidebar: {
    about: "关于我们",
    cases: "成功案例",
    process: "流程",
    faq: "常见问题",
    aiAssistant: "AI 助手",
    ctaTitle: "准备好开始创作了吗？",
    ctaBody: "连接全球创作者，让您的创意成为现实。",
    ctaButton: "立即开始",
    darkMode: "深色模式"
  },
  hero: {
    title: "连接每一个创意，让每一次合作更简单。",
    paragraphs: [
      "VINCIS 是一个面向全球的 AI 广告创作平台，连接品牌与创作者，让创意从一个想法开始，到最终作品交付，都能够在同一个平台高效完成。",
      "从需求发布、智能匹配、项目协作、版本审核到托管支付与最终交付，我们重新设计了整个广告制作流程，让复杂的创作合作变得更加简单、透明\u2060与高效。",
      "我们相信，优秀的创意不应该因为地域、资源或沟通成本而被埋没。\n无论你是一家正在寻找优质广告的品牌，还是一位拥有创作能力的 AI 创作者，VINCIS 都希望帮助你更快找到彼此，并建立值得信赖的合作关系。"
    ],
    features: [
      {
        title: "让品牌更容易找到优秀的创作者。",
        body: "通过智能匹配与真实作品数据，帮助品牌快速找到风格契合的创作者。"
      },
      {
        title: "让创作者获得更多来自全球的项目机会。",
        body: "连接全球品牌需求，让更多创作者获得稳定、高质量的合作机会。"
      },
      {
        title: "让 AI 成为提高效率的工具，而不是取代创造力。",
        body: "AI 负责流程优化与协作效率，创意与决策始终由人主导。"
      },
      {
        title: "让广告制作变得更加透明、公平、高效。",
        body: "从报价、协作到审片与支付，全流程透明可追溯。"
      }
    ],
    watchFilm: "观看品牌影片",
    filmDuration: "1:35"
  },
  quickNav: [
    { id: "story", label: "品牌故事" },
    { id: "mission", label: "我们的使命" },
    { id: "why", label: "为什么创立 VINCIS" },
    { id: "values", label: "我们的价值观" },
    { id: "contact", label: "联系我们" },
    { id: "press", label: "媒体资料" }
  ],
  story: {
    eyebrow: "品牌故事",
    title: "Our Story",
    paragraphs: [
      "Every great story begins with a connection.",
      "AI 视频正在让高质量广告更容易被创作，但品牌仍然很难快速找到真正合适的创作者，创作者也缺少稳定、高质量的项目机会。",
      "能力难判断、沟通成本高、流程不透明、付款缺乏保障、修改效率低，仍然是行业里最常见的问题。",
      "VINCIS 因此诞生：连接全球品牌与创作者，让每一次合作都更透明、更专业、更值得信任。"
    ],
    quote: "Every great story begins with a connection.",
    moreLink: "了解更多故事"
  },
  mission: {
    title: "我们的使命",
    body: "我们的使命很简单：连接全球品牌与创作者，让每一个优秀创意都有机会成为现实。",
    bullets: [
      "让品牌更容易找到优秀的创作者。",
      "让创作者获得更多来自全球的项目机会。",
      "让 AI 成为提高效率的工具，而不是取代创造力。",
      "让广告制作变得更加透明、公平、高效。"
    ],
    moreLink: "联系我们"
  },
  why: {
    title: "为什么创立 VINCIS",
    paragraphs: [
      "我们的目标并不是再做一个作品展示网站，也不是一个简单的接单平台。VINCIS 希望重新定义 AI 广告制作的合作方式。",
      "在这里，品牌不需要花费大量时间寻找合适的团队；创作者也不需要不断推销自己寻找机会。AI 会帮助双方完成更精准的匹配，让真正优秀的创作者获得更多机会，让品牌以更合理的成本完成更高质量的作品。",
      "技术不是目的。帮助人与人更高效地合作，才是 VINCIS 存在的意义。"
    ],
    bullets: [
      "AI 驱动的精准匹配，而非人海搜索",
      "透明流程与托管支付，建立信任",
      "专注协作效率，而非简单信息展示"
    ],
    moreLink: "了解更多"
  },
  values: {
    title: "我们的价值观",
    items: [
      {
        title: "创意第一",
        body: "优秀的作品永远来自优秀的创意。AI 可以提升效率，但真正打动人的，始终是创作者的想法。"
      },
      {
        title: "信任协作",
        body: "每一个项目都值得被认真对待。通过透明的流程、版本管理、托管支付和完整的协作机制，让品牌与创作者都能够安心合作。"
      },
      {
        title: "全球连接",
        body: "优秀的创作者遍布世界各地。我们希望帮助更多品牌跨越地域限制，与真正适合自己的创作者建立合作。"
      },
      {
        title: "持续创新",
        body: "AI 正在改变创作方式。VINCIS 将持续探索新的技术、新的工作流程和新的协作模式，让创意制作变得更加简单。"
      }
    ],
    moreLink: "了解更多"
  },
  platform: {
    title: "我们打造的平台",
    subtitle: "VINCIS 提供完整的广告制作协作体验，包括：",
    items: [
      "AI 智能需求整理",
      "全球创作者匹配",
      "项目协作与沟通",
      "多版本管理",
      "在线审片中心",
      "托管支付（Escrow）",
      "AI 创意助手",
      "全球多语言支持",
      "数据驱动的智能报价系统"
    ],
    closing: "让品牌能够专注于创意，让创作者专注于创作。"
  },
  stats: [
    { value: "10,000+", label: "全球创作者" },
    { value: "2,000+", label: "品牌客户" },
    { value: "15,000+", label: "完成项目" },
    { value: "70+", label: "覆盖国家和地区" }
  ],
  team: {
    title: "全球团队",
    body: "VINCIS 是一个面向全球市场打造的平台。我们的团队拥有广告创意、影视制作、AI 技术、产品设计与软件工程等不同背景，并持续与来自世界各地的品牌、创作者和合作伙伴共同完善平台。",
    moreLink: "了解我们的团队",
    members: [
      { name: "李国威", role: "创始人 & CEO" },
      { name: "陈雅文", role: "产品负责人" },
      { name: "Marcus Lee", role: "创意总监" },
      { name: "Sarah Kim", role: "工程负责人" }
    ]
  },
  press: {
    title: "媒体资料",
    body: "欢迎媒体、合作伙伴及行业机构了解 VINCIS。",
    items: ["品牌介绍", "Logo 与品牌规范", "官方宣传图片", "产品截图", "品牌影片", "新闻资料", "联系方式"],
    downloadLink: "下载资源包",
    note: "如需采访、商务合作或媒体授权，请联系我们。"
  },
  contact: {
    title: "联系我们",
    body: "无论你是品牌、创作者、媒体还是合作伙伴，我们都期待与你建立联系。",
    business: "商务合作",
    press: "媒体合作",
    support: "客户支持",
    website: "官方网站",
    sendMessage: "发送消息"
  },
  closing: {
    en: "Every great story begins with a connection.",
    local: "每一个伟大的故事，都始于一次连接。VINCIS 希望成为连接全球品牌与创作者的桥梁，让更多优秀的创意跨越语言、地域与行业边界，从一个想法开始，最终成为真正影响世界的作品。"
  }
};

const en: AboutCopy = {
  pageTitle: "About us",
  sidebar: {
    about: "About us",
    cases: "Case studies",
    process: "Process",
    faq: "FAQ",
    aiAssistant: "AI assistant",
    ctaTitle: "Ready to create?",
    ctaBody: "Connect with global creators and bring your ideas to life.",
    ctaButton: "Get started",
    darkMode: "Dark mode"
  },
  hero: {
    title: "Connect every idea. Make every collaboration simpler.",
    paragraphs: [
      "VINCIS is a global AI advertising platform that connects brands and creators so ideas can move from brief to final delivery in one place.",
      "From brief publishing and intelligent matching to collaboration, version review, escrow payments, and final delivery, we redesigned the full production workflow to be simpler, more transparent, and more efficient.",
      "Great creative work should not be limited by geography, resources, or communication overhead.\nWhether you are a brand looking for quality ads or a creator with AI production skills, VINCIS helps you find the right partner faster and build trust."
    ],
    features: [
      {
        title: "Help brands find excellent creators more easily.",
        body: "Intelligent matching and real portfolio data help brands find the right studio faster."
      },
      {
        title: "Give creators more global project opportunities.",
        body: "Connect creators to global brand demand with more stable, high-quality collaborations."
      },
      {
        title: "Use AI to improve efficiency, not replace creativity.",
        body: "AI optimizes workflow and collaboration while creative decisions stay human-led."
      },
      {
        title: "Make advertising production more transparent, fair, and efficient.",
        body: "From pricing and collaboration to review and payment, the full process stays traceable."
      }
    ],
    watchFilm: "Watch brand film",
    filmDuration: "1:35"
  },
  quickNav: [
    { id: "story", label: "Our story" },
    { id: "mission", label: "Mission" },
    { id: "why", label: "Why VINCIS" },
    { id: "values", label: "Values" },
    { id: "contact", label: "Contact" },
    { id: "press", label: "Press kit" }
  ],
  story: {
    eyebrow: "Our story",
    title: "Our Story",
    paragraphs: [
      "Every great product starts with a real problem.",
      "AI video has advanced quickly, and more creators are producing high-quality ads with AI. Yet brands still struggle to find the right talent, and creators still struggle to access stable, high-quality opportunities.",
      "Brands cannot easily tell who can truly deliver. Creators cannot easily find reliable projects. High communication cost, messy workflows, weak payment protection, and slow revision cycles remain the norm.",
      "VINCIS was built in that context—to connect global brands and creators on a foundation of transparency, professionalism, and trust."
    ],
    quote: "Every great story begins with a connection.",
    moreLink: "Read more"
  },
  mission: {
    title: "Our mission",
    body: "Our mission is simple: connect global brands and creators so every strong idea has a chance to become real.",
    bullets: [
      "Help brands find excellent creators more easily.",
      "Give creators more global project opportunities.",
      "Use AI to improve efficiency, not replace creativity.",
      "Make advertising production more transparent, fair, and efficient."
    ],
    moreLink: "Contact us"
  },
  why: {
    title: "Why VINCIS",
    paragraphs: [
      "We are not building another portfolio site or a basic job board. VINCIS is redefining how AI advertising collaborations work.",
      "Brands should not spend weeks hunting for the right team. Creators should not spend all their time pitching. AI helps both sides match more precisely so great creators get more opportunities and brands get better work at fair cost.",
      "Technology is not the goal. Helping people collaborate better is why VINCIS exists."
    ],
    bullets: [
      "AI-powered matching instead of manual search",
      "Transparent workflow with escrow protection",
      "Built for collaboration, not just listings"
    ],
    moreLink: "Learn more"
  },
  values: {
    title: "Our values",
    items: [
      {
        title: "Creativity first",
        body: "Great work starts with great ideas. AI improves speed; creators supply the vision that moves people."
      },
      {
        title: "Trusted collaboration",
        body: "Every project matters. Transparent workflow, version control, escrow, and structured collaboration keep both sides confident."
      },
      {
        title: "Global connection",
        body: "Talent is everywhere. We help brands work across borders with creators who truly fit their needs."
      },
      {
        title: "Continuous innovation",
        body: "AI is changing how work gets made. VINCIS keeps exploring better tools, workflows, and collaboration models."
      }
    ],
    moreLink: "Learn more"
  },
  platform: {
    title: "What we build",
    subtitle: "VINCIS delivers the full advertising collaboration stack:",
    items: [
      "AI brief structuring",
      "Global creator matching",
      "Project collaboration",
      "Multi-version management",
      "Online review center",
      "Escrow payments",
      "AI creative assistant",
      "Multilingual support",
      "Data-driven pricing engine"
    ],
    closing: "So brands can focus on creative direction and creators can focus on making."
  },
  stats: [
    { value: "10,000+", label: "Global creators" },
    { value: "2,000+", label: "Brand clients" },
    { value: "15,000+", label: "Completed projects" },
    { value: "70+", label: "Countries & regions" }
  ],
  team: {
    title: "Global team",
    body: "VINCIS is built for a global market. Our team spans advertising, film production, AI, product design, and engineering—and we keep improving the platform with brands, creators, and partners worldwide.",
    moreLink: "Meet the team",
    members: [
      { name: "Guowei Li", role: "Founder & CEO" },
      { name: "Yawen Chen", role: "Head of Product" },
      { name: "Marcus Lee", role: "Creative Director" },
      { name: "Sarah Kim", role: "Head of Engineering" }
    ]
  },
  press: {
    title: "Press kit",
    body: "Media, partners, and industry organizations are welcome to learn more about VINCIS.",
    items: [
      "Brand overview",
      "Logo & brand guidelines",
      "Official imagery",
      "Product screenshots",
      "Brand film",
      "Press materials",
      "Contact information"
    ],
    downloadLink: "Download press kit",
    note: "For interviews, partnerships, or media licensing, please contact us."
  },
  contact: {
    title: "Contact",
    body: "Whether you are a brand, creator, journalist, or partner—we would like to hear from you.",
    business: "Business",
    press: "Press",
    support: "Support",
    website: "Website",
    sendMessage: "Send a message"
  },
  closing: {
    en: "Every great story begins with a connection.",
    local:
      "Every great story begins with a connection. VINCIS aims to be the bridge between global brands and creators—so strong ideas can cross language, geography, and industry boundaries and become work that matters."
  }
};

export function aboutText(locale: Locale): AboutCopy {
  return locale === "zh" ? zh : en;
}
