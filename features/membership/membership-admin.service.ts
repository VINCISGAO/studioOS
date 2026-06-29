import type { CreatorMembershipHistoryAction } from "@prisma/client";
import { membershipRepository } from "@/features/membership/membership.repository";
import { membershipService } from "@/features/membership/membership.service";
import { assertValidCommissionPercentages } from "@/features/membership/commission-calculation.service";
import { appError } from "@/lib/core/errors";
import type { AuthUser } from "@/features/auth/permission.service";
import { PermissionService } from "@/features/auth/permission.service";

export class MembershipAdminService {
  private assertAdmin(actor: AuthUser) {
    PermissionService.assert(actor, "admin.membership.manage");
  }

  async getConfiguration(actor: AuthUser) {
    this.assertAdmin(actor);
    const [rule, plans] = await Promise.all([
      membershipRepository.getActiveCommissionRule(),
      membershipRepository.listPlans()
    ]);
    return { rule, plans };
  }

  async upsertCommissionRule(
    actor: AuthUser,
    input: {
      name?: string;
      clientServiceFeePercentage: number;
      defaultCreatorCommissionPercentage: number;
      verifiedCreatorCommissionPercentage: number;
      upgradeRevenueThreshold: number;
      upgradeModalEnabled?: boolean;
      clientServiceFeeEnabled?: boolean;
    }
  ) {
    this.assertAdmin(actor);
    assertValidCommissionPercentages(input);

    const rule = await membershipRepository.createCommissionRule({
      name: input.name ?? "default",
      clientServiceFeePercentage: input.clientServiceFeePercentage,
      defaultCreatorCommissionPercentage: input.defaultCreatorCommissionPercentage,
      verifiedCreatorCommissionPercentage: input.verifiedCreatorCommissionPercentage,
      upgradeRevenueThreshold: input.upgradeRevenueThreshold,
      upgradeModalEnabled: input.upgradeModalEnabled ?? true,
      clientServiceFeeEnabled: input.clientServiceFeeEnabled ?? true
    });

    await this.syncPlanCommissionsFromRule(input);
    return rule;
  }

  /** Keep plan commission rates aligned with the active commission rule. */
  private async syncPlanCommissionsFromRule(input: {
    defaultCreatorCommissionPercentage: number;
    verifiedCreatorCommissionPercentage: number;
  }) {
    const plans = await membershipRepository.listPlans();
    for (const plan of plans) {
      const rate =
        plan.planType === "VERIFIED"
          ? input.verifiedCreatorCommissionPercentage
          : input.defaultCreatorCommissionPercentage;
      if (plan.creatorCommissionPercentage !== rate) {
        await membershipRepository.upsertPlan(plan.slug, {
          slug: plan.slug,
          name: plan.name,
          planType: plan.planType,
          annualFee: plan.annualFee,
          creatorCommissionPercentage: rate,
          membershipDurationDays: plan.membershipDurationDays,
          benefitsJson: plan.benefits as object,
          stripePriceId: plan.stripePriceId ?? null,
          isActive: plan.isActive,
          sortOrder: 0
        });
      }
    }
  }

  async updatePlan(
    actor: AuthUser,
    slug: string,
    input: {
      name: string;
      planType: "DEFAULT" | "VERIFIED";
      annualFee: number;
      creatorCommissionPercentage: number;
      membershipDurationDays: number;
      benefitsJson: unknown;
      stripePriceId?: string | null;
      isActive?: boolean;
      sortOrder?: number;
    }
  ) {
    this.assertAdmin(actor);
    if (input.creatorCommissionPercentage < 0 || input.creatorCommissionPercentage > 100) {
      throw appError("VALIDATION_ERROR", "Invalid commission percentage");
    }

    return membershipRepository.upsertPlan(slug, {
      slug,
      name: input.name,
      planType: input.planType,
      annualFee: input.annualFee,
      creatorCommissionPercentage: input.creatorCommissionPercentage,
      membershipDurationDays: input.membershipDurationDays,
      benefitsJson: input.benefitsJson as object,
      stripePriceId: input.stripePriceId ?? null,
      isActive: input.isActive ?? true,
      sortOrder: input.sortOrder ?? 0
    });
  }

  async manualUpgrade(actor: AuthUser, creatorId: string, note?: string) {
    this.assertAdmin(actor);
    const verifiedPlan = await membershipService.requireVerifiedPlan();
    const startedAt = new Date();
    const expiresAt = new Date(startedAt);
    expiresAt.setDate(expiresAt.getDate() + verifiedPlan.membershipDurationDays);

    const membership = await membershipRepository.createMembership({
      creator: { connect: { id: creatorId } },
      plan: { connect: { id: verifiedPlan.id } },
      status: "ACTIVE",
      paymentProvider: "ADMIN",
      startedAt,
      expiresAt,
      amountPaid: verifiedPlan.annualFee,
      currency: "USD"
    });

    await this.log(actor.id, creatorId, "ADMIN_UPGRADE", verifiedPlan.id, membership.id, note);
    return membership;
  }

  async manualDowngrade(actor: AuthUser, creatorId: string, note?: string) {
    this.assertAdmin(actor);
    const active = await membershipRepository.getActiveVerifiedMembership(creatorId);
    if (active) {
      await membershipRepository.updateMembership(active.id, { status: "CANCELLED" });
    }
    await this.log(actor.id, creatorId, "ADMIN_DOWNGRADE", active?.planId ?? null, active?.id ?? null, note);
    return { ok: true };
  }

  async extendMembership(actor: AuthUser, creatorId: string, extraDays: number, note?: string) {
    this.assertAdmin(actor);
    const active = await membershipRepository.getActiveVerifiedMembership(creatorId);
    if (!active) throw appError("NOT_FOUND", "No active verified membership");

    const base = active.expiresAt ?? new Date();
    const expiresAt = new Date(base);
    expiresAt.setDate(expiresAt.getDate() + extraDays);

    const updated = await membershipRepository.updateMembership(active.id, { expiresAt });
    await this.log(actor.id, creatorId, "ADMIN_EXTEND", active.planId, active.id, note, { extraDays });
    return updated;
  }

  async refundMembership(actor: AuthUser, creatorId: string, membershipId: string, note?: string) {
    this.assertAdmin(actor);
    const membership = await membershipRepository.updateMembership(membershipId, {
      status: "REFUNDED"
    });
    await this.log(actor.id, creatorId, "REFUNDED", membership.planId, membershipId, note);
    return membership;
  }

  async getCreatorHistory(actor: AuthUser, creatorId: string) {
    this.assertAdmin(actor);
    return membershipRepository.listHistory(creatorId);
  }

  async getCommissionHistory(actor: AuthUser, creatorId: string) {
    this.assertAdmin(actor);
    return membershipRepository.listOrderCommissionsForCreator(creatorId);
  }

  async getPlatformRevenue(actor: AuthUser, since?: Date) {
    this.assertAdmin(actor);
    return membershipRepository.aggregatePlatformRevenue(since);
  }

  private async log(
    actorId: string,
    creatorId: string,
    action: CreatorMembershipHistoryAction,
    planId: string | null,
    membershipId: string | null,
    note?: string,
    metadata?: Record<string, unknown>
  ) {
    await membershipRepository.appendHistory({
      creator: { connect: { id: creatorId } },
      ...(planId ? { plan: { connect: { id: planId } } } : {}),
      action,
      actorId,
      note,
      metadataJson: metadata ? (metadata as object) : undefined,
      ...(membershipId ? { membershipId } : {})
    });
  }
}

export const membershipAdminService = new MembershipAdminService();
