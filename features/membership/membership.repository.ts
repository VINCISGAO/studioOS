import type {
  CommissionRule,
  CreatorMembership,
  CreatorMembershipPlan,
  CreatorMembershipPlanType,
  Prisma
} from "@prisma/client";
import { prisma, hasDatabaseUrl } from "@/lib/core/database/prisma";
import type { ActiveCommissionRule, MembershipPlanView } from "@/features/membership/membership.types";

function toNumber(value: Prisma.Decimal | number | null | undefined): number {
  if (value == null) return 0;
  return Number(value);
}

function mapPlan(plan: CreatorMembershipPlan): MembershipPlanView {
  return {
    id: plan.id,
    slug: plan.slug,
    name: plan.name,
    planType: plan.planType,
    annualFee: toNumber(plan.annualFee),
    creatorCommissionPercentage: toNumber(plan.creatorCommissionPercentage),
    membershipDurationDays: plan.membershipDurationDays,
    benefits: Array.isArray(plan.benefitsJson)
      ? (plan.benefitsJson as MembershipPlanView["benefits"])
      : [],
    stripePriceId: plan.stripePriceId,
    isActive: plan.isActive
  };
}

function mapRule(rule: CommissionRule): ActiveCommissionRule {
  return {
    id: rule.id,
    name: rule.name,
    clientServiceFeePercentage: toNumber(rule.clientServiceFeePercentage),
    defaultCreatorCommissionPercentage: toNumber(rule.defaultCreatorCommissionPercentage),
    verifiedCreatorCommissionPercentage: toNumber(rule.verifiedCreatorCommissionPercentage),
    upgradeRevenueThreshold: toNumber(rule.upgradeRevenueThreshold),
    upgradeModalEnabled: rule.upgradeModalEnabled,
    clientServiceFeeEnabled: rule.clientServiceFeeEnabled
  };
}

export class MembershipRepository {
  private assertDb() {
    if (!hasDatabaseUrl()) throw new Error("DATABASE_URL not configured");
  }

