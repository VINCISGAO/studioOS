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
import { invitationDeclineFeedbackFromFormData } from "@/features/matching/invitation-decline-feedback";
import type { CreatorInvitationTab } from "@/lib/studioos/creator-invitation-utils";

export type InvitationActionResult =
  | { ok: true; nextTab: CreatorInvitationTab }
  | { ok: false; error: string };

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

export async function acceptDemoInvitationAction(formData: FormData): Promise<InvitationActionResult> {
  const locale = (formData.get("lang") as Locale) || "en";
  const invitationId = String(formData.get("invitationId") ?? "");
  const creatorId = await getCurrentCreatorId();
  if (!creatorId) {
    redirect(withLocale("/login?role=creator", locale));
  }

  const result = await acceptInvitation(invitationId, creatorId, locale);
  if (result.ok) {
    const project = await getProject(result.invitation.projectId);
    await notifyBrandInvitationResponse({
      invitation: result.invitation,
      project,
      action: "accepted",
      locale
    });
    revalidateInvitationPaths(result.invitation.projectId);
    return { ok: true, nextTab: "accepted" };
  }

  return { ok: false, error: result.error };
}

export async function declineDemoInvitationAction(formData: FormData): Promise<InvitationActionResult> {
  const locale = (formData.get("lang") as Locale) || "en";
  const invitationId = String(formData.get("invitationId") ?? "");
  const creatorId = await getCurrentCreatorId();
  const feedback = invitationDeclineFeedbackFromFormData(formData);
  if (!feedback.success) {
    return { ok: false, error: locale === "zh" ? "请选择拒绝原因" : "Select a decline reason" };
  }
  if (!creatorId) {
    redirect(withLocale("/login?role=creator", locale));
  }

  const result = await declineInvitation(invitationId, creatorId, locale, feedback.data);
  if (result.ok) {
    const project = await getProject(result.invitation.projectId);
    await notifyBrandInvitationResponse({
      invitation: result.invitation,
      project,
      action: "declined",
      locale
    });
    revalidateInvitationPaths(result.invitation.projectId);
    return { ok: true, nextTab: "declined" };
  }

  return { ok: false, error: result.error };
}
