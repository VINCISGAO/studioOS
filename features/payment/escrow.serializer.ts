import type { EscrowPayment } from "@prisma/client";

export function serializeEscrow(escrow: EscrowPayment) {
  return {
    id: escrow.id,
    campaignId: escrow.campaignId,
    brandId: escrow.brandId,
    creatorId: escrow.creatorId,
    stripePaymentId: escrow.stripePaymentId,
    currency: escrow.currency,
    amount: Number(escrow.amount),
    releasedAmount: Number(escrow.releasedAmount),
    remainingAmount: Number(escrow.remainingAmount),
    status: escrow.status,
    createdAt: escrow.createdAt.toISOString(),
    updatedAt: escrow.updatedAt.toISOString()
  };
}
