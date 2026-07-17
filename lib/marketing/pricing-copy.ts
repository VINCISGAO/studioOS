import type { MarketingLocale } from "@/lib/i18n";
import pricingBundles from "@/lib/marketing/i18n/bundles/pricing.json";
import { resolveMarketingCopy } from "@/lib/marketing/i18n/resolve-marketing-copy";

export type BudgetTierTheme = "blue" | "purple" | "orange" | "green";

export type PricingCopy = {
  eyebrow: string;
  title: string;
  titleAccent: string;
  intro: string;
  philosophy: string;
  principles: Array<{ title: string; body: string }>;
  budgetTitle: string;
  budgetSubtitle: string;
  budgetTiers: Array<{
    title: string;
    subtitle: string;
    badge?: string;
    audience: string;
    features: string[];
    theme: BudgetTierTheme;
  }>;
  trustTitle: string;
  trustPoints: Array<{ title: string; body: string }>;
  serviceFeeTitle: string;
  serviceFeeSubtitle: string;
  serviceFeeIntro: string;
  serviceFeeIncludesTitle: string;
  serviceFeeSplitTitle: string;
  serviceFeeSplit: Array<{ label: string; value: string }>;
  serviceFeeTierTitle: string;
  serviceFeeTierColumns: [string, string, string];
  serviceFeeTiers: Array<{ title: string; rate: string; note: string }>;
  serviceFeeNote: string;
  closingTitleLead: string;
  closingTitleAccent: string;
  closingBody: string[];
  closingCta: string;
  closingNote: string;
};

