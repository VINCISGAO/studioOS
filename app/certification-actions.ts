"use server";

import { revalidatePath } from "next/cache";
import { getCurrentCreator } from "@/lib/creator-session";
import {
  dismissCertificationWelcomeBanner,
  markCertificationLevelUpSeen
} from "@/lib/studioos/creator-settings-service";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import { creatorPortalRoutes } from "@/lib/studioos/creator-portal-routes";

function normalizeLang(raw: FormDataEntryValue | null): Locale {
  return raw === "zh" ? "zh" : "en";
}

function revalidateStudio() {
  revalidatePath("/studio");
  revalidatePath("/studio/deposit");
}

export async function markCertificationLevelUpSeenAction(formData: FormData) {
  const lang = normalizeLang(formData.get("lang"));
  const next = String(formData.get("next") ?? "home");
  const creator = await getCurrentCreator();
  if (!creator) {
    return { ok: false as const };
  }

  await markCertificationLevelUpSeen(creator.id, creator);
  revalidateStudio();
  const href =
    next === "benefits"
      ? withLocale(`${creatorPortalRoutes.deposit}?scroll=benefits`, lang)
      : withLocale(creatorPortalRoutes.invitations, lang);
  return { ok: true as const, href };
}

export async function dismissCertificationWelcomeBannerAction(formData: FormData) {
  void formData;
  const creator = await getCurrentCreator();
  if (!creator) {
    return { ok: false as const };
  }

  await dismissCertificationWelcomeBanner(creator.id, creator);
  revalidateStudio();
  return { ok: true as const };
}
