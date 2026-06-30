import { walletRepository } from "@/features/wallet/wallet.repository";
import { serializeTransaction, serializeWallet } from "@/features/wallet/wallet.serializer";
import { paymentConfig } from "@/lib/core/config/payment";
import { membershipService } from "@/features/membership/membership.service";
import type { AuthUser } from "@/features/auth/permission.service";
import { PermissionService } from "@/features/auth/permission.service";
import { appError } from "@/lib/core/errors";
import { hasDatabaseUrl, prisma } from "@/lib/core/database/prisma";

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

export class WalletService {
  private assertDb() {
    if (!hasDatabaseUrl()) throw appError("SYSTEM_ERROR", "DATABASE_URL not configured");
  }

  private assertSelfWallet(user: AuthUser, walletUserId: string) {
    if (user.role.toUpperCase() === "ADMIN") return;
    if (user.id !== walletUserId) {
      throw appError("FORBIDDEN", "Not allowed for this wallet");
    }
  }

  async getWallet(user: AuthUser) {
    this.assertDb();
    PermissionService.assert(user, "wallet.read");

    const wallet = await walletRepository.getOrCreate(user.id);
    const transactions = await walletRepository.listTransactions(wallet.id, 20);

    return {
      wallet: serializeWallet(wallet),
      transactions: transactions.map(serializeTransaction),
      limits: {
        minWithdrawUsd: paymentConfig.minWithdrawUsd,
        platformCommissionPercent: null
      }
    };
  }

  async listLedger(user: AuthUser, limit = 50) {
    this.assertDb();
    PermissionService.assert(user, "wallet.read");

    const wallet = await walletRepository.getOrCreate(user.id);
    const transactions = await walletRepository.listTransactions(wallet.id, limit);
    return {
      items: transactions.map(serializeTransaction),
      wallet: serializeWallet(wallet)
    };
  }

  /** Dual-ledger credit: pending → available with audit entries + commission snapshot. */
  async creditFromEscrowRelease(input: {
    creatorUserId: string;
    campaignId: string;
    grossAmount: number;
    description?: string;
    orderId?: string;
    currency?: string;
  }) {
    this.assertDb();

    const settled = await membershipService.getOrSettleOrderCommission({
      campaignId: input.campaignId,
      creatorId: input.creatorUserId,
      orderAmount: input.grossAmount,
      currency: input.currency,
      orderId: input.orderId
    });

    const commission = settled.creatorCommissionAmount;
    const net = settled.creatorPayoutAmount;
    const wallet = await walletRepository.getOrCreate(input.creatorUserId);
    const availableBefore = Number(wallet.availableBalance);

    await walletRepository.applyLedgerUpdate({
      walletId: wallet.id,
      campaignId: input.campaignId,
      pendingDelta: net,
      entries: [
        {
          type: "ESCROW_RELEASE",
          amount: net,
          balanceAfter: availableBefore,
          description: input.description ?? `Escrow release for campaign ${input.campaignId}`
        },
        {
          type: "PLATFORM_COMMISSION",
          amount: commission,
          balanceAfter: availableBefore,
          description: `Creator commission ${settled.creatorCommissionPercentage}% (${settled.creatorMembershipType})`
        },
        ...(settled.clientServiceFeeAmount > 0
          ? [
              {
                type: "CLIENT_SERVICE_FEE" as const,
                amount: settled.clientServiceFeeAmount,
                balanceAfter: availableBefore,
                description: `Client service fee ${settled.clientServiceFeePercentage}% (recorded at settlement)`
              }
            ]
          : [])
      ]
    });

    const afterPending = await walletRepository.applyLedgerUpdate({
      walletId: wallet.id,
      campaignId: input.campaignId,
      pendingDelta: -net,
      availableDelta: net,
      earnedDelta: net,
      entries: []
    });

    return {
      grossAmount: input.grossAmount,
      commission,
      net,
      commissionSnapshot: settled,
      wallet: serializeWallet(afterPending.wallet)
    };
  }

  async releaseEscrowForCampaign(campaignId: string, actor?: AuthUser) {
    this.assertDb();

    if (actor) {
      if (actor.role.toUpperCase() === "ADMIN") {
        PermissionService.assert(actor, "payment.release");
      } else {
        PermissionService.assert(actor, "payment.read");
      }
      const campaignCheck = await prisma.campaign.findUniqueOrThrow({ where: { id: campaignId } });
      if (
        actor.role.toUpperCase() !== "ADMIN" &&
        !PermissionService.canAccessCampaign(actor, campaignCheck)
      ) {
        throw appError("FORBIDDEN", "Not allowed for this campaign");
      }
    }

    const campaign = await prisma.campaign.findUniqueOrThrow({ where: { id: campaignId } });
    if (!campaign.creatorId) {
      throw appError("INVALID_TRANSITION", "Campaign has no creator assigned");
    }

    const escrow = await prisma.escrowPayment.findUnique({ where: { campaignId } });
    if (!escrow || escrow.status !== "HELD") {
      throw appError("INVALID_TRANSITION", "Escrow must be HELD before wallet release");
    }

    const remaining = Number(escrow.remainingAmount);
    if (remaining <= 0) {
      throw appError("INVALID_TRANSITION", "No remaining escrow to release");
    }

    const credit = await this.creditFromEscrowRelease({
      creatorUserId: campaign.creatorId,
      campaignId,
      grossAmount: remaining,
      description: `Settlement release — ${campaign.title}`
    });

    await prisma.escrowPayment.update({
      where: { campaignId },
      data: {
        status: "FULL_RELEASE",
        releasedAmount: Number(escrow.releasedAmount) + remaining,
        remainingAmount: 0
      }
    });

    if (actor) {
      await prisma.activityLog.create({
        data: {
          campaignId,
          userId: actor.id,
          action: "wallet.ESCROW_RELEASE",
          metadata: { net: credit.net, commission: credit.commission }
        }
      });
    }

    return credit;
  }
}

export const walletService = new WalletService();
