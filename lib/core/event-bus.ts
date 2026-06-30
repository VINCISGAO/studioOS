import "server-only";

import type { DomainEvent } from "@/features/shared/types/events";
import { hasDatabaseUrl } from "@/lib/core/database/prisma";
import { persistDomainEvent, markDomainEventProcessed } from "@/lib/core/event-store";
import { logger } from "@/lib/core/logger";

type EventHandler = (event: DomainEvent) => void | Promise<void>;

const handlers = new Map<string, Set<EventHandler>>();

let bootstrapPromise: Promise<void> | null = null;

async function ensureEventSystemBootstrapped() {
  if (!bootstrapPromise) {
    bootstrapPromise = import("@/features/events/bootstrap").then(({ bootstrapEventSystem }) => {
      bootstrapEventSystem();
    });
  }
  await bootstrapPromise;
}

export async function publishEvent(
  event: DomainEvent,
  options?: { skipPersist?: boolean }
): Promise<void> {
  await ensureEventSystemBootstrapped();

  let storedId: string | null = null;

  if (hasDatabaseUrl() && !options?.skipPersist) {
    const stored = await persistDomainEvent(event);
    storedId = stored?.id ?? null;
  }

  const subs = handlers.get(event.name) ?? new Set();
  const globalSubs = handlers.get("*") ?? new Set();

  try {
    for (const handler of [...subs, ...globalSubs]) {
      await handler(event);
    }
    if (storedId) {
      await markDomainEventProcessed(storedId, "SUCCESS");
    }
  } catch (error) {
    if (storedId) {
      await markDomainEventProcessed(storedId, "FAILED");
    }
    logger.error("Event handler failed", {
      service: "EventBus",
      event: event.name,
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}

export function onEvent(name: string, handler: EventHandler): () => void {
  const set = handlers.get(name) ?? new Set();
  set.add(handler);
  handlers.set(name, set);
  return () => set.delete(handler);
}

/** Reset handlers — for tests only */
export function _resetEventBusForTests() {
  handlers.clear();
}
