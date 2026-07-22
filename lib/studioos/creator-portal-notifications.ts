import { getSessionUser } from "@/features/auth/session.service";
import { notificationService } from "@/features/notification/notification.service";

/** Sidebar badge must match `/studio/messages`, which prefers DB-backed notifications. */
export async function resolveCreatorPortalUnreadCount(legacyUnreadCount: number): Promise<number> {
  const sessionUser = await getSessionUser();
  if (!sessionUser || sessionUser.id.startsWith("demo_")) {
    return legacyUnreadCount;
  }

  try {
    const unified = await notificationService.listForUser(
      { id: sessionUser.id, role: sessionUser.role },
      1
    );
    return unified.unreadCount;
  } catch {
    return legacyUnreadCount;
  }
}
