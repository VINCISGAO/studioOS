"use server";

import { revalidatePath } from "next/cache";
import { getCurrentCreator } from "@/lib/creator-session";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import { markNotificationRead } from "@/lib/notification-service";
import {
  markCreatorSelectionCelebrationSeen
} from "@/lib/studioos/creator-settings-service";
import { creatorPortalRoutes } from "@/lib/studioos/creator-portal-routes";

function normalizeLang(raw: FormDataEntryValue | null): Locale {
  return raw === "zh" ? "zh" : "en";
}

function revalidateStudio() {
  revalidatePath("/studio");
  revalidatePath("/studio/projects");
  revalidatePath("/studio/review");
}

export async function markCreatorSelectionCelebrationSeenAction(formData: FormData) {
  const lang = normalizeLang(formData.get("lang"));
  const notificationId = String(formData.get("notificationId") ?? "");
  const next = String(formData.get("next") ?? "project");
  const creator = await getCurrentCreator();
  if (!creator || !notificationId) {
    return { ok: false as const };
  }

  await markCreatorSelectionCelebrationSeen(creator.id, creator, notificationId);
  await markNotificationRead(notificationId, creator.id).catch(() => false);
  revalidateStudio();

  const orderId = String(formData.get("orderId") ?? "");
  const href =
    next === "review" && orderId
      ? withLocale(creatorPortalRoutes.review(orderId), lang)
      : orderId
        ? withLocale(creatorPortalRoutes.project(orderId), lang)
        : withLocale(creatorPortalRoutes.projects, lang);

  return { ok: true as const, href };
}
