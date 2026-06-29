import type { Locale } from "@/lib/i18n";

export const cinematicCopy = {
  nav: {
    en: {
      cases: "Work",
      process: "Process",
      login: "Log in",
      start: "Start project"
    },
    zh: {
      cases: "案例",
      process: "流程",
      login: "登录",
      start: "开始项目"
    }
  },
  hero: {
    en: {
      chapter: "01 — Opening",
      lines: ["Hollywood-level ads.", "Lowest production budget.", "Global creator network."],
      subtitle: "A cross-border production OS — from brief to final cut, with cinema-grade quality.",
      primary: "I'm a brand",
      secondary: "I'm a creator",
      scroll: "Scroll to enter"
    },
    zh: {
      chapter: "01 — 开场",
      lines: ["好莱坞级广告。", "最低制作预算。", "全球创作者网络。"],
      subtitle: "跨境广告制作系统 — 从 Brief 到成片，电影级品质一站完成。",
      primary: "我是广告商",
      secondary: "我是创作者",
      scroll: "向下进入"
    }
  },
  cost: {
    en: {
      chapter: "02 — Cost Break",
      title: "Traditional production, cut open.",
      agency: "Traditional Agency",
      agencyPrice: 50000,
      agencyLabel: "Average campaign",
      studio: "StudioOS",
      studioPrice: 8000,
      studioLabel: "Same deliverable tier",
      save: "Save up to 84%"
    },
    zh: {
      chapter: "02 — 成本切开",
      title: "传统制作模式，被切开。",
      agency: "传统广告公司",
      agencyPrice: 360000,
      agencyLabel: "平均投放项目",
      studio: "StudioOS",
      studioPrice: 58000,
      studioLabel: "同等交付标准",
      save: "节省最高 84%"
    }
  },
  network: {
    en: {
      chapter: "03 — Production Network",
      title: "Not a marketplace.",
      highlight: "A living production network.",
      subtitle: "Studios, directors, and AIGC teams — connected in real time across time zones."
    },
    zh: {
      chapter: "03 — 制作网络",
      title: "不是找人平台。",
      highlight: "是流动的制作网络。",
      subtitle: "工作室、导演、AIGC 团队 — 跨时区实时连接。"
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
      chapter: "04 — 从 Brief 到成片",
      title: "五个节拍，一条制作线。",
      steps: [
        { key: "brief", label: "Brief", desc: "发布需求" },
        { key: "match", label: "Match", desc: "作品集匹配" },
        { key: "production", label: "Production", desc: "制作执行" },
        { key: "review", label: "Review", desc: "帧级审片" },
        { key: "delivery", label: "Delivery", desc: "交付成片" }
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
      title: "匹配之前，作品先说话。",
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
      title: "每一帧都有信任机制。",
      items: [
        { title: "资金托管", desc: "里程碑达成前资金锁定。" },
        { title: "审片保护", desc: "水印样片，版本完整留痕。" },
        { title: "交付解锁", desc: "验收满意后释放付款。" }
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
      title: "准备好你的下一支大片了吗？",
      subtitle: "已有品牌以远低于代理成本，持续产出电影级广告。",
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
