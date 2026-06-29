import type { StateMachine } from "@/lib/core/state-machine";
import { safeTransition } from "@/lib/core/state-machine";
import { appError } from "@/lib/core/errors";
import { publishEvent } from "@/lib/core/event-bus";
import { logger } from "@/lib/core/logger";
import { prisma, hasDatabaseUrl } from "@/lib/core/database/prisma";
import type { DomainEvent } from "@/features/shared/types/events";
import type { AuthUser } from "@/features/auth/permission.service";

export type TransitionContext = {
  aggregateType: DomainEvent["aggregateType"];
  aggregateId: string;
  actor?: AuthUser;
  campaignId?: string;
  permission?: string;
  metadata?: Record<string, unknown>;
};

export type TransitionOptions<TState extends string, TEvent extends string> = {
  machine: StateMachine<TState, TEvent>;
  current: TState;
  event: TEvent;
  context: TransitionContext;
  /** Persist new state — must run in transaction when paired with side effects */
  persist: (next: TState) => Promise<void>;
  /** Optional domain event after successful persist */
  domainEvent?: Omit<DomainEvent, "occurredAt">;
};

/**
 * Vol 18 Ch.13–16 — unified transition runner.
 * Validates → persists → audit → publish event.
 */
export async function runTransition<TState extends string, TEvent extends string>(
  options: TransitionOptions<TState, TEvent>
): Promise<TState> {
  const { machine, current, event, context, persist, domainEvent } = options;

  const result = safeTransition(machine, current, event);
  if (!result.ok) {
    throw appError("INVALID_TRANSITION", result.message);
  }

  if (!hasDatabaseUrl()) {
    await persist(result.status);
    return result.status;
  }

  await prisma.$transaction(async (tx) => {
    await persist(result.status);

    if (context.campaignId) {
      await tx.activityLog.create({
        data: {
          campaignId: context.campaignId,
          userId: context.actor?.id,
          action: `${context.aggregateType}.${event}`,
          metadata: {
            from: current,
            to: result.status,
            aggregateId: context.aggregateId,
            ...context.metadata
          }
        }
      });
    }
  });

  if (domainEvent) {
    await publishEvent({
      ...domainEvent,
      occurredAt: new Date().toISOString(),
      actorId: context.actor?.id
    });
  }

  logger.info("State transition", {
    service: "TransitionRunner",
    campaignId: context.campaignId,
    userId: context.actor?.id,
    aggregateType: context.aggregateType,
    event: String(event),
    from: current,
    to: result.status
  });

  return result.status;
}
