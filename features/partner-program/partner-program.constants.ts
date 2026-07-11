import {
  PLATFORM_SERVICE_FEE_MODEL,
  calculatePlatformFeeSplit
} from "@/features/pricing/platform-service-fee.constants";

export type PartnerCustomerType = "standard" | "annual" | "enterprise";

export type PartnerCommissionTier = {
  id: PartnerCustomerType;
  labelZh: string;
  labelEn: string;
  platformServiceFeeRate: number;
  descriptionZh: string;
  descriptionEn: string;
};

export const PARTNER_REFERRAL_SHARE_OF_PLATFORM_FEE =
  PLATFORM_SERVICE_FEE_MODEL.partnerReferralShareOfPlatformFee;

export const PARTNER_COMMISSION_TIERS: PartnerCommissionTier[] = [
  {
    id: "standard",
    labelZh: "标准项目",
    labelEn: "Standard project",
    platformServiceFeeRate: 20,
    descriptionZh: "推荐客户完成付款后，获得平台服务费的 40% 作为合作伙伴佣金。",
    descriptionEn: "Earn 40% of the platform service fee after a referred customer pays."
  },
  {
    id: "annual",
    labelZh: "年度合作客户",
    labelEn: "Annual partnership",
    platformServiceFeeRate: 18,
    descriptionZh: "年度合作客户适用 18% 平台服务费，合作伙伴仍获得其中 40% 的分成。",
    descriptionEn: "Annual partners use an 18% platform service fee; you still earn 40% of that fee."
  },
  {
    id: "enterprise",
    labelZh: "企业客户",
    labelEn: "Enterprise",
    platformServiceFeeRate: 15,
    descriptionZh: "企业定制合作适用 15% 平台服务费，合作伙伴获得其中 40% 的分成。",
    descriptionEn: "Enterprise deals use a 15% platform service fee; you earn 40% of that fee."
  }
] as const;

export const PARTNER_PROGRAM_MARKETING = {
  satisfactionRate: 97.6,
  partnerShareOfPlatformFee: PARTNER_REFERRAL_SHARE_OF_PLATFORM_FEE
} as const;

export function getPartnerCommissionTier(id: PartnerCustomerType) {
  const tier = PARTNER_COMMISSION_TIERS.find((item) => item.id === id);
  if (!tier) {
    throw new Error(`Unknown partner commission tier: ${id}`);
  }
  return tier;
}

export function calculatePartnerCommission(orderAmount: number, platformServiceFeeRate: number) {
  return calculatePlatformFeeSplit(orderAmount, platformServiceFeeRate).partnerReferral;
}
