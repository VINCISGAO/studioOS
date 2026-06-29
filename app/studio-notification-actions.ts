"use server";

import { revalidatePath } from "next/cache";
import { getCurrentCreatorId } from "@/lib/creator-session";
import {
  markAllNotificationsRead,
  markNotificationRead
} from "@/lib/notification-service";

export async function markNotificationReadAction(formData: FormData) {
  const creatorId = await getCurrentCreatorId();
  const notificationId = String(formData.get("notification_id") ?? "");
  if (!creatorId || !notificationId) {
    return { ok: false as const };
  }

  const ok = await markNotificationRead(notificationId, creatorId);
  revalidatePath("/studio");
  revalidatePath("/studio/messages");
  return { ok };
}

export async function markAllNotificationsReadAction() {
  const creatorId = await getCurrentCreatorId();
  if (!creatorId) {
    return { ok: false as const, count: 0 };
  }

  const count = await markAllNotificationsRead(creatorId);
  revalidatePath("/studio");
  revalidatePath("/studio/messages");
  return { ok: true as const, count };
}
