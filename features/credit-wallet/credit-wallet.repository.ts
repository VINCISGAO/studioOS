import type {
  CreditPurchaseStatus,
  CreditReservationStatus,
  CreditSource,
  CreditTransactionType,
  Prisma
} from "@prisma/client";
import { prisma } from "@/lib/core/database/prisma";
import { appError } from "@/lib/core/errors";

function assertPositiveInt(value: number, label: string) {
  if (!Number.isInteger(value) || value <= 0) {
    throw appError("VALIDATION_ERROR", `${label} must be a positive integer`);
  }
}

async function writeCreditTransaction(
  tx: Prisma.TransactionClient,
  input: {
    userId: string;
    walletId: string;
    type: CreditTransactionType;
    amount: number;
    balanceBefore: number;
    balanceAfter: number;
    source: CreditSource;
    referenceType?: string;
    referenceId?: string;
    description?: string;
    metadata?: Prisma.InputJsonValue;
    createdBy?: string;
  }
) {
  return tx.creditTransaction.create({
    data: {
      userId: input.userId,
      walletId: input.walletId,
      type: input.type,
      amount: input.amount,
      balanceBefore: input.balanceBefore,
      balanceAfter: input.balanceAfter,
      source: input.source,
      referenceType: input.referenceType,
      referenceId: input.referenceId,
      description: input.description,
      metadata: input.metadata,
      createdBy: input.createdBy
    }
  });
}

