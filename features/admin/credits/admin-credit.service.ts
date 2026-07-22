import type { AuthUser } from "@/features/auth/permission.service";
import { PermissionService } from "@/features/auth/permission.service";
import { serializeCreditPackage } from "@/features/credit-wallet/credit-wallet.serializer";
import { hasDatabaseUrl, prisma } from "@/lib/core/database/prisma";

function dayStart(now = new Date()) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export class AdminCreditService {
  private assertAccess(user: AuthUser) {
    PermissionService.assert(user, "admin.wallet.manage");
    if (!hasDatabaseUrl()) return false;
    return true;
  }

  async getOverview(user: AuthUser) {
    if (!this.assertAccess(user)) {
      return {
        todayPurchaseMinor: 0,
        todayCreditsSold: 0,
        todayCreditsCaptured: 0,
        totalLiability: 0,
        totalBonus: 0,
        totalRefunded: 0,
        conversionMinorToday: 0,
        walletCount: 0
      };
    }

    const start = dayStart();
    const [
      purchaseAgg,
      captureAgg,
      liabilityAgg,
      bonusAgg,
      refundAgg,
      conversionAgg,
      walletCount
    ] = await Promise.all([
      prisma.creditPurchaseOrder.aggregate({
        where: { status: "CREDITED", creditedAt: { gte: start } },
        _sum: { amountMinor: true, credits: true, bonusCredits: true }
      }),
      prisma.creditTransaction.aggregate({
        where: { type: "CAPTURE", createdAt: { gte: start } },
        _sum: { amount: true }
      }),
      prisma.creditWallet.aggregate({
        _sum: { availableCredits: true, reservedCredits: true }
      }),
      prisma.creditWallet.aggregate({ _sum: { lifetimeBonus: true } }),
      prisma.creditWallet.aggregate({ _sum: { lifetimeRefunded: true } }),
      prisma.earningToCreditConversion.aggregate({
        where: { status: "COMPLETED", completedAt: { gte: start } },
        _sum: { earningAmountMinor: true }
      }),
      prisma.creditWallet.count()
    ]);

    return {
      todayPurchaseMinor: purchaseAgg._sum.amountMinor ?? 0,
      todayCreditsSold:
        (purchaseAgg._sum.credits ?? 0) + (purchaseAgg._sum.bonusCredits ?? 0),
      todayCreditsCaptured: captureAgg._sum.amount ?? 0,
      totalLiability:
        (liabilityAgg._sum.availableCredits ?? 0) + (liabilityAgg._sum.reservedCredits ?? 0),
      totalBonus: bonusAgg._sum.lifetimeBonus ?? 0,
      totalRefunded: refundAgg._sum.lifetimeRefunded ?? 0,
      conversionMinorToday: conversionAgg._sum.earningAmountMinor ?? 0,
      walletCount
    };
  }

  async listWallets(user: AuthUser, search?: string) {
    if (!this.assertAccess(user)) return { items: [], total: 0 };

    const where = search
      ? {
          OR: [
            { email: { contains: search, mode: "insensitive" as const } },
            { fullName: { contains: search, mode: "insensitive" as const } },
            { id: search }
          ]
        }
      : undefined;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        take: 50,
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          creditWallet: true
        }
      }),
      prisma.user.count({ where })
    ]);

    return {
      total,
      items: users.map((row) => ({
        userId: row.id,
        email: row.email,
        name: row.fullName,
        role: row.role,
        availableCredits: row.creditWallet?.availableCredits ?? 0,
        reservedCredits: row.creditWallet?.reservedCredits ?? 0,
        lifetimePurchased: row.creditWallet?.lifetimePurchased ?? 0,
        lifetimeSpent: row.creditWallet?.lifetimeSpent ?? 0
      }))
    };
  }

  async listPackages(user: AuthUser) {
    if (!this.assertAccess(user)) return [];
    const rows = await prisma.creditPackage.findMany({
      orderBy: [{ sortOrder: "asc" }, { credits: "asc" }]
    });
    return rows.map((row) => ({
      ...serializeCreditPackage(row),
      enabled: row.enabled,
      sortOrder: row.sortOrder,
      startsAt: row.startsAt?.toISOString() ?? null,
      endsAt: row.endsAt?.toISOString() ?? null
    }));
  }

  async listRecentOrders(user: AuthUser, limit = 20) {
    if (!this.assertAccess(user)) return [];
    return prisma.creditPurchaseOrder.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { email: true, fullName: true } } }
    });
  }

  async listRecentTransactions(user: AuthUser, limit = 30) {
    if (!this.assertAccess(user)) return [];
    return prisma.creditTransaction.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { email: true, fullName: true } } }
    });
  }

  async listPricingRules(user: AuthUser) {
    if (!this.assertAccess(user)) return [];
    const { creditPricingService } = await import("@/features/credit-wallet/credit-pricing.service");
    return creditPricingService.listRules(true);
  }

  async getWalletDetail(user: AuthUser, userId: string) {
    if (!this.assertAccess(user)) return null;
    const { creditWalletRepository } = await import("@/features/credit-wallet/credit-wallet.repository");
    const wallet = await creditWalletRepository.findWallet(userId);
    if (!wallet) {
      const row = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, fullName: true, role: true }
      });
      if (!row) return null;
      return {
        user: row,
        wallet: null,
        transactions: [],
        reservations: []
      };
    }

    const [transactions, reservations, userRow] = await Promise.all([
      creditWalletRepository.listWalletTransactions(wallet.id, 40),
      creditWalletRepository.listWalletReservations(wallet.id, 20),
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, fullName: true, role: true }
      })
    ]);

    return {
      user: userRow,
      wallet,
      transactions,
      reservations
    };
  }
}

export const adminCreditService = new AdminCreditService();
