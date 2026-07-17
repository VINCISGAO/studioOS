import type { MarketingLocale } from "@/lib/i18n";
import { isChineseMarketingLocale, toLegacyLocale } from "@/lib/marketing/i18n/resolve-marketing-copy";
import partnersBundles from "@/lib/marketing/i18n/bundles/partners.json";
import { resolveMarketingCopy } from "@/lib/marketing/i18n/resolve-marketing-copy";
import { formatMoneyFromUsd } from "@/lib/money/display-money";

export type PartnersCopy = {
  nav: {
    home: string;
    process: string;
    pricing: string;
    partners: string;
    resources: string;
    login: string;
    register: string;
  };
  hero: {
    titleLead: string;
    titleAccent: string;
    body: string;
    links: Array<{ label: string; href: string }>;
  };
  benefitsTitle: string;
  benefits: Array<{ title: string; body: string }>;
  stepsTitle: string;
  steps: Array<{ title: string; body: string }>;
  commissionTitle: string;
  commissionColumns: [string, string, string];
  calculatorTitle: string;
  calculatorLabels: {
    customerType: string;
    orderAmount: string;
    platformServiceFee: string;
    partnerShare: string;
    platformFeeAmount: string;
    estimatedEarnings: string;
    currency: string;
  };
  statsTitle: string;
  stats: Array<{ label: string }>;
  faqTitle: string;
  faq: Array<{ question: string; answer: string }>;
};

export const partnersCopyZhCN: PartnersCopy = {
  nav: {
    home: "首页",
    process: "如何工作",
    pricing: "价格",
    partners: "合作伙伴",
    resources: "资源中心",
    login: "登录",
    register: "注册成为合作伙伴"
  },
  hero: {
    titleLead: "成为 VINCIS 合作伙伴",
    titleAccent: "开启可持续的收益机会",
    body: "通过推荐品牌或创作者加入 VINCIS，您将获得平台服务费中 40% 的合作伙伴分成。无需管理项目，只需分享链接，即可持续获得收入。",
    links: [
      { label: "立即加入合作伙伴计划", href: "/login" },
      { label: "了解平台服务费", href: "/pricing" },
      { label: "查看分成机制", href: "#commission" },
      { label: "常见问题", href: "/faq" }
    ]
  },
  benefitsTitle: "合作伙伴权益",
  benefits: [
    { title: "透明分成机制", body: "获得平台服务费的 40%，而非订单总额的固定抽成" },
    { title: "长期持续收益", body: "客户持续消费，您持续获得佣金" },
    { title: "实时数据追踪", body: "实时查看点击、注册、付费等全流程数据" },
    { title: "快速提现", body: "低门槛、多种提现方式，最快当日到账" }
  ],
  stepsTitle: "如何开始赚取收益",
  steps: [
    { title: "注册成为合作伙伴", body: "填写基本信息，获得专属推荐链接" },
    { title: "分享您的链接", body: "将链接分享给潜在品牌客户或创作者" },
    { title: "客户注册并付费", body: "客户通过您的链接注册并完成首次付费" },
    { title: "获得佣金", body: "客户付款后，按平台服务费比例计算您的合作伙伴分成" },
    { title: "提现收益", body: "佣金自动累计，达到门槛后即可申请提现" }
  ],
  commissionTitle: "合作伙伴分成机制",
  commissionColumns: ["客户类型", "平台服务费", "合作伙伴分成"],
  calculatorTitle: "收益计算器",
  calculatorLabels: {
    customerType: "客户类型",
    orderAmount: "预计订单金额 (USD)",
    platformServiceFee: "平台服务费比例",
    partnerShare: "合作伙伴分成",
    platformFeeAmount: "平台服务费金额",
    estimatedEarnings: "预估合作伙伴收益",
    currency: "USD"
  },
  statsTitle: "加入 VINCIS 合作伙伴计划的伙伴",
  stats: [
    { label: "活跃合作伙伴" },
    { label: "已支付佣金总额" },
    { label: "通过合作伙伴带来的客户" },
    { label: "合作伙伴满意度" }
  ],
  faqTitle: "常见问题",
  faq: [
    {
      question: "加入合作伙伴计划需要费用吗？",
      answer: "完全免费。注册成为合作伙伴无需任何费用。客户付款后，您获得平台服务费中的 40% 作为合作伙伴分成。"
    },
    {
      question: "佣金多久结算一次？",
      answer: "客户完成付款后，佣金会实时计入您的账户。达到提现门槛后即可申请提现，通常 1–3 个工作日到账。"
    },
    {
      question: "如何追踪我的推荐客户？",
      answer: "每位合作伙伴都有专属推荐链接和后台数据面板，可实时查看点击、注册、付费与佣金明细。"
    },
    {
      question: "我可以推广哪些内容？",
      answer: "您可以推广 VINCIS 平台服务、创作者工具、品牌广告制作服务，以及 Academy 课程内容。"
    }
  ]
};