export const pricingCopyZhCN: PricingCopy = {
  eyebrow: "价格",
  title: "透明定价，让每个广告项目",
  titleAccent: "更容易开始。",
  intro:
    "VINCIS 通过智能制作估价引擎，根据项目复杂度、视频长度、交付速度等因素，为您提供透明、合理的专业报价。",
  philosophy:
    "VINCIS 不追求最低价，而是通过合理预算 × 高质量交付 × 创作者可持续收益，确保每一次合作都建立在公平与信任之上。",
  principles: [
    {
      title: "智能估价",
      body: "基于真实制作数据与历史成交，智能计算合理预算区间，告别盲目报价。"
    },
    {
      title: "成本透明",
      body: "平台服务费覆盖智能匹配、托管、审片、协作、存储与安全保障等完整基础设施，每一项都有明确依据。"
    },
    {
      title: "托管支付保障",
      body: "资金平台托管，确认交付后放款，品牌与创作者双向保障，安全无忧。"
    },
    {
      title: "创作者可持续收益",
      body: "品牌付款中 80% 直接归属创作者，平台服务费用于支撑完整交易基础设施与长期生态。"
    }
  ],
  budgetTitle: "预算如何理解？",
  budgetSubtitle: "不同预算等级，匹配不同的项目需求与创作资源",
  budgetTiers: [
    {
      title: "基础预算",
      subtitle: "快速启动创意",
      audience: "适合轻量项目",
      theme: "blue",
      features: [
        "适合产品展示类广告",
        "15-30 秒短视频",
        "满足基础制作需求",
        "快速验证创意方向"
      ]
    },
    {
      title: "推荐预算",
      subtitle: "兼顾质量与效率",
      badge: "推荐",
      audience: "大多数品牌的选择",
      theme: "purple",
      features: [
        "30-60 秒商业广告",
        "更高创意与制作标准",
        "优先匹配优质创作者",
        "平台推荐预算区间"
      ]
    },
    {
      title: "优先预算",
      subtitle: "更高品质要求",
      audience: "适用于高要求项目",
      theme: "orange",
      features: [
        "60 秒以上精品广告",
        "匹配资深创作者",
        "更快响应与交付",
        "更高制作稳定性"
      ]
    },
    {
      title: "顶级预算",
      subtitle: "电影级制作标准",
      audience: "大型品牌与定制项目",
      theme: "green",
      features: [
        "品牌宣传片与电影感广告",
        "全球顶级创作者团队",
        "定制化全流程服务",
        "专属创意与执行支持"
      ]
    }
  ],
  trustTitle: "为什么相信 VINCIS 的报价？",
  trustPoints: [
    {
      title: "真实成本模型",
      body: "基于真实制作样本与历史成交数据，而不是市场喊价。"
    },
    {
      title: "智能计算",
      body: "综合项目复杂度自动计算，报价准确且公平。"
    },
    {
      title: "创作者生态保障",
      body: "合理定价保障创作者收益，吸引全球优秀制作团队。"
    },
    {
      title: "持续学习进化",
      body: "每完成一个项目，模型持续优化下一次报价。"
    }
  ],
  serviceFeeTitle: "平台服务费",
  serviceFeeSubtitle: "您购买的是完整广告交易基础设施，而不是联系人列表",
  serviceFeeIntro:
    "VINCIS 是完整的广告交易平台。平台服务费（Production Service Fee）用于支撑 AI 创意分析、全球 Creator 匹配、托管支付、在线审片、项目协作、文件存储、安全保障及平台运营等完整服务。",
  serviceFeeIncludesTitle: "平台服务费包含",
  serviceFeeSplitTitle: "资金如何分配",
  serviceFeeSplit: [
    { label: "品牌支付", value: "100%" },
    { label: "Creator 收益", value: "80%" },
    { label: "平台服务费", value: "20%（默认标准）" }
  ],
  serviceFeeTierTitle: "按合作层级收取",
  serviceFeeTierColumns: ["客户类型", "平台服务费", "说明"],
  serviceFeeTiers: [
    { title: "标准项目", rate: "20%", note: "默认标准费率，覆盖完整平台基础设施成本" },
    { title: "年度合作客户", rate: "18%", note: "长期合作激励，兼顾客户竞争力与平台健康毛利" },
    { title: "企业客户", rate: "15%", note: "Enterprise 定制合作，可按协议单独约定" }
  ],
  serviceFeeNote:
    "20% 为默认标准平台服务费，而非唯一固定费率。我们统一使用「平台服务费」表述，不使用「抽成」一词。",
  closingTitleLead: "不是最低价，",
  closingTitleAccent: "而是最值得成交的价格。",
  closingBody: [
    "优秀的广告需要合理预算。过低的价格往往意味着更少投入与更高风险。",
    "VINCIS 帮助品牌用合理预算获得更高质量作品，也让每一次合作更值得成交。"
  ],
  closingCta: "获取 AI 智能估价",
  closingNote: "快速响应 · 安全可靠"
};

