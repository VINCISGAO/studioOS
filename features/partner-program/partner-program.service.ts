import {
  PARTNER_COMMISSION_TIERS,
  PARTNER_PROGRAM_MARKETING
} from "@/features/partner-program/partner-program.constants";
import { partnerProgramRepository } from "@/features/partner-program/partner-program.repository";

export class PartnerProgramService {
  async getMarketingPageData() {
    const stats = await partnerProgramRepository.getMarketingStats();

    return {
      stats,
      commissionTiers: PARTNER_COMMISSION_TIERS,
      partnerShareOfPlatformFee: PARTNER_PROGRAM_MARKETING.partnerShareOfPlatformFee
    };
  }
}

export const partnerProgramService = new PartnerProgramService();