export const partnersCopyEn: PartnersCopy = {
  nav: {
    home: "Home",
    process: "How it works",
    pricing: "Pricing",
    partners: "Partners",
    resources: "Resources",
    login: "Log in",
    register: "Become a partner"
  },
  hero: {
    titleLead: "Become a VINCIS partner",
    titleAccent: "and unlock sustainable earnings",
    body: "Refer brands or creators to VINCIS and earn 40% of the platform service fee — no project management required.",
    links: [
      { label: "Join the partner program", href: "/login" },
      { label: "Platform service fee", href: "/pricing" },
      { label: "Revenue share model", href: "#commission" },
      { label: "FAQ", href: "/faq" }
    ]
  },
  benefitsTitle: "Partner benefits",
  benefits: [
    { title: "Transparent revenue share", body: "Earn 40% of the platform service fee — not a flat take of the order" },
    { title: "Recurring income", body: "Keep earning as referred customers continue spending" },
    { title: "Real-time tracking", body: "Monitor clicks, signups, payments, and commissions live" },
    { title: "Fast withdrawal", body: "Low thresholds, multiple payout methods, same-day options" }
  ],
  stepsTitle: "How to start earning",
  steps: [
    { title: "Register as a partner", body: "Submit basic details and receive your unique referral link" },
    { title: "Share your link", body: "Send it to potential brand clients or creators" },
    { title: "Customer signs up & pays", body: "They register through your link and complete first payment" },
    { title: "Earn commission", body: "After customer payment, your share is calculated from the platform service fee" },
    { title: "Withdraw earnings", body: "Commissions accumulate automatically and can be withdrawn at threshold" }
  ],
  commissionTitle: "Partner revenue share",
  commissionColumns: ["Customer type", "Platform service fee", "Partner share"],
  calculatorTitle: "Earnings calculator",
  calculatorLabels: {
    customerType: "Customer type",
    orderAmount: "Estimated order amount (USD)",
    platformServiceFee: "Platform service fee rate",
    partnerShare: "Partner share",
    platformFeeAmount: "Platform service fee amount",
    estimatedEarnings: "Estimated partner earnings",
    currency: "USD"
  },
  statsTitle: "Partners already in the program",
  stats: [
    { label: "Active partners" },
    { label: "Total commissions paid" },
    { label: "Customers referred" },
    { label: "Partner satisfaction" }
  ],
  faqTitle: "FAQ",
  faq: [
    {
      question: "Is there a fee to join?",
      answer: "Joining is free. After a referred customer pays, you earn 40% of the platform service fee."
    },
    {
      question: "How often is commission settled?",
      answer: "Commissions are credited in real time after customer payment. Withdrawals typically arrive in 1–3 business days."
    },
    {
      question: "How are referrals tracked?",
      answer: "Every partner gets a unique referral link and dashboard for clicks, signups, payments, and commissions."
    },
    {
      question: "What can I promote?",
      answer: "VINCIS platform services, creator tools, brand production services, and Academy courses."
    }
  ]
};

export function partnersText(locale: MarketingLocale): PartnersCopy {
  return resolveMarketingCopy(
    {
      en: partnersCopyEn,
      "zh-CN": partnersCopyZhCN,
      ...(partnersBundles as Partial<Record<MarketingLocale, PartnersCopy>>)
    },
    locale
  );
}

export function formatPartnerStatValue(
  index: number,
  stats: {
    activePartners: number;
    totalPaidCommission: number;
    referredCustomers: number;
    satisfactionRate: number;
  },
  locale: MarketingLocale
) {
  const numberLocale = isChineseMarketingLocale(locale) ? "zh-CN" : "en-US";
  if (index === 0) return `${stats.activePartners.toLocaleString(numberLocale)}+`;
  if (index === 1) {
    return `${formatMoneyFromUsd(stats.totalPaidCommission, toLegacyLocale(locale))}+`;
  }
  if (index === 2) return `${stats.referredCustomers.toLocaleString(numberLocale)}+`;
  return `${stats.satisfactionRate.toFixed(1)}%`;
}
