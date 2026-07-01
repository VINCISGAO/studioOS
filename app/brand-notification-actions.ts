"use server";

import { revalidatePath } from "next/cache";
import { getCurrentClientEmail } from "@/lib/client-session";
import type { Locale } from "@/lib/i18n";
import {
  deleteAllNotificationsForBrand,
  deleteBrandNotifications,
  markBrandNotificationRead,
  markBrandNotificationsRead
} from "@/lib/studioos/brand-notification-service";

function normalizeLang(raw: FormDataEntryValue | null): Locale {
  return raw === "zh" ? "zh" : "en";
}

function revalidateBrandMessages() {
  revalidatePath("/brand");
  revalidatePath("/brand/messages");
}

export async function markBrandNotificationReadAction(formData: FormData) {
  const clientEmail = await getCurrentClientEmail();
  const notificationId = String(formData.get("notification_id") ?? "");
  if (!clientEmail || !notificationId) {
    return { ok: false as const };
  }

  const ok = await markBrandNotificationRead(notificationId, clientEmail);
  revalidateBrandMessages();
  return { ok: ok as boolean };
}

export async function markBrandNotificationsReadAction(formData: FormData) {
  const clientEmail = await getCurrentClientEmail();
  if (!clientEmail) {
    return { ok: false as const, count: 0 };
  }

  const raw = String(formData.get("notification_ids") ?? "");
  const ids = raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const count = await markBrandNotificationsRead(ids, clientEmail);
  revalidateBrandMessages();
  return { ok: true as const, count };
}

export async function deleteBrandNotificationsAction(formData: FormData) {
  const lang = normalizeLang(formData.get("lang"));
  const clientEmail = await getCurrentClientEmail();
  if (!clientEmail) {
    return { ok: false as const, deleted: 0, error: lang === "zh" ? "请先登录" : "Sign in required" };
  }

  const raw = String(formData.get("notification_ids") ?? "");
  const ids = raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  if (!ids.length) {
    return { ok: false as const, deleted: 0, error: lang === "zh" ? "请先选择消息" : "Select messages first" };
  }

  const deleted = await deleteBrandNotifications(ids, clientEmail);
  revalidateBrandMessages();

  if (deleted === 0) {
    return {
      ok: false as const,
      deleted: 0,
      error: lang === "zh" ? "未能删除消息，请刷新后重试" : "Could not delete messages. Refresh and try again."
    };
  }

  return { ok: true as const, deleted };
}

export async function deleteAllBrandNotificationsAction(formData: FormData) {
  const lang = normalizeLang(formData.get("lang"));
  const clientEmail = await getCurrentClientEmail();
  if (!clientEmail) {
    return { ok: false as const, deleted: 0, error: lang === "zh" ? "请先登录" : "Sign in required" };
  }

  const deleted = await deleteAllNotificationsForBrand(clientEmail);
  revalidateBrandMessages();
  return { ok: true as const, deleted };
}
