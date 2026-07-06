"use server";

import { revalidatePath } from "next/cache";
import { notificationService } from "@/features/notification/notification.service";
import { getSessionUser } from "@/features/auth/session.service";
import { getCurrentCreatorId } from "@/lib/creator-session";
import type { Locale } from "@/lib/i18n";
import {
  deleteAllNotificationsForCreator,
  deleteNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  markNotificationsRead
} from "@/lib/notification-service";

function normalizeLang(raw: FormDataEntryValue | null): Locale {
  return raw === "zh" ? "zh" : "en";
}

function revalidateCreatorMessages() {
  revalidatePath("/studio");
  revalidatePath("/studio/messages");
}

async function getDatabaseNotificationUser() {
  const user = await getSessionUser();
  if (!user || user.id.startsWith("demo_")) return null;
  return { id: user.id, role: user.role };
}

export async function markNotificationReadAction(formData: FormData) {
  const creatorId = await getCurrentCreatorId();
  const notificationId = String(formData.get("notification_id") ?? "");
  if (!creatorId || !notificationId) {
    return { ok: false as const };
  }

  const dbUser = await getDatabaseNotificationUser();
  if (dbUser) {
    try {
      await notificationService.markRead(notificationId, dbUser);
      revalidateCreatorMessages();
      return { ok: true as const };
    } catch {
      // Fall through for legacy creator notification ids.
    }
  }

  const ok = await markNotificationRead(notificationId, creatorId);
  revalidateCreatorMessages();
  return { ok };
}

export async function markAllNotificationsReadAction() {
  const creatorId = await getCurrentCreatorId();
  if (!creatorId) {
    return { ok: false as const, count: 0 };
  }

  const dbUser = await getDatabaseNotificationUser();
  if (dbUser) {
    try {
      const result = await notificationService.markAllRead(dbUser);
      revalidateCreatorMessages();
      return { ok: true as const, count: result.updated };
    } catch {
      // Fall through for legacy-only sessions.
    }
  }

  const count = await markAllNotificationsRead(creatorId);
  revalidateCreatorMessages();
  return { ok: true as const, count };
}

export async function markNotificationsReadAction(formData: FormData) {
  const creatorId = await getCurrentCreatorId();
  if (!creatorId) {
    return { ok: false as const, count: 0 };
  }

  const raw = String(formData.get("notification_ids") ?? "");
  const ids = raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const dbUser = await getDatabaseNotificationUser();
  if (dbUser) {
    let count = 0;
    try {
      for (const id of ids) {
        await notificationService.markRead(id, dbUser);
        count += 1;
      }
      revalidateCreatorMessages();
      return { ok: true as const, count };
    } catch {
      // Fall through for legacy ids.
    }
  }

  const count = await markNotificationsRead(ids, creatorId);
  revalidateCreatorMessages();
  return { ok: true as const, count };
}

export async function deleteNotificationsAction(formData: FormData) {
  const lang = normalizeLang(formData.get("lang"));
  const creatorId = await getCurrentCreatorId();
  if (!creatorId) {
    return {
      ok: false as const,
      deleted: 0,
      error: lang === "zh" ? "请先登录" : "Sign in required"
    };
  }

  const raw = String(formData.get("notification_ids") ?? "");
  const ids = raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  if (!ids.length) {
    return {
      ok: false as const,
      deleted: 0,
      error: lang === "zh" ? "请先选择消息" : "Select messages first"
    };
  }

  const dbUser = await getDatabaseNotificationUser();
  if (dbUser) {
    try {
      const result = await notificationService.deleteMany(ids, dbUser);
      revalidateCreatorMessages();
      if (result.deleted > 0) {
        return { ok: true as const, deleted: result.deleted };
      }
    } catch {
      // Fall through for legacy creator notification ids.
    }
  }

  const deleted = await deleteNotifications(ids, creatorId);
  revalidateCreatorMessages();

  if (deleted === 0) {
    return {
      ok: false as const,
      deleted: 0,
      error: lang === "zh" ? "未能删除消息，请刷新后重试" : "Could not delete messages. Refresh and try again."
    };
  }

  return { ok: true as const, deleted };
}

export async function deleteAllNotificationsAction() {
  const creatorId = await getCurrentCreatorId();
  if (!creatorId) {
    return { ok: false as const, deleted: 0 };
  }

  const deleted = await deleteAllNotificationsForCreator(creatorId);
  revalidateCreatorMessages();
  return { ok: true as const, deleted };
}
