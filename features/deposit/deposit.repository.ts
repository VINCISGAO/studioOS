import type {
  CreatorDepositAccount,
  CreatorDepositPayment,
  CreatorDepositPaymentStatus,
  CreatorDepositStatus
} from "@prisma/client";
import { resolveCreatorProfileIdForLegacyId } from "@/features/matching/invitation-creator-bridge";
import {
  CREATOR_DEPOSIT_AMOUNT_MINOR,
  CREATOR_DEPOSIT_CURRENCY,
  depositAmountUsdFromMinor
} from "@/features/deposit/deposit.constants";
import { hasDatabaseUrl, prisma } from "@/lib/core/database/prisma";
import { CREATOR_DEPOSIT_USD } from "@/lib/studioos/deposit-copy";

export type DepositIdentity = {
  creatorProfileId: string;
  userId: string;
  legacyCreatorId: string | null;
};

function createPaymentId() {
  return `dep_pay_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function mapPaymentStatus(status: CreatorDepositPaymentStatus) {
  switch (status) {
    case "PROCESSING":
      return "under_review" as const;
    case "SUCCEEDED":
      return "confirmed" as const;
    case "FAILED":
      return "failed" as const;
    default:
      return "pending" as const;
  }
}

function mapDepositStatus(status: CreatorDepositStatus) {
  return status === "PAID" ? ("paid" as const) : ("unpaid" as const);
}

export function mapDepositPaymentRow(
  payment: CreatorDepositPayment,
  legacyCreatorId: string | null
) {
  const amountMinor = payment.amountMinor;
  return {
    id: payment.id,
    creator_id: legacyCreatorId ?? payment.userId,
    amount_usd: depositAmountUsdFromMinor(amountMinor),
    payment_method: payment.paymentMethod as import("@/lib/studioos/withdrawal-types").PayoutMethodType,
    payment_reference: payment.paymentReference ?? undefined,
    status: mapPaymentStatus(payment.status),
    status_note: payment.statusNote ?? undefined,
    stripe_session_id: payment.stripeSessionId,
    stripe_payment_intent_id: payment.stripePaymentIntentId,
    created_at: payment.createdAt.toISOString(),
    confirmed_at: payment.confirmedAt?.toISOString() ?? null
  };
}

export class DepositRepository {
  isEnabled() {
    return hasDatabaseUrl();
  }

  async resolveIdentity(creatorKey: string): Promise<DepositIdentity | null> {
    if (!this.isEnabled()) return null;

    const profile = await prisma.creatorProfile.findFirst({
      where: {
        OR: [{ id: creatorKey }, { legacyCreatorId: creatorKey }, { userId: creatorKey }]
      },
      select: { id: true, userId: true, legacyCreatorId: true }
    });

    if (profile) {
      return {
        creatorProfileId: profile.id,
        userId: profile.userId,
        legacyCreatorId: profile.legacyCreatorId
      };
    }

    const profileId = await resolveCreatorProfileIdForLegacyId(creatorKey);
    if (!profileId) return null;

    const resolved = await prisma.creatorProfile.findUnique({
      where: { id: profileId },
      select: { id: true, userId: true, legacyCreatorId: true }
    });

    if (!resolved) return null;
    return {
      creatorProfileId: resolved.id,
      userId: resolved.userId,
      legacyCreatorId: resolved.legacyCreatorId
    };
  }

  async getOrCreateAccount(identity: DepositIdentity): Promise<CreatorDepositAccount> {
    const existing = await prisma.creatorDepositAccount.findUnique({
      where: { creatorProfileId: identity.creatorProfileId }
    });
    if (existing) return existing;

    return prisma.creatorDepositAccount.create({
      data: {
        creatorProfileId: identity.creatorProfileId,
        userId: identity.userId,
        legacyCreatorId: identity.legacyCreatorId,
        depositAmountUsd: depositAmountUsdFromMinor(CREATOR_DEPOSIT_AMOUNT_MINOR)
      }
    });
  }

  async findAccountById(accountId: string) {
    return prisma.creatorDepositAccount.findUnique({ where: { id: accountId } });
  }

  async findAccountByKey(creatorKey: string) {
    const identity = await this.resolveIdentity(creatorKey);
    if (!identity) return null;

    return prisma.creatorDepositAccount.findUnique({
      where: { creatorProfileId: identity.creatorProfileId },
      include: {
        payments: { orderBy: { createdAt: "desc" } }
      }
    });
  }

  async findPaymentById(paymentId: string) {
    return prisma.creatorDepositPayment.findUnique({ where: { id: paymentId } });
  }

  async findByStripePaymentIntentId(paymentIntentId: string) {
    return prisma.creatorDepositPayment.findUnique({
      where: { stripePaymentIntentId: paymentIntentId }
    });
  }

  async listAdminAccounts() {
    return prisma.creatorDepositAccount.findMany({
      include: { payments: { orderBy: { createdAt: "desc" }, take: 1 } },
      orderBy: { updatedAt: "desc" }
    });
  }

  async createPayment(input: {
    accountId: string;
    userId: string;
    amountMinor?: number;
    currency?: string;
    paymentMethod: string;
    paymentReference?: string;
    status?: CreatorDepositPaymentStatus;
    idempotencyKey?: string;
  }) {
    const amountMinor = input.amountMinor ?? CREATOR_DEPOSIT_AMOUNT_MINOR;
    const currency = (input.currency ?? CREATOR_DEPOSIT_CURRENCY).toUpperCase();

    return prisma.creatorDepositPayment.create({
      data: {
        id: createPaymentId(),
        accountId: input.accountId,
        userId: input.userId,
        amountMinor,
        currency,
        amountUsd: depositAmountUsdFromMinor(amountMinor),
        paymentMethod: input.paymentMethod,
        paymentReference: input.paymentReference,
        provider: "stripe",
        idempotencyKey: input.idempotencyKey,
        status: input.status ?? "PENDING"
      }
    });
  }

  async findActivePayment(accountId: string) {
    return prisma.creatorDepositPayment.findFirst({
      where: {
        accountId,
        status: { in: ["PENDING", "PROCESSING"] }
      },
      orderBy: { createdAt: "desc" }
    });
  }

  async findConfirmedByStripeRef(stripeRef: string) {
    return prisma.creatorDepositPayment.findFirst({
      where: {
        status: "SUCCEEDED",
        OR: [{ stripeSessionId: stripeRef }, { stripePaymentIntentId: stripeRef }]
      }
    });
  }

  async attachStripeSession(paymentId: string, accountId: string, stripeSessionId: string) {
    const result = await prisma.creatorDepositPayment.updateMany({
      where: { id: paymentId, accountId },
      data: { stripeSessionId }
    });
    return result.count > 0;
  }

  async attachStripePaymentIntent(paymentId: string, accountId: string, stripePaymentIntentId: string) {
    const result = await prisma.creatorDepositPayment.updateMany({
      where: { id: paymentId, accountId },
      data: { stripePaymentIntentId }
    });
    return result.count > 0;
  }

  async confirmPayment(input: {
    accountId: string;
    paymentId: string;
    amountMinor: number;
    currency: string;
    stripeSessionId?: string;
    stripePaymentIntentId?: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const payment = await tx.creatorDepositPayment.findFirst({
        where: { id: input.paymentId, accountId: input.accountId }
      });
      if (!payment) {
        throw new Error("Deposit payment not found");
      }

      const provider = payment.provider || "stripe";
      const externalReferenceId =
        input.stripePaymentIntentId ??
        payment.stripePaymentIntentId ??
        input.stripeSessionId ??
        payment.stripeSessionId ??
        payment.id;

      const existingLedger = await tx.creatorDepositLedgerEntry.findUnique({
        where: {
          provider_externalReferenceId_entryType: {
            provider,
            externalReferenceId,
            entryType: "DEPOSIT_CREDIT"
          }
        }
      });

      if (payment.status === "SUCCEEDED" || existingLedger) {
        if (payment.status !== "SUCCEEDED") {
          await tx.creatorDepositPayment.update({
            where: { id: payment.id },
            data: {
              status: "SUCCEEDED",
              confirmedAt: payment.confirmedAt ?? new Date(),
              stripeSessionId: input.stripeSessionId ?? payment.stripeSessionId,
              stripePaymentIntentId: input.stripePaymentIntentId ?? payment.stripePaymentIntentId
            }
          });
        }
        const synced = await tx.creatorDepositPayment.findUniqueOrThrow({ where: { id: payment.id } });
        return { duplicate: true as const, payment: synced, accountId: input.accountId };
      }

      if (payment.amountMinor !== input.amountMinor || payment.currency !== input.currency.toUpperCase()) {
        throw new Error("Deposit amount or currency mismatch");
      }

      const confirmedAt = new Date();

      await tx.creatorDepositLedgerEntry.create({
        data: {
          accountId: input.accountId,
          paymentId: payment.id,
          provider,
          externalReferenceId,
          entryType: "DEPOSIT_CREDIT",
          direction: "CREDIT",
          amountMinor: input.amountMinor,
          currency: input.currency.toUpperCase(),
          balanceAfterMinor: input.amountMinor,
          description: `Creator deposit credit (${externalReferenceId})`,
          metadataJson: {
            stripePaymentIntentId: input.stripePaymentIntentId ?? payment.stripePaymentIntentId,
            stripeSessionId: input.stripeSessionId ?? payment.stripeSessionId
          }
        }
      });

      const updatedPayment = await tx.creatorDepositPayment.update({
        where: { id: payment.id },
        data: {
          amountMinor: input.amountMinor,
          amountUsd: depositAmountUsdFromMinor(input.amountMinor),
          currency: input.currency.toUpperCase(),
          status: "SUCCEEDED",
          confirmedAt,
          stripeSessionId: input.stripeSessionId ?? payment.stripeSessionId,
          stripePaymentIntentId: input.stripePaymentIntentId ?? payment.stripePaymentIntentId
        }
      });

      await tx.creatorDepositAccount.update({
        where: { id: input.accountId },
        data: {
          depositStatus: "PAID",
          depositAmountUsd: depositAmountUsdFromMinor(input.amountMinor),
          paidAt: confirmedAt
        }
      });

      return { duplicate: false as const, payment: updatedPayment, accountId: input.accountId };
    });
  }

  async advanceDemoPayments(accountId: string) {
    const payments = await prisma.creatorDepositPayment.findMany({
      where: {
        accountId,
        status: { in: ["PENDING", "PROCESSING"] },
        stripeSessionId: null,
        stripePaymentIntentId: null
      },
      orderBy: { createdAt: "asc" }
    });

    const now = Date.now();
    let confirmedPaymentId: string | null = null;

    for (const payment of payments) {
      const ageMs = now - payment.createdAt.getTime();
      if (payment.status === "PENDING" && ageMs > 3_000) {
        await prisma.creatorDepositPayment.update({
          where: { id: payment.id },
          data: { status: "PROCESSING" }
        });
      }
      if (payment.status === "PROCESSING" && ageMs > 8_000) {
        const result = await this.confirmPayment({
          accountId,
          paymentId: payment.id,
          amountMinor: payment.amountMinor,
          currency: payment.currency
        });
        confirmedPaymentId = result.payment.id;
      }
    }

    return confirmedPaymentId;
  }

  mapAccountSnapshot(
    account: CreatorDepositAccount & { payments: CreatorDepositPayment[] },
    legacyCreatorId: string | null
  ) {
    const payments = account.payments.map((payment) =>
      mapDepositPaymentRow(payment, legacyCreatorId ?? account.legacyCreatorId)
    );

    const pending_payment =
      payments.find((item) => item.status === "pending" || item.status === "under_review") ?? null;

    return {
      amount_usd: Number(account.depositAmountUsd) || CREATOR_DEPOSIT_USD,
      deposit_status: mapDepositStatus(account.depositStatus),
      paid_at: account.paidAt?.toISOString() ?? null,
      can_accept_orders: account.depositStatus === "PAID",
      pending_payment,
      payments
    };
  }
}

export const depositRepository = new DepositRepository();
