import type { CreatorPortalInvitationView } from "@/features/creator/creator-portal.types";
import type { StoredOrder } from "@/lib/order-types";

export type CreatorInvitationTab = "pending" | "accepted" | "declined" | "expired";

export const creatorInvitationTabs: CreatorInvitationTab[] = [
  "pending",
  "accepted",
  "declined",
  "expired"
];

export const creatorInvitationTabLabels = {
  en: {
    pending: "Awaiting response",
    accepted: "Accepted · awaiting brand",
    declined: "Declined",
    expired: "Closed"
  },
  zh: {
    pending: "等待回复",
    accepted: "已接受 · 等待品牌",
    declined: "已拒绝",
    expired: "已失效"
  }
} as const;

export function invitationTabForStatus(status: string) {
  if (status === "accepted") return "accepted" as const;
  if (status === "selected") return "accepted" as const;
  if (status === "not_selected") return "expired" as const;
  if (status === "declined") return "declined" as const;
  if (status === "expired") return "expired" as const;
  return "pending" as const;
}

export function filterInvitationsByTab<T extends CreatorPortalInvitationView>(
  invitations: T[],
  tab: CreatorInvitationTab
): T[] {
  return invitations.filter((item) => invitationTabForStatus(item.status) === tab);
}

export function countInvitationsByTab(invitations: CreatorPortalInvitationView[]) {
  const counts: Record<CreatorInvitationTab, number> = {
    pending: 0,
    accepted: 0,
    declined: 0,
    expired: 0
  };
  for (const item of invitations) {
    counts[invitationTabForStatus(item.status)] += 1;
  }
  return counts;
}

export function countPendingInvitationsForCreator(invitations: CreatorPortalInvitationView[]) {
  return invitations.filter((item) => item.status === "pending").length;
}

export function countAwaitingBrandSelection(
  invitations: CreatorPortalInvitationView[],
  orders: Pick<StoredOrder, "project_id">[] = []
) {
  const selectedProjectIds = new Set(
    orders.map((order) => order.project_id).filter((id): id is string => Boolean(id))
  );
  return invitations.filter(
    (item) => item.status === "accepted" && !selectedProjectIds.has(item.campaignId)
  ).length;
}
