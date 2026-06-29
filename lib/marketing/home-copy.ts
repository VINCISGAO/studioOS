import type { Locale } from "@/lib/i18n";

/** Homepage marketing copy — sections 01–08. */
export const homePageCopy = {
  hero: {
    en: {
      eyebrow: "Cross-border ad production network",
      titleLine1: "Hollywood-level ads,",
      titleHighlight: "at the lowest budget",
      titleLine2: "",
      subtitle:
        "We connect expensive overseas ad production demand with China's top creator productivity — so brands get cinematic commercials at a fraction of the cost.",
      primary: "I'm a brand",
      secondary: "I'm a creator"
    },
    zh: {
      eyebrow: "跨境广告制作网络",
      titleLine1: "最低的预算，",
      titleHighlight: "好莱坞级别",
      titleLine2: "的广告",
      subtitle:
        "把国外昂贵广告制作需求，与中国优秀创作者的高效生产力连接起来，让品牌用更低成本获得电影级广告。",
      primary: "我是广告商",
      secondary: "我是创作者"
    }
  },
  costComparison: {
    en: {
      eyebrow: "Cost comparison",
      title: "Traditional agency vs StudioOS",
      traditional: "Traditional agency",
      studio: "StudioOS production",
      saveLabel: "Save",
      saveRange: "60–80%",
      traditionalItems: ["$15k–$80k per spot", "8–12 week cycles", "Opaque markups"],
      studioItems: ["Direct creator rates", "72h to first cut", "Escrow-backed delivery"]
    },
    zh: {
      eyebrow: "成本对比",
      title: "传统广告公司报价 vs StudioOS 制作成本",
      traditional: "传统广告公司",
      studio: "StudioOS 制作",
      saveLabel: "节省",
      saveRange: "60–80%",
      traditionalItems: ["单条 $15k–$80k", "8–12 周周期", "中间层加价不透明"],
      studioItems: ["直连创作者报价", "72 小时出初剪", "托管交付保障"]
    }
  },
  howItWorks: {
    en: {
      eyebrow: "How it works",
      title: "From brief to final cut in one flow",
      steps: [
        "Post your brief",
        "AI organizes Brief",
        "Match creators",
        "Escrow payment",
        "Review & revise",
        "Deliver final film"
      ]
    },
    zh: {
      eyebrow: "如何运作",
      title: "从发布需求到交付成片",
      steps: ["发布需求", "AI 整理 Brief", "匹配创作者", "托管付款", "审片修改", "交付成片"]
    }
  },
  whyStudioOS: {
    en: {
      eyebrow: "Why StudioOS",
      title: "Not a freelancer marketplace. Not just a review tool.",
      highlight: "A cross-border ad production network.",
      notItems: ["Not a talent marketplace", "Not just proofing software", "Not another agency layer"],
      body: "StudioOS is the infrastructure layer — connecting global brand demand with vetted Chinese creators, AI-assisted briefs, escrow, and frame-accurate review in one OS."
    },
    zh: {
      eyebrow: "为什么选择 StudioOS",
      title: "不是找人平台，不是审片工具，",
      highlight: "是跨境广告制作网络。",
      notItems: ["不是自由职业者平台", "不只是审片软件", "不是多一层代理加价"],
      body: "StudioOS 是基础设施层 — 连接全球品牌需求与中国严选创作者，AI 辅助简报、托管结算与帧级审片，一套系统完成。"
    }
  },
  qualityProof: {
    en: {
      eyebrow: "Quality proof",
      title: "Cinema-grade output, every format",
      formats: ["4K", "CG", "Short film ads", "Social ads", "Product ads", "Brand films"]
    },
    zh: {
      eyebrow: "品质证明",
      title: "电影级品质，全格式覆盖",
      formats: ["4K", "CG", "短片广告", "社媒广告", "产品广告", "品牌片"]
    }
  },
  creatorNetwork: {
    en: {
      eyebrow: "Creator network",
      title: "Vetted creators, platform-backed delivery",
      items: [
        { title: "Curated creators", body: "Hand-picked studios with proven ad portfolios." },
        { title: "Work certification", body: "Every deliverable verified against brief standards." },
        { title: "Delivery ratings", body: "Transparent scores from brands and platform QA." },
        { title: "Platform escrow", body: "Funds held until you approve the final cut." }
      ]
    },
    zh: {
      eyebrow: "创作者网络",
      title: "严选创作者，平台保障交付",
      items: [
        { title: "严选创作者", body: "精选有广告作品集的专业制作方。" },
        { title: "作品认证", body: "每条交付物对照 Brief 标准核验。" },
        { title: "交付评分", body: "品牌与平台质检的透明评分体系。" },
        { title: "平台托管", body: "资金托管，满意后再结算。" }
      ]
    }
  },
  trustEscrow: {
    en: {
      eyebrow: "Trust & escrow",
      title: "Your budget is protected at every step",
      items: [
        { title: "Payment protection", body: "Escrow holds funds until delivery is approved." },
        { title: "Review watermarks", body: "Screeners watermarked until final sign-off." },
        { title: "Version history", body: "Every cut, comment, and approval on record." },
        { title: "Pay when satisfied", body: "Release payment only after you approve." }
      ]
    },
    zh: {
      eyebrow: "信任与托管",
      title: "每一步，预算都有保障",
      items: [
        { title: "付款保护", body: "资金托管，交付确认前不释放。" },
        { title: "审片版水印", body: "终审前所有审片版本带水印保护。" },
        { title: "版本记录", body: "每一版剪辑、评论与审批完整留痕。" },
        { title: "满意后结算", body: "确认满意后再向创作者结算。" }
      ]
    }
  },
  cta: {
    en: {
      title: "Start Your Campaign",
      subtitle: "Post a brief in minutes. Match vetted creators. Deliver cinematic ads at a fraction of agency cost.",
      primary: "Start Your Campaign",
      secondary: "Talk to us"
    },
    zh: {
      title: "启动你的投放项目",
      subtitle: "几分钟发布需求，匹配严选创作者，以远低于代理公司的成本交付电影级广告。",
      primary: "启动你的投放项目",
      secondary: "联系我们"
    }
  }
} as const;

export function homeCopy<K extends keyof typeof homePageCopy>(
  section: K,
  locale: Locale
): (typeof homePageCopy)[K]["en"] {
  return homePageCopy[section][locale] as (typeof homePageCopy)[K]["en"];
}