export const pricingCopyEn: PricingCopy = {
  eyebrow: "Pricing",
  title: "Transparent pricing that makes every campaign ",
  titleAccent: "easier to start.",
  intro:
    "VINCIS uses an AI Production Pricing Engine to deliver transparent, professional quotes based on complexity, duration, delivery speed, and more.",
  philosophy:
    "VINCIS does not chase the lowest price. We build every deal on fair budget × quality delivery × sustainable creator earnings.",
  principles: [
    {
      title: "AI pricing engine",
      body: "Fair budget ranges from real production data and historical deals — not guesswork."
    },
    {
      title: "Transparent costs",
      body: "The platform service fee covers AI, matching, escrow, review, collaboration, storage, and security — every line is explainable."
    },
    {
      title: "Escrow protection",
      body: "Funds stay in escrow until delivery is confirmed, protecting brands and creators equally."
    },
    {
      title: "Sustainable creator earnings",
      body: "80% of brand payment goes to creators; the platform service fee funds the full transaction infrastructure."
    }
  ],
  budgetTitle: "How to read a budget",
  budgetSubtitle: "Different budget levels match different project needs and creator resources",
  budgetTiers: [
    {
      title: "Starter",
      subtitle: "Launch ideas quickly",
      audience: "Lightweight projects",
      theme: "blue",
      features: [
        "Product showcase ads",
        "15–30s short video",
        "Essential production needs",
        "Fast creative validation"
      ]
    },
    {
      title: "Recommended",
      subtitle: "Balance quality and speed",
      badge: "Recommended",
      audience: "The choice for most brands",
      theme: "purple",
      features: [
        "30–60s commercial ads",
        "Higher creative standards",
        "Priority creator matching",
        "Platform default budget band"
      ]
    },
    {
      title: "Priority",
      subtitle: "Higher quality bar",
      audience: "Higher-expectation projects",
      theme: "orange",
      features: [
        "60s+ premium ads",
        "Senior studio matching",
        "Faster response and delivery",
        "More stable production"
      ]
    },
    {
      title: "Top tier",
      subtitle: "Cinematic production standard",
      audience: "Large brands and custom work",
      theme: "green",
      features: [
        "Brand films and cinematic ads",
        "Global top studio teams",
        "Custom end-to-end service",
        "Dedicated creative execution"
      ]
    }
  ],
  trustTitle: "Why trust VINCIS pricing?",
  trustPoints: [
    {
      title: "Real cost model",
      body: "Grounded in real production samples and historical deals — not market hype."
    },
    {
      title: "AI-powered quotes",
      body: "Complexity is calculated automatically for accurate, fair pricing."
    },
    {
      title: "Creator ecosystem",
      body: "Fair pricing keeps creator earnings healthy and attracts great studios."
    },
    {
      title: "Continuous learning",
      body: "Every completed project improves the next quote."
    }
  ],
  serviceFeeTitle: "Platform service fee",
  serviceFeeSubtitle: "You buy full transaction infrastructure — not a contact list",
  serviceFeeIntro:
    "VINCIS is a full advertising transaction platform. The platform service fee (production service fee) funds AI creative analysis, global creator matching, escrow, online review, collaboration, storage, security, and operations.",
  serviceFeeIncludesTitle: "What the fee includes",
  serviceFeeSplitTitle: "How funds are split",
  serviceFeeSplit: [
    { label: "Brand pays", value: "100%" },
    { label: "Creator payout", value: "80%" },
    { label: "Platform service fee", value: "20% (default standard)" }
  ],
  serviceFeeTierTitle: "Tiered by partnership level",
  serviceFeeTierColumns: ["Customer type", "Platform service fee", "Details"],
  serviceFeeTiers: [
    { title: "Standard project", rate: "20%", note: "Default standard rate covering full platform infrastructure" },
    { title: "Annual partnership", rate: "18%", note: "Long-term incentive with healthy platform margin" },
    { title: "Enterprise", rate: "15%", note: "Custom enterprise agreements available" }
  ],
  serviceFeeNote:
    "20% is the default standard platform service fee, not a single fixed rate for every deal. We never use the word “commission take.”",
  closingTitleLead: "Not the lowest price —",
  closingTitleAccent: "the best value to close.",
  closingBody: [
    "Great ads need reasonable budgets. Prices that are too low usually mean less craft and more risk.",
    "VINCIS helps brands buy better work at fair budgets so every deal is worth closing."
  ],
  closingCta: "Get an AI estimate",
  closingNote: "Fast response · Secure and reliable"
};

export function pricingText(locale: MarketingLocale): PricingCopy {
  const copy = resolveMarketingCopy(
    {
      en: pricingCopyEn,
      "zh-CN": pricingCopyZhCN,
      ...(pricingBundles as Partial<Record<MarketingLocale, PricingCopy>>)
    },
    locale
  );

  return {
    ...copy,
    budgetTiers: copy.budgetTiers.map((tier, index) => ({
      ...tier,
      theme: pricingCopyEn.budgetTiers[index]?.theme ?? tier.theme
    }))
  };
}
