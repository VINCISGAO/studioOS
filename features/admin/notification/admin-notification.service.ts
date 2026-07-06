import { adminNotificationRepository } from "@/features/admin/notification/admin-notification.repository";
import type { AdminNotificationFilters } from "@/features/admin/notification/admin-notification.repository";
import type { AuthUser } from "@/features/auth/permission.service";
import { PermissionService } from "@/features/auth/permission.service";
import { notificationService } from "@/features/notification/notification.service";
import { appError } from "@/lib/core/errors";
import { hasDatabaseUrl } from "@/lib/core/database/prisma";

export type AdminNotificationView = {
  id: string;
  userId: string;
  userEmail: string | null;
  campaignId: string | null;
  campaignTitle: string | null;
  type: string;
  category: string;
  eventName: string | null;
  title: string;
  content: string;
  channel: string;
  isSent: boolean;
  isRead: boolean;
  createdAt: string;
};

export class AdminNotificationService {
  async list(user: AuthUser, filters: AdminNotificationFilters): Promise<AdminNotificationView[]> {
    PermissionService.assert(user, "admin.notification.read");
    if (!hasDatabaseUrl()) return [];

    const rows = await adminNotificationRepository.list(filters);
    return rows.map((row) => ({
      id: row.id,
      userId: row.userId,
      userEmail: row.user.email,
      campaignId: row.campaignId,
      campaignTitle: row.campaign?.title ?? null,
      type: row.type,
      category: row.category,
      eventName: row.eventName,
      title: row.title,
      content: row.content,
      channel: row.channel,
      isSent: row.isSent,
      isRead: row.isRead,
      createdAt: row.createdAt.toISOString()
    }));
  }

  async retry(user: AuthUser, notificationId: string) {
    PermissionService.assert(user, "admin.notification.read");
    const row = await adminNotificationRepository.findById(notificationId);
    if (!row) throw appError("NOT_FOUND", "Notification not found");

    await notificationService.notify({
      userId: row.userId,
      campaignId: row.campaignId ?? undefined,
      type: row.type,
      category: row.category,
      eventName: row.eventName ?? undefined,
      metadata: row.metadataJson ?? undefined,
      title: row.title,
      content: row.content,
      actionUrl: row.actionUrl ?? undefined,
      email: true
    });

    return { ok: true };
  }

  async countFailed(user: AuthUser) {
    PermissionService.assert(user, "admin.notification.read");
    return adminNotificationRepository.countFailed();
  }
}

export const adminNotificationService = new AdminNotificationService();
