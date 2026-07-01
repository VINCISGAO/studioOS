"use server";

import { revalidatePath } from "next/cache";
import { getCurrentCreatorId } from "@/lib/creator-session";
import {
  deleteAllNotificationsForCreator,
  deleteNotifications,
  markAllNotificationsRead,
  markNotificationRead
} from "@/lib/notification-service";

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

export async function deleteNotificationsAction(formData: FormData) {
  const creatorId = await getCurrentCreatorId();
  if (!creatorId) {
    return { ok: false as const, deleted: 0 };
  }

  const raw = String(formData.get("notification_ids") ?? "");
  const ids = raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const deleted = await deleteNotifications(ids, creatorId);
  revalidateCreatorMessages();
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
