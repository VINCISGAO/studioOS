import type { CreatorMembershipPlanType } from "@prisma/client";
import {
  calculateOrderCommission,
  computeUpgradeProgress,
  roundMoney
} from "@/features/membership/commission-calculation.service";
import { membershipRepository } from "@/features/membership/membership.repository";
import { membershipNotificationService } from "@/features/membership/membership-notification.service";
import type {
  ActiveCommissionRule,
  CommissionBreakdown,
  CreatorMembershipStatusView,
  MembershipPlanView,
  UpgradeEligibility
} from "@/features/membership/membership.types";
import { appError } from "@/lib/core/errors";
import { hasDatabaseUrl } from "@/lib/core/database/prisma";

export class MembershipService {
  private assertDb() {
    if (!hasDatabaseUrl()) throw appError("SYSTEM_ERROR", "DATABASE_URL not configured");
  }

  async requireActiveCommissionRule(): Promise<ActiveCommissionRule> {
    const rule = await membershipRepository.getActiveCommissionRule();
    if (!rule) {
      throw appError("SYSTEM_ERROR", "No active commission rule configured");
    }
    return rule;
  }

  async requireDefaultPlan(): Promise<MembershipPlanView> {
    const plan = await membershipRepository.getPlanByType("DEFAULT");
    if (!plan) throw appError("SYSTEM_ERROR", "Default creator plan not configured");
    return plan;
  }

  async requireVerifiedPlan(): Promise<MembershipPlanView> {
    const plan = await membershipRepository.getPlanByType("VERIFIED");
    if (!plan) throw appError("SYSTEM_ERROR", "Verified creator plan not configured");
    return plan;
  }

  /** Resolve effective tier + commission rate at settlement time (snapshot). */
  async resolveCreatorCommissionRate(creatorId: string): Promise<{
    planType: CreatorMembershipPlanType;
    plan: MembershipPlanView;
    commissionPercentage: number;
    rule: ActiveCommissionRule;
  }> {
    const rule = await this.requireActiveCommissionRule();
    const defaultPlan = await this.requireDefaultPlan();
    const verifiedMembership = await membershipRepository.getActiveVerifiedMembership(creatorId);

    if (verifiedMembership) {
      const plan = {
        id: verifiedMembership.plan.id,
        slug: verifiedMembership.plan.slug,
        name: verifiedMembership.plan.name,
        planType: verifiedMembership.plan.planType,
        annualFee: Number(verifiedMembership.plan.annualFee),
        creatorCommissionPercentage: Number(verifiedMembership.plan.creatorCommissionPercentage),
        membershipDurationDays: verifiedMembership.plan.membershipDurationDays,
        benefits: Array.isArray(verifiedMembership.plan.benefitsJson)
          ? (verifiedMembership.plan.benefitsJson as MembershipPlanView["benefits"])
          : [],
        stripePriceId: verifiedMembership.plan.stripePriceId,
        isActive: verifiedMembership.plan.isActive
      };
      return {
        planType: "VERIFIED",
        plan,
        commissionPercentage: plan.creatorCommissionPercentage,
        rule
      };
    }

    return {
      planType: "DEFAULT",
      plan: defaultPlan,
      commissionPercentage: defaultPlan.creatorCommissionPercentage,
      rule
    };
  }

  /** Calculate + persist commission snapshot for a settled order/campaign. */
  async settleOrderCommission(input: {
    campaignId: string;
    creatorId: string;
    orderAmount: number;
    currency?: string;
    orderId?: string;
  }): Promise<CommissionBreakdown & { id: string }> {
    this.assertDb();

    const existing = await membershipRepository.findOrderCommissionByCampaign(input.campaignId);
    if (existing) {
      throw appError("VALIDATION_ERROR", "Commission already settled for this campaign");
    }

    const { planType, plan, commissionPercentage, rule } =
      await this.resolveCreatorCommissionRate(input.creatorId);

    const breakdown = calculateOrderCommission({
      orderAmount: input.orderAmount,
      currency: input.currency,
      creatorCommissionPercentage: commissionPercentage,
      clientServiceFeePercentage: rule.clientServiceFeePercentage,
      clientServiceFeeEnabled: rule.clientServiceFeeEnabled,
      creatorMembershipType: planType
    });

    const record = await membershipRepository.createOrderCommission({
      campaign: { connect: { id: input.campaignId } },
      creator: { connect: { id: input.creatorId } },
      orderId: input.orderId ?? null,
      orderAmount: breakdown.orderAmount,
      currency: breakdown.currency,
      clientServiceFeePercentage: breakdown.clientServiceFeePercentage,
      clientServiceFeeAmount: breakdown.clientServiceFeeAmount,
      creatorCommissionPercentage: breakdown.creatorCommissionPercentage,
      creatorCommissionAmount: breakdown.creatorCommissionAmount,
      creatorPayoutAmount: breakdown.creatorPayoutAmount,
      platformTotalRevenue: breakdown.platformTotalRevenue,
      creatorMembershipTypeAtOrder: planType,
      commissionRuleId: rule.id,
      planId: plan.id
    });

    const earnings = await membershipRepository.getOrCreateEarnings(input.creatorId);
    const previousSettled = Number(earnings.totalSettledRevenue);
    await membershipRepository.updateEarnings(input.creatorId, {
      totalSettledRevenue: roundMoney(previousSettled + breakdown.orderAmount),
      totalCreatorPayout: roundMoney(Number(earnings.totalCreatorPayout) + breakdown.creatorPayoutAmount)
    });

    const newSettled = roundMoney(previousSettled + breakdown.orderAmount);
    const threshold = rule.upgradeRevenueThreshold;
    if (
      planType === "DEFAULT" &&
      rule.upgradeModalEnabled &&
      previousSettled < threshold &&
      newSettled >= threshold
    ) {
      void membershipNotificationService.notifyUpgradeEligible(input.creatorId, threshold);
    }

    return { ...breakdown, id: record.id };
  }

