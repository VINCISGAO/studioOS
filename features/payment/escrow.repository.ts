import type { EscrowPayment, EscrowStatus } from "@prisma/client";
import { prisma, hasDatabaseUrl } from "@/lib/core/database/prisma";
import { asInputJson } from "@/lib/core/prisma-json";

export class EscrowRepository {
  async findByCampaignId(campaignId: string): Promise<EscrowPayment | null> {
    if (!hasDatabaseUrl()) return null;
    return prisma.escrowPayment.findUnique({ where: { campaignId } });
  }

  async create(input: {
    campaignId: string;
    brandId: string;
    creatorId: string;
    amount: number;
    currency?: string;
  }): Promise<EscrowPayment> {
    return prisma.escrowPayment.create({
      data: {
        campaignId: input.campaignId,
        brandId: input.brandId,
        creatorId: input.creatorId,
        amount: input.amount,
        remainingAmount: input.amount,
        currency: input.currency ?? "USD",
        status: "CREATED"
      }
    });
  }

  async updateStatus(campaignId: string, status: EscrowStatus, extra?: Partial<{
    stripePaymentId: string;
    releasedAmount: number;
    remainingAmount: number;
  }>) {
    return prisma.escrowPayment.update({
      where: { campaignId },
      data: { status, ...extra }
    });
  }

  async updatePaymentMeta(campaignId: string, data: Partial<{
    stripePaymentId: string;
    stripeSessionId: string;
    paymentStatus: "UNPAID" | "PAID" | "FAILED" | "CANCELLED";
    creatorPayoutStatus: "MANUAL_PAYOUT_PENDING" | "PAID";
    paidAt: Date;
  }>) {
    return prisma.escrowPayment.update({
      where: { campaignId },
      data
    });
  }

  async recordWebhook(input: {
    provider: string;
    eventType: string;
    payload: Record<string, unknown>;
    processed: boolean;
  }) {
    return prisma.webhookEvent.create({
      data: {
        provider: input.provider,
        eventType: input.eventType,
        payloadJson: asInputJson(input.payload)!,
        processed: input.processed
      }
    });
  }

  async hasProcessedStripeEvent(eventId: string): Promise<boolean> {
    const rows = await prisma.webhookEvent.findMany({
      where: { provider: "stripe", processed: true },
      select: { payloadJson: true },
      take: 200,
      orderBy: { createdAt: "desc" }
    });
    return rows.some((row) => {
      const payload = row.payloadJson as { id?: string };
      return payload.id === eventId;
    });
  }
}

export const escrowRepository = new EscrowRepository();