  async getActiveCommissionRule(): Promise<ActiveCommissionRule | null> {
    this.assertDb();
    const rule = await prisma.commissionRule.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: "desc" }
    });
    return rule ? mapRule(rule) : null;
  }

  async listCommissionRules() {
    this.assertDb();
    const rules = await prisma.commissionRule.findMany({ orderBy: { updatedAt: "desc" } });
    return rules.map(mapRule);
  }

  async createCommissionRule(data: Prisma.CommissionRuleCreateInput) {
    this.assertDb();
    return prisma.$transaction(async (tx) => {
      await tx.commissionRule.updateMany({ where: { isActive: true }, data: { isActive: false } });
      const created = await tx.commissionRule.create({ data: { ...data, isActive: true } });
      return mapRule(created);
    });
  }

  async updateCommissionRule(id: string, data: Prisma.CommissionRuleUpdateInput) {
    this.assertDb();
    const updated = await prisma.commissionRule.update({ where: { id }, data });
    return mapRule(updated);
  }

  async getPlanByType(planType: CreatorMembershipPlanType): Promise<MembershipPlanView | null> {
    this.assertDb();
    const plan = await prisma.creatorMembershipPlan.findFirst({
      where: { planType, isActive: true },
      orderBy: { sortOrder: "asc" }
    });
    return plan ? mapPlan(plan) : null;
  }

  async getPlanBySlug(slug: string): Promise<MembershipPlanView | null> {
    this.assertDb();
    const plan = await prisma.creatorMembershipPlan.findUnique({ where: { slug } });
    return plan ? mapPlan(plan) : null;
  }

  async listPlans(): Promise<MembershipPlanView[]> {
    this.assertDb();
    const plans = await prisma.creatorMembershipPlan.findMany({ orderBy: { sortOrder: "asc" } });
    return plans.map(mapPlan);
  }

  async upsertPlan(slug: string, data: Prisma.CreatorMembershipPlanCreateInput) {
    this.assertDb();
    const plan = await prisma.creatorMembershipPlan.upsert({
      where: { slug },
      create: data,
      update: data
    });
    return mapPlan(plan);
  }

  async getActiveVerifiedMembership(creatorId: string): Promise<
    (CreatorMembership & { plan: CreatorMembershipPlan }) | null
  > {
    this.assertDb();
    const now = new Date();
    return prisma.creatorMembership.findFirst({
      where: {
        creatorId,
        status: "ACTIVE",
        plan: { planType: "VERIFIED" },
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }]
      },
      include: { plan: true },
      orderBy: { startedAt: "desc" }
    });
  }

  async listMembershipsForCreator(creatorId: string) {
    this.assertDb();
    return prisma.creatorMembership.findMany({
      where: { creatorId },
      include: { plan: true },
      orderBy: { createdAt: "desc" }
    });
  }

  async createMembership(data: Prisma.CreatorMembershipCreateInput) {
    this.assertDb();
    return prisma.creatorMembership.create({ data, include: { plan: true } });
  }

  async updateMembership(id: string, data: Prisma.CreatorMembershipUpdateInput) {
    this.assertDb();
    return prisma.creatorMembership.update({ where: { id }, data, include: { plan: true } });
  }

  async expireMembershipsBefore(date: Date) {
    this.assertDb();
    return prisma.creatorMembership.findMany({
      where: {
        status: "ACTIVE",
        plan: { planType: "VERIFIED" },
        expiresAt: { lte: date }
      },
      include: { plan: true }
    });
  }

  async findActiveVerifiedMembershipsExpiringBetween(start: Date, end: Date) {
    this.assertDb();
    return prisma.creatorMembership.findMany({
      where: {
        status: "ACTIVE",
        plan: { planType: "VERIFIED" },
        expiresAt: { gte: start, lt: end }
      },
      include: { plan: true }
    });
  }

  async findMembershipByStripeSession(stripeSessionId: string) {
    this.assertDb();
    return prisma.creatorMembership.findFirst({ where: { stripeSessionId } });
  }

  async getOrCreateEarnings(creatorId: string) {
    this.assertDb();
    return prisma.creatorEarnings.upsert({
      where: { creatorId },
      create: { creatorId },
      update: {}
    });
  }

  async updateEarnings(creatorId: string, data: Prisma.CreatorEarningsUpdateInput) {
    this.assertDb();
    return prisma.creatorEarnings.update({ where: { creatorId }, data });
  }

  async appendHistory(data: Prisma.CreatorMembershipHistoryCreateInput) {
    this.assertDb();
    return prisma.creatorMembershipHistory.create({ data });
  }

  async listHistory(creatorId: string, limit = 50) {
    this.assertDb();
    return prisma.creatorMembershipHistory.findMany({
      where: { creatorId },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { plan: true }
    });
  }

  async createOrderCommission(data: Prisma.OrderCommissionCreateInput) {
    this.assertDb();
    return prisma.orderCommission.create({ data });
  }

  async findOrderCommissionByCampaign(campaignId: string) {
    this.assertDb();
    return prisma.orderCommission.findUnique({ where: { campaignId } });
  }

  async listOrderCommissionsForCreator(creatorId: string, limit = 50) {
    this.assertDb();
    return prisma.orderCommission.findMany({
      where: { creatorId },
      orderBy: { settledAt: "desc" },
      take: limit
    });
  }

  async aggregatePlatformRevenue(since?: Date) {
    this.assertDb();
    const where = since ? { settledAt: { gte: since } } : {};
    const rows = await prisma.orderCommission.findMany({ where });
    const membershipFees = await prisma.creatorMembership.aggregate({
      _sum: { amountPaid: true },
      where: {
        status: "ACTIVE",
        ...(since ? { createdAt: { gte: since } } : {})
      }
    });

    let clientServiceFees = 0;
    let creatorCommissions = 0;
    let creatorPayouts = 0;
    let platformTotal = 0;

    for (const row of rows) {
      clientServiceFees += toNumber(row.clientServiceFeeAmount);
      creatorCommissions += toNumber(row.creatorCommissionAmount);
      creatorPayouts += toNumber(row.creatorPayoutAmount);
      platformTotal += toNumber(row.platformTotalRevenue);
    }

    return {
      orderCount: rows.length,
      clientServiceFees: round(clientServiceFees),
      creatorCommissions: round(creatorCommissions),
      creatorPayouts: round(creatorPayouts),
      platformTotalFromOrders: round(platformTotal),
      membershipFees: round(toNumber(membershipFees._sum.amountPaid))
    };
  }
}

function round(n: number) {
  return Math.round(n * 100) / 100;
}

export const membershipRepository = new MembershipRepository();