  async getUpgradeEligibility(creatorId: string): Promise<UpgradeEligibility> {
    const rule = await this.requireActiveCommissionRule();
    const verified = await membershipRepository.getActiveVerifiedMembership(creatorId);
    const earnings = await membershipRepository.getOrCreateEarnings(creatorId);
    const settledRevenue = Number(earnings.totalSettledRevenue);

    if (verified) {
      return {
        eligible: false,
        reason: "already_verified",
        threshold: rule.upgradeRevenueThreshold,
        settledRevenue,
        modalEnabled: rule.upgradeModalEnabled,
        declined: Boolean(earnings.upgradeDeclinedAt)
      };
    }

    if (!rule.upgradeModalEnabled) {
      return {
        eligible: false,
        reason: "modal_disabled",
        threshold: rule.upgradeRevenueThreshold,
        settledRevenue,
        modalEnabled: false,
        declined: Boolean(earnings.upgradeDeclinedAt)
      };
    }

    if (earnings.upgradeDeclinedAt) {
      return {
        eligible: false,
        reason: "declined",
        threshold: rule.upgradeRevenueThreshold,
        settledRevenue,
        modalEnabled: true,
        declined: true
      };
    }

    if (settledRevenue < rule.upgradeRevenueThreshold) {
      return {
        eligible: false,
        reason: "below_threshold",
        threshold: rule.upgradeRevenueThreshold,
        settledRevenue,
        modalEnabled: true,
        declined: false
      };
    }

    return {
      eligible: true,
      threshold: rule.upgradeRevenueThreshold,
      settledRevenue,
      modalEnabled: true,
      declined: false
    };
  }

  async recordUpgradeDeclined(creatorId: string) {
    await membershipRepository.updateEarnings(creatorId, {
      upgradeDeclinedAt: new Date(),
      lastUpgradePromptAt: new Date()
    });
    await membershipRepository.appendHistory({
      creator: { connect: { id: creatorId } },
      action: "UPGRADE_DECLINED"
    });
  }

  async getCreatorMembershipStatus(creatorId: string): Promise<CreatorMembershipStatusView> {
    const { planType, plan, commissionPercentage, rule } =
      await this.resolveCreatorCommissionRate(creatorId);
    const verifiedMembership = await membershipRepository.getActiveVerifiedMembership(creatorId);
    const earnings = await membershipRepository.getOrCreateEarnings(creatorId);
    const eligibility = await this.getUpgradeEligibility(creatorId);

    return {
      creatorId,
      planType,
      plan,
      isVerified: planType === "VERIFIED",
      membership: verifiedMembership
        ? {
            id: verifiedMembership.id,
            status: verifiedMembership.status,
            startedAt: verifiedMembership.startedAt.toISOString(),
            expiresAt: verifiedMembership.expiresAt?.toISOString() ?? null
          }
        : null,
      commissionRate: commissionPercentage,
      earnings: {
        totalSettledRevenue: Number(earnings.totalSettledRevenue),
        totalPendingRevenue: Number(earnings.totalPendingRevenue),
        totalWithdrawn: Number(earnings.totalWithdrawn),
        totalCreatorPayout: Number(earnings.totalCreatorPayout),
        upgradeThreshold: rule.upgradeRevenueThreshold,
        progressPercent: computeUpgradeProgress(
          Number(earnings.totalSettledRevenue),
          rule.upgradeRevenueThreshold
        ),
        shouldShowUpgradeModal: eligibility.eligible
      },
      benefits: plan.benefits
    };
  }

  async ensureDefaultMembershipOnCreatorRegister(creatorId: string, creatorProfileId?: string) {
    const defaultPlan = await this.requireDefaultPlan();
    await membershipRepository.getOrCreateEarnings(creatorId);
    await membershipRepository.appendHistory({
      creator: { connect: { id: creatorId } },
      plan: { connect: { id: defaultPlan.id } },
      action: "CREATED",
      note: "Default creator on registration"
    });
    if (creatorProfileId) {
      void creatorProfileId;
    }
  }
}

export const membershipService = new MembershipService();
