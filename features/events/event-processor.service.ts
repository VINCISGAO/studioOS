import type { DomainEvent } from "@/features/shared/types/events";
import { hasDatabaseUrl } from "@/lib/core/database/prisma";
import {
  markDomainEventProcessed,
  persistDomainEvent,
  storedEventToDomainEvent,
  listPendingDomainEvents
} from "@/lib/core/event-store";
import { publishEvent, onEvent } from "@/lib/core/event-bus";
import { logger } from "@/lib/core/logger";

export class EventProcessorService {
  async processPending(limit = 25) {
    if (!hasDatabaseUrl()) return { processed: 0 };

    const pending = await listPendingDomainEvents(limit);
    let processed = 0;

    for (const row of pending) {
      try {
        const event = storedEventToDomainEvent(row);
        await publishEvent(event, { skipPersist: true });
        await markDomainEventProcessed(row.id, "SUCCESS");
        processed += 1;
      } catch (error) {
        await markDomainEventProcessed(row.id, "FAILED");
        logger.error("Domain event processing failed", {
          service: "EventProcessorService",
          eventId: row.id,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    return { processed };
  }

  /** Subscribe processor to all events for observability. */
  registerAuditSubscriber() {
    onEvent("*", async (event) => {
      logger.info("Domain event dispatched", {
        service: "EventProcessorService",
        name: event.name,
        aggregateType: event.aggregateType,
        aggregateId: event.aggregateId
      });
    });
  }
}

export const eventProcessorService = new EventProcessorService();