export const creditWalletRepository = {
  getOrCreateWallet(userId: string) {
    return prisma.creditWallet.upsert({
      where: { userId },
      create: { userId },
      update: {}
    });
  },

  async getOrCreateEarningWallet(userId: string) {
    const existing = await prisma.creatorEarningWallet.findUnique({ where: { userId } });
    if (existing) return existing;

    const legacyWallet = await prisma.wallet.findUnique({ where: { userId } });
    const availableMinor = legacyWallet
      ? Math.max(0, Math.round(Number(legacyWallet.availableBalance) * 100))
      : 0;
    const pendingMinor = legacyWallet
      ? Math.max(0, Math.round(Number(legacyWallet.pendingBalance) * 100))
      : 0;
    const withdrawnMinor = legacyWallet
      ? Math.max(0, Math.round(Number(legacyWallet.totalWithdraw) * 100))
      : 0;

    return prisma.creatorEarningWallet.create({
      data: {
        userId,
        availableBalanceMinor: availableMinor,
        pendingBalanceMinor: pendingMinor,
        withdrawnBalanceMinor: withdrawnMinor
      }
    });
  },

  findWallet(userId: string) {
    return prisma.creditWallet.findUnique({ where: { userId } });
  },

  findWalletById(walletId: string) {
    return prisma.creditWallet.findUnique({
      where: { id: walletId },
      include: {
        user: { select: { id: true, email: true, fullName: true, role: true } }
      }
    });
  },

  listWalletTransactions(walletId: string, limit = 50) {
    return prisma.creditTransaction.findMany({
      where: { walletId },
      orderBy: { createdAt: "desc" },
      take: limit
    });
  },

  listWalletReservations(walletId: string, limit = 20) {
    return prisma.creditReservation.findMany({
      where: { walletId },
      orderBy: { createdAt: "desc" },
      take: limit
    });
  },

  findAdminAdjustmentByIdempotency(idempotencyKey: string) {
    return prisma.creditTransaction.findFirst({
      where: {
        type: "ADMIN_ADJUSTMENT",
        referenceType: "AdminCreditAdjustment",
        referenceId: idempotencyKey
      }
    });
  },

  linkReservationToJob(reservationId: string, generationJobId: string) {
    return prisma.creditReservation.update({
      where: { id: reservationId },
      data: { generationJobId }
    });
  },

  listActivePackages(now = new Date()) {
    return prisma.creditPackage.findMany({
      where: {
        enabled: true,
        visible: true,
        deletedAt: null,
        OR: [{ startsAt: null }, { startsAt: { lte: now } }],
        AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }]
      },
      orderBy: [{ sortOrder: "asc" }, { credits: "asc" }]
    });
  },

  findPackageById(packageId: string) {
    return this.findActivePackageById(packageId);
  },

  findActivePackageById(packageId: string, now = new Date()) {
    return prisma.creditPackage.findFirst({
      where: {
        id: packageId,
        enabled: true,
        OR: [{ startsAt: null }, { startsAt: { lte: now } }],
        AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }]
      }
    });
  },

  findPurchaseOrderByIdempotency(idempotencyKey: string) {
    return prisma.creditPurchaseOrder.findUnique({ where: { idempotencyKey } });
  },

  findPurchaseOrderBySessionId(sessionId: string) {
    return prisma.creditPurchaseOrder.findFirst({ where: { providerSessionId: sessionId } });
  },

  findPurchaseOrderByPaymentId(paymentId: string) {
    return prisma.creditPurchaseOrder.findFirst({ where: { providerPaymentId: paymentId } });
  },

  findPurchaseOrderByChargeId(chargeId: string) {
    return prisma.creditPurchaseOrder.findFirst({ where: { providerChargeId: chargeId } });
  },

  findPurchaseOrderById(orderId: string) {
    return prisma.creditPurchaseOrder.findUnique({ where: { id: orderId } });
  },

  findReservationByIdempotency(idempotencyKey: string) {
    return prisma.creditReservation.findUnique({ where: { idempotencyKey } });
  },

  findReservationById(id: string) {
    return prisma.creditReservation.findUnique({ where: { id } });
  },

  findConversionByIdempotency(idempotencyKey: string) {
    return prisma.earningToCreditConversion.findUnique({ where: { idempotencyKey } });
  },

  getExchangeRateConfig(currency: string) {
    return prisma.creditExchangeRateConfig.findFirst({
      where: { currency, enabled: true }
    });
  },

  listTransactions(userId: string, limit = 20) {
    return prisma.creditTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit
    });
  },

  listPurchaseOrders(userId: string, limit = 20) {
    return prisma.creditPurchaseOrder.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit
    });
  },

  listEarningConversions(userId: string, limit = 20) {
    return prisma.earningToCreditConversion.findMany({
      where: { userId, status: "COMPLETED" },
      orderBy: { createdAt: "desc" },
      take: limit
    });
  },

  findPurchaseOrderForUser(orderId: string, userId: string) {
    return prisma.creditPurchaseOrder.findFirst({
      where: { id: orderId, userId }
    });
  },

  sumMonthSpent(userId: string, monthStart: Date) {
    return prisma.creditTransaction.aggregate({
      where: {
        userId,
        type: "CAPTURE",
        createdAt: { gte: monthStart }
      },
      _sum: { amount: true }
    });
  },

  createPurchaseOrder(input: {
    userId: string;
    walletId: string;
    packageId?: string | null;
    packageVersion?: number | null;
    regionalPriceId?: string | null;
    regionCode?: string | null;
    credits: number;
    bonusCredits: number;
    currency: string;
    amountMinor: number;
    stripePriceIdSnapshot?: string | null;
    pricingSnapshot?: Prisma.InputJsonValue;
    idempotencyKey: string;
  }) {
    return prisma.creditPurchaseOrder.create({
      data: {
        userId: input.userId,
        walletId: input.walletId,
        packageId: input.packageId ?? null,
        packageVersion: input.packageVersion ?? null,
        regionalPriceId: input.regionalPriceId ?? null,
        regionCode: input.regionCode ?? null,
        credits: input.credits,
        bonusCredits: input.bonusCredits,
        currency: input.currency,
        amountMinor: input.amountMinor,
        stripePriceIdSnapshot: input.stripePriceIdSnapshot ?? null,
        pricingSnapshot: input.pricingSnapshot,
        status: "PENDING",
        idempotencyKey: input.idempotencyKey
      }
    });
  },

  markPurchasePaymentCreated(orderId: string, sessionId: string) {
    return prisma.creditPurchaseOrder.updateMany({
      where: {
        id: orderId,
        status: { in: ["PENDING", "PAYMENT_CREATED"] }
      },
      data: { status: "PAYMENT_CREATED", providerSessionId: sessionId }
    });
  },

  markPurchaseCancelled(orderId: string) {
    return prisma.creditPurchaseOrder.updateMany({
      where: {
        id: orderId,
        status: { in: ["PENDING", "PAYMENT_CREATED"] }
      },
      data: { status: "CANCELLED", cancelledAt: new Date() }
    });
  },

  markPurchaseFailed(orderId: string) {
    return prisma.creditPurchaseOrder.updateMany({
      where: {
        id: orderId,
        status: { in: ["PENDING", "PAYMENT_CREATED"] }
      },
      data: { status: "FAILED", failedAt: new Date() }
    });
  },

  markPurchaseCancelledBySession(sessionId: string) {
    return prisma.creditPurchaseOrder.updateMany({
      where: {
        providerSessionId: sessionId,
        status: { in: ["PENDING", "PAYMENT_CREATED"] }
      },
      data: { status: "CANCELLED", cancelledAt: new Date() }
    });
  },

  markPurchaseFailedBySession(sessionId: string) {
    return prisma.creditPurchaseOrder.updateMany({
      where: {
        providerSessionId: sessionId,
        status: { in: ["PENDING", "PAYMENT_CREATED"] }
      },
      data: { status: "FAILED", failedAt: new Date() }
    });
  },

  async creditPurchaseOrderOnce(input: {
    orderId: string;
    providerPaymentId: string;
    providerSessionId?: string;
    providerChargeId?: string;
    paidAt: Date;
  }) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.creditPurchaseOrder.findUnique({ where: { id: input.orderId } });
      if (!order) throw appError("NOT_FOUND", "Credit purchase order not found");
      if (order.status === "CREDITED") {
        return { order, duplicate: true, totalCredits: order.credits + order.bonusCredits };
      }
      if (order.status === "REFUNDED" || order.status === "DISPUTED") {
        throw appError("VALIDATION_ERROR", "Credit purchase order is closed");
      }
      if (!["PENDING", "PAYMENT_CREATED", "PAID"].includes(order.status)) {
        throw appError("VALIDATION_ERROR", `Credit purchase order is ${order.status}`);
      }
      if (
        input.providerSessionId &&
        order.providerSessionId &&
        order.providerSessionId !== input.providerSessionId
      ) {
        throw appError("VALIDATION_ERROR", "Stripe session mismatch");
      }

      const wallet = await tx.creditWallet.findUnique({ where: { id: order.walletId } });
      if (!wallet) throw appError("NOT_FOUND", "Credit wallet not found");
      if (wallet.purchaseBlocked) {
        throw appError("VALIDATION_ERROR", "Credit purchases are temporarily blocked for this account");
      }

      const totalCredits = order.credits + order.bonusCredits;
      const balanceBefore = wallet.availableCredits;
      const balanceAfter = balanceBefore + totalCredits;

      const updated = await tx.creditWallet.updateMany({
        where: {
          id: wallet.id,
          version: wallet.version
        },
        data: {
          availableCredits: { increment: totalCredits },
          lifetimePurchased: { increment: order.credits },
          lifetimeBonus: { increment: order.bonusCredits },
          version: { increment: 1 }
        }
      });

      if (updated.count !== 1) {
        throw appError("CONFLICT", "Credit wallet update conflict");
      }

      await writeCreditTransaction(tx, {
        userId: order.userId,
        walletId: wallet.id,
        type: "PURCHASE",
        amount: order.credits,
        balanceBefore,
        balanceAfter: balanceBefore + order.credits,
        source: "CASH_PAYMENT",
        referenceType: "CreditPurchaseOrder",
        referenceId: order.id,
        description: "Token package purchase",
        metadata: {
          providerPaymentId: input.providerPaymentId,
          providerSessionId: input.providerSessionId ?? order.providerSessionId,
          providerChargeId: input.providerChargeId ?? null
        }
      });

      if (order.bonusCredits > 0) {
        await writeCreditTransaction(tx, {
          userId: order.userId,
          walletId: wallet.id,
          type: "BONUS",
          amount: order.bonusCredits,
          balanceBefore: balanceBefore + order.credits,
          balanceAfter,
          source: "PROMOTION",
          referenceType: "CreditPurchaseOrder",
          referenceId: order.id,
          description: "Purchase bonus Token",
          metadata: {
            providerPaymentId: input.providerPaymentId
          }
        });
      }

      const creditedOrder = await tx.creditPurchaseOrder.update({
        where: { id: order.id },
        data: {
          status: "CREDITED",
          providerPaymentId: input.providerPaymentId,
          providerSessionId: input.providerSessionId ?? order.providerSessionId,
          providerChargeId: input.providerChargeId ?? order.providerChargeId,
          paidAt: input.paidAt,
          creditedAt: new Date()
        }
      });

      return { order: creditedOrder, duplicate: false, totalCredits };
    });
  },

  async refundPurchaseOrderOnce(input: {
    orderId: string;
    providerRefundId: string;
    cumulativeRefundedMinor: number;
    refundAmountMinor: number;
    refundedAt: Date;
  }) {
    return prisma.$transaction(async (tx) => {
      const existingEvent = await tx.creditPurchaseRefundEvent.findUnique({
        where: { providerRefundId: input.providerRefundId }
      });
      if (existingEvent) {
        const order = await tx.creditPurchaseOrder.findUniqueOrThrow({ where: { id: input.orderId } });
        return {
          order,
          duplicate: true,
          clawedBack: 0,
          shortfall: 0,
          cumulativeRefundedMinor: order.totalRefundedMinor
        };
      }

      const order = await tx.creditPurchaseOrder.findUnique({ where: { id: input.orderId } });
      if (!order) throw appError("NOT_FOUND", "Credit purchase order not found");
      if (!["CREDITED", "PARTIALLY_REFUNDED", "DISPUTED"].includes(order.status)) {
        throw appError("VALIDATION_ERROR", "Only credited orders can be refunded");
      }
      if (input.cumulativeRefundedMinor < order.totalRefundedMinor) {
        throw appError("VALIDATION_ERROR", "Refund cumulative amount moved backwards");
      }
      if (input.cumulativeRefundedMinor === order.totalRefundedMinor) {
        return {
          order,
          duplicate: true,
          clawedBack: 0,
          shortfall: 0,
          cumulativeRefundedMinor: order.totalRefundedMinor
        };
      }

      const wallet = await tx.creditWallet.findUnique({ where: { id: order.walletId } });
      if (!wallet) throw appError("NOT_FOUND", "Credit wallet not found");

      const totalCredits = order.credits + order.bonusCredits;
      const targetClawedBack = Math.min(
        totalCredits,
        Math.floor((totalCredits * input.cumulativeRefundedMinor) / Math.max(order.amountMinor, 1))
      );
      const deltaClawedBack = Math.max(0, targetClawedBack - order.creditsClawedBack);
      const clawedBack = Math.min(wallet.availableCredits, deltaClawedBack);
      const shortfall = deltaClawedBack - clawedBack;
      const balanceBefore = wallet.availableCredits;
      const balanceAfter = balanceBefore - clawedBack;

      if (clawedBack > 0) {
        const updated = await tx.creditWallet.updateMany({
          where: {
            id: wallet.id,
            version: wallet.version,
            availableCredits: { gte: clawedBack }
          },
          data: {
            availableCredits: { decrement: clawedBack },
            lifetimeRefunded: { increment: clawedBack },
            version: { increment: 1 }
          }
        });
        if (updated.count !== 1) throw appError("CONFLICT", "Unable to claw back credits");

        await writeCreditTransaction(tx, {
          userId: order.userId,
          walletId: wallet.id,
          type: "REFUND",
          amount: -clawedBack,
          balanceBefore,
          balanceAfter,
          source: "CASH_PAYMENT",
          referenceType: "CreditPurchaseOrder",
          referenceId: order.id,
          description:
            shortfall > 0 || input.cumulativeRefundedMinor < order.amountMinor
              ? "Partial credit refund clawback"
              : "Credit purchase refund",
          metadata: {
            providerRefundId: input.providerRefundId,
            refundAmountMinor: input.refundAmountMinor,
            cumulativeRefundedMinor: input.cumulativeRefundedMinor,
            requestedDelta: deltaClawedBack,
            shortfall,
            partial: input.cumulativeRefundedMinor < order.amountMinor || shortfall > 0
          }
        });
      }

      const nextStatus =
        input.cumulativeRefundedMinor >= order.amountMinor ? "REFUNDED" : "PARTIALLY_REFUNDED";

      const refundedOrder = await tx.creditPurchaseOrder.update({
        where: { id: order.id },
        data: {
          status: nextStatus,
          totalRefundedMinor: input.cumulativeRefundedMinor,
          creditsClawedBack: order.creditsClawedBack + clawedBack
        }
      });

      await tx.creditPurchaseRefundEvent.create({
        data: {
          orderId: order.id,
          providerRefundId: input.providerRefundId,
          refundAmountMinor: input.refundAmountMinor,
          cumulativeRefundedMinor: input.cumulativeRefundedMinor,
          creditsClawedBackDelta: clawedBack
        }
      });

      return {
        order: refundedOrder,
        duplicate: false,
        clawedBack,
        shortfall,
        cumulativeRefundedMinor: input.cumulativeRefundedMinor
      };
    });
  },

  async handlePurchaseDisputeCreated(input: {
    orderId: string;
    stripeDisputeId: string;
    disputeStatus: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.creditPurchaseOrder.findUnique({ where: { id: input.orderId } });
      if (!order) throw appError("NOT_FOUND", "Credit purchase order not found");
      if (order.status === "DISPUTED" && order.stripeDisputeId === input.stripeDisputeId) {
        return { order, duplicate: true, heldCredits: order.creditsDisputeHeld };
      }
      if (!["CREDITED", "PARTIALLY_REFUNDED"].includes(order.status)) {
        throw appError("VALIDATION_ERROR", "Only active credited orders can enter dispute");
      }

      const wallet = await tx.creditWallet.findUnique({ where: { id: order.walletId } });
      if (!wallet) throw appError("NOT_FOUND", "Credit wallet not found");

      const totalCredits = order.credits + order.bonusCredits;
      const remainingPurchaseCredits = Math.max(0, totalCredits - order.creditsClawedBack - order.creditsDisputeHeld);
      const holdCredits = Math.min(wallet.availableCredits, remainingPurchaseCredits);
      const balanceBefore = wallet.availableCredits;
      const balanceAfter = balanceBefore - holdCredits;

      if (holdCredits > 0) {
        const updated = await tx.creditWallet.updateMany({
          where: {
            id: wallet.id,
            version: wallet.version,
            availableCredits: { gte: holdCredits }
          },
          data: {
            availableCredits: { decrement: holdCredits },
            purchaseBlocked: true,
            version: { increment: 1 }
          }
        });
        if (updated.count !== 1) throw appError("CONFLICT", "Unable to hold credits for dispute");

        await writeCreditTransaction(tx, {
          userId: order.userId,
          walletId: wallet.id,
          type: "REFUND",
          amount: -holdCredits,
          balanceBefore,
          balanceAfter,
          source: "CASH_PAYMENT",
          referenceType: "CreditPurchaseOrder",
          referenceId: order.id,
          description: "Token held for payment dispute",
          metadata: {
            stripeDisputeId: input.stripeDisputeId,
            disputeStatus: input.disputeStatus,
            disputeHold: true
          }
        });
      } else {
        await tx.creditWallet.updateMany({
          where: { id: wallet.id },
          data: { purchaseBlocked: true }
        });
      }

      const disputedOrder = await tx.creditPurchaseOrder.update({
        where: { id: order.id },
        data: {
          status: "DISPUTED",
          stripeDisputeId: input.stripeDisputeId,
          disputeStatus: input.disputeStatus,
          creditsDisputeHeld: order.creditsDisputeHeld + holdCredits
        }
      });

      return { order: disputedOrder, duplicate: false, heldCredits: holdCredits };
    });
  },

  async handlePurchaseDisputeClosed(input: {
    orderId: string;
    stripeDisputeId: string;
    disputeStatus: string;
    merchantWon: boolean;
  }) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.creditPurchaseOrder.findUnique({ where: { id: input.orderId } });
      if (!order) throw appError("NOT_FOUND", "Credit purchase order not found");
      if (order.stripeDisputeId !== input.stripeDisputeId) {
        throw appError("VALIDATION_ERROR", "Dispute id mismatch");
      }
      if (order.disputeStatus === input.disputeStatus && order.creditsDisputeHeld === 0) {
        return { order, duplicate: true, releasedCredits: 0, forfeitedCredits: 0 };
      }

      const wallet = await tx.creditWallet.findUnique({ where: { id: order.walletId } });
      if (!wallet) throw appError("NOT_FOUND", "Credit wallet not found");

      const heldCredits = order.creditsDisputeHeld;
      let releasedCredits = 0;
      let forfeitedCredits = 0;

      if (heldCredits > 0) {
        const balanceBefore = wallet.availableCredits;
        if (input.merchantWon) {
          releasedCredits = heldCredits;
          const balanceAfter = balanceBefore + releasedCredits;
          const updated = await tx.creditWallet.updateMany({
            where: { id: wallet.id, version: wallet.version },
            data: {
              availableCredits: { increment: releasedCredits },
              purchaseBlocked: false,
              version: { increment: 1 }
            }
          });
          if (updated.count !== 1) throw appError("CONFLICT", "Unable to release dispute hold");

          await writeCreditTransaction(tx, {
            userId: order.userId,
            walletId: wallet.id,
            type: "BONUS",
            amount: releasedCredits,
            balanceBefore,
            balanceAfter,
            source: "CASH_PAYMENT",
            referenceType: "CreditPurchaseOrder",
            referenceId: order.id,
            description: "Dispute won — Token released",
            metadata: {
              stripeDisputeId: input.stripeDisputeId,
              disputeStatus: input.disputeStatus,
              disputeRelease: true
            }
          });
        } else {
          forfeitedCredits = heldCredits;
          const updated = await tx.creditWallet.updateMany({
            where: { id: wallet.id, version: wallet.version },
            data: {
              lifetimeRefunded: { increment: forfeitedCredits },
              purchaseBlocked: false,
              version: { increment: 1 }
            }
          });
          if (updated.count !== 1) throw appError("CONFLICT", "Unable to finalize dispute loss");

          await writeCreditTransaction(tx, {
            userId: order.userId,
            walletId: wallet.id,
            type: "REFUND",
            amount: -forfeitedCredits,
            balanceBefore,
            balanceAfter: balanceBefore,
            source: "CASH_PAYMENT",
            referenceType: "CreditPurchaseOrder",
            referenceId: order.id,
            description: "Dispute lost — Token forfeited",
            metadata: {
              stripeDisputeId: input.stripeDisputeId,
              disputeStatus: input.disputeStatus,
              disputeForfeit: true
            }
          });
        }
      } else {
        await tx.creditWallet.updateMany({
          where: { id: wallet.id },
          data: { purchaseBlocked: false }
        });
      }

      const nextStatus =
        order.totalRefundedMinor >= order.amountMinor
          ? "REFUNDED"
          : order.totalRefundedMinor > 0
            ? "PARTIALLY_REFUNDED"
            : "CREDITED";

      const closedOrder = await tx.creditPurchaseOrder.update({
        where: { id: order.id },
        data: {
          status: nextStatus,
          disputeStatus: input.disputeStatus,
          creditsDisputeHeld: 0,
          creditsClawedBack: input.merchantWon
            ? order.creditsClawedBack
            : order.creditsClawedBack + forfeitedCredits
        }
      });

      return { order: closedOrder, duplicate: false, releasedCredits, forfeitedCredits };
    });
  },

  async reserveCredits(input: {
    userId: string;
    amount: number;
    idempotencyKey: string;
    pricingSnapshot?: Prisma.InputJsonValue;
    generationJobId?: string;
    description?: string;
  }) {
    assertPositiveInt(input.amount, "Reserve amount");

    const existing = await this.findReservationByIdempotency(input.idempotencyKey);
    if (existing) return existing;

    return prisma.$transaction(async (tx) => {
      const wallet = await tx.creditWallet.upsert({
        where: { userId: input.userId },
        create: { userId: input.userId },
        update: {}
      });

      if (wallet.availableCredits < input.amount) {
        throw appError("VALIDATION_ERROR", "Insufficient Token");
      }

      const balanceBefore = wallet.availableCredits;
      const balanceAfter = balanceBefore - input.amount;

      const updated = await tx.creditWallet.updateMany({
        where: {
          id: wallet.id,
          version: wallet.version,
          availableCredits: { gte: input.amount }
        },
        data: {
          availableCredits: { decrement: input.amount },
          reservedCredits: { increment: input.amount },
          version: { increment: 1 }
        }
      });

      if (updated.count !== 1) {
        throw appError("CONFLICT", "Unable to reserve credits");
      }

      const reservation = await tx.creditReservation.create({
        data: {
          userId: input.userId,
          walletId: wallet.id,
          estimatedCredits: input.amount,
          idempotencyKey: input.idempotencyKey,
          pricingSnapshot: input.pricingSnapshot,
          generationJobId: input.generationJobId,
          status: "ACTIVE"
        }
      });

      await writeCreditTransaction(tx, {
        userId: input.userId,
        walletId: wallet.id,
        type: "RESERVE",
        amount: input.amount,
        balanceBefore,
        balanceAfter,
        source: "GENERATION_JOB",
        referenceType: "CreditReservation",
        referenceId: reservation.id,
        description: input.description ?? "Generation Token reservation"
      });

      return reservation;
    });
  },

  async captureReservation(reservationId: string, actualCredits: number) {
    assertPositiveInt(actualCredits, "Capture amount");

    return prisma.$transaction(async (tx) => {
      const reservation = await tx.creditReservation.findUnique({ where: { id: reservationId } });
      if (!reservation) throw appError("NOT_FOUND", "Credit reservation not found");
      if (reservation.status === "CAPTURED") return reservation;
      if (reservation.status !== "ACTIVE") {
        throw appError("VALIDATION_ERROR", "Reservation is not active");
      }
      if (actualCredits > reservation.estimatedCredits) {
        throw appError("VALIDATION_ERROR", "Capture exceeds reservation");
      }

      const releaseAmount = reservation.estimatedCredits - actualCredits;
      const wallet = await tx.creditWallet.findUnique({ where: { id: reservation.walletId } });
      if (!wallet) throw appError("NOT_FOUND", "Credit wallet not found");

      const updated = await tx.creditWallet.updateMany({
        where: { id: wallet.id, version: wallet.version, reservedCredits: { gte: reservation.estimatedCredits } },
        data: {
          reservedCredits: { decrement: reservation.estimatedCredits },
          availableCredits: releaseAmount > 0 ? { increment: releaseAmount } : undefined,
          lifetimeSpent: { increment: actualCredits },
          version: { increment: 1 }
        }
      });
      if (updated.count !== 1) throw appError("CONFLICT", "Unable to capture reservation");

      if (actualCredits > 0) {
        await writeCreditTransaction(tx, {
          userId: reservation.userId,
          walletId: wallet.id,
          type: "CAPTURE",
          amount: actualCredits,
          balanceBefore: wallet.availableCredits,
          balanceAfter: wallet.availableCredits + releaseAmount,
          source: "GENERATION_JOB",
          referenceType: "CreditReservation",
          referenceId: reservation.id,
          description: "Generation Token capture"
        });
      }

      if (releaseAmount > 0) {
        await writeCreditTransaction(tx, {
          userId: reservation.userId,
          walletId: wallet.id,
          type: "RELEASE",
          amount: releaseAmount,
          balanceBefore: wallet.availableCredits,
          balanceAfter: wallet.availableCredits + releaseAmount,
          source: "GENERATION_JOB",
          referenceType: "CreditReservation",
          referenceId: reservation.id,
          description: "Unused reservation release"
        });
      }

      return tx.creditReservation.update({
        where: { id: reservation.id },
        data: {
          status: "CAPTURED",
          capturedCredits: actualCredits,
          releasedCredits: releaseAmount,
          capturedAt: new Date()
        }
      });
    });
  },

  async releaseReservation(reservationId: string) {
    return prisma.$transaction(async (tx) => {
      const reservation = await tx.creditReservation.findUnique({ where: { id: reservationId } });
      if (!reservation) throw appError("NOT_FOUND", "Credit reservation not found");
      if (reservation.status === "RELEASED") return reservation;
      if (reservation.status !== "ACTIVE") return reservation;

      const wallet = await tx.creditWallet.findUnique({ where: { id: reservation.walletId } });
      if (!wallet) throw appError("NOT_FOUND", "Credit wallet not found");

      const updated = await tx.creditWallet.updateMany({
        where: {
          id: wallet.id,
          version: wallet.version,
          reservedCredits: { gte: reservation.estimatedCredits }
        },
        data: {
          reservedCredits: { decrement: reservation.estimatedCredits },
          availableCredits: { increment: reservation.estimatedCredits },
          version: { increment: 1 }
        }
      });
      if (updated.count !== 1) throw appError("CONFLICT", "Unable to release reservation");

      await writeCreditTransaction(tx, {
        userId: reservation.userId,
        walletId: wallet.id,
        type: "RELEASE",
        amount: reservation.estimatedCredits,
        balanceBefore: wallet.availableCredits,
        balanceAfter: wallet.availableCredits + reservation.estimatedCredits,
        source: "GENERATION_JOB",
        referenceType: "CreditReservation",
        referenceId: reservation.id,
        description: "Generation failed — Token released"
      });

      return tx.creditReservation.update({
        where: { id: reservation.id },
        data: {
          status: "RELEASED",
          releasedCredits: reservation.estimatedCredits,
          releasedAt: new Date()
        }
      });
    });
  },

  async convertEarnings(input: {
    userId: string;
    earningAmountMinor: number;
    creditsGranted: number;
    exchangeRateSnapshot: Prisma.InputJsonValue;
    idempotencyKey: string;
  }) {
    assertPositiveInt(input.earningAmountMinor, "Conversion amount");
    assertPositiveInt(input.creditsGranted, "Token granted");

    const existing = await this.findConversionByIdempotency(input.idempotencyKey);
    if (existing?.status === "COMPLETED") return existing;

    const conversion = await prisma.$transaction(
      async (tx) => {
        const earningWallet = await tx.creatorEarningWallet.upsert({
          where: { userId: input.userId },
          create: { userId: input.userId },
          update: {}
        });
        const creditWallet = await tx.creditWallet.upsert({
          where: { userId: input.userId },
          create: { userId: input.userId },
          update: {}
        });

        if (earningWallet.availableBalanceMinor < input.earningAmountMinor) {
          throw appError("VALIDATION_ERROR", "Insufficient earning balance");
        }

        const earningBalanceBefore = earningWallet.availableBalanceMinor;
        const earningBalanceAfter = earningBalanceBefore - input.earningAmountMinor;

        const earningUpdated = await tx.creatorEarningWallet.updateMany({
          where: {
            id: earningWallet.id,
            version: earningWallet.version,
            availableBalanceMinor: { gte: input.earningAmountMinor }
          },
          data: {
            availableBalanceMinor: { decrement: input.earningAmountMinor },
            version: { increment: 1 }
          }
        });
        if (earningUpdated.count !== 1) throw appError("CONFLICT", "Unable to deduct earnings");

        const conversionRow = await tx.earningToCreditConversion.create({
          data: {
            userId: input.userId,
            earningWalletId: earningWallet.id,
            creditWalletId: creditWallet.id,
            earningAmountMinor: input.earningAmountMinor,
            creditsGranted: input.creditsGranted,
            exchangeRateSnapshot: input.exchangeRateSnapshot,
            status: "COMPLETED",
            idempotencyKey: input.idempotencyKey,
            completedAt: new Date()
          }
        });

        const earningTransaction = await tx.creatorEarningTransaction.create({
          data: {
            userId: input.userId,
            walletId: earningWallet.id,
            type: "CONVERSION_OUT",
            amountMinor: -input.earningAmountMinor,
            balanceBeforeMinor: earningBalanceBefore,
            balanceAfterMinor: earningBalanceAfter,
            referenceType: "EarningToCreditConversion",
            referenceId: conversionRow.id,
            description: "Converted earnings to VINCIS Token"
          }
        });

        const balanceBefore = creditWallet.availableCredits;
        const balanceAfter = balanceBefore + input.creditsGranted;

        const creditUpdated = await tx.creditWallet.updateMany({
          where: { id: creditWallet.id, version: creditWallet.version },
          data: {
            availableCredits: { increment: input.creditsGranted },
            version: { increment: 1 }
          }
        });
        if (creditUpdated.count !== 1) {
          throw appError("CONFLICT", "Unable to credit wallet");
        }

        const creditTransaction = await writeCreditTransaction(tx, {
          userId: input.userId,
          walletId: creditWallet.id,
          type: "EARNING_CONVERSION",
          amount: input.creditsGranted,
          balanceBefore,
          balanceAfter,
          source: "CREATOR_EARNINGS",
          referenceType: "EarningToCreditConversion",
          referenceId: conversionRow.id,
          description: "Converted creator earnings to Token",
          metadata: {
            earningAmountMinor: input.earningAmountMinor,
            exchangeRateSnapshot: input.exchangeRateSnapshot
          }
        });

        return tx.earningToCreditConversion.update({
          where: { id: conversionRow.id },
          data: {
            earningTransactionId: earningTransaction.id,
            creditTransactionId: creditTransaction.id
          }
        });
      },
      { maxWait: 10_000, timeout: 30_000 }
    );

    const legacyWallet = await prisma.wallet.findUnique({ where: { userId: input.userId } });
    if (legacyWallet) {
      const nextAvailable = Math.max(
        0,
        Number(legacyWallet.availableBalance) - input.earningAmountMinor / 100
      );
      await prisma.wallet.update({
        where: { id: legacyWallet.id },
        data: { availableBalance: nextAvailable }
      });
      await prisma.transaction.create({
        data: {
          walletId: legacyWallet.id,
          type: "PENALTY",
          amount: input.earningAmountMinor / 100,
          balanceAfter: nextAvailable,
          description: "Converted earnings to VINCIS Token"
        }
      });
    }

    return conversion;
  },

  async adminAdjustCredits(input: {
    userId: string;
    amount: number;
    reason: string;
    internalNote: string;
    idempotencyKey: string;
    actorUserId: string;
  }) {
    if (!Number.isInteger(input.amount) || input.amount === 0) {
      throw appError("VALIDATION_ERROR", "Adjustment amount must be a non-zero integer");
    }

    const existing = await this.findAdminAdjustmentByIdempotency(input.idempotencyKey);
    if (existing) {
      const wallet = await this.findWallet(input.userId);
      if (!wallet) throw appError("NOT_FOUND", "Credit wallet not found");
      return { wallet, transaction: existing, duplicate: true };
    }

    return prisma.$transaction(async (tx) => {
      const wallet = await tx.creditWallet.upsert({
        where: { userId: input.userId },
        create: { userId: input.userId },
        update: {}
      });

      const nextAvailable = wallet.availableCredits + input.amount;
      if (nextAvailable < 0) {
        throw appError("VALIDATION_ERROR", "Adjustment would create negative balance");
      }

      const updated = await tx.creditWallet.updateMany({
        where: {
          id: wallet.id,
          version: wallet.version,
          ...(input.amount < 0 ? { availableCredits: { gte: Math.abs(input.amount) } } : {})
        },
        data: {
          availableCredits: { increment: input.amount },
          lifetimeBonus:
            input.amount > 0 ? { increment: input.amount } : undefined,
          version: { increment: 1 }
        }
      });

      if (updated.count !== 1) {
        throw appError("CONFLICT", "Unable to adjust credit wallet");
      }

      const balanceBefore = wallet.availableCredits;
      const balanceAfter = balanceBefore + input.amount;

      const transaction = await writeCreditTransaction(tx, {
        userId: input.userId,
        walletId: wallet.id,
        type: "ADMIN_ADJUSTMENT",
        amount: input.amount,
        balanceBefore,
        balanceAfter,
        source: "ADMIN",
        referenceType: "AdminCreditAdjustment",
        referenceId: input.idempotencyKey,
        description: input.reason,
        metadata: {
          idempotencyKey: input.idempotencyKey,
          internalNote: input.internalNote,
          reason: input.reason
        },
        createdBy: input.actorUserId
      });

      const nextWallet = await tx.creditWallet.findUniqueOrThrow({ where: { id: wallet.id } });
      return { wallet: nextWallet, transaction, duplicate: false };
    });
  }
};
