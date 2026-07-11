import { prisma } from "@/lib/core/database/prisma";
import { PARTNER_PROGRAM_MARKETING } from "@/features/partner-program/partner-program.constants";

function money(value: unknown) {
  return Number(value ?? 0);
}

export class PartnerProgramRepository {
  async getMarketingStats() {
    const [activePartners, partnerTotals, paidReferrals] = await Promise.all([
      prisma.partnerProgram.count({ where: { status: "ACTIVE" } }),
      prisma.partnerProgram.aggregate({
        _sum: {
          paidCommission: true,
          attributedBrands: true,
          attributedCreators: true
        }
      }),
      prisma.referralCommission.aggregate({
        where: { status: "PAID" },
        _sum: { commissionAmount: true }
      })
    ]);

    const paidFromPrograms = money(partnerTotals._sum.paidCommission);
    const paidFromReferrals = money(paidReferrals._sum.commissionAmount);
    const referredCustomers =
      (partnerTotals._sum.attributedBrands ?? 0) + (partnerTotals._sum.attributedCreators ?? 0);

    return {
      activePartners,
      totalPaidCommission: paidFromPrograms + paidFromReferrals,
      referredCustomers,
      satisfactionRate: PARTNER_PROGRAM_MARKETING.satisfactionRate
    };
  }
}

export const partnerProgramRepository = new PartnerProgramRepository();
