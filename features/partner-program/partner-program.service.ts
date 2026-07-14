import "server-only";

import { unstable_cache } from "next/cache";
import {
  PARTNER_COMMISSION_TIERS,
  PARTNER_PROGRAM_MARKETING
} from "@/features/partner-program/partner-program.constants";
import { partnerProgramRepository } from "@/features/partner-program/partner-program.repository";

const getCachedMarketingStats = unstable_cache(
  () => partnerProgramRepository.getMarketingStats(),
  ["partner-program-marketing-stats"],
  { revalidate: 300 }
);

export class PartnerProgramService {
  async getMarketingPageData() {
    const stats = await getCachedMarketingStats();

    return {
      stats,
      commissionTiers: PARTNER_COMMISSION_TIERS,
      partnerShareOfPlatformFee: PARTNER_PROGRAM_MARKETING.partnerShareOfPlatformFee
    };
  }
}

export const partnerProgramService = new PartnerProgramService();
