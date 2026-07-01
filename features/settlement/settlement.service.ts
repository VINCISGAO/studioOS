import { activityService } from "@/features/campaign/activity.service";
import { campaignRepository } from "@/features/campaign/campaign.repository";
import { campaignService } from "@/features/campaign/campaign.service";
import { CampaignEvent, CampaignState } from "@/features/campaign/campaign.state-machine";
import { readProductionBrief } from "@/features/campaign/brand-campaign/brand-campaign.utils";
import type { BrandProductionBrief } from "@/features/campaign/brand-campaign/brand-campaign.types";
import { calculateOrderCommission } from "@/features/membership/commission-calculation.service";
import { membershipService } from "@/features/membership/membership.service";
import { notificationService } from "@/features/notification/notification.service";
import { settlementBridgeService } from "@/features/settlement/settlement-bridge.service";
import {
  settlementRepository,
  type SettlementContext
} from "@/features/settlement/settlement.repository";
import {
  SettlementEvent,
  SettlementState,
  settlementStateMachine,
  type SettlementStateValue
} from "@/features/settlement/settlement.state-machine";
import { safeTransition } from "@/lib/core/state-machine";
import { walletRepository } from "@/features/wallet/wallet.repository";
import { walletService } from "@/features/wallet/wallet.service";
import { EscrowState } from "@/features/shared/state-machines/escrow.state-machine";
import { getAppBaseUrl } from "@/lib/app-url";
import { hasDatabaseUrl } from "@/lib/core/database/prisma";
import type { Locale } from "@/lib/i18n";
import type { CreatorIncomeSnapshot } from "@/lib/studioos/withdrawal-types";
import { MIN_WITHDRAWAL_USD } from "@/lib/studioos/withdrawal-utils";

export type SettlementAmountPreview = {
  campaignId: string;
  orderAmount: number;
  currency: string;
  creatorPayoutAmount: number;
  creatorCommissionAmount: number;
  creatorCommissionPercentage: number;
  platformTotalRevenue: number;
};

export type SettlementReleaseResult = {
  campaignId: string;
  settlementState: SettlementStateValue;
  creatorPayoutAmount: number;
  creatorCommissionAmount: number;
  currency: string;
  alreadySettled: boolean;
};

