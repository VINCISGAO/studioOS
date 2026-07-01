import "server-only";

import type { DomainEvent } from "@/features/shared/types/events";
import {
  onEvent,
  _resetEventBusForTests,
  publishEvent as publishEventCore
} from "@/lib/core/event-bus-core";

export { onEvent, _resetEventBusForTests };

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
  return publishEventCore(event, options);
}
