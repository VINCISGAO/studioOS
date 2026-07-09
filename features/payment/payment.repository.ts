import { randomUUID } from "node:crypto";
import { Prisma, type EscrowPayment, type EscrowStatus } from "@prisma/client";
import { prisma, hasDatabaseUrl } from "@/lib/core/database/prisma";
import { asInputJson } from "@/lib/core/prisma-json";

export class PaymentRepository {
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

  async updateStatus(
    campaignId: string,
    status: EscrowStatus,
    extra?: Partial<{
      stripePaymentId: string;
      releasedAmount: number;
      remainingAmount: number;
    }>
  ) {
    return prisma.escrowPayment.update({
      where: { campaignId },
      data: { status, ...extra }
    });
  }

  async updatePaymentMeta(
    campaignId: string,
    data: Partial<{
      stripePaymentId: string;
      stripeSessionId: string;
      paymentStatus: "UNPAID" | "PAID" | "FAILED" | "CANCELLED";
      creatorPayoutStatus: "MANUAL_PAYOUT_PENDING" | "PAID";
      paidAt: Date;
    }>
  ) {
    return prisma.escrowPayment.update({
      where: { campaignId },
      data
    });
  }

  async recordWebhook(input: {
    provider: string;
    eventId?: string;
    eventType: string;
    payload: Record<string, unknown>;
    processed: boolean;
  }) {
    if (input.eventId) {
      const id = randomUUID();
      const rows = await prisma.$queryRaw<{ id: string }[]>`
        INSERT INTO "webhook_events" ("id", "provider", "event_id", "event_type", "payload_json", "processed")
        VALUES (${id}, ${input.provider}, ${input.eventId}, ${input.eventType}, ${JSON.stringify(input.payload)}::jsonb, ${input.processed})
        RETURNING "id"
      `;
      return prisma.webhookEvent.findUniqueOrThrow({ where: { id: rows[0]!.id } });
    }

    return prisma.webhookEvent.create({
      data: {
        provider: input.provider,
        eventType: input.eventType,
        payloadJson: asInputJson(input.payload)!,
        processed: input.processed
      }
    });
  }

  async reserveWebhook(input: {
    provider: string;
    eventId: string;
    eventType: string;
    payload: Record<string, unknown>;
  }): Promise<{ id: string; duplicate: boolean }> {
    const existing = (
      await prisma.$queryRaw<Array<{ id: string; event_type: string; processed: boolean }>>`
        SELECT "id", "event_type", "processed"
        FROM "webhook_events"
        WHERE "event_id" = ${input.eventId}
        LIMIT 1
      `
    )[0];
    if (existing) {
      const canRetryFailedEvent = !existing.processed && existing.event_type.endsWith(":failed");
      return { id: existing.id, duplicate: !canRetryFailedEvent };
    }

    try {
      const id = randomUUID();
      const row = (
        await prisma.$queryRaw<Array<{ id: string }>>`
          INSERT INTO "webhook_events" ("id", "provider", "event_id", "event_type", "payload_json", "processed")
          VALUES (${id}, ${input.provider}, ${input.eventId}, ${input.eventType}, ${JSON.stringify(input.payload)}::jsonb, false)
          RETURNING "id"
        `
      )[0];
      if (!row) throw new Error("Failed to reserve webhook event");
      return { id: row.id, duplicate: false };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        const duplicate = (
          await prisma.$queryRaw<Array<{ id: string }>>`
            SELECT "id"
            FROM "webhook_events"
            WHERE "event_id" = ${input.eventId}
            LIMIT 1
          `
        )[0];
        if (duplicate) return { id: duplicate.id, duplicate: true };
      }
      throw error;
    }
  }

  async markWebhookProcessed(
    id: string,
    input: {
      eventType: string;
      payload: Record<string, unknown>;
      processed: boolean;
    }
  ) {
    return prisma.webhookEvent.update({
      where: { id },
      data: {
        eventType: input.eventType,
        payloadJson: asInputJson(input.payload)!,
        processed: input.processed
      }
    });
  }

  async hasProcessedStripeEvent(eventId: string): Promise<boolean> {
    const row = (
      await prisma.$queryRaw<Array<{ processed: boolean }>>`
        SELECT "processed"
        FROM "webhook_events"
        WHERE "event_id" = ${eventId}
        LIMIT 1
      `
    )[0];
    return row?.processed === true;
  }
}

export const paymentRepository = new PaymentRepository();