function resolveLegacyProjectId(campaign: { productionBrief: unknown; id: string }): string {
  const brief = readProductionBrief(campaign.productionBrief) as BrandProductionBrief;
  return brief.legacy_project_id ?? campaign.id;
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

export class SettlementService {
  isEnabled() {
    return hasDatabaseUrl();
  }

  resolveState(ctx: SettlementContext): SettlementStateValue {
    if (ctx.campaign.status === CampaignState.COMPLETED) {
      return SettlementState.COMPLETED;
    }

    if (
      ctx.campaign.status === CampaignState.SETTLEMENT ||
      ctx.escrow?.status === EscrowState.FULL_RELEASE ||
      ctx.escrow?.status === EscrowState.CLOSED ||
      ctx.commission
    ) {
      return SettlementState.RELEASED;
    }

    if (
      ctx.delivery?.status === "LOCKED" &&
      ctx.escrow?.status === EscrowState.HELD &&
      ctx.campaign.status === CampaignState.MASTER_UPLOADED &&
      Number(ctx.escrow.remainingAmount) > 0
    ) {
      return SettlementState.READY;
    }

    return SettlementState.BLOCKED;
  }

  async getStateForLegacyProject(legacyProjectId: string): Promise<SettlementStateValue | null> {
    if (!this.isEnabled()) return null;
    const ctx = await settlementRepository.findContextByLegacyProjectId(legacyProjectId);
    return ctx ? this.resolveState(ctx) : null;
  }

  async previewForLegacyProject(
    legacyProjectId: string
  ): Promise<SettlementAmountPreview | null> {
    if (!this.isEnabled()) return null;

    const ctx = await settlementRepository.findContextByLegacyProjectId(legacyProjectId);
    if (!ctx?.campaign.creatorId || !ctx.escrow) return null;

    const orderAmount = Number(ctx.escrow.remainingAmount || ctx.escrow.amount);
    if (ctx.commission) {
      return {
        campaignId: ctx.campaign.id,
        orderAmount: Number(ctx.commission.orderAmount),
        currency: ctx.commission.currency,
        creatorPayoutAmount: Number(ctx.commission.creatorPayoutAmount),
        creatorCommissionAmount: Number(ctx.commission.creatorCommissionAmount),
        creatorCommissionPercentage: Number(ctx.commission.creatorCommissionPercentage),
        platformTotalRevenue: Number(ctx.commission.platformTotalRevenue)
      };
    }

    const { commissionPercentage, rule, planType } =
      await membershipService.resolveCreatorCommissionRate(ctx.campaign.creatorId);
    const breakdown = calculateOrderCommission({
      orderAmount,
      currency: ctx.escrow.currency,
      creatorCommissionPercentage: commissionPercentage,
      clientServiceFeePercentage: rule.clientServiceFeePercentage,
      clientServiceFeeEnabled: rule.clientServiceFeeEnabled,
      creatorMembershipType: planType
    });

    return {
      campaignId: ctx.campaign.id,
      orderAmount: breakdown.orderAmount,
      currency: breakdown.currency,
      creatorPayoutAmount: breakdown.creatorPayoutAmount,
      creatorCommissionAmount: breakdown.creatorCommissionAmount,
      creatorCommissionPercentage: breakdown.creatorCommissionPercentage,
      platformTotalRevenue: breakdown.platformTotalRevenue
    };
  }

  async getCreatorIncomeSnapshot(creatorUserId: string): Promise<CreatorIncomeSnapshot | null> {
    if (!this.isEnabled()) return null;

    const [wallet, heldUsd] = await Promise.all([
      walletRepository.getOrCreate(creatorUserId),
      settlementRepository.sumHeldEscrowForCreator(creatorUserId)
    ]);

    return {
      available_usd: roundMoney(Number(wallet.availableBalance)),
      held_usd: roundMoney(heldUsd),
      pending_withdrawal_usd: 0,
      lifetime_withdrawn_usd: roundMoney(Number(wallet.totalWithdraw)),
      min_withdrawal_usd: MIN_WITHDRAWAL_USD
    };
  }

  private assertCanRelease(
    ctx: SettlementContext,
    actor: { id: string; role: string }
  ): { ok: true } | { ok: false; error: string } {
    const role = actor.role.toUpperCase();
    if (role === "ADMIN") return { ok: true };
    if (role === "BRAND" && actor.id === ctx.campaign.brandId) return { ok: true };
    return { ok: false, error: "unauthorized" };
  }

  private async completeCampaignIfNeeded(
    ctx: SettlementContext,
    actor: { id: string; role: string }
  ) {
    const refreshed = await campaignRepository.findById(ctx.campaign.id);
    if (!refreshed) return;

    if (refreshed.status === CampaignState.MASTER_UPLOADED) {
      await campaignService.transition(refreshed.id, CampaignEvent.RELEASE_PAYMENT, actor);
    }

    const afterRelease = await campaignRepository.findById(refreshed.id);
    if (afterRelease?.status === CampaignState.SETTLEMENT) {
      await campaignService.transition(afterRelease.id, CampaignEvent.COMPLETE, actor);
    }
  }

  async releaseForCampaign(input: {
    campaignId: string;
    actor: { id: string; role: string; email?: string };
    locale?: Locale;
    orderId?: string | null;
  }): Promise<
    { ok: true; result: SettlementReleaseResult } | { ok: false; error: string }
  > {
    if (!this.isEnabled()) {
      return { ok: false, error: "no-database" };
    }

    const ctx = await settlementRepository.findContextByCampaignId(input.campaignId);
    if (!ctx) {
      return { ok: false, error: "not-found" };
    }

    const settlementState = this.resolveState(ctx);
    const locale = input.locale ?? "en";

    if (settlementState === SettlementState.COMPLETED) {
      const preview = await this.previewForLegacyProject(resolveLegacyProjectId(ctx.campaign));
      return {
        ok: true,
        result: {
          campaignId: ctx.campaign.id,
          settlementState,
          creatorPayoutAmount: preview?.creatorPayoutAmount ?? 0,
          creatorCommissionAmount: preview?.creatorCommissionAmount ?? 0,
          currency: preview?.currency ?? ctx.campaign.currency,
          alreadySettled: true
        }
      };
    }

    if (settlementState === SettlementState.RELEASED) {
      await this.completeCampaignIfNeeded(ctx, input.actor);
      const preview = await this.previewForLegacyProject(resolveLegacyProjectId(ctx.campaign));
      return {
        ok: true,
        result: {
          campaignId: ctx.campaign.id,
          settlementState: SettlementState.COMPLETED,
          creatorPayoutAmount: preview?.creatorPayoutAmount ?? 0,
          creatorCommissionAmount: preview?.creatorCommissionAmount ?? 0,
          currency: preview?.currency ?? ctx.campaign.currency,
          alreadySettled: true
        }
      };
    }

    if (settlementState !== SettlementState.READY) {
      return { ok: false, error: "not-ready" };
    }

    const auth = this.assertCanRelease(ctx, input.actor);
    if (!auth.ok) {
      return { ok: false, error: auth.error };
    }

    const releaseCheck = safeTransition(
      settlementStateMachine,
      SettlementState.READY,
      SettlementEvent.RELEASE
    );
    if (!releaseCheck.ok) {
      return { ok: false, error: "invalid-transition" };
    }

    const credit = await walletService.releaseEscrowForCampaign(ctx.campaign.id, {
      id: input.actor.id,
      role: input.actor.role
    });

    await settlementRepository.markCreatorPayoutReleased(ctx.campaign.id, input.actor.id);

    if (ctx.campaign.status === CampaignState.MASTER_UPLOADED) {
      await campaignService.transition(ctx.campaign.id, CampaignEvent.RELEASE_PAYMENT, input.actor);
    }

    const afterRelease = await campaignRepository.findById(ctx.campaign.id);
    if (afterRelease?.status === CampaignState.SETTLEMENT) {
      const completeCheck = safeTransition(
        settlementStateMachine,
        SettlementState.RELEASED,
        SettlementEvent.COMPLETE
      );
      if (!completeCheck.ok) {
        return { ok: false, error: "invalid-transition" };
      }
      await campaignService.transition(afterRelease.id, CampaignEvent.COMPLETE, input.actor);
    }

    await activityService.write(
      ctx.campaign.id,
      "settlement.released",
      {
        userId: input.actor.id,
        email: input.actor.email ?? input.actor.id,
        role: input.actor.role.toLowerCase() === "brand" ? "brand" : "admin"
      },
      {
        legacy_project_id: resolveLegacyProjectId(ctx.campaign),
        order_id: input.orderId ?? null,
        net: credit.net,
        commission: credit.commission,
        gross: credit.grossAmount
      }
    );

    const legacyProjectId = resolveLegacyProjectId(ctx.campaign);

    if (ctx.campaign.creatorId) {
      await notificationService
        .notify({
          userId: ctx.campaign.creatorId,
          campaignId: ctx.campaign.id,
          title: locale === "zh" ? "托管款已释放" : "Escrow released to your income",
          content:
            locale === "zh"
              ? `「${ctx.campaign.title}」结算完成，$${credit.net} 已计入可提现余额。`
              : `"${ctx.campaign.title}" is settled — $${credit.net} is now available in your income.`,
          actionUrl: `${getAppBaseUrl()}/studio/income`,
          email: false
        })
        .catch(() => undefined);
    }

    await notificationService
      .notify({
        userId: ctx.campaign.brandId,
        campaignId: ctx.campaign.id,
        title: locale === "zh" ? "Campaign 已结算" : "Campaign settled",
        content:
          locale === "zh"
            ? `「${ctx.campaign.title}」托管款已释放给制作团队，项目已完成。`
            : `"${ctx.campaign.title}" escrow has been released to the studio. Project completed.`,
        actionUrl: `${getAppBaseUrl()}/brand/projects/${legacyProjectId}`,
        email: false
      })
      .catch(() => undefined);

    await settlementBridgeService.syncLegacyAfterSettled(ctx.campaign.id);

    return {
      ok: true,
      result: {
        campaignId: ctx.campaign.id,
        settlementState: SettlementState.COMPLETED,
        creatorPayoutAmount: credit.net,
        creatorCommissionAmount: credit.commission,
        currency: ctx.escrow?.currency ?? ctx.campaign.currency,
        alreadySettled: false
      }
    };
  }

  async releaseForLegacyProject(input: {
    legacyProjectId: string;
    actor: { id: string; role: string; email?: string };
    locale?: Locale;
    orderId?: string | null;
  }): Promise<
    { ok: true; result: SettlementReleaseResult } | { ok: false; error: string }
  > {
    if (!this.isEnabled()) {
      return { ok: false, error: "no-database" };
    }

    const ctx = await settlementRepository.findContextByLegacyProjectId(input.legacyProjectId);
    if (!ctx) {
      return { ok: false, error: "not-found" };
    }

    return this.releaseForCampaign({
      campaignId: ctx.campaign.id,
      actor: input.actor,
      locale: input.locale,
      orderId: input.orderId
    });
  }
}

export const settlementService = new SettlementService();
