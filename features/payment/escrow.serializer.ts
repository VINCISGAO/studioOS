import type { EscrowPayment } from "@prisma/client";

export function serializeEscrow(escrow: EscrowPayment) {
  return {
    id: escrow.id,
    campaignId: escrow.campaignId,
    brandId: escrow.brandId,
    creatorId: escrow.creatorId,
    stripePaymentId: escrow.stripePaymentId,
    stripeSessionId: escrow.stripeSessionId,
    paymentStatus: escrow.paymentStatus,
    creatorPayoutStatus: escrow.creatorPayoutStatus,
    paidAt: escrow.paidAt?.toISOString() ?? null,
    payoutPaidAt: escrow.payoutPaidAt?.toISOString() ?? null,
    currency: escrow.currency,
    amount: Number(escrow.amount),
    releasedAmount: Number(escrow.releasedAmount),
    remainingAmount: Number(escrow.remainingAmount),
    status: escrow.status,
    createdAt: escrow.createdAt.toISOString(),
    updatedAt: escrow.updatedAt.toISOString()
  };
}
