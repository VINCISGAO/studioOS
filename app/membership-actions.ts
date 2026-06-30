"use server";

import { revalidatePath } from "next/cache";
import { membershipService } from "@/features/membership/membership.service";
import { getSessionUser } from "@/features/auth/session.service";
import { PermissionService } from "@/features/auth/permission.service";
import { creatorPortalRoutes } from "@/lib/studioos/creator-portal-routes";
import { withLocale, type Locale } from "@/lib/i18n";

export async function declineMembershipUpgradeAction(formData: FormData) {
  const user = await getSessionUser();
  if (!user) throw new Error("Not authenticated");
  PermissionService.assert(user, "membership.upgrade");

  const lang = (String(formData.get("lang") ?? "en") === "zh" ? "zh" : "en") as Locale;
  await membershipService.recordUpgradeDeclined(user.id);
  revalidatePath(withLocale(creatorPortalRoutes.dashboard, lang));
}

export async function demoMembershipUpgradeAction(formData: FormData) {
  const user = await getSessionUser();
  if (!user) throw new Error("Not authenticated");
  PermissionService.assert(user, "membership.upgrade");

  const lang = (String(formData.get("lang") ?? "en") === "zh" ? "zh" : "en") as Locale;
  await membershipService.activateVerifiedMembershipDemo(user.id);
  revalidatePath(withLocale(creatorPortalRoutes.dashboard, lang));
}
