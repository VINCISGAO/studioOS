"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentCreatorId } from "@/lib/creator-session";
import { withLocale, type Locale } from "@/lib/i18n";
import { getProject } from "@/lib/project-service";
import { notifyBrandInvitationResponse } from "@/lib/studioos/campaign-invitation-notify";
import {
  acceptInvitation,
  declineInvitation
} from "@/lib/studioos/creator-invitation-store";
import { creatorPortalRoutes } from "@/lib/studioos/creator-portal-routes";

function revalidateInvitationPaths(projectId?: string) {
  revalidatePath("/studio");
  revalidatePath("/studio/messages");
  revalidatePath("/studio/invitations");
  revalidatePath("/brand");
  revalidatePath("/brand/campaigns");
  revalidatePath("/brand/messages");
  if (projectId) {
    revalidatePath(`/brand/projects/${projectId}`);
  }
}

export async function acceptDemoInvitationAction(formData: FormData) {
  const locale = (formData.get("lang") as Locale) || "en";
  const invitationId = String(formData.get("invitationId") ?? "");
  const creatorId = await getCurrentCreatorId();
  if (!creatorId) {
    redirect(withLocale("/login?role=creator", locale));
  }

  const result = await acceptInvitation(invitationId, creatorId);
  if (result.ok) {
    const project = await getProject(result.invitation.projectId);
    await notifyBrandInvitationResponse({
      invitation: result.invitation,
      project,
      action: "accepted",
      locale
    });
  }
  revalidateInvitationPaths(result.ok ? result.invitation.projectId : undefined);

  if (!result.ok) {
    redirect(withLocale(`${creatorPortalRoutes.invitations}?error=${result.error}`, locale));
  }

  redirect(withLocale(`${creatorPortalRoutes.invitations}?tab=accepted`, locale));
}

export async function declineDemoInvitationAction(formData: FormData) {
  const locale = (formData.get("lang") as Locale) || "en";
  const invitationId = String(formData.get("invitationId") ?? "");
  const creatorId = await getCurrentCreatorId();
  if (!creatorId) {
    redirect(withLocale("/login?role=creator", locale));
  }

  const result = await declineInvitation(invitationId, creatorId);
  if (result.ok) {
    const project = await getProject(result.invitation.projectId);
    await notifyBrandInvitationResponse({
      invitation: result.invitation,
      project,
      action: "declined",
      locale
    });
  }
  revalidateInvitationPaths(result.ok ? result.invitation.projectId : undefined);
  redirect(withLocale(`${creatorPortalRoutes.invitations}?tab=declined`, locale));
}
