import { PARTNER_PROGRAM_MARKETING } from "@/features/partner-program/partner-program.constants";
import { prisma } from "@/lib/core/database/prisma";
import { logger } from "@/lib/core/logger";

function money(value: unknown) {
  return Number(value ?? 0);
}

function prismaErrorCode(error: unknown) {
  if (typeof error === "object" && error !== null && "code" in error) {
    return String((error as { code?: string }).code ?? "");
  }
  return "";
}

function isRecoverablePartnerReadError(error: unknown) {
  const code = prismaErrorCode(error);
  if (code && ["P1001", "P1002", "P1017", "P2021", "P2022", "P2024"].includes(code)) {
    return true;
  }
  const message = (error instanceof Error ? error.message : String(error)).toLowerCase();
  return (
    message.includes("prepared statement") ||
    message.includes("connection") ||
    message.includes("timeout") ||
    message.includes("does not exist")
  );
}

const EMPTY_MARKETING_STATS = {
  activePartners: 0,
  totalPaidCommission: 0,
  referredCustomers: 0,
  satisfactionRate: PARTNER_PROGRAM_MARKETING.satisfactionRate
} as const;

export class PartnerProgramRepository {
  async getMarketingStats() {
    try {
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
    } catch (error) {
      logger.error("Partner program public read failed", {
        service: "PartnerProgramRepository",
        operation: "getMarketingStats",
        code: prismaErrorCode(error) || undefined,
        error: error instanceof Error ? error.message : String(error)
      });
      if (isRecoverablePartnerReadError(error)) return EMPTY_MARKETING_STATS;
      throw error;
    }
  }
}

export const partnerProgramRepository = new PartnerProgramRepository();
