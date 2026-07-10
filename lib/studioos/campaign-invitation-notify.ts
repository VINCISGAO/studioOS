import "server-only";

import type { Locale } from "@/lib/i18n";
import { createBrandNotification, hasBrandNotification } from "@/lib/studioos/brand-notification-service";
import { getConfirmedBriefText } from "@/lib/studioos/confirmed-brief";
import { resolveCreatorDisplayName } from "@/lib/studioos/creator-display-name.server";
import { ensureCampaignInvitationsForProject } from "@/lib/studioos/creator-invitation-store";
import type { StoredCreatorInvitation } from "@/lib/studioos/creator-invitation-types";
import {
  createCreatorNotification,
  findNotificationByProject
} from "@/lib/notification-service";
import type { StoredProject } from "@/lib/project-types";

function invitationMatchCopy(locale: Locale, brandName: string, projectTitle: string) {
  if (locale === "zh") {
    return {
      title: "你收到一个新的合作邀请",
      body: `${brandName} 邀请你参与「${projectTitle}」。接受邀请表示你有合作意向，最终是否合作由品牌方决定。`
    };
  }
  return {
    title: "You received a new collaboration invitation",
    body: `${brandName} invited you to "${projectTitle}". Accepting shows interest — the brand makes the final selection.`
  };
}

function brandResponseCopy(
  locale: Locale,
  action: "accepted" | "declined",
  creatorName: string,
  projectTitle: string
) {
  if (locale === "zh") {
    if (action === "accepted") {
      return {
        title: `${creatorName} 接受了合作邀请`,
        body: `「${projectTitle}」— ${creatorName} 已进入候选名单，你可以在匹配页最终选定 1 位 Creator。`
      };
    }
    return {
      title: `${creatorName} 拒绝了意向发单`,
      body: `「${projectTitle}」— ${creatorName} 已拒绝本次邀请。`
    };
  }

  if (action === "accepted") {
    return {
      title: `${creatorName} accepted your invitation`,
      body: `"${projectTitle}" — ${creatorName} is in your shortlist. Select them from the match tab when ready.`
    };
  }
  return {
    title: `${creatorName} declined your invitation`,
    body: `"${projectTitle}" — ${creatorName} declined this invitation.`
  };
}

export async function publishCampaignIntentInvitations(input: {
  project: StoredProject;
  locale: Locale;
}) {
  const invitations = await ensureCampaignInvitationsForProject(input.project, input.locale);

  const pending = invitations.filter((item) => item.status === "pending");
  const brandName = input.project.company_name || input.project.client_name || "Brand";
  const projectTitle = input.project.title || input.project.product_name || brandName;
  const requirementsText = getConfirmedBriefText(input.project, input.locale);

  await Promise.all(
    pending.map((invitation) =>
      notifyCreatorMatchInvitation({
        invitation,
        brandName,
        projectTitle,
        requirementsText,
        locale: input.locale
      })
    )
  );

  return invitations;
}

async function notifyCreatorMatchInvitation(input: {
  invitation: StoredCreatorInvitation;
  brandName: string;
  projectTitle: string;
  requirementsText: string;
  locale: Locale;
}) {
  const existing = await findNotificationByProject(
    input.invitation.creatorId,
    input.invitation.projectId,
    "invitation_match"
  );
  if (existing) return existing;

  const copy = invitationMatchCopy(input.locale, input.brandName, input.projectTitle);
  return createCreatorNotification({
    creator_id: input.invitation.creatorId,
    type: "invitation_match",
    title: copy.title,
    body: copy.body,
    project_id: input.invitation.projectId,
    order_id: null,
    client_name: input.brandName,
    company_name: input.brandName,
    requirements_text: input.requirementsText
  });
}

export async function notifyBrandInvitationResponse(input: {
  invitation: StoredCreatorInvitation;
  project: StoredProject | null;
  action: "accepted" | "declined";
  locale: Locale;
}) {
  const brandEmail = (input.project?.client_email ?? input.invitation.brandEmail ?? "").trim().toLowerCase();
  if (!brandEmail) return null;

  const creatorName = await resolveCreatorDisplayName(input.invitation.creatorId, {
    hint: input.invitation.creatorName,
    locale: input.locale
  });
  const projectTitle =
    input.project?.title ||
    input.project?.product_name ||
    input.invitation.title ||
    input.project?.company_name ||
    input.invitation.brandName;
  const copy = brandResponseCopy(input.locale, input.action, creatorName, projectTitle);
  const type = input.action === "accepted" ? "invitation_accepted" : "invitation_declined";

  const exists = await hasBrandNotification({
    brand_email: brandEmail,
    project_id: input.invitation.projectId,
    creator_id: input.invitation.creatorId,
    type
  });
  if (exists) return null;

  return createBrandNotification({
    brand_email: brandEmail,
    type,
    title: copy.title,
    body: copy.body,
    project_id: input.invitation.projectId,
    creator_id: input.invitation.creatorId,
    creator_name: creatorName
  });
}
