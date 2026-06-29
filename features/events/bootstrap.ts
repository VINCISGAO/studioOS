import { registerNotificationHandlers } from "@/features/notification/notification.handlers";
import { eventProcessorService } from "@/features/events/event-processor.service";

let bootstrapped = false;

export function bootstrapEventSystem() {
  if (bootstrapped) return;
  bootstrapped = true;
  registerNotificationHandlers();
  eventProcessorService.registerAuditSubscriber();
}

export function _resetEventSystemForTests() {
  bootstrapped = false;
}
