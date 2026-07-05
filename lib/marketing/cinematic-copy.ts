import type { Locale } from "@/lib/i18n";

export const cinematicCopy = {
  nav: {
    en: {
      cases: "Work",
      process: "Process",
      pricing: "Pricing",
      resources: "Resources",
      about: "About",
      login: "Log in",
      start: "Start project"
    },
    zh: {
      cases: "案例",
      process: "流程",
      pricing: "价格",
      resources: "资源",
      about: "关于我们",
      login: "登录",
      start: "开始项目"
    }
  },
  hero: {
    en: {
      chapter: "01 — Opening",
      lines: ["Hollywood quality.", "Without Hollywood cost."],
      subtitle:
        "The production OS for global brands — portfolio-first matching, frame-accurate review, and escrow-backed delivery.",
      primary: "I'm a brand",
      secondary: "I'm a creator",
      loggedInPrimary: "Brand portal",
      scroll: "Scroll to enter"
    },
    zh: {
      chapter: "01 — 开场",
      lines: ["好莱坞品质", "无需好莱坞成本"],
      subtitle: "面向全球品牌的制作操作系统 — 作品集优先匹配、帧级审片、托管交付",
      primary: "我是品牌方",
      secondary: "我是创作者",
      loggedInPrimary: "品牌方门户",
      scroll: "向下滚动"
    }
  },
  trust: {
    en: {
      label: "Trusted by teams who ship at paid-social speed",
      brands: ["Google", "Samsung", "Coca-Cola", "Airbnb", "TikTok", "Shopify", "Amazon", "Meta", "Nike", "P&G"]
    },
    zh: {
      label: "服务需要快速出片的全球品牌团队",
      brands: ["Google", "Samsung", "Coca-Cola", "Airbnb", "TikTok", "Shopify", "Amazon", "Meta", "Nike", "P&G"]
    }
  },
  cost: {
    en: {
      chapter: "02 — Cost Break",
      title: "Traditional production, cut open.",
      agency: "Traditional Agency",
      agencyPrice: 50000,
      agencyLabel: "Average campaign",
      studio: "VINCIS",
      studioPrice: 8000,
      studioLabel: "Same deliverable tier",
      save: "Save up to 84%"
    },
    zh: {
      chapter: "02 — 成本切开",
      title: "传统制作模式已经失效",
      agency: "传统广告公司",
      agencyPrice: 360000,
      agencyLabel: "平均投放项目",
      studio: "VINCIS",
      studioPrice: 58000,
      studioLabel: "同等交付标准",
      save: "节省最高 84%"
    }
  },
  network: {
    en: {
      chapter: "03 — Production Network",
      title: "Not a marketplace.",
      highlight: "A curated studio roster.",
      subtitle: "Directors, editors, and AIGC teams — vetted for portfolio quality and delivery discipline.",
      rosterEyebrow: "Live roster",
      statusActive: "In production",
      statusOpen: "Taking briefs",
      matchNote: "Matched in under 48h on average"
    },
    zh: {
      chapter: "03 — 制作网络",
      title: "不是找人平台",
      highlight: "是严选的制作方名册",
      subtitle: "导演、剪辑、AI 制作团队 — 按作品集质量与交付纪律筛选，品牌方直连协作",
      rosterEyebrow: "实时名册",
      statusActive: "制作中",
      statusOpen: "可接需求",
      matchNote: "平均 48 小时内完成匹配"
    }
  },
  filmstrip: {
    en: {
      chapter: "04 — From Brief to Film",
      title: "Five beats. One production line.",
      steps: [
        { key: "brief", label: "Brief", desc: "Publish requirements" },
        { key: "match", label: "Match", desc: "Portfolio-first pairing" },
        { key: "production", label: "Production", desc: "Studio execution" },
        { key: "review", label: "Review", desc: "Frame-accurate proofing" },
        { key: "delivery", label: "Delivery", desc: "Final cut release" }
      ]
    },
    zh: {
      chapter: "04 — 从需求到成片",
      title: "五个节拍，一条制作线",
      steps: [
        { key: "brief", label: "需求", desc: "发布需求" },
        { key: "match", label: "匹配", desc: "作品集匹配" },
        { key: "production", label: "制作", desc: "制作执行" },
        { key: "review", label: "审片", desc: "帧级审片" },
        { key: "delivery", label: "交付", desc: "交付成片" }
      ]
    }
  },
  wall: {
    en: {
      chapter: "05 — Quality Wall",
      title: "Work that speaks before you match.",
      viewAll: "Browse all studios"
    },
    zh: {
      chapter: "05 — 品质墙",
      title: "匹配之前，作品先说话",
      viewAll: "浏览全部制作方"
    }
  },
  escrow: {
    en: {
      chapter: "06 — Escrow Trust",
      title: "Trust built into every frame.",
      items: [
        { title: "Escrow payment", desc: "Funds held until milestones clear." },
        { title: "Review protection", desc: "Watermarked proofs, version history." },
        { title: "Delivery unlock", desc: "Release payment when you approve." }
      ]
    },
    zh: {
      chapter: "06 — 托管信任",
      title: "每一帧都有信任机制",
      items: [
        { title: "资金托管", desc: "里程碑达成前资金锁定" },
        { title: "审片保护", desc: "水印样片，版本完整留痕" },
        { title: "交付解锁", desc: "验收满意后释放付款" }
      ]
    }
  },
  cta: {
    en: {
      chapter: "07 — Final Cut",
      title: "Ready for your next blockbuster?",
      subtitle: "Join brands already producing cinema-grade ads at a fraction of agency cost.",
      primary: "Start your campaign",
      secondary: "Talk to an expert"
    },
    zh: {
      chapter: "07 — 终场",
      title: "下一支电影级广告，从这里开始",
      subtitle: "已有品牌以远低于代理成本，持续产出电影级广告",
      primary: "启动投放项目",
      secondary: "联系专家"
    }
  }
} as const;

export function cinematicText<K extends keyof typeof cinematicCopy>(
  section: K,
  locale: Locale
): (typeof cinematicCopy)[K]["en"] {
  return cinematicCopy[section][locale] as (typeof cinematicCopy)[K]["en"];
}
