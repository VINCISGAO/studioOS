export const PLATFORM_SERVICE_FEE_MODEL = {
  creatorShareRate: 80,
  defaultPlatformShareRate: 20,
  partnerReferralShareOfPlatformFee: 40,
  platformOpsShareOfPlatformFee: 60
} as const;

export type PlatformServiceFeeTierId = "standard" | "annual" | "enterprise";

export type PlatformServiceFeeTier = {
  id: PlatformServiceFeeTierId;
  labelZh: string;
  labelEn: string;
  rate: number;
};

export const PLATFORM_SERVICE_FEE_TIERS: PlatformServiceFeeTier[] = [
  { id: "standard", labelZh: "标准项目", labelEn: "Standard project", rate: 20 },
  { id: "annual", labelZh: "年度合作客户", labelEn: "Annual partnership", rate: 18 },
  { id: "enterprise", labelZh: "企业客户", labelEn: "Enterprise", rate: 15 }
] as const;

export const PLATFORM_SERVICE_INCLUDES = {
  zh: [
    "AI 创意分析与报价",
    "AI Creator 匹配",
    "托管支付（Escrow）",
    "在线审片（Review Center）",
    "多版本管理",
    "项目协作",
    "文件存储与交付",
    "通知系统",
    "风控与权限",
    "AI Copilot",
    "多语言支持",
    "全球支付",
    "售后与争议处理"
  ],
  en: [
    "AI creative analysis and pricing",
    "AI creator matching",
    "Escrow payment",
    "Online review center",
    "Multi-version management",
    "Project collaboration",
    "File storage and delivery",
    "Notification system",
    "Risk control and permissions",
    "AI Copilot",
    "Multilingual support",
    "Global payments",
    "Support and dispute resolution"
  ]
} as const;

export function calculatePlatformFeeSplit(orderAmount: number, platformServiceFeeRate: number) {
  const normalizedAmount = Number.isFinite(orderAmount) ? Math.max(0, orderAmount) : 0;
  const normalizedRate = Number.isFinite(platformServiceFeeRate) ? Math.max(0, platformServiceFeeRate) : 0;
  const platformFee = Math.round((normalizedAmount * normalizedRate) / 100);
  const creatorPayout = Math.max(0, normalizedAmount - platformFee);
  const partnerReferral = Math.round(
    (platformFee * PLATFORM_SERVICE_FEE_MODEL.partnerReferralShareOfPlatformFee) / 100
  );
  const platformRetained = Math.max(0, platformFee - partnerReferral);

  return {
    orderAmount: normalizedAmount,
    creatorPayout,
    platformFee,
    partnerReferral,
    platformRetained
  };
}
