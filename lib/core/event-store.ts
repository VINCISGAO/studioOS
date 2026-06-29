import type { DomainEvent } from "@/features/shared/types/events";
import { prisma, hasDatabaseUrl } from "@/lib/core/database/prisma";

export async function persistDomainEvent(event: DomainEvent) {
  if (!hasDatabaseUrl()) return null;

  return prisma.domainEvent.create({
    data: {
      eventName: event.name,
      aggregateType: event.aggregateType,
      aggregateId: event.aggregateId,
      payloadJson: {
        ...event.payload,
        occurredAt: event.occurredAt,
        actorId: event.actorId
      },
      status: "PENDING"
    }
  });
}

export async function markDomainEventProcessed(id: string, status: "SUCCESS" | "FAILED" = "SUCCESS") {
  return prisma.domainEvent.update({
    where: { id },
    data: {
      status,
      processedAt: new Date()
    }
  });
}

export async function listPendingDomainEvents(limit = 25) {
  return prisma.domainEvent.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
    take: limit
  });
}

export function storedEventToDomainEvent(row: {
  eventName: string;
  aggregateType: string;
  aggregateId: string;
  payloadJson: unknown;
}): DomainEvent {
  const payload = (row.payloadJson ?? {}) as Record<string, unknown>;
  const { occurredAt, actorId, ...rest } = payload;
  return {
    name: row.eventName,
    aggregateType: row.aggregateType as DomainEvent["aggregateType"],
    aggregateId: row.aggregateId,
    payload: rest,
    occurredAt: typeof occurredAt === "string" ? occurredAt : new Date().toISOString(),
    actorId: typeof actorId === "string" ? actorId : undefined
  };
}
