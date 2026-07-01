import type { StoredProject } from "@/lib/project-types";
import { normalizeCampaignStatus } from "@/lib/studioos/project-status";
import type { InvitationLifecycleStatus } from "@/lib/studioos/campaign-closed-loop";
import type { StoredCreatorInvitation } from "@/lib/studioos/creator-invitation-types";

export const MAX_CAMPAIGN_INVITATIONS = 5;

const CLOSED_PROJECT_STATUSES = new Set([
  "production",
  "in_review",
  "delivered",
  "completed",
  "cancelled",
  "refunded"
]);

export function isInvitationRecruitmentClosed(
  invitations: Pick<StoredCreatorInvitation, "projectId" | "status">[],
  projectId: string,
  project?: StoredProject | null
): boolean {
  if (invitations.some((item) => item.projectId === projectId && item.status === "selected")) {
    return true;
  }
  if (project) {
    const status = normalizeCampaignStatus(project.status);
    if (CLOSED_PROJECT_STATUSES.has(status)) {
      return true;
    }
  }
  return false;
}

export function brandInvitationStatusLabel(status: InvitationLifecycleStatus | string, locale: "en" | "zh") {
  const map = {
    en: {
      pending: "Awaiting response",
      accepted: "Accepted",
      selected: "Selected",
      declined: "Declined",
      expired: "Expired",
      not_selected: "Expired"
    },
    zh: {
      pending: "等待回复",
      accepted: "已接受",
      selected: "已中选",
      declined: "已拒绝",
      expired: "已过期",
      not_selected: "已过期"
    }
  } as const;
  return map[locale][status as keyof typeof map.en] ?? status;
}

export function normalizeInvitationStatus(status: string): InvitationLifecycleStatus {
  if (status === "not_selected") return "expired";
  return status as InvitationLifecycleStatus;
}
