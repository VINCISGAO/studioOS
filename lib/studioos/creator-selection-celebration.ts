import type { CreatorNotification } from "@/lib/notification-types";
import { hasSeenCreatorSelectionCelebration } from "@/lib/studioos/creator-settings-service";
import type { PendingSelectionCelebration } from "@/components/studioos/creator-selection-orchestrator";

export async function resolvePendingSelectionCelebration(input: {
  creatorId: string;
  notifications: CreatorNotification[];
}): Promise<PendingSelectionCelebration | null> {
  const candidates = input.notifications
    .filter((item) => item.type === "creator_selected")
    .sort((a, b) => b.created_at.localeCompare(a.created_at));

  for (const notification of candidates) {
    const seen = await hasSeenCreatorSelectionCelebration(input.creatorId, notification.id);
    if (!seen) {
      return {
        notificationId: notification.id,
        orderId: notification.order_id,
        projectId: notification.project_id,
        title: notification.title
      };
    }
  }

  return null;
}
