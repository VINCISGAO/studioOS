"use server";

import { revalidatePath } from "next/cache";
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

export async function markNotificationReadAction(formData: FormData) {
  const creatorId = await getCurrentCreatorId();
  const notificationId = String(formData.get("notification_id") ?? "");
  if (!creatorId || !notificationId) {
    return { ok: false as const };
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
