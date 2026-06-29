"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { invitationService } from "@/features/matching/invitation.service";
import { getSessionUser } from "@/features/auth/session.service";
import { withLocale, type Locale } from "@/lib/i18n";
import { creatorPortalRoutes } from "@/lib/studioos/creator-portal-routes";

async function requireCreatorUser() {
  const user = await getSessionUser();
  if (!user || user.id.startsWith("demo_")) {
    throw new Error("Sign in with a database account");
  }
  if (user.role !== "CREATOR" && user.role !== "ADMIN") {
    throw new Error("Creator access only");
  }
  return user;
}

function revalidateCreatorPortal() {
  revalidatePath("/studio");
  revalidatePath("/studio/invitations");
  revalidatePath("/studio/review");
}

export async function acceptCreatorInvitationAction(formData: FormData) {
  const locale = (formData.get("lang") as Locale) || "en";
  const invitationId = String(formData.get("invitationId") ?? "");
  const user = await requireCreatorUser();

  await invitationService.accept(invitationId, { id: user.id, role: user.role });
  revalidateCreatorPortal();
  redirect(withLocale(creatorPortalRoutes.dashboard, locale));
}

export async function declineCreatorInvitationAction(formData: FormData) {
  const locale = (formData.get("lang") as Locale) || "en";
  const invitationId = String(formData.get("invitationId") ?? "");
  const user = await requireCreatorUser();

  await invitationService.decline(invitationId, { id: user.id, role: user.role });
  revalidateCreatorPortal();
  redirect(withLocale(creatorPortalRoutes.invitations, locale));
}
